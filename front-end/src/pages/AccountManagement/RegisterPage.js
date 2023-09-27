import React from "react";
import { Row, Col, Card, Button, Typography } from "antd";
import { Link } from "react-router-dom";
import RegisterForm from "../../components/AccountManagement/RegisterForm";
import loginCover from "../../assets/platform_cover.svg";
import logo from "../../assets/text_logo_dark.png";
import "./Styles.less";

const { Text } = Typography;

const RegisterPage = () => (
  <div
    className="card-container"
    style={{ backgroundImage: `url(${loginCover})` }}
  >
    <Card className="login-card">
      <img className="logo" src={logo} alt="Logo" />
      <span className="centered-title">Create Account</span>
      <span className="centered-description">Join our community.</span>
      <RegisterForm />
      {/* <Row justify="center" style={{ marginTop: "10px", marginBottom: "20px" }}>
        <Col>
          <Text type="danger">
            Registration is currently closed. Please check back later.
          </Text>
        </Col>
      </Row> */}
      <Row justify="center">
        <Col>
          <Button type="link" className="white-button">
            <Link to="/login">Already have an account? Log in</Link>
          </Button>
        </Col>
      </Row>
    </Card>
  </div>
);

export default RegisterPage;
