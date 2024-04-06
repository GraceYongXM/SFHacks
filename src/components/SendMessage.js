import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  where,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
} from "firebase/firestore";

const SendMessage = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState();
  const messagesRef = collection(db, "messages");
  // const groupChatName = "roomie";
  // const chatroomDocRef = db.collection("Chatrooms").doc(groupChatName);

  useEffect(() => {
    const queryMessages = query(
      messagesRef,
      where("room", "==", room),
      orderBy("createdAt")
    );
    const unsuscribe = onSnapshot(queryMessages, (snapshot) => {
      let messages = [];
      snapshot.forEach((doc) => {
        messages.push({ ...doc.data(), id: doc.id });
      });
      console.log(messages);
      setMessages(messages);
    });

    return () => unsuscribe();
  }, []);

  // // Function to add a new message to the Message array in Chatroom
  // const addMessage = async (groupChatName, newMessage) => {
  //   setNewMessage(newMessage);
  //   try {
  //     // Get a reference to the Firestore document
  //     const chatRoomRef = doc(db, "Chatrooms", groupChatName);

  //     // Update the document by adding the new item to the array
  //     const result = await chatRoomRef.update({
  //       Messages: db.FieldValue.arrayUnion(newMessage),
  //     });

  //     console.log(result);

  //     console.log("Item added to array successfully.");
  //   } catch (error) {
  //     console.error("Error adding item to array:", error);
  //   }
  // };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newMessage === "") return;
    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: auth.currentUser.displayName,
      room,
    });

    setNewMessage("");
  };

  return (
    // <form className="send-message">
    //   <label htmlFor="messageInput" hidden>
    //     Enter Message
    //   </label>

    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={newMessage}
        onChange={(event) => setNewMessage(event.target.value)}
        className="new-message-input"
        placeholder="Type your message here..."
      />
      <button type="submit" className="send-button">
        Send
      </button>
    </form>

    /* <input
        id="messageInput"
        name="messageInput"
        type="text"
        className="form-input__input"
        placeholder="Type message..."
      />
      <button type="submit">Send</button>
    </form> */
  );
};

export default SendMessage;
