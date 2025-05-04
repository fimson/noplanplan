/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Import necessary Firebase and OpenAI modules
const { onRequest } = require("firebase-functions/v2/https"); // Use v2 for easier secrets
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");
const cors = require("cors")({ origin: true }); // Handle CORS automatically
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const sharp = require("sharp");
const path = require("path");
const { onObjectFinalized } = require("firebase-functions/v2/storage");

admin.initializeApp();

// Define the OpenAI API Key as a secret using Firebase function configuration
// IMPORTANT: Set this secret using `firebase functions:secrets:set OPENAI_SECRET_KEY`
const openaiApiKey = defineSecret("OPENAI_SECRET_KEY");

// Helper to verify Firebase ID token from Authorization header
const verifyToken = async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing token' });
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded; // contains uid, email, etc.
  } catch (err) {
    console.error('Token verification failed', err);
    res.status(401).json({ error: 'Unauthorized: invalid token' });
    return null;
  }
};

// HTTPS Function triggered by a request
exports.processWishlistItem = onRequest(
  // Ensure the function has access to the secret and set memory/CPU if needed
  { secrets: [openaiApiKey], memory: "512MiB" },
  async (req, res) => {
    // Enable CORS for all origins for this function
    // For production, restrict origins: const cors = require("cors")({ origin: "YOUR_FRONTEND_URL" });
    cors(req, res, async () => {
      // Ensure it's a POST request
      if (req.method !== "POST") {
        console.log("Received non-POST request:", req.method);
        return res.status(405).send({ error: "Method Not Allowed" });
      }

      // Verify Firebase ID token
      const decoded = await verifyToken(req, res);
      if (!decoded) return;

      // Extract title and availableRegions from the request body
      const { title, availableRegions } = req.body;
      console.log("Received request body:", req.body);
      console.log("Available regions:", JSON.stringify(availableRegions));

      // Basic validation
      if (!title || !availableRegions || !Array.isArray(availableRegions)) {
        console.log("Missing required fields: title or availableRegions");
        return res.status(400).send({ error: "Missing required fields: title (string) and availableRegions (array)." });
      }
      if (availableRegions.length === 0) {
         console.log("availableRegions array is empty.");
         // Decide if this is an error or if AI should proceed without region context
         // For now, proceed but AI likely won't assign a region.
      }

      // Keep track of the response string for error logging
      let resultString = "";

      try {
        console.log("Initializing OpenAI client...");
        const openai = new OpenAI({
          apiKey: openaiApiKey.value(), // Access the secret's value
        });

        // Prepare the list of region names for the prompt
        const regionNames = availableRegions.map((r) => r.name).join(", ") || "None";

        // Construct the prompt for the OpenAI API using a standard string
        const prompt =
`You are a helpful travel assistant specializing in Japanese destinations.

Given a raw destination title and a list of user-defined travel regions, perform the following tasks and return your result as a valid JSON object:

---

**Input**  
Raw Destination Title: "${title}"  
Available Regions: [${regionNames}]

---

**Rules**
1. Correct typos and fix capitalization in the title. (E.g., "tokyo zoo" → "Tokyo Zoo")
2. Determine which ONE region from the list the destination most likely belongs to (based on proximity or cultural association). Return **exactly** one of the region names from the list (must match exactly), or "None" if the list is empty.
3. Suggest a short, engaging 1–2 sentence description of this destination.
4. Suggest a relevant link from japan-guide.com. Format: \`https://www.japan-guide.com/e/e[xxxx].html\`
5. Suggest a thumbnail image URL for the destination from japan-guide.com. Format: \`https://www.japan-guide.com/thumb/XYZeXYZe2165_1680.jpg\`
When suggesting an image, only use known, published URLs from japan-guide.com. Do not invent or guess image URLs. If no valid known URL can be provided, return an empty string.
---

**Output Format**  
{
  "correctedTitle": "",
  "region": "",
  "description": "",
  "link": "",
  "imageUrl": ""
}

Only return the JSON object — no extra commentary.`;

        console.log("Sending prompt to OpenAI:", prompt);

        // Call the OpenAI Chat Completions API
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Using gpt-4o-mini
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5, // Lower temperature for more predictable results
          response_format: { type: "json_object" }, // Request JSON output
        });
        console.log("Received OpenAI completion choice:", completion.choices[0]);


        resultString = completion.choices[0].message.content;
        if (!resultString) {
          console.error("OpenAI returned an empty response content.");
          throw new Error("OpenAI returned an empty response.");
        }

        console.log("OpenAI response string:", resultString);
        
        // Additional diagnostic logging
        console.log("Attempting to parse JSON response...");
        let result;
        try {
          result = JSON.parse(resultString); // Parse the JSON string from AI
          
          // Log the parsed result structure
          console.log("Successfully parsed JSON. Keys in response:", Object.keys(result));
          console.log("correctedTitle:", result.correctedTitle);
          console.log("region:", result.region);
          
          // --- Post-processing: Map region name back to ID ---
          let suggestedRegionId = null;
          if (result.region && result.region !== "None") {
            // Improved region matching with better logging
            console.log(`Looking for region match for: '${result.region}'`);
            
            // First try exact match
            let matchedRegion = availableRegions.find(
              (r) => r.name === result.region
            );
            
            // If no exact match, try case-insensitive match
            if (!matchedRegion) {
              matchedRegion = availableRegions.find(
                (r) => r.name.toLowerCase() === result.region.toLowerCase()
              );
            }
            
            // If still no match, try to find a partial match
            if (!matchedRegion) {
              matchedRegion = availableRegions.find(
                (r) => r.name.toLowerCase().includes(result.region.toLowerCase()) || 
                      result.region.toLowerCase().includes(r.name.toLowerCase())
              );
            }
            
            if (matchedRegion) {
              suggestedRegionId = matchedRegion.id;
              console.log(`Mapped region '${result.region}' to ID '${suggestedRegionId}' (${matchedRegion.name})`);
            } else {
              console.warn(`AI suggested region '${result.region}' not found in availableRegions.`);
              console.log("Available region names:", availableRegions.map(r => r.name));
            }
          }
          // --- End Post-processing ---

          // Prepare the final response object for the frontend
          const responseData = {
            correctedTitle: result.correctedTitle || title, // Fallback to original title if needed
            suggestedRegionId: suggestedRegionId, // Send the ID, not the name
            description: result.description || null,
            link: result.link || null,
            imageUrl: result.imageUrl || null, // Use the image URL directly from API
          };

          console.log("Sending successful response to frontend:", responseData);
          return res.status(200).json(responseData); // Send successful response

        } catch (syntaxError) {
          console.error("Error parsing JSON response from OpenAI:", syntaxError);
          console.error("Problematic JSON string was:", resultString);
          throw new Error("Failed to parse OpenAI response as JSON");
        }
      } catch (error) {
        console.error("Error during OpenAI API call or processing:", error);
        // Log specific OpenAI errors if available
        if (error.response) {
          console.error("OpenAI API Error Details:", error.response.status, error.response.data);
        }
        // Send a generic server error response
        return res.status(500).send({ error: "Internal Server Error while processing the request." });
      }
    }); // End CORS wrapper
  } // End onRequest handler
); // End exports.processWishlistItem

