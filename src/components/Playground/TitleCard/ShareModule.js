import { useState } from "react";
import { message } from "antd";
import { generateShareLink } from "../../../api/sharedLink.ts";

const useShareModule = (appId) => {
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const handleShareClick = async () => {
    try {
      const response = await generateShareLink("APP", appId, null);
      setShareLink(response.shareableUrl);
      message.success("Link generated successfully");
    } catch (error) {
      message.error("Failed to generate the link");
    }
    setShareModalVisible(true);
  };

  const handleShareModalCancel = () => {
    setShareModalVisible(false);
  };

  return {
    shareModalVisible,
    shareLink,
    handleShareClick,
    handleShareModalCancel,
  };
};

export default useShareModule;
