import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./pages/Landing";
import Library from "./pages/Library";
import FanzineReader from "./pages/FanzineReader";
import { fanzines } from "./data/fanzines";
import { Analytics } from "@vercel/analytics/react";

// data router (non <BrowserRouter>): serve per <Link viewTransition>, la copertina
// che dalla Library "vola" nel lettore
const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/library", element: <Library /> },
  ...fanzines.map((fz) => ({ path: fz.href, element: <FanzineReader fz={fz} /> })),
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
