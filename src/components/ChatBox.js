import React from "react";
import SendMessage from "./SendMessage";
import NavBar from "./NavBar";
import { useLocation } from "react-router-dom";

const ChatBox = () => {
  const location = useLocation();
  const { state } = location;

  const { room } = state;

  return (
    <main className="chat-box">
      <NavBar />
      <SendMessage room={room} />
    </main>
  );
};

export default ChatBox;
