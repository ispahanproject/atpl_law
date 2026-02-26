import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LawRelationshipMap from "../atpl_law.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LawRelationshipMap />
  </StrictMode>
);
