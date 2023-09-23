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
        { label: "Doc Search", key: "doc-search" },
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
          if(onMenuClick) {
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
