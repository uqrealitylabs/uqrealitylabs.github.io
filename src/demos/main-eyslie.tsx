import "@uqrealitylabs/eyslie/styles.css";
import { createRoot } from "react-dom/client";
import "./demo.css";
import { EyslieDemo } from "./eyslie";

document.body.dataset.demo = "eyslie";

const root = document.getElementById("root");
if (!root) throw new Error("Eyslie demo root is missing");

createRoot(root).render(<EyslieDemo />);
