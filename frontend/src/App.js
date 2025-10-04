import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Common/Navbar';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Home from './components/Common/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Auth/Profile';
import ChangePassword from './components/Auth/ChangePassword';
import FoodList from './components/Food/FoodList';
import FoodForm from './components/Food/FoodForm';
import FoodDetail from './components/Food/FoodDetail';
import MyDonations from './components/Food/MyDonations';
import MyClaims from './components/Food/MyClaims';
import AdminPanel from './components/Admin/AdminPanel';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<FoodList />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/food/:id" element={<FoodDetail />} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/food/create"
                element={
                  <ProtectedRoute>
                    <FoodForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/food/edit/:id"
                element={
                  <ProtectedRoute>
                    <FoodForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-donations"
                element={
                  <ProtectedRoute>
                    <MyDonations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-claims"
                element={
                  <ProtectedRoute>
                    <MyClaims />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />

              {/* 404 Route */}
              <Route
                path="*"
                element={
                  <div className="not-found">
                    <h1>404 - Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                  </div>
                }
              />
            </Routes>
          </main>
          <footer className="footer">
            <p>&copy; 2025 FoodShare. All rights reserved. | Reduce Waste, Share Food, Help Community</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
