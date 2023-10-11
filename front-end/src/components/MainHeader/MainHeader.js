import React, { useState } from "react";
import { Layout, Menu, Dropdown, Modal, Button, Card } from "antd";
import {
  GithubOutlined,
  BookOutlined,
  LogoutOutlined,
  SettingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import DiscordIcon from "../../assets/discord-mark-black.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../api/account.ts";
import "./MainHeader.less";
import logo from "../../assets/text_logo.png";
import stringToColor from "string-to-color";
import color from "color";

const { Header } = Layout;

const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey = location.pathname.split("/")[1];
  const username = localStorage.getItem("username") || "Guest";

  const firstLetter = username[0].toUpperCase();
  const avatarColor = stringToColor(username);
  const darkAvatarColor = color(avatarColor).darken(0.5).hex();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCreateNewApp = () => {
    navigate("/playground/new");
    setIsModalVisible(false);
  };

  const handleGenerateNewApp = () => {
    navigate("/playground/generate");
    setIsModalVisible(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleUserSettings = async () => {
    navigate("/userSettings");
  };

  const userMenuItems = [
    {
      key: "0",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: handleUserSettings,
    },
    {
      key: "1",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  const items = [
    {
      label: "Home",
      key: "home",
      onClick: () => {
        navigate("/home");
      },
    },
    {
      label: "Application",
      key: "apps",
      onClick: () => {
        navigate("/apps");
      },
    },
    {
      label: "Data",
      key: "data",
      onClick: () => {
        navigate("/data");
      },
    },
    {
      label: "Batch Jobs",
      key: "jobs",
      onClick: () => {
        navigate("/jobs");
      },
    },
    // {
    //   label: "Deploy",
    //   key: "deploy",
    //   onClick: () => {
    //     navigate("/deploy");
    //   },
    // },
  ];

  return (
    <Header className="header">
      <div className="left-header">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>
        <Menu
          className="menu"
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={items}
        />
      </div>
      <div className="input-group">
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          New App
        </Button>
        <div className="icon-row">
          <a
            href="https://github.com/AnchoringAI/anchoring-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-container"
          >
            <GithubOutlined className="icon" />
          </a>
          <a
            href="https://discord.gg/rZ6ne9HRq4"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-container"
          >
            <img src={DiscordIcon} alt="Discord" className="icon" />
          </a>
          <a
            href="https://docs.anchoring.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-container"
          >
            <BookOutlined className="icon" />
          </a>
        </div>
        <Dropdown
          menu={{
            items: userMenuItems,
          }}
          trigger={["click"]}
          placement="bottomRight"
          arrow
        >
          <div
            className="ant-dropdown-link avatar"
            style={{ backgroundColor: darkAvatarColor }}
            onClick={(e) => e.preventDefault()}
          >
            {firstLetter}
          </div>
        </Dropdown>
      </div>
      <Modal
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        className="create-app-modal"
      >
        <div className="modal-option" onClick={handleCreateNewApp}>
          <Card bordered={true} hoverable={true}>
            <p className="modal-card-title">Build on your own</p>
            <p className="modal-card-text">
              Create a new application from scratch using our intuitive
              application building tools.
            </p>
          </Card>
        </div>
        <div className="modal-option" onClick={handleGenerateNewApp}>
          <Card bordered={true} hoverable={true}>
            <p className="modal-card-title">Build with AI</p>
            <p className="modal-card-text">
              Provide some simple instructions, and let AI automatically
              generate a new application for you.
            </p>
          </Card>
        </div>
      </Modal>
    </Header>
  );
};

export default MainHeader;
