import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import Home from "./pages/Home"; // FIX: Import file Home baru lu
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Login from "./pages/Login";
import BankSoal from "./pages/BankSoal";
import './index.css';
import './App.css';
import 'katex/dist/katex.min.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> }, // FIX: Index sekarang nembak ke Home
      { path: "/lobby/:gameId", element: <Lobby /> }, // FIX: Route baru buat ruang tunggu
      { path: "/game/:gameId", element: <Game /> },
      { path: "/login", element: <Login /> },
      { path: "/bank-soal", element: <BankSoal /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);