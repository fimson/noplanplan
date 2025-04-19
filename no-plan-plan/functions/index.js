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

// Define the OpenAI API Key as a secret using Firebase function configuration
// IMPORTANT: Set this secret using `firebase functions:secrets:set OPENAI_SECRET_KEY`
const openaiApiKey = defineSecret("OPENAI_SECRET_KEY");

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