import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

// StrictMode double-invokes effects which causes issues with node-pty shell spawning
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
