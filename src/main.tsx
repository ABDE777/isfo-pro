import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Analytics } from "@vercel/analytics/react"; // Add this import

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics /> {/* Add this line */}
  </>
);
