import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import App from "./App.tsx";
import "./index.css";

// When the iOS keyboard closes it can leave the page nudged up. The app never
// scrolls as a whole (only the views inside it do), so snap it back.
const resetPageOffset = () => {
  if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
};
document.addEventListener("focusout", () => setTimeout(resetPageOffset, 60));
window.visualViewport?.addEventListener("resize", () => setTimeout(resetPageOffset, 60));

// Hide the iOS "< > Done" bar above the keyboard; the app has a single field.
if (Capacitor.isNativePlatform()) {
  Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
  // While typing, hide the tab bar so the chat box sits directly on the keyboard.
  Keyboard.addListener("keyboardWillShow", () => document.body.classList.add("keyboard-open"));
  Keyboard.addListener("keyboardWillHide", () => document.body.classList.remove("keyboard-open"));
}

createRoot(document.getElementById("root")!).render(<App />);
