import React, { useState, useEffect, useRef } from "react";
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
  getDoc,
  updateDoc,
} from "firebase/firestore";
import Message from "./Message";

// Track if user has sent message in this new round of questioning
const updateHasSentMessage = async (room, usernameToUpdate) => {
  try {
    const chatRoomRef = doc(db, "Chatrooms", room);
    const chatRoomSnapshot = await getDoc(chatRoomRef);
    if (chatRoomSnapshot.exists) {
      const chatRoomData = chatRoomSnapshot.data();
      const participants = chatRoomData.Participants;

      const participantToUpdate = participants.find(
        (participant) => participant.username === usernameToUpdate
      );

      if (participantToUpdate) {
        // Update has_sent_messages to true
        participantToUpdate.has_sent_messages = true;
        // Update the document in Firestore
        await updateDoc(chatRoomRef, chatRoomData);
        console.log(`Updated has_sent_messages for ${usernameToUpdate}`);
      } else {
        console.log(`${usernameToUpdate} not found in participants array`);
      }
    }
  } catch (error) {
    console.error("Error updating has_sent_message:", error);
  }
};

const SendMessage = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState();
  const messagesRef = collection(db, "messages");
  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);

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
      setMessages(messages);
    });

    return () => unsuscribe();
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) {
      scrollUp();
    } else {
      isInitialMount.current = false;
    }
  }, [messages]);

  const scrollUp = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newMessage === "") return;
    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: auth.currentUser.displayName,
      room,
    });

    updateHasSentMessage(room, auth.currentUser.displayName);

    setNewMessage("");
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    scrollUp();
  };

  return (
    <div className="chat">
      <div className="messages-wrapper">
        {messages.map((message) => (
          <div key={message.id}>
            <Message userName={message.user} message={message.text} />
          </div>
        ))}
      </div>
      <div ref={messagesEndRef} />
      <form onSubmit={handleSubmit} className="send-message">
        <input
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder="Type your message here..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default SendMessage;
