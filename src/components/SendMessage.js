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
} from "firebase/firestore";
import Message from "./Message";

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
    console.log(isInitialMount.current);
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
