import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

ProtectedRoute.propTypes = {
  element: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string)
};

ProtectedRoute.defaultProps = {
  allowedRoles: undefined
};

export default ProtectedRoute;
