import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./pages/Landing";
import Library from "./pages/Library";
import FanzineReader from "./pages/FanzineReader";
import { fanzines } from "./data/fanzines";
import SectionLayout from "./pages/SectionLayout";
import { sections } from "./data/sections";
import { Analytics } from "@vercel/analytics/react";

// data router (non <BrowserRouter>): serve per <Link viewTransition>, la copertina
// che dalla Library "vola" nel lettore
const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/library", element: <Library /> },
  ...fanzines.map((fz) => ({ path: fz.href, element: <FanzineReader fz={fz} /> })),
  // layout route delle sezioni: figlie senza element, lo stage resta montato
  { element: <SectionLayout />, children: sections.map((s) => ({ path: s.href })) },
]);

function App() {
  return (
    <div>
      <RouterProvider router={router} />
      <Analytics />
    </div>
  );
}

export default App;
