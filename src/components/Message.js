import React from "react";
import { auth } from "../firebase";

const Message = ({ userName, message }) => {
  return (
    <div className={userName === auth.currentUser.displayName ? "reverse" : ""}>
      <div
        className={`chat-bubble ${
          userName === auth.currentUser.displayName ? "right" : "left"
        }`}
      >
        <p className="user-name">{userName}</p>
        <p className="user-message">{message}</p>
      </div>
    </div>
  );
};

export default Message;
