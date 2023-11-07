import React, { useEffect, useState } from "react";
import { Drawer, Form, Slider, Select, Tooltip } from "antd";
import "./OpenAIModelSettings.less";

const { Option } = Select;

const OpenAIModelSettings = ({
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
  frequencyPenalty,
  setFrequencyPenalty,
  presencePenalty,
  setPresencePenalty,
}) => {
  const [sliderMax, setSliderMax] = useState(2048);

  useEffect(() => {
    // Define the max tokens and slider max for each model
    const modelSliderMax = {
      "gpt-3.5-turbo-16k": 16385,
      "gpt-4": 8192,
      "gpt-4-1106-preview": 128000,
    };

    // Set max tokens and slider max when model name changes
    if (modelSliderMax[modelName]) {
      setMaxTokens(
        Math.min(maxTokens, modelSliderMax[modelName])
      );
      setSliderMax(modelSliderMax[modelName]);
    }
  }, [modelName, setMaxTokens]);

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
      <Form layout="vertical">
        <Form.Item label={"Model Name"}>
          <Select defaultValue={modelName} onChange={handleModelNameChange}>
            <Option value="gpt-3.5-turbo-16k">
              {"GPT-3.5 Trubo (gpt-3.5-turbo-16k)"}
            </Option>
            <Option value="gpt-4">{"GPT-4 (gpt-4)"}</Option>
            <Option value="gpt-4-1106-preview">
              {"GPT-4 Turbo (gpt-4-1106-preview)"}
            </Option>
          </Select>
        </Form.Item>
        <Form.Item
          label={
            <Tooltip
              title={
                "Controls the randomness of the model's responses. Higher values (closer to 1) mean more random output."
              }
            >
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
            <Tooltip
              title={
                "The maximum length of the output in tokens. A higher value means a longer output."
              }
            >
              <div className="labelContainer">
                <span>{"Maximum Tokens"}</span>
                <span>{maxTokens}</span>
              </div>
            </Tooltip>
          }
        >
          <Slider
            value={maxTokens}
            min={1}
            max={sliderMax}
            onChange={setMaxTokens}
          />
        </Form.Item>
        <Form.Item
          label={
            <Tooltip
              title={
                "Controls the diversity of the model's responses via nucleus sampling. Higher values (closer to 1) mean less diverse output."
              }
            >
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
        <Form.Item
          label={
            <Tooltip
              title={
                "The penalty for using new tokens in the output. Higher values discourage the model from using new tokens."
              }
            >
              <div className="labelContainer">
                <span>{"Frequency Penalty"}</span>
                <span>{frequencyPenalty}</span>
              </div>
            </Tooltip>
          }
        >
          <Slider
            defaultValue={frequencyPenalty}
            min={0}
            max={2}
            step={0.01}
            onChange={setFrequencyPenalty}
          />
        </Form.Item>
        <Form.Item
          label={
            <Tooltip
              title={
                "The penalty for using tokens that were not in the input. Higher values discourage the model from introducing new concepts."
              }
            >
              <div className="labelContainer">
                <span>{"Presence Penalty"}</span>
                <span>{presencePenalty}</span>
              </div>
            </Tooltip>
          }
        >
          <Slider
            defaultValue={presencePenalty}
            min={0}
            max={2}
            step={0.01}
            onChange={setPresencePenalty}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default OpenAIModelSettings;
