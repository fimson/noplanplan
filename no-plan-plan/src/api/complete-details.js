// This file would typically be in a server-side API route folder
// For example: /api/complete-details.js in Next.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, contextHint } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Replace with your actual OpenAI API key in a secure environment variable
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      const fallbackContext = contextHint || 'travel';
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        // Fallback values for development
        description: `A popular tourist destination, possibly related to ${fallbackContext}.`,
        link: `https://www.google.com/search?q=${encodeURIComponent(title)}+${encodeURIComponent(fallbackContext)}`,
        imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(fallbackContext)},${encodeURIComponent(title)}`
      });
    }

    const promptContext = contextHint || 'general travel';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful travel assistant. Provide information about tourist destinations, considering the context: ${promptContext}.`
          },
          {
            role: 'user',
            content: `Provide information about "${title}" in the context of ${promptContext}. Return ONLY a JSON object (no extra text or markdown) with these fields: 
            1. description (a brief 1-2 sentence description)
            2. link (a relevant URL to learn more about this place)
            3. imageUrl (a URL to a royalty-free image of this place)
            If you cannot find a specific image or link, return null for that field.`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    let result;

    try {
      // Try to parse the AI response as JSON
      const content = data.choices[0].message.content.trim();
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback with default values
      const fallbackContext = contextHint || 'travel';
      result = {
        description: `Could not fetch details. Possibly a popular tourist destination related to ${fallbackContext}.`,
        link: `https://www.google.com/search?q=${encodeURIComponent(title)}+${encodeURIComponent(fallbackContext)}`,
        imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(fallbackContext)},${encodeURIComponent(title)}`
      };
    }

    // Return the completed details
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in complete-details API:', error);
    const fallbackContext = req.body.contextHint || 'travel';
    const requestedTitle = req.body.title || 'destination';
    return res.status(500).json({ 
      error: 'Failed to complete details',
      // Fallback values
      description: `Error fetching details. Possibly a popular tourist destination related to ${fallbackContext}.`,
      link: `https://www.google.com/search?q=${encodeURIComponent(requestedTitle)}+${encodeURIComponent(fallbackContext)}`,
      imageUrl: `https://source.unsplash.com/featured/?${encodeURIComponent(fallbackContext)},${encodeURIComponent(requestedTitle)}`
    });
  }
} 