import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const noiseUrl = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

document.addEventListener("copy", (e) => {
  e.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <>
    <div className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.05]" style={{ backgroundImage: noiseUrl, backgroundRepeat: "repeat", backgroundSize: "128px 128px",}}/>
    <App />
  </>
);