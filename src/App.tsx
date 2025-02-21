import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout";
import HomePage from "./pages/home";
import BookingPage from "./book/page";
import ServicesPage from "./services/page";
import ConfirmationPage from "./confirm/page";
import PaginaAdmin from "./pages/admin";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/confirm" element={<ConfirmationPage />} />
          <Route path="/admin" element={<PaginaAdmin />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
