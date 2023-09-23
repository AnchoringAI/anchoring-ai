import React, { useState } from "react";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/account.ts";
import { useDispatch } from "react-redux";
import "./Styles.less";

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onFinish = async (values) => {
    try {
      const data = await login(values.email, values.password, dispatch);
      if (data.success) {
        console.log(localStorage.getItem("redirectPath"))
        const redirectPath = localStorage.getItem("redirectPath") || "/home";
        navigate(redirectPath);
        localStorage.removeItem("redirectPath");
      } else {
        message.error(
          "The provided email or password is invalid. Please try again."
        );
      }
    } catch (error) {
      console.error("Login failed with error: ", error);
      message.error(
        "The provided email or password is invalid. Please try again."
      );
    }
  };

  return (
    <Form
      name="normal_login"
      className="login-form"
      initialValues={{ remember: true }}
      onFinish={onFinish}
    >
      <Form.Item
        name="email"
        validateTrigger="onBlur"
        rules={[
          { required: true, message: "Please enter your Email" },
          { type: "email", message: "This seems not a valid E-mail" },
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
        name="password"
        validateTrigger="onBlur"
        rules={[{ required: true, message: "Please enter your Password" }]}
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

      <Form.Item>
        <Button type="primary" htmlType="submit" className="main-button">
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
