import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input, Select, message } from "antd";
import { forwardRef, useImperativeHandle } from "react";
import { setComponentParam } from "../../../redux/actions/componentParamActions";
import ResponseCard from "../Common/ResponseCard";
import "./TagParser.less";

const TagParser = forwardRef(
  (
    { components, id, index, onUpdateOutput, onUpdateInput, isEditMode, title },
    ref
  ) => {
    const [extractPattern, setExtractPattern] = useState("");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [noResult, setNoResult] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const previousComponents = components.slice(0, index);
    const selectEnabled = previousComponents.length > 0;

    const dispatch = useDispatch();
    const { loadedApplicationData } = useSelector(
      (state) => state.applicationData
    );

    useEffect(() => {
      if (loadedApplicationData && loadedApplicationData.chain) {
        for (const item of loadedApplicationData.chain) {
          if (item.id === id) {
            setInput(item.input || "");
            setExtractPattern(item.parameters.extractPattern || "");
            break;
          }
        }
      }
    }, [loadedApplicationData, id]);

    useEffect(() => {
      dispatch(setComponentParam(id, "extractPattern", extractPattern));
    }, [extractPattern, dispatch, id]);

    const handleRunClick = async () => {
      setIsLoading(true);
      setOutput(null);
      setNoResult(null);

      let processedInput = `${input}`;

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
      if (processedInput && extractPattern) {
        const extracted = extractPatternFromText(
          processedInput,
          extractPattern
        );
        setOutput(extracted);
        onUpdateOutput(extracted);
        setNoResult(extracted ? "" : "No data extracted.");
        await new Promise((resolve) => setTimeout(resolve, 100));
        setIsLoading(false);
        return extracted;
      }
      setIsLoading(false);
    };

    const extractPatternFromText = (text, pattern) => {
      const regex = new RegExp(`<${pattern}>(.*?)<\/${pattern}>`, "is");
      const match = text.match(regex);
      return match ? match[1] : null;
    };

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
            };
          });
        } else {
          return {
            label: component.title,
            key: index.toString(),
          };
        }
      })
      .flat()
      .filter(Boolean);

    const menuProps = {
      items,
    };

    return (
      <div className="tag-parser-container">
        {isEditMode && (
          <>
            <div className="action-row">
              <Select
                className="select-field"
                placeholder="Select Data"
                disabled={!selectEnabled}
                value={input || undefined}
                onChange={(value) => {
                  setInput(value);
                  onUpdateInput(value);
                }}
                options={menuProps.items.map((item) => ({
                  value: `{${item.label}}`,
                  label: item.label,
                  key: item.key,
                }))}
              />
              <div className="input-field">
                <Input
                  addonBefore="Pattern"
                  placeholder="Enter your pattern (case insensitive)"
                  value={extractPattern}
                  onChange={(e) => setExtractPattern(e.target.value)}
                />
              </div>
              <Button
                type="primary"
                onClick={handleRunClick}
                loading={isLoading}
              >
                Run
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

export default TagParser;
