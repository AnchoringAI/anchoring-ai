// External dependencies
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input, message } from "antd";
import "highlight.js/styles/atom-one-light.css";

// Internal dependencies
import ResponseCard from "../Common/ResponseCard";
import { callYouTubeTranscript } from "./YouTubeTranscriptApi";
import "./YouTubeTranscript.less";

const YouTubeTranscript = forwardRef((props, ref) => {
  // State hooks
  const [userInput, setUserInput] = useState("");
  const [input, setInput] = useState("");
  const [apiResponse, setApiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Context hooks
  const dispatch = useDispatch();
  const { loadedApplicationData } = useSelector(
    (state) => state.applicationData
  );

  // Refs
  const textAreaRef = useRef(null);

  // Constants
  const { index, components } = props;
  const previousComponents = components.slice(0, index);
  const dropdownEnabled = previousComponents.length > 0;

  // Effect hooks
  useEffect(() => {
    setInput(`{${props.title} Content}`);
    props.onUpdateInput(`{${props.title} Content}`);
  }, [props.title]);

  useEffect(() => {
    props.onUpdateOutput(userInput);
    props.onUpdateUserInput(userInput);
  }, [userInput]);

  useEffect(() => {
    if (loadedApplicationData && loadedApplicationData.chain) {
      for (const item of loadedApplicationData.chain) {
        if (item.id === props.id) {
          setInput(item.input || "");
          break;
        }
      }
    }
  }, [loadedApplicationData, props.id]);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    async run() {
      return await handleRunClick();
    },
    setInput(newInput) {
      setInput(newInput);
    },
    setUserInput(newInput) {
      setUserInput(newInput);
    },
    getInput() {
      return input;
    },
  }));

  // Function definitions
  const handleInputChange = (e) => setUserInput(e.target.value);
  const handleRunClick = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    let processedInput = userInput;

    previousComponents.forEach((component, i) => {
      if (component.type === "batch-input" && Array.isArray(component.output)) {
        component.output.forEach((outputItem) => {
          const columnName = outputItem.Field;
          const columnValue = outputItem.Value;
          const placeholder = `{${columnName}}`;
          processedInput = processedInput.replace(
            new RegExp(placeholder, "g"),
            columnValue
          );
        });
      } else if (component && component.output) {
        const placeholder = component.title
          ? `{${component.title}}`
          : `{Action-${i + 1} Output}`;
        processedInput = processedInput.replace(
          new RegExp(placeholder, "g"),
          component.output
        );
      }
    });

    try {
      const response = await callYouTubeTranscript(processedInput);

      const output = JSON.stringify(response, null, 2);

      setApiResponse(output);
      props.onUpdateOutput(output);

      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsLoading(false);
      return output;
    } catch (err) {
      console.error("API call failed:", err);
      setError(err.toString());
      setIsLoading(false);
    }
  };

  const handleCopyClick = () => {
    setIsCopied(true);
    navigator.clipboard.writeText(apiResponse).then(() => {
      message.success("Copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="transcript-input">
      {
        <>
          <div className="action-row">
            <div className="input-field">
              <Input
                ref={textAreaRef}
                addonBefore="Video Link"
                placeholder="URL of the YouTube video"
                value={userInput}
                onChange={handleInputChange}
              />
            </div>
            <Button
              type="primary"
              onClick={handleRunClick}
              loading={isLoading}
              className="run-button"
            >
              {isLoading ? "Running" : "Run"}
            </Button>
          </div>
          {/* <div className="button-container">
            <div className="left-buttons">
              <Dropdown menu={menuProps} disabled={!dropdownEnabled}>
                <Button className="insert-data-button">
                  Insert Data <DownOutlined />
                </Button>
              </Dropdown>
            </div>
          </div> */}
        </>
      }
      {(apiResponse || isLoading || error || !props.isEditMode) && (
        <ResponseCard
          isLoading={isLoading}
          apiResponse={apiResponse}
          error={error}
          handleCopyClick={handleCopyClick}
          isCopied={isCopied}
          isEditMode={props.isEditMode}
          title={props.title}
        />
      )}
    </div>
  );
});

export default YouTubeTranscript;
