import { createRoot } from "react-dom/client";
import "./demo.css";
import { FeelableMaterialsDemo } from "./feelable-materials";

document.body.dataset.demo = "feelable-materials";

const root = document.getElementById("root");
if (!root) throw new Error("Feelable Materials demo root is missing");

createRoot(root).render(<FeelableMaterialsDemo />);
