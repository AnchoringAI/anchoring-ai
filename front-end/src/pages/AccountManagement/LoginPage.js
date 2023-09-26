import React, { useEffect } from "react";
import { Row, Col, Card, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "../../components/AccountManagement/LoginForm";
import loginCover from "../../assets/platform_cover.svg";
import logo from "../../assets/text_logo_dark.png";
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
      >
        <img className="logo" src={logo} alt="Logo" />
        <span className="centered-title">Hello!</span>
        <span className="centered-description">Let's build together.</span>
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
