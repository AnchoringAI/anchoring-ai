import React, { useState, useEffect, useRef } from "react";
import { Layout, Form, Input, Button, Card, message, Spin } from "antd";
import { useBeforeUnload } from "react-router-dom";

import MainHeader from "../../components/MainHeader/MainHeader";
import { registerApiKey, fetchApiKeys } from "../../api/apiKeys.ts";
import { getQuota } from "../../api/quota.ts";
import "./UserSettingsPage.less";

const { Content } = Layout;

const UserSettingsPage = () => {
  const [quota, setQuota] = useState(100);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
  const formRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const responseKeys = await fetchApiKeys();
        const keys = responseKeys.data;

        if (keys && keys.length > 0 && keys[0].valid === "True") {
          setApiKey("•".repeat(12));
          formRef.current.setFieldsValue({ apiKey: "•".repeat(12) });
        }

        const responseQuota = await getQuota();
        setQuota(responseQuota.data.quotaAvailable);

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onFinish = async (values) => {
    try {
      await registerApiKey(values.apiKey, "openai");
      message.success("API key saved successfully.");
      setApiKey("•".repeat(12));
      formRef.current.setFieldsValue({ apiKey: "•".repeat(12) });
    } catch (error) {
      message.error("Failed to save API key.");
      console.error("Failed to register API key:", error);
    }
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleBeforeUnload = (event) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = "Changes you made may not be saved.";
    }
  };

  return (
    <Layout className="settings-page">
      <MainHeader />
      <Content className="settings-container">
        <Card title="Usage Overview" className="settings-card">
          <p className="quota">
            You have {quota} requests left in your quota. Enjoy exploring!
          </p>
          <p className="quota-notes">
            Just to give you a sense, that equates to {quota} runs on GPT-3.5 or
            approximately {(quota / 5).toFixed(0)} runs on GPT-4.
          </p>
        </Card>

        <Card title="API Settings" className="settings-card">
          <Form layout="vertical" ref={formRef} onFinish={onFinish}>
            <Form.Item
              label="OpenAI API Key"
              name="apiKey"
              rules={[
                {
                  required: true,
                  message: "Please input your OpenAI API Key!",
                },
              ]}
            >
              {loading ? (
                <Spin />
              ) : (
                <Input
                  placeholder="Enter your OpenAI API Key here"
                  onChange={(e) => setApiKey(e.target.value)}
                  value={apiKey}
                />
              )}
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" disabled={loading}>
                Save API Key
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default UserSettingsPage;
