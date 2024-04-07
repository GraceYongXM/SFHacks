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

const getChatroomData = async (room) => {
  const chatroomRef = doc(db, "Chatrooms", room);
  const chatroomSnapshot = await getDoc(chatroomRef);

  if (!chatroomSnapshot.exists()) {
    console.log(`Chatroom ${room} does not exist`);
    return null;
  }

  return chatroomSnapshot.data();
};

// Update user message details in this new round of questioning
const updateCurrentMessageDetails = async (
  room,
  usernameToUpdate,
  messageId
) => {
  try {
    const chatroomData = await getChatroomData(room);

    if (!chatroomData) return;

    const chatRoomRef = doc(db, "Chatrooms", room);
    const participants = chatroomData.Participants;

    const participantToUpdate = participants.find(
      (participant) => participant.username === usernameToUpdate
    );

    // Update has_sent_messages & message ID
    if (participantToUpdate) {
      participantToUpdate.has_sent_messages = true;
      participantToUpdate.messages.push(messageId);
      await updateDoc(chatRoomRef, chatroomData);
      console.log(`Updated has_sent_messages for ${usernameToUpdate}`);
    } else {
      console.log(`${usernameToUpdate} not found in participants array`);
    }

    checkAllUsersSentMessage(room);
  } catch (error) {
    console.error("Error updating has_sent_message:", error);
  }
};

// Track if all users have sent a message in this round of questioning
const checkAllUsersSentMessage = async (room) => {
  try {
    const chatroomData = await getChatroomData(room);

    if (!chatroomData) return;

    const participants = chatroomData.Participants;

    // Check if all users have sent a message
    const allUsersSentMessage = participants.every(
      (participant) => participant.has_sent_messages
    );

    if (allUsersSentMessage) {
      await insertChatroomMessagesIntoAnswers(room);
      await resetMessageArrayForParticipants(room);
      await resetHasSentMessage(room);
      console.log("All users have sent a message");
    } else {
      console.log("Not all users have sent a message");
    }
  } catch (error) {
    console.error("Error checking all users sent message:", error);
  }
};

// Reset all participants' has_sent_message to false
const resetHasSentMessage = async (room) => {
  try {
    const chatroomData = await getChatroomData(room);

    if (!chatroomData) return;

    const chatroomRef = doc(db, "Chatrooms", room);
    const participants = chatroomData.Participants;

    // Update has_sent_message to false for all participants
    const updatedParticipants = participants.map((participant) => {
      participant.has_sent_messages = false;
      return participant;
    });

    // Update the document in Firestore with the modified participants
    await updateDoc(chatroomRef, { Participants: updatedParticipants });

    console.log(
      `Reset has_sent_message to false for all participants in chatroom ${room}`
    );
  } catch (error) {
    console.error("Error resetting has_sent_message:", error);
  }
};

// Get all messages from all the participants in the same chatroom
const getAllMessagesFromParticipants = async (room) => {
  try {
    const chatroomData = await getChatroomData(room);

    if (!chatroomData) return;

    const participants = chatroomData.Participants;

    // Initialize an array to store all messages
    let allMessages = [];

    // Iterate through each participant
    for (const participant of participants) {
      const participantMessages = participant.messages || []; // Get messages array for the participant (if exists)
      allMessages = allMessages.concat(participantMessages); // Concatenate messages to allMessages array
    }

    console.log("All messages from all participants:", allMessages);
    return allMessages; // Return all messages array
  } catch (error) {
    console.error("Error fetching messages from participants:", error);
    return []; // Return empty array in case of error
  }
};

// Insert all the messages in the round into the collection which will trigger GPT
const insertChatroomMessagesIntoAnswers = async (room) => {
  try {
    // Get all messages from participants in the chatroom
    const messages = await getAllMessagesFromParticipants(room);

    // Create a new document in the "answers" collection
    const answersRef = collection(db, "answers");
    const newAnswerDoc = await addDoc(answersRef, {
      chatroomName: room, // Insert the chatroom name
      messages: messages, // Insert the list of messages
    });

    console.log(
      "Chatroom messages inserted into 'answers' collection with ID:",
      newAnswerDoc.id
    );
  } catch (error) {
    console.error(
      "Error inserting chatroom messages into 'answers' collection:",
      error
    );
  }
};

// Reset all messages for all participants in the same chatroom once the messages are parsed in GPT
const resetMessageArrayForParticipants = async (room) => {
  try {
    const chatroomData = await getChatroomData(room);

    if (!chatroomData) return;

    const chatroomRef = doc(db, "Chatrooms", room);
    const participants = chatroomData.Participants;

    // Reset message array for all participants
    const updatedParticipants = participants.map((participant) => {
      participant.messages = []; // Set message array to empty
      return participant;
    });

    // Update the document in Firestore with the modified participants
    await updateDoc(chatroomRef, { Participants: updatedParticipants });

    console.log(`Reset message array for all participants in chatroom ${room}`);
  } catch (error) {
    console.error("Error resetting message array for participants:", error);
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
    const docRef = await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: auth.currentUser.displayName,
      room,
    });

    updateCurrentMessageDetails(room, auth.currentUser.displayName, docRef.id);

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
