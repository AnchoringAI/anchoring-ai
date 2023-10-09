import React, { useState, useEffect } from "react";
import { Layout, Input, Button, message, Progress } from "antd"; // 1. Import Progress
import { autoGenerateApplication } from "../../api/applications.ts";
import MainHeader from "../../components/MainHeader/MainHeader";
import { useNavigate } from "react-router-dom";
import "./PlaygroundGenerationPage.less";

const { Content } = Layout;
const { TextArea } = Input;

const PlaygroundGenerationPage = () => {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(0); // 2. Create a new state variable

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
    if (loading && percent < 100) {
      timer = setInterval(() => {
        setPercent((prev) => Math.min(prev + 1, 100)); // 3. Update the percent value over time
      }, 600); // Update every 600ms to simulate progress over 1 minute
    }
    return () => clearInterval(timer); // Cleanup timer on component unmount or when loading is false
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
      message.success("Application generated successfully!");
      setLoading(false);
      setPercent(0); // 4. Reset percent to 0 and hide progress bar
      const appId = response.application.appId;
      navigate(`/playground/${appId}`);
    } catch (error) {
      message.error("Failed to generate application.");
      setLoading(false);
      setPercent(0); // 4. Reset percent to 0 and hide progress bar
    }
  };

  return (
    <>
      <MainHeader />
      <div className="auto-generation-page">
        <Content className="generation-content">
          <p className="instruction-title">Build with AI</p>
          <p className="instruction-description">
            Provide a detailed description of the tasks you want AI to assist
            with. The more detailed your instructions, the better AI can tailor
            the generated application to your needs. After submitting, please
            allow a minute for the application to be generated and appear in
            your app list.
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
