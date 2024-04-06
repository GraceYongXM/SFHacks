import React from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import NavBar from "./NavBar";
import Welcome from "./Welcome";
import HomePage from "./HomePage";

const Main = () => {
  const [user] = useAuthState(auth);
  return (
    <div className="App">
      <NavBar />
      {!user ? (
        <Welcome />
      ) : (
        <>
          <HomePage />
        </>
      )}
    </div>
  );
};

export default Main;
