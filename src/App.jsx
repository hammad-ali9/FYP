import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import './App.css';

import Inventory from './pages/dashboard/Inventory';
import Analytics from './pages/dashboard/Analytics';
import Sessions from './pages/dashboard/Sessions';
import Settings from './pages/dashboard/Settings';

import Profile from './pages/dashboard/Profile';
import Subscription from './pages/dashboard/Subscription';
import TryOn from './pages/TryOn';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Standalone Try-On Interface */}
          <Route path="/try-on" element={<TryOn />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subscription" element={<Subscription />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
