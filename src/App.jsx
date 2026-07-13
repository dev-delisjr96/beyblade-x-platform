import React from "react";

// Router
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";

import LandingPage from "./pages/LandingPage/LandingPage";
import DeckBuilderPage from "./pages/DeckBuilderPage/DeckBuilderPage";
import RulesPartValues from "./pages/RulesPartValues/RulesPartValues";
import RulesPointValues from "./pages/RulesPointValues/RulesPointValues";

const AppWrapper = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/:tournament_format" element={<Outlet />}>
        <Route path="deck-builder" element={<Outlet />}>
          <Route index element={<DeckBuilderPage />} />

          <Route path=":club" element={<Outlet />}>
            <Route path=":date" element={<Outlet />}>
              <Route path="values" element={<RulesPointValues />} />
              <Route path="parts" element={<RulesPartValues />} />
            </Route>
          </Route>
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
