import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [groupChatName, setgroupChatName] = useState("");
  const [participants, setParticipants] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    setgroupChatName(event.target.value);
  };

  const getUserEmail = () => {
    const user = auth.currentUser;

    if (user) {
      const email = user.email;
      console.log("User email:", email);
      return email;
    } else {
      console.log("No user logged in.");
      return null;
    }
  };

  const handleJoinChat = async (event) => {
    event.preventDefault();

    try {
      // Check if the chat room exists in Firebase Firestore
      const chatRoomRef = doc(db, "Chatrooms", groupChatName);
      const chatRoomSnapshot = await getDoc(chatRoomRef);

      // If the chat room exists, check if the user exists in that chat room
      const userId = getUserEmail();
      if (chatRoomSnapshot.exists) {
        const chatRoomData = chatRoomSnapshot.data();
        if (
          chatRoomData["Participants"] &&
          chatRoomData["Participants"].includes(userId)
        ) {
          // User exists in the chat room
          setParticipants(true);
          console.log("User exists in the chat room:", groupChatName);
        } else {
          // User does not exist in the chat room
          setParticipants(false);
          console.log("User does not exist in the chat room:", groupChatName);
        }
      } else {
        // Chat room does not exist
        console.log("Chat room does not exist:", groupChatName);
      }
    } catch (error) {
      console.error("Error checking chat room existence:", error);
      return null;
    }
  };

  // Redirect user to chatbox component if they exist in the group chat
  useEffect(() => {
    if (participants) {
      navigate("/chatbox"); // Redirect to chatbox component
    }
  }, [participants, navigate]);

  return (
    // <main className="chat-box">
    <form className="group-chat-form" onSubmit={handleJoinChat}>
      <input
        type="text"
        value={groupChatName}
        onChange={handleInputChange}
        placeholder="Enter Group Chat Name"
      />
      <button type="submit">Join</button>
    </form>
    // </main>
  );
};

export default HomePage;
