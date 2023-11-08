import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Input, Button, Dropdown, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { forwardRef, useImperativeHandle } from "react";
import ResponseCard from "../Common/ResponseCard";
import "./Output.less";

const Output = forwardRef(
  (
    { components, id, onUpdateInput, onUpdateOutput, index, isEditMode, title },
    ref
  ) => {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [noResult, setNoResult] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const previousComponents = components.slice(0, index);
    const dropdownEnabled = previousComponents.length > 0;

    const { loadedApplicationData } = useSelector(
      (state) => state.applicationData
    );

    const textAreaRef = useRef(null);

    useEffect(() => {
      onUpdateInput(input);
    }, [input]);

    useEffect(() => {
      if (loadedApplicationData && loadedApplicationData.chain) {
        for (const item of loadedApplicationData.chain) {
          if (item.id === id) {
            setInput(item.input || "");
            break;
          }
        }
      }
    }, [loadedApplicationData, id]);

    useEffect(() => {
      onUpdateOutput(output);
    }, [output]);

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

    const handleInputChange = (e) => {
      setInput(e.target.value);
    };

    const handleRunClick = async () => {
      setIsLoading(true);
      setOutput(null);
      setNoResult(null);

      let processedInput = input;

      previousComponents.forEach((component, i) => {
        if (
          component.type === "batch-input" &&
          Array.isArray(component.output)
        ) {
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
          const placeholder = `{${component.title}}`;
          processedInput = processedInput.replace(
            new RegExp(placeholder, "g"),
            component.output
          );
        }
      });

      if (processedInput) {
        onUpdateOutput(processedInput);
        setNoResult(processedInput ? "" : "No output generated.");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      setOutput(processedInput);
      setIsLoading(false);
    };

    const handleCopyClick = () => {
      setIsCopied(true);
      navigator.clipboard.writeText(output).then(() => {
        message.success("Copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
      });
    };

    const items = previousComponents
      .map((component, index) => {
        if (component === null || component === undefined) return null;
        if (
          component.type === "batch-input" &&
          Array.isArray(component.output)
        ) {
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
          const label = component.title;
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
      <div className="output-container">
        {isEditMode && (
          <>
            <div className="input-area">
              <Input.TextArea
                ref={textAreaRef}
                className="text-area"
                placeholder="Enter your text"
                value={input}
                onChange={handleInputChange}
                autoSize={{ minRows: 1, maxRows: 4 }}
              />
            </div>
            <div className="button-container">
              <div className="left-buttons">
                <Dropdown menu={menuProps} disabled={!dropdownEnabled}>
                  <Button className="insert-data-button">
                    Insert Data <DownOutlined />
                  </Button>
                </Dropdown>
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
          </>
        )}

        {(output || noResult || !isEditMode) && (
          <ResponseCard
            isLoading={isLoading}
            apiResponse={output}
            error={noResult}
            handleCopyClick={handleCopyClick}
            isCopied={isCopied}
            isEditMode={isEditMode}
            title={title}
          />
        )}
      </div>
    );
  }
);

export default Output;
