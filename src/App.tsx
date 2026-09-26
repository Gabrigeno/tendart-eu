import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Library from "./pages/Library";
import FanzineReader from "./pages/FanzineReader";
import { fanzines } from "./data/fanzines";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <div>
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        {fanzines.map((fz) => (
          <Route key={fz.href} path={fz.href} element={<FanzineReader fz={fz} />} />
        ))}
        <Route path="/library" element={<Library />} />
      </Routes>
    </Router>
    <Analytics />
    </div>
  );
}

export default App;
