import React from "react";
import Message from "./Message";
import SendMessage from "./SendMessage";
import NavBar from "./NavBar";

const ChatBox = () => {
  return (
    <main className="chat-box">
      <NavBar />
      <div className="messages-wrapper">
        <Message />
      </div>
      <SendMessage />
    </main>
  );
};

export default ChatBox;
