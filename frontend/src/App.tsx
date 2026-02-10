import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Feedback from "./pages/Feedback";
import Analytics from "./pages/Analytics";
import Reviews from "./pages/Reviews";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Feedback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/reviews" element={<Reviews />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
