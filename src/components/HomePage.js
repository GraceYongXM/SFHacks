import React, { useState } from "react";

const HomePage = () => {
  const [groupChatId, setGroupChatId] = useState("");

  const handleInputChange = (event) => {
    setGroupChatId(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Here you can perform any action with the entered groupChatId
    console.log("Group Chat ID:", groupChatId);
    // Clear the input field after submission if needed
    setGroupChatId("");
  };

  return (
    // <main className="chat-box">
    <form className="group-chat-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={groupChatId}
        onChange={handleInputChange}
        placeholder="Enter Group Chat ID"
      />
      <button type="submit">Join</button>
    </form>
    // </main>
  );
};

export default HomePage;
