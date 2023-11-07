import React, { useState, useEffect } from "react";
import { Input } from "antd";
import { forwardRef, useImperativeHandle } from "react";
import "./TextInput.less";

const TextInput = forwardRef(
  (
    {
      components,
      index,
      title,
      onUpdateInput,
      onUpdateUserInput,
      onUpdateOutput,
    },
    ref
  ) => {
    const [userInput, setUserInput] = useState("");
    const [input, setInput] = useState("");

    useEffect(() => {
      setInput(`{${title} Content}`);
      onUpdateInput(`{${title} Content}`);
    }, [title]);

    useEffect(() => {
      onUpdateOutput(userInput);
      onUpdateUserInput(userInput);
    }, [userInput]);

    useImperativeHandle(ref, () => ({
      async run() {
        let processedInput = userInput;

        onUpdateOutput(processedInput);
        return processedInput;
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

    const handleInputChange = (e) => {
      setUserInput(e.target.value);
    };

    const previousComponents = components.slice(0, index);

    return (
      <div className="text-input-container">
        <Input.TextArea
          className="text-area"
          placeholder="Enter your text"
          value={userInput}
          onChange={handleInputChange}
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
      </div>
    );
  }
);

export default TextInput;
