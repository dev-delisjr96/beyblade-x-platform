import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

import Languagedetector from "i18next-browser-languagedetector";

const ENVS = import.meta.env;

i18n
  .use(HttpBackend) // Use HTTP backend to fetch translations
  .use(Languagedetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    debug: ENVS.NODE_ENV === "development",
    lng: "it",
    supportedLngs: ["it", "en"], // Define supported languages
    fallbackLng: "it",
    defaultNS: "common",
    ns: ["common", "inputs", "landing-page", "rules-point-values", "tournament-formats"],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    // resources,

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
