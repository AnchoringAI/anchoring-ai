import React, { useEffect } from "react";
import { Row, Col, Card, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "../../components/AccountManagement/LoginForm";
import loginCover from "../../assets/platform_cover.svg";
import "./Styles.less";

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  return (
    <div
      className="card-container"
      style={{ backgroundImage: `url(${loginCover})` }}
    >
      <Card
        className="login-card"
        title={<span className="centered-title">Sign in to Anchoring.ai</span>}
      >
        <LoginForm />
        <Row justify="center">
          <Button type="link" className="white-button">
            <Link to="/register">No account? Create one!</Link>
          </Button>
        </Row>
      </Card>
    </div>
  );
};

export default LoginPage;
