import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
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
      console.log("chatRoomSnapshot", chatRoomSnapshot);

      // If the chat room exists, check if the user exists in that chat room
      const userEmail = getUserEmail();
      const chatRoomData = chatRoomSnapshot.data();
      if (chatRoomData) {
        const participants = chatRoomData["Participants"] || [];
        if (participants.includes(userEmail)) {
          // User exists in the chat room
          setParticipants(true);
          console.log("User exists in the chat room:", groupChatName);
        } else {
          // User does not exist in the chat room yet
          // Add user in
          participants.push({
            email: userEmail,
            has_sent_messages: false,
            messages: [],
            username: auth.currentUser.displayName,
          });
          await updateDoc(chatRoomRef, {
            Participants: participants,
          });
          console.log("User added to the chat room:", groupChatName);
          setParticipants(true);
        }
      } else {
        // Chat room does not exist
        // Create chat room
        await setDoc(chatRoomRef, {
          Participants: [
            {
              email: userEmail,
              has_sent_message: false,
              messages: [],
              username: auth.currentUser.displayName,
            },
          ],
        });
        console.log("Chat room created:", groupChatName);
        setParticipants(true);
      }
    } catch (error) {
      console.error("Error checking chat room existence:", error);
      return null;
    }
  };

  // Redirect user to chatbox component if they exist in the group chat
  useEffect(() => {
    if (participants) {
      navigate("/chatbox", { state: { room: groupChatName } }); // Redirect to chatbox component
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
