import React from "react";
import { Drawer, Form, Slider, Select, Tooltip } from "antd";
import "./AnthropicModelSettings.less";

const { Option } = Select;

const AnthropicModelSettings = ({
  open,
  onClose,
  modelName,
  setModelName,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  topP,
  setTopP,
}) => {
  const handleModelNameChange = (value) => {
    setModelName(value);
  };

  return (
    <Drawer
      title={"Model Settings"}
      width={360}
      onClose={onClose}
      open={open}
      bodyStyle={{ paddingBottom: 80 }}
    >
      <Form layout="vertical" hideRequiredMark>
        <Form.Item label={"Model Name"}>
          <Select defaultValue={modelName} onChange={handleModelNameChange}>
            <Option value="claude-2">{"claude-2"}</Option>
            <Option value="claude-instant-1">{"claude-instant-1"}</Option>
          </Select>
        </Form.Item>
        <Form.Item
          label={
            <Tooltip title={"Controls the randomness of the model's responses. Higher values (closer to 1) mean more random output."}>
              <div className="labelContainer">
                <span>{"Temperature"}</span>
                <span>{temperature}</span>
              </div>
            </Tooltip>
          }
        >
          <Slider
            value={temperature}
            min={0}
            max={1}
            step={0.01}
            onChange={setTemperature}
          />
        </Form.Item>
        <Form.Item
          label={
            <Tooltip title={"The maximum length of the output in tokens. A higher value means a longer output."}>
              <div className="labelContainer">
                <span>{"Maximum Tokens"}</span>
                <span>{maxTokens}</span>
              </div>
            </Tooltip>
          }
        >
          <Slider
            defaultValue={maxTokens}
            min={1}
            max={2048}
            onChange={setMaxTokens}
          />
        </Form.Item>
        <Form.Item
          label={
            <Tooltip title={"Controls the diversity of the model's responses via nucleus sampling. Higher values (closer to 1) mean less diverse output."}>
              <div className="labelContainer">
                <span>{"Top P"}</span>
                <span>{topP}</span>
              </div>
            </Tooltip>
          }
        >
          <Slider
            defaultValue={topP}
            min={0}
            max={1}
            step={0.01}
            onChange={setTopP}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AnthropicModelSettings;
