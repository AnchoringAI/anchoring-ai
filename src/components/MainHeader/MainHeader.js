import React from "react";
import { Layout, Menu, Dropdown } from "antd";
import {
  GithubOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  LogoutOutlined,
  SettingOutlined,
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
        <div className="icon-row">
          <a
            href="https://github.com/AnchoringAI/anchoring-ai-frontend"
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
    </Header>
  );
};

export default MainHeader;
