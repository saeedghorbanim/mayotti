import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// When the iOS keyboard closes it can leave the page nudged up. The app never
// scrolls as a whole (only the views inside it do), so snap it back.
const resetPageOffset = () => {
  if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
};
document.addEventListener("focusout", () => setTimeout(resetPageOffset, 60));
window.visualViewport?.addEventListener("resize", () => setTimeout(resetPageOffset, 60));

createRoot(document.getElementById("root")!).render(<App />);
