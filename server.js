// const PORT = 8000
// const express = require('express')
// const cors = require('cors')
// const app = express()
// app.use(express.json())
// app.use(cors())

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// const API_KEY = "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"

// app.post('/completions', async (req, res) => {
//     const options = {
//         method: 'POST',
//         headers: {
//             'Authorization': `Bearer ${API_KEY}`,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             model: "gtp-4",
//             messages: [{role: "user", content: "hello"}],
//             max_tokens: 200
//         })
//     }
//     try {
//         const response = await fetch('https://api.openai.com/v1/chat/completions', options)
//         const data = await response.json()
//         res.send(data)
//     } catch (error) {
//         console.error(`Failed to generate AI response. Error: ${error.message}`)
//     }

// })

const admin = require("firebase-admin");
const { OpenAIApi, Configuration } = require("openai");

const apiKey = "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";
const openai = new OpenAIApi(
  new Configuration({
    apiKey: apiKey,
  })
); // Initialize Firebase Admin SDK
const serviceAccount = require("/Users/allenchou/Downloads/agreemate-bd6d4-firebase-adminsdk-h3fk4-de61f4a718.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Initialize OpenAI SDK

const db = admin.firestore();

async function processMessages(answerId) {
  try {
    const snap = await db.collection("answers").doc(answerId).get();
    if (!snap.exists) {
      console.error("Answer document does not exist");
      return;
    }
    const messagesArray = snap.data().messages;

    if (!messagesArray || messagesArray.length === 0) {
      console.error("No messages provided.");
      return;
    }

    let userMessages = [];
    const messagesPromises = messagesArray.map((messageId) =>
      db.collection("messages").doc(messageId).get()
    );
    const messagesDocs = await Promise.all(messagesPromises);

    messagesDocs.forEach((doc) => {
      if (doc.exists) {
        userMessages.push(doc.data().text);
      } else {
        console.error("Message document does not exist", doc.id);
      }
    });

    // Combine the text of each message into a single string
    const combinedUserMessage = userMessages.join(" ");

    const detailedPrompt = "Your detailed prompt here " + combinedUserMessage; // Construct your prompt

    const response = await openai.createCompletion({
      model: "text-davinci-003", // Adjust as necessary
      prompt: detailedPrompt,
      temperature: 0.5,
      max_tokens: 150,
    });

    const aiResponse = response.data.choices[0].text.trim();

    // Optionally save or process the AI response further
    console.log(aiResponse);
  } catch (error) {
    console.error(
      `Failed to process messages or generate AI response. Error: ${error.message}`
    );
  }
}

// Example usage
const answerId = "your_answer_document_id_here";
processMessages(answerId);
