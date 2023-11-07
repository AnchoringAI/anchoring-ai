// External dependencies
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input, Dropdown, message } from "antd";
import { SettingOutlined, DownOutlined } from "@ant-design/icons";
import "highlight.js/styles/atom-one-light.css";

// Internal dependencies
import GoogleSearchSettings from "./GoogleSearchSettings";
import ResponseCard from "../Common/ResponseCard";
import { callGoogleSearch } from "./GoogleSearchApi";
import { setComponentParam } from "../../../redux/actions/componentParamActions";
import "./GoogleSearch.less";

const GoogleSearch = forwardRef((props, ref) => {
  // State hooks
  const [open, setOpen] = useState(false);
  const [numResults, setNumResults] = useState(3);
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
    if (loadedApplicationData && loadedApplicationData.chain) {
      for (const item of loadedApplicationData.chain) {
        if (item.id === props.id) {
          const parameters = item.parameters;
          setNumResults(parameters.numResults || 3);
          setInput(item.input || "");
          break;
        }
      }
    }
  }, [loadedApplicationData, props.id]);

  useEffect(() => {
    dispatch(setComponentParam(props.id, "numResults", numResults));
  }, [
    numResults,
    dispatch,
    props.id,
  ]);

  useEffect(() => {
    props.onUpdateInput(input);
  }, [input]);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    async run() {
      return await handleRunClick();
    },
    getInput() {
      return input;
    },
    setInput(newInput) {
      setInput(newInput);
    },
  }));

  // Function definitions
  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);
  const handleInputChange = (e) => setInput(e.target.value);
  const handleRunClick = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    let processedInput = input;

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
      const response = await callGoogleSearch(
        processedInput,
        numResults
      );

      const output = response;
      setApiResponse(output);
      props.onUpdateOutput(output);

      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsLoading(false);
      return output;
    } catch (err) {
      console.error("API call failed:", err);
      setError(err.message);
      setIsLoading(false);
      return new Error("There was an error with the API call.");
    }
  };

  const handleCopyClick = () => {
    setIsCopied(true);
    navigator.clipboard.writeText(apiResponse).then(() => {
      message.success("Copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const items = previousComponents
    .map((component, index) => {
      if (component === null || component === undefined) return null;
      if (component.type === "batch-input" && Array.isArray(component.output)) {
        return component.output.map((outputItem) => {
          const columnName = outputItem.Field;
          return {
            label: `${columnName}`,
            key: `${columnName}`,
            onClick: () => {
              const { selectionStart, selectionEnd } =
                textAreaRef.current.resizableTextArea.textArea;
              const toInsert = `{${columnName}}`;
              setInput(
                (prevInput) =>
                  prevInput.substring(0, selectionStart) +
                  toInsert +
                  prevInput.substring(selectionEnd)
              );
            },
          };
        });
      } else {
        const label = component.title || `Action-${index + 1} Output`;
        return {
          label: label,
          key: index.toString(),
          onClick: () => {
            const { selectionStart, selectionEnd } =
              textAreaRef.current.resizableTextArea.textArea;
            const toInsert = `{${label}}`;
            setInput(
              (prevInput) =>
                prevInput.substring(0, selectionStart) +
                toInsert +
                prevInput.substring(selectionEnd)
            );
          },
        };
      }
    })
    .flat()
    .filter(Boolean);

  const menuProps = {
    items,
  };

  return (
    <div className="search-input">
      {props.isEditMode && (
        <>
          <div className="input-area">
            <Input.TextArea
              className="text-area"
              ref={textAreaRef}
              placeholder="Enter your search query"
              value={input}
              onChange={handleInputChange}
              autoSize={{ minRows: 3, maxRows: 8 }}
            />
          </div>
          <div className="button-container">
            <div className="left-buttons">
              <Dropdown menu={menuProps} disabled={!dropdownEnabled}>
                <Button className="insert-data-button">
                  Insert Data <DownOutlined />
                </Button>
              </Dropdown>
              <Button
                type="primary"
                onClick={showDrawer}
                className="settings-button"
              >
                <SettingOutlined />
              </Button>
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
          <GoogleSearchSettings
            open={open}
            onClose={onClose}
            numResults={numResults}
            setNumResults={setNumResults}
          />
        </>
      )}
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

export default GoogleSearch;
