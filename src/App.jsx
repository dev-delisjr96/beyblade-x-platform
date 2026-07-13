import React, { useState, useEffect } from "react";

import { subscribeToData } from "./services/firebase/rtdb";

// Router
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import RulesPartValues from "./pages/RulesPartValues/RulesPartValues";
import RulesPointValues from "./pages/RulesPointValues/RulesPointValues";

const ENVS = import.meta.env;

const AppWrapper = () => {
  // const [testDeck, setTestDeck] = useState([]);

  // useEffect(() => {
  //   const unsubscribe = subscribeToData("/ ", setTestDeck);
  //   return () => unsubscribe();
  // }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/rules" element={<Outlet />}>
        <Route path=":rule_name" element={<Outlet />}>
          <Route path="parts" element={<RulesPartValues />} />
          <Route path="values" element={<RulesPointValues />} />
        </Route>
      </Route>
    </Routes>
  );
};

const RouterWrapper = () => (
  <Router>
    <AppWrapper />
  </Router>
);

const App = () => <RouterWrapper />;

export default App;
