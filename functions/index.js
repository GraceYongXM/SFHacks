const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const OpenAI = require("openai").default;
const openai = new OpenAI({
  apiKey: "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",
});
// const openaiApiKey = functions.config().openai.api_key;
// openai.apiKey = "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";

exports.respondToMessage = functions.firestore
  .document("answers/{answerId}")
  .onCreate(async (snap, context) => {
    const messagesArray = snap.data().messages;

    if (!messagesArray || messagesArray.length === 0) {
      console.error("No messages provided.");
      return;
    }

    // Initialize an array to hold the text from each message
    let userMessages = [];

    try {
      // Step 2 & 3: For each text ID, get the corresponding document from 'messages' and accumulate the text
      const db = admin.firestore();
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
      const combinedUserMessage =
        "Respond to the following user message: " + userMessages.join(" ");

      const detailedPrompt =
        "You are AgreeMate AI, a facilitation bot designed to assist individuals " +
        "in getting to know one another better and seeing if they're a good match as housemates. " +
        "Your goal is to navigate this conversation by asking about their weekly schedules, hobbies, " +
        "guest preferences, cleaning habits and preferences for shared responsibilities and items. " +
        "You ask about one topic then wait for all parties to respond, then you can either delve " +
        "deeper into the same topic or move onto the next topic if you think its suitable. If there " +
        "is nothing more to discuss, create a home mates contract between the users and emphasize " +
        "that to be a good match these rules must be followed.";
      // const responseDocRef = db.collection("Chatrooms").doc();
      // await responseDocRef.set({
      //   user: "AgreeMateAI",
      //   message: detailedPrompt,
      //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
      // });

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: detailedPrompt },
          { role: "user", content: combinedUserMessage },
        ],
        temperature: 0.5,
        max_tokens: 400,
      });

      const aiResponse = response.choices[0].message.content;
      console.log("aiResponse", aiResponse);

      // Save the AI response back to Firestore
      const responseDocRef = db.collection("messages").doc();
      await responseDocRef.set({
        user: "AgreeMate",
        text: aiResponse,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        room: "roomie",
      });
    } catch (error) {
      console.error(
        `Failed to process messages or generate AI response. Error: ${error.message}`
      );
    }
  });
