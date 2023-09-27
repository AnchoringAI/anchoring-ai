import React, { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { register, login } from "../../api/account.ts";
import "./Styles.less";

const RegisterForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onFinish = async (values) => {
    try {
      const response = await register(
        values.username,
        values.email,
        values.password
      );
      if (response.success) {
        message.success("Registered successfully.");

        const loginResponse = await login(
          values.email,
          values.password,
          dispatch
        );
        if (loginResponse.success) {
          const redirectPath = localStorage.getItem("redirectPath") || "/home";
          navigate(redirectPath);
          localStorage.removeItem("redirectPath");
        } else {
          message("Login failed after registration");
        }
      } else {
        // handle failure
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { }, []);

  return (
    <Form name="register" onFinish={onFinish}>
      <Form.Item
        name="email"
        validateTrigger="onBlur"
        rules={[
          {
            type: "email",
            message: "The input is not a valid E-mail.",
          },
          {
            required: true,
            message: "Please provide your E-mail.",
          },
        ]}
      >
        <Input
          prefix={<MailOutlined style={{ color: email ? "black" : "grey" }} />}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Form.Item>
      <Form.Item
        name="username"
        validateTrigger="onBlur"
        rules={[
          {
            required: true,
            message: "Please provide your username.",
          },
          {
            min: 3,
            max: 20,
            message: "Username must be between 3 and 20 characters long.",
          },
        ]}
      >
        <Input
          prefix={
            <UserOutlined style={{ color: username ? "black" : "grey" }} />
          }
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Form.Item>
      <Form.Item
        name="password"
        validateTrigger="onBlur"
        rules={[
          {
            required: true,
            message: "Please input your password.",
          },
        ]}
        hasFeedback
      >
        <Input.Password
          prefix={
            <LockOutlined style={{ color: password ? "black" : "grey" }} />
          }
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Form.Item>
      <Form.Item
        name="confirm"
        dependencies={["password"]}
        hasFeedback
        rules={[
          {
            required: true,
            message: "Please confirm your password.",
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("The two passwords that you entered do not match.")
              );
            },
          }),
        ]}
      >
        <Input.Password
          prefix={
            <LockOutlined
              style={{ color: confirmPassword ? "black" : "grey" }}
            />
          }
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="main-button">
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RegisterForm;
