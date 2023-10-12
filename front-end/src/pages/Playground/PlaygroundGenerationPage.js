import React, { useState, useEffect } from "react";
import { Layout, Input, Button, message, Progress } from "antd";
import { autoGenerateApplication } from "../../api/applications.ts";
import MainHeader from "../../components/MainHeader/MainHeader";
import { useNavigate } from "react-router-dom";
import "./PlaygroundGenerationPage.less";

const { Content } = Layout;
const { TextArea } = Input;

const PlaygroundGenerationPage = () => {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(0);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    if (e.target.value.length <= 1000) {
      setInstruction(e.target.value);
    } else {
      message.error("Max word count exceeded!");
    }
  };

  useEffect(() => {
    let timer;
    if (loading && percent < 99) {
      timer = setInterval(() => {
        setPercent((prev) => Math.min(prev + 1, 99));
      }, 600);
    } else if (!loading && percent === 99) {
      setPercent(100);
    }
    return () => clearInterval(timer);
  }, [loading, percent]);

  const handleGenerateClick = async () => {
    if (instruction.trim().length === 0) {
      message.error("Please provide valid instructions.");
      return;
    }
    setLoading(true);
    try {
      message.success("Your application is being created.");
      const response = await autoGenerateApplication(instruction);
      if (response && response.application) {
        message.success("Application generated successfully!");
        setLoading(false);
        setPercent(0);
        const appId = response.application.appId;
        navigate(`/playground/${appId}`);
      } else {
        throw new Error("No data returned");
      }
    } catch (error) {
      message.error("Failed to generate application.");
      setLoading(false);
      setPercent(0);
    }
  };

  return (
    <>
      <MainHeader />
      <div className="auto-generation-page">
        <Content className="generation-content">
          <p className="instruction-title">Build with AI</p>
          <p className="instruction-description">
            Tell us what tasks you'd like AI to help with. The more you share,
            the better we can tailor the app to your needs. After you hit
            submit, give us a minute to create your custom app. We'll take you
            right to your new app once it's ready!
          </p>
          <TextArea
            value={instruction}
            onChange={handleInputChange}
            placeholder="Enter your instructions here..."
            rows={10}
            maxLength={1000}
            className="instruction-input"
          />
          {loading && <Progress percent={percent} className="progress-bar" />}{" "}
          <Button
            type="primary"
            onClick={handleGenerateClick}
            className="generateButton"
            loading={loading}
          >
            {loading ? "Creating" : "Create"}
          </Button>
        </Content>
      </div>
    </>
  );
};

export default PlaygroundGenerationPage;
