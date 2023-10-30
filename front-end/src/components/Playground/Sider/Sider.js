import React from "react";
import { Layout, Menu } from "antd";
import {
  DatabaseOutlined,
  AppstoreAddOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import "./Sider.less";

const { Sider } = Layout;

const PlaygroundSider = ({ onMenuClick }) => {
  const [selectedKeys, setSelectedKeys] = React.useState([]);

  const items = [
    {
      label: "Models",
      key: "models",
      icon: <CodeOutlined />,
      children: [
        { label: "OpenAI", key: "openai" },
        { label: "Anthropic", key: "anthropic" },
      ],
    },
    {
      label: "Data",
      key: "data",
      icon: <DatabaseOutlined />,
      children: [
        { label: "Text Input", key: "text-input" },
        { label: "Batch Input", key: "batch-input" },
        { label: "Output", key: "output" },
      ],
    },
    {
      label: "Plug-ins",
      key: "plugins",
      icon: <AppstoreAddOutlined />,
      children: [
        { label: "Tag Parser", key: "tag-parser" },
        { label: "Google Search", key: "google-search" },
        { label: "Doc Search", key: "doc-search" },
        { label: "YouTube Transcript", key: "youtube-transcript" },
      ],
    },
  ];

  return (
    <Sider className="playground-sider">
      <Menu
        mode="inline"
        defaultOpenKeys={["models", "data", "plugins"]}
        selectedKeys={selectedKeys}
        onClick={(e) => {
          if (onMenuClick) {
            onMenuClick(e);
          }
          setSelectedKeys([]);
        }}
        items={items}
      />
    </Sider>
  );
};

export default PlaygroundSider;
