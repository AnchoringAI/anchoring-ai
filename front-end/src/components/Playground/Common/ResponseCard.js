import React, { useState, useEffect } from "react";
import { Button, Card } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-light.css";
import "./ResponseCard.less";

const ResponseCard = ({
  isLoading,
  apiResponse,
  error,
  handleCopyClick,
  isCopied,
  isEditMode,
  title,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>{!isEditMode ? title : "Response"}</div>
          {!isLoading && apiResponse && (
            <Button
              className={`copy-icon ${isCopied ? "copied" : ""}`}
              type="link"
              onClick={handleCopyClick}
            >
              <CopyOutlined />
            </Button>
          )}
        </div>
      }
      className={`response-card ${
        !isLoading && !apiResponse && !error
          ? "header-only"
          : `${!isEditMode ? "non-editmode" : ""}`
      }`}
    >
      {isLoading && <p className="running">Waiting for responses...</p>}
      {!isLoading && apiResponse && (
        <div
          className="markdown-container"
          style={{ maxHeight: isExpanded ? "auto" : "16em", overflowY: "auto" }}
        >
          <ReactMarkdown
            remarkPlugins={[gfm]}
            rehypePlugins={[rehypeHighlight]}
            children={apiResponse}
          />
        </div>
      )}
      {!isLoading && error && <p className="alert">{error}</p>}
    </Card>
  );
};

export default ResponseCard;