// Cloud Function for generating travel guide content with AI
exports.generateGuide = onRequest(
  // Ensure the function has access to the secret and increase memory to handle longer text generation
  { secrets: [openaiApiKey], memory: "1GiB" },
  async (req, res) => {
    // Enable CORS for all origins for this function
    cors(req, res, async () => {
      // Ensure it's a POST request
      if (req.method !== "POST") {
        console.log("Received non-POST request:", req.method);
        return res.status(405).send({ error: "Method Not Allowed" });
      }

      // Verify Firebase ID token
      const decoded = await verifyToken(req, res);
      if (!decoded) return;

      // Extract data from the request body
      const { prompt, language, context, guideType, tripId, itemId } = req.body;
      console.log("Received guide generation request:", {
        language,
        guideType,
        tripId,
        itemId
      });

      // Basic validation
      if (!prompt || !language) {
        console.log("Missing required fields: prompt or language");
        return res.status(400).send({ 
          error: "Missing required fields: prompt (string) and language (string)." 
        });
      }

      try {
        console.log("Initializing OpenAI client for guide generation...");
        const openai = new OpenAI({
          apiKey: openaiApiKey.value(), // Access the secret's value
        });

        // Determine the system prompt based on language
        let systemPrompt = context || "You are a helpful travel guide writer.";
        
        // Add language-specific instructions
        if (language === "ru") {
          systemPrompt += "\n\nПожалуйста, пиши ответ на русском языке. Используй информативный и интересный стиль. Отвечай подробно, с историческими и культурными фактами.";
        }

        // Adjust the prompt based on guide type
        let userPrompt = prompt;
        if (guideType === 'topic') {
          userPrompt = `Write a comprehensive travel guide about: ${prompt}. 
Include relevant historical facts, cultural insights, and practical information.
Format your response with clear headings and structured sections using markdown.`;
        } else if (guideType === 'wishlist') {
          userPrompt = `Write a detailed guide about this specific location or attraction: ${prompt}.
Include what makes it special, practical visiting information, and cultural or historical context.
Format your response with clear headings and structured sections using markdown.`;
        }

        console.log("Sending guide generation prompt to OpenAI");

        // Call the OpenAI Chat Completions API with higher token limit
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Using gpt-4o-mini
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7, // Slightly higher temperature for creative content
          max_tokens: 1500, // Allow for longer responses
        });

        // Extract the generated text from the API response
        const generatedText = completion.choices[0].message.content;
        if (!generatedText) {
          console.error("OpenAI returned an empty response content.");
          throw new Error("OpenAI returned an empty response.");
        }

        console.log("Successfully generated guide content");
        
        // Return the generated text
        return res.status(200).json({ 
          generatedText,
          language,
          itemId
        });

      } catch (error) {
        console.error("Error during guide generation:", error);
        // Log specific OpenAI errors if available
        if (error.response) {
          console.error("OpenAI API Error Details:", error.response.status, error.response.data);
        }
        // Send error response
        return res.status(500).send({ 
          error: "Failed to generate guide content",
          message: error.message
        });
      }
    }); // End CORS wrapper
  } // End onRequest handler
); // End exports.generateGuide

