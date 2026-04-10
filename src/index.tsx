import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 1. Подключаем скрипт Telegram динамически
const script = document.createElement("script");
script.src = "https://telegram.org/js/telegram-web-app.js";
script.async = true;
script.onload = () => {
  // 2. Когда скрипт загрузился, расширяем приложение
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
};
document.head.appendChild(script);

let rootElement = document.getElementById("root");
if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = "root";
  document.body.appendChild(rootElement);
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
