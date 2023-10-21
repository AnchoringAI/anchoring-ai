import React, { useState, useEffect } from "react";
import { Row, Col, Tooltip, Modal, Input, Switch, message } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import ModelInput from "./ModelInput";
import "./ComponentCard.less";

const modelComponents = {
  openai: "OpenAI Model",
  anthropic: "Anthropic Model",
  "text-input": "Text Input",
  "batch-input": "Batch Input",
  output: "Output",
  "tag-parser": "Tag Parser",
  "doc-search": "Doc Search",
};

const ComponentCard = (props) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState(props.component.title);
  const [tempTitle, setTempTitle] = useState(props.component.title);
  const [isInput, setIsInput] = useState(props.component.isAppInput);
  const [isOutput, setIsOutput] = useState(props.component.isAppOutput);

  const shouldRenderCard =
    props.component.isAppInput ||
    props.component.isAppOutput ||
    props.isEditMode;

  useEffect(() => {
    if (modalVisible) {
      setTempTitle(newTitle);
    }
  }, [modalVisible, newTitle]);

  const handleOk = () => {
    if (tempTitle.trim() === "") {
      message.error("Title cannot be empty");
    } else {
      setNewTitle(tempTitle);
      props.updateComponentTitle(props.component.id, tempTitle);
      props.updateComponentIsAppInput(props.component.id, isInput);
      props.updateComponentIsAppOutput(props.component.id, isOutput);
      setModalVisible(false);
    }
  };

  return (
    <div
      className={`customCard ${shouldRenderCard ? "" : "non-editmode"}`}
      key={props.component.id}
    >
      <Row {...props.dragHandleProps} align="middle" justify="space-between">
        {(props.component.isAppInput ||
          (!props.component.isAppInput && props.isEditMode)) && (
            <>
              {" "}
              <Col>
                <h3>
                  {props.component.title}{" "}
                  <small style={{ fontSize: "0.8em" }}>
                    ({modelComponents[props.component.type]})
                  </small>
                </h3>
              </Col>
              <Col>
                {props.isEditMode && (
                  <>
                    <Tooltip title="Edit">
                      <EditOutlined
                        className="edit-icon"
                        onClick={() => setModalVisible(true)}
                      />
                    </Tooltip>
                    <Tooltip title="Delete">
                      <DeleteOutlined
                        className="delete-icon"
                        onClick={() => props.deleteComponent(props.component.id)}
                      />
                    </Tooltip>
                  </>
                )}
              </Col>
            </>
          )}
      </Row>
      {modelComponents.hasOwnProperty(props.component.type) && (
        <ModelInput
          type={props.component.type}
          id={props.component.id}
          ref={(el) =>
            (props.refMap[props.component.type].current[props.index] = el)
          }
          components={props.components}
          index={props.index}
          title={props.component.title}
          isChangeSaved={props.isChangeSaved}
          isEditMode={props.isEditMode}
          onUpdateTitle={(newTitle) =>
            props.updateComponentTitle(props.component.id, newTitle)
          }
          onUpdateOutput={(output) =>
            props.updateComponentOutput(props.component.id, output)
          }
          onUpdateInput={(input) =>
            props.updateComponentInput(props.component.id, input)
          }
          onUpdateUserInput={(userInput) =>
            props.updateComponentUserInput(props.component.id, userInput)
          }
          onUpdateFileId={(fileId) =>
            props.updateComponentFileId(props.component.id, fileId)
          }
        />
      )}
      <Modal
        title="Component settings"
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
      >
        <Row gutter={16} className="row-align-items">
          <Col span={8}>
            <p>Title</p>
          </Col>
          <Col span={16} className="input-wrapper">
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
            />
          </Col>
        </Row>
        <Row gutter={16} className="row-align-items">
          <Col span={8}>
            <p>Set as Input</p>
          </Col>
          <Col span={16} className="switch-wrapper">
            <Switch
              checked={isInput}
              onChange={(checked) => setIsInput(checked)}
              disabled={["text-input", "batch-input", "output"].includes(
                props.component.type
              )}
            />
          </Col>
        </Row>
        <Row gutter={16} className="row-align-items">
          <Col span={8}>
            <p>Set as Output</p>
          </Col>
          <Col span={16} className="switch-wrapper">
            <Switch
              checked={isOutput}
              onChange={(checked) => setIsOutput(checked)}
              disabled={["batch-input", "output"].includes(
                props.component.type
              )}
            />
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default ComponentCard;
