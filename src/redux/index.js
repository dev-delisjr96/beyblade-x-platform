import { configureStore } from "@reduxjs/toolkit";
import { thunk } from "redux-thunk";

const ENVS = import.meta.env;

// Define which reducers to persist
const PERSIST_KEYS = [""]; // <- just add/remove keys here

const loadState = () => {
  try {
    return PERSIST_KEYS.reduce((acc, key) => {
      const serialized = localStorage.getItem(`redux_${key}`);
      if (serialized) acc[key] = JSON.parse(serialized);
      return acc;
    }, {});
  } catch {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    PERSIST_KEYS.forEach((key) => {
      localStorage.setItem(`redux_${key}`, JSON.stringify(state[key]));
    });
  } catch {
    // ignore write errors
  }
};

export const store = configureStore({
  reducer: {},
  preloadedState: loadState(),
  middleware: () => [thunk],
  devTools: ENVS.MODE !== "production",
});

store.subscribe(() => saveState(store.getState()));
