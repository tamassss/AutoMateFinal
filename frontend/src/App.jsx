import "./App.css";

import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import Home from "./pages/landing/home/home";
import Tips from "./pages/landing/tips/tips";
import DashboardLights from "./pages/landing/tips/dashboardLights/dashboardLights";
import FuelSaving from "./pages/landing/tips/fuelSaving/fuelSaving";
import ParkingHelp from "./pages/landing/tips/parkingHelp/parkingHelp";

import Cars from "./pages/car-select/cars/cars";

import Dashboard from "./pages/main-page/dashboard/dashboard";
import AverageConsumption from "./pages/main-page/averageConsumption/averageConsumption";
import ServiceLog from "./pages/main-page/menu-points/serviceLog/serviceLog";
import Statistics from "./pages/main-page/menu-points/statistics/statistics";
import TripsAndFuels from "./pages/main-page/menu-points/tripsAndFuels/tripsAndFuels";
import Login from "./pages/landing/login/login";
import GasStations from "./pages/main-page/menu-points/gasStations/gasStations";
import Community from "./pages/main-page/menu-points/community/community";
import AdminPage from "./pages/roles/admin/adminPage";
import LoadingOverlay from "./components/loading-overlay/loadingOverlay";
import SuccessModal from "./components/success-modal/successModal";

function isTokenValid(token) {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload?.exp) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp > nowSec;
  } catch {
    return false;
  }
}

function ProtectedRoute() {
  const token = localStorage.getItem("token");

  if (!isTokenValid(token)) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function AdminRoute() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!isTokenValid(token)) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/autok" replace />;
  }

  return <Outlet />;
}

function HomeRoute() {
  const token = localStorage.getItem("token");

  if (isTokenValid(token)) {
    return <Navigate to="/autok" replace />;
  }

  return <Home />;
}

function NotFoundRoute() {
  const token = localStorage.getItem("token");
  return <Navigate to={isTokenValid(token) ? "/autok" : "/"} replace />;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const routeState = location.state || {};
  const successMessage = routeState.successMessage;

  function closeSuccessModal() {
    if (!successMessage) return;

    const nextState = { ...routeState };
    delete nextState.successMessage;

    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: Object.keys(nextState).length ? nextState : null,
    });
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tippek" element={<Tips />} />
        <Route path="/tippek/muszerfal-jelzesek" element={<DashboardLights />} />
        <Route path="/tippek/uzemanyag-sporolas" element={<FuelSaving />} />
        <Route path="/tippek/parkolasi-tippek" element={<ParkingHelp />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/autok" element={<Cars />} />
          <Route path="/muszerfal" element={<Dashboard />} />
          <Route path="/muszerfal/atlagfogyasztas" element={<AverageConsumption />} />
          <Route path="/muszerfal/szerviznaplo" element={<ServiceLog />} />
          <Route path="/muszerfal/statisztikak" element={<Statistics />} />
          <Route path="/muszerfal/utak-tankolasok" element={<TripsAndFuels />} />
          <Route path="/muszerfal/benzinkutak" element={<GasStations />} />
          <Route path="/muszerfal/kozosseg" element={<Community />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundRoute />} />
      </Routes>

      {successMessage && <SuccessModal description={successMessage} onClose={closeSuccessModal} />}

      <LoadingOverlay />
    </>
  );
}

export default App;
