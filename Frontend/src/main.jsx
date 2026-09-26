import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Dynamically style favicon to circle with white background
function processFavicon() {
  const iconLink = document.querySelector("link[rel~='icon']");
  if (!iconLink) return;

  const img = new Image();
  img.src = iconLink.href;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const size = 128; // high res canvas
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // 1. White circle background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // 2. Circular border outline
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f1f5f9"; // slate-100 border
    ctx.stroke();

    // 3. Clip and draw image centered inside with padding
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, 2 * Math.PI);
    ctx.clip();
    ctx.drawImage(img, 8, 8, size - 16, size - 16);
    ctx.restore();

    // 4. Update the link href
    iconLink.href = canvas.toDataURL("image/png");
  };
}

// Execute favicon mask
processFavicon();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div data-theme="light">
      <App />
    </div>
  </StrictMode>,
);