// Thumbnail generator
exports.generateThumbnails = onObjectFinalized({ memory: "1GiB", timeoutSeconds: 120 }, async (object) => {
  const filePath = object.name; // e.g. trips/abc/hero/hero_original.jpg
  if (!filePath.startsWith("trips/")) return; // Only process trip images
  if (!object.contentType.startsWith("image/")) return;
  if (filePath.includes("thumb_")) return; // avoid infinite loop

  const bucket = admin.storage().bucket(object.bucket);
  const tempLocalPath = `/tmp/${path.basename(filePath)}`;
  await bucket.file(filePath).download({ destination: tempLocalPath });
  const dirName = path.dirname(filePath);

  const thumbPath = `${dirName}/thumb_800.webp`;
  await sharp(tempLocalPath)
    .resize({ width: 800 })
    .webp({ quality: 75 })
    .toFile(tempLocalPath + "_thumb");
  await bucket.upload(tempLocalPath + "_thumb", {
    destination: thumbPath,
    metadata: {
      contentType: "image/webp",
      cacheControl: "public,max-age=31536000,immutable",
    },
  });
});

// **** INVITE MANAGEMENT FUNCTIONS **** //

// Helper to ensure caller is trip owner
const ensureOwner = async (tripId, uid) => {
  const tripDoc = await admin.firestore().doc(`trips/${tripId}`).get();
  if (!tripDoc.exists) throw new Error('Trip not found');
  const data = tripDoc.data();
  if (data.owner) {
    if (data.owner !== uid) throw new Error('Forbidden');
  } else {
    // Fallback: allow if caller is already in members array
    if (!data.members || !data.members.includes(uid)) throw new Error('Forbidden');
  }
};

// Create short invite code (owner only)
exports.createInvite = onRequest({ timeoutSeconds: 10, memory: '128MiB' }, async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const decoded = await verifyToken(req, res);
    if (!decoded) return; // verifyToken sent response

    const { tripId } = req.body;
    if (!tripId) return res.status(400).json({ error: 'tripId required' });

    try {
      await ensureOwner(tripId, decoded.uid);

      // generate 6-char code
      let code;
      let exists = true;
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const gen = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      while (exists) {
        code = gen();
        const snap = await admin.firestore().doc(`invites/${code}`).get();
        exists = snap.exists;
      }

      await admin.firestore().doc(`invites/${code}`).set({
        tripId,
        role: 'member',
        usedBy: null,
        created: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.json({ code });
    } catch (err) {
      console.error(err);
      return res.status(err.message === 'Forbidden' ? 403 : 500).json({ error: err.message });
    }
  });
});

// Invite by email (adds user UID directly)
exports.inviteByEmail = onRequest({ timeoutSeconds: 15, memory: '256MiB' }, async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const decoded = await verifyToken(req, res);
    if (!decoded) return;

    const { tripId, email } = req.body;
    if (!tripId || !email) return res.status(400).json({ error: 'tripId and email required' });

    try {
      await ensureOwner(tripId, decoded.uid);

      // Find or create user
      let targetUser;
      try {
        targetUser = await admin.auth().getUserByEmail(email);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          targetUser = await admin.auth().createUser({ email });
          // Optionally send email invite link here
        } else throw err;
      }

      const tripRef = admin.firestore().doc(`trips/${tripId}`);
      await tripRef.update({ members: admin.firestore.FieldValue.arrayUnion(targetUser.uid) });

      return res.json({ uid: targetUser.uid });
    } catch (err) {
      console.error(err);
      const status = err.message === 'Forbidden' ? 403 : 500;
      return res.status(status).json({ error: err.message });
    }
  });
});

// Claim invite code (any authenticated user)
exports.claimInvite = onRequest({ timeoutSeconds: 15, memory: '128MiB' }, async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const decoded = await verifyToken(req, res);
    if (!decoded) return;

    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    const inviteRef = admin.firestore().doc(`invites/${code}`);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) return res.status(400).json({ error: 'Invalid code' });
    const invite = inviteSnap.data();
    if (invite.usedBy) return res.status(400).json({ error: 'Code already used' });

    const tripRef = admin.firestore().doc(`trips/${invite.tripId}`);

    await admin.firestore().runTransaction(async (tx) => {
      tx.update(tripRef, { members: admin.firestore.FieldValue.arrayUnion(decoded.uid) });
      tx.update(inviteRef, { usedBy: decoded.uid, claimed: admin.firestore.FieldValue.serverTimestamp() });
    });

    return res.json({ tripId: invite.tripId });
  });
});