import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { captureAttribution } from "./lib/track";

captureAttribution();
import "./index.css";
import { applyFontScale, getStoredFontScale } from "./hooks/useFontScale.ts";

applyFontScale(getStoredFontScale());

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
