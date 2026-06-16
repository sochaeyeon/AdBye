import { Navigate } from "react-router-dom";

function PrivateRoute({ children, role, allowedRoles }) {
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/review" replace />;
  }
  return children;
}

export default PrivateRoute;
