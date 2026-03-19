import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "../auth/storage";

export default function ProtectedRoute() {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
