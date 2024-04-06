import React from "react";

const Message = ({ userName, message }) => {
  return (
    <div className={`chat-bubble`}>
      <div className="chat-bubble__right">
        <p className="user-name">{userName}</p>
        <p className="user-message">{message}</p>
      </div>
    </div>
  );
};

export default Message;
