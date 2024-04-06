import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ChatBox from "./components/ChatBox";
import Main from "./components/Main";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/chatbox" element={<ChatBox />} />
        {/* <Route component={NotFound} /> */}
      </Routes>
    </Router>
  );
}

export default App;
