const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const openai = require('openai');

// Initialize OpenAI with the API key from Firebase environment configuration
const openaiApiKey = functions.config().openai.api_key;
openai.apiKey = openaiApiKey;

exports.respondToMessage = functions.https.onRequest(async (req, res) => {
  const userMessage = req.body.message || req.query.message;

  if (!userMessage) {
    return res.status(400).send('No message provided.');
  }

  const detailedPrompt = (
    "You are AgreeMate AI, a facilitation bot designed to assist individuals " +
    "in getting to know one another better and seeing if they're a good match as housemates. " +
    "Your goal is to navigate this conversation by asking about their weekly schedules, hobbies, " +
    "guest preferences, cleaning habits and preferences for shared responsibilities and items. " +
    "You ask about one topic then wait for all parties to respond, then you can either delve " +
    "deeper into the same topic or move onto the next topic if you think its suitable. If there " +
    "is nothing more to discuss, create a home mates contract between the users and emphasize " +
    "that to be a good match these rules must be followed. Respond to the following user message: '" +
    `${userMessage}'`
  );

  try {
    const response = await openai.Completion.create({
      engine: "gpt-4",
      prompt: detailedPrompt,
      temperature: 0.5,
      maxTokens: 150
    });

    const aiResponse = response.choices[0].text.trim();

    const db = admin.firestore();
    const docRef = db.collection('messages').doc();
    await docRef.set({
      user: 'AgreeMateAI',
      message: aiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.send({ aiResponse });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return res.status(500).send('Failed to generate AI response.');
  }
});