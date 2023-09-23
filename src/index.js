import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import translationEn from "./locales/en/translation.json";
// import other translation files here

// i18n.use(initReactI18next).init({
//   resources: {
//     en: {
//       translation: translationEn,
//     },
//     // Add other languages here
//   },
//   lng: "en",
//   fallbackLng: "en",
//   interpolation: {
//     escapeValue: false,
//   },
// });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
reportWebVitals();
