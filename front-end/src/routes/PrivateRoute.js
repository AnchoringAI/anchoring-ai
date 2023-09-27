import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { checkAuthStatus } from "../api/account.ts";
import { Skeleton, message } from "antd";

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectToLogin = (errorMessage) => {
    localStorage.setItem("redirectPath", location.pathname);
    localStorage.removeItem("token");
    navigate("/login");
    message.warning(errorMessage);
  };

  useEffect(() => {
    checkAuthStatus()
      .then((data) => {
        if (data.success) {
          setIsAuthenticated(true);
        } else {
          redirectToLogin("Please log in to continue using our services.");
        }
      })
      .catch((error) => {
        console.error(error);
        redirectToLogin("Please log in to continue using our services."); //Your session has expired, please log in again.
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div>
        <Skeleton active />
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

export default PrivateRoute;
