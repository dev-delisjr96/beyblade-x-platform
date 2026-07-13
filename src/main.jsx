import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.scss";
import App from "./App.jsx";
import "./translations/i18n";
// Icons
import lottie from "lottie-web";
import { defineElement } from "lord-icon-element";
// Redux
import { Provider } from "react-redux";
import {
  store,
  // persistor
} from "./redux";
// import { PersistGate } from "redux-persist/integration/react";

import { QueryClientProvider } from "@tanstack/react-query";
import { reactQuery } from "./api/reactQuery.js";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

defineElement(lottie.loadAnimation);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      {/* <PersistGate loading={null} persistor={persistor}> */}
      <QueryClientProvider client={reactQuery}>
        <ReactQueryDevtools initialIsOpen={false} />
        <App />
      </QueryClientProvider>
      {/* </PersistGate> */}
    </Provider>
  </StrictMode>,
);
