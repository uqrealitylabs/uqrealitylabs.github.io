import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../shared/styles/tailwind.css";

const root = document.getElementById("root");

if (!root) throw new Error("Missing #root");

createRoot(root).render(<App />);
