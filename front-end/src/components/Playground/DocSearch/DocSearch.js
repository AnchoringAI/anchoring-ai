// External dependencies
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button, Input, Dropdown, Table, Modal, message } from "antd";
import {
  SelectOutlined,
  DownOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

// Internal dependencies
import ResponseCard from "../Common/ResponseCard";
import { setComponentParam } from "../../../redux/actions/componentParamActions";
import {
  listEmbeddings,
  searchRelatedDocument,
} from "../../../api/embedding.ts";
import { formatTime } from "../../../utils/formatUtils";
import "highlight.js/styles/atom-one-light.css";
import "./DocSearch.less";

const DocSearch = forwardRef((props, ref) => {
  // State hooks
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [embeddingId, setEmbeddingId] = useState("");
  const [apiResponse, setApiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [files, setFiles] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileName, setFileName] = useState("");

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
          setEmbeddingId(parameters.embeddingId || "");
          setFileName(parameters.fileName || "");
          setInput(item.input || "");
          break;
        }
      }
    }
  }, [loadedApplicationData]);

  useEffect(() => {
    dispatch(setComponentParam(props.id, "embeddingId", embeddingId));
    dispatch(setComponentParam(props.id, "fileName", fileName));
  }, [embeddingId]);

  useEffect(() => {
    props.onUpdateInput(input);
  }, [input]);

  useEffect(() => {
    if (showFileModal) {
      listEmbeddings()
        .then((response) => {
          if (response.embeddings) {
            setFiles(
              response.embeddings.filter(
                (embedding) => embedding.status === "COMPLETED"
              )
            );
          } else {
            message.error("An error occurred while fetching the files.");
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("An error occurred while fetching the files.");
        });
    }
  }, [showFileModal]);

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
      const response = await searchRelatedDocument(embeddingId, processedInput);

      const result = response.result;

      setApiResponse(result);
      props.onUpdateOutput(result);
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error(err);
      setError(err);
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

  const columns = [
    {
      title: "Name",
      dataIndex: "embeddingName",
      key: "embeddingName",
      sorter: (a, b) => a.embeddingName.localeCompare(b.embeddingName),
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (createdAt) => {
        const date = new Date(createdAt);
        return `${formatTime(date.toISOString())}`;
      },
    },
    {
      title: "Created by",
      dataIndex: "createdByUsername",
      key: "createdByUsername",
      sorter: (a, b) => a.createdByUsername.localeCompare(b.createdByUsername),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      },
    },
  ];

  return (
    <div className="doc-search">
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
          {embeddingId && (
            <span className="file-name">
              <FileTextOutlined style={{ marginRight: "8px" }} />
              File: {fileName}
            </span>
          )}
          <div className="button-container">
            <div className="left-buttons">
              <Dropdown menu={menuProps} disabled={!dropdownEnabled}>
                <Button className="insert-data-button">
                  Insert Data <DownOutlined />
                </Button>
              </Dropdown>
              {embeddingId ? (
                <Button onClick={() => setShowFileModal(true)}>
                  Change File
                </Button>
              ) : (
                <Button
                  onClick={() => setShowFileModal(true)}
                  icon={<SelectOutlined />}
                >
                  Select File
                </Button>
              )}
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
      <Modal
        title={
          <div className="table-title">
            <div>Embedded files</div>
          </div>
        }
        open={showFileModal}
        onCancel={() => setShowFileModal(false)}
        width="80%"
        footer={null}
      >
        <Table
          columns={columns}
          dataSource={files}
          onRow={(record) => ({
            onClick: () => {
              setEmbeddingId(record.id);
              setFileName(record.embeddingName);
              setShowFileModal(false);
            },
          })}
          rowKey="id"
          rowClassName="selectable-row"
        >
        </Table>
      </Modal>
    </div>
  );
});

export default DocSearch;
