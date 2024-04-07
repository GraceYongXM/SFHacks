const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const OpenAI = require("openai").default;

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key,
});
const openai2 = new OpenAI({
  apiKey: functions.config().openai2.api_key,
});

exports.respondToMessage = functions.firestore
  .document("answers/{answerId}")
  .onCreate(async (snap, context) => {
    const messagesArray = snap.data().messages;
    const room = snap.data().chatroomName;

    if (!messagesArray || messagesArray.length === 0) {
      console.error("No messages provided.");
      return;
    }
    const db = admin.firestore();
    const messagesPromises = messagesArray.map((messageId) =>
      db.collection("messages").doc(messageId).get()
    );

    const conversationRef = db.collection("chatgpt").doc("ContextDoc");
    const messagesDocs = await Promise.all(messagesPromises);
    const userMessages = messagesDocs
      .map((doc) => {
        if (doc.exists) {
          const data = doc.data();
          return `${data.user}: ${data.text}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");

    try {
      const conversationDoc = await conversationRef.get();
      let existingContext = conversationDoc.exists
        ? conversationDoc.data().context
        : "";

      const summaryResponse = await openai2.chat.completions.create({
        model: "gpt-4-turbo-preview", // Use an appropriate model for summarization
        messages: [
          {
            role: "system",
            content: `Summarize this conversation. make it short but very detailed and also inform on what was most important and recently talked about. Also keep a count on the topics covered at the end of the summary like this: [sleep, noise, smoking, hobbies, cleanliness]. You may only put a topic in there if that topic has a very slim chance of causing conflict or if the users had settle on a compromise." +
           `,
          },
          { role: "user", content: `\n${existingContext}, \n${userMessages}` },
        ],
        temperature: 0.5,
        max_tokens: 600,
      });

      const summarizedContext = summaryResponse.choices[0].message.content;

      const detailedPrompt =
        "You are AgreeMate AI, an expert mediator for two individuals " +
        "who want to get to know each another better to see if they're a good match as housemates. talk to them directly with first names or plural pronouns, not in the third person. " +
        "Your goal is to navigate this conversation by asking about things such as their budget, weekly schedules, hobbies, " +
        "guest preferences, smoking, cleaning habits and preferences for shared responsibilities and items. " +
        "You ask about relevant common topics and tough questions and if they heavily disagree on something,try to make a fair compromise." +
        "I will provide you a very brief summary and also tell you the topics you have already covered extensively in brackets so you don't talk about the exact same topic unless theres something to be expanded on from a possible conflict. " +
        "Try to keep your word count under 130. Create a house mates contract if 5 separate topics have been covered extensively. ";

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: detailedPrompt },
          { role: "user", content: summarizedContext },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      const aiResponse = response.choices[0].message.content;
      // const aiResponseWithInfo = `You: ${aiResponse}`;

      await db.collection("messages").doc().set({
        user: "AgreeMate",
        text: aiResponse,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        room: room,
      });

      let newContext = existingContext;
      if (existingContext.length > 0) {
        newContext += "\n\n";
      }
      newContext += `${userMessages}\n`;

      // Update the context field with the new combined string
      await conversationRef.set({ context: newContext }, { merge: true });
    } catch (error) {
      console.error(
        `Failed to process messages or generate AI response. Error: ${error.message}`
      );
    }
  });
