import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children, adminOnly = false, volunteerOnly = false }) => {
  const { isAuthenticated, isAdmin, isVolunteerOrAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (volunteerOnly && !isVolunteerOrAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
