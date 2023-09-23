import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Button,
  message,
  Upload,
  Table,
  Input,
  Form,
  Modal,
  Pagination,
  Tooltip,
} from "antd";
import { UploadOutlined, SelectOutlined } from "@ant-design/icons";
import { fetchFile, fetchFiles } from "../../../api/file.ts";
import { formatBytes, formatTime } from "../../../utils/formatUtils";
import EditableCell from "./EditableCell";
import { useFileHandler } from "./FileHandler";
import JobModal from "./JobModal";
import "./BatchInput.less";

const BatchInput = forwardRef(
  ({ onUpdateOutput, onUpdateFileId, isChangeSaved, isEditMode }, ref) => {
    const [file, setFile] = useState();
    const [data, setData] = useState(null);
    const [editingKey, setEditingKey] = useState("");
    const [form] = Form.useForm();
    const [input, setInput] = useState("");
    const [userInput, setUserInput] = useState("");
    const [showTableModal, setShowTableModal] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [fileData, setFileData] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [files, setFiles] = useState([]);
    const [fileId, setFileId] = useState(null);
    const [showJobModal, setShowJobModal] = useState(false);

    const isValidFileType = (file) => {
      const validTypes = ["text/tab-separated-values", "text/plain", "text/csv"];
      return validTypes.includes(file.type);
    };
    
    const isValidFileSize = (file) => {
      return file.size / 1024 / 1024 < 15;
    };
    
    const beforeUpload = (file) => {
      if (!isValidFileType(file)) {
        message.error("Only TSV/TXT/CSV files are supported.");
        return false;
      }
    
      if (!isValidFileSize(file)) {
        message.error("Only files smaller than 15MB are supported.");
        return false;
      }
    
      return true;
    };
    
    const fetchFileData = (fileId) => {
      if (!fileId) {
        console.error("No fileId provided");
        return;
      }

      fetchFile(fileId)
        .then((response) => {
          if (response.data.success) {
            const fileData = response.data.file;
            console.log(fileData)
            onUpdateOutput(fileData);

            if (!fileData.content) {
              console.error("Empty content");
              return;
            }

            if (fileData.type !== "Table") {
              message.error("Unsupported data format");
              return;
            }

            let contentJson = JSON.parse(fileData.content);

            if (!contentJson) {
              console.error("Unexpected data format");
              return;
            }

            setFileData(contentJson);
            setFileId(fileId);
            onUpdateFileId(fileId);

            let tableData = [];
            const keys = Object.keys(contentJson);

            keys.forEach((key, i) => {
              const newKey = key === "key" ? "key_user" : key;
              const values = contentJson[key];

              const valuesArr =
                typeof values === "object" ? Object.values(values) : [values];

              valuesArr.forEach((val, j) => {
                let row = tableData[j] || {};
                row[newKey] = val;
                tableData[j] = row;
              });
            });

            setSelectedRow(tableData[0]);
          } else {
            message.error(response.data.error);
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("An error occurred while fetching the file data.");
        });
    };

    useFileHandler({
      file,
      fetchFileData,
      setFile,
    });

    const formatDataForTable = (obj, currentPage, itemsPerPage) => {
      if (!obj) return [];

      let formattedData = [];
      const keys = Object.keys(obj);
      keys.forEach((key) => {
        const values = obj[key];
        const valuesArr =
          typeof values === "object" ? Object.values(values) : [values];
        valuesArr.forEach((value, index) => {
          if (
            index >= (currentPage - 1) * itemsPerPage &&
            index < currentPage * itemsPerPage
          ) {
            formattedData[index] = { ...formattedData[index], [key]: value };
          }
        });
      });
      return formattedData;
    };

    const handleShowJobModal = () => {
      setShowJobModal(true);
      if (!isChangeSaved && isEditMode) {
        message.warning(
          "Your changes have not been saved. Unsaved changes will not be reflected in the batch job."
        );
      }
    };

    const handleJobModalClose = () => {
      setShowJobModal(false);
    };

    const totalRows = fileData
      ? Math.min(Object.keys(Object.values(fileData)[0]).length, 2000)
      : 0;

    const columns = [
      {
        title: "Field",
        dataIndex: "Field",
        width: "20%",
        editable: false,
      },
      {
        title: "Value",
        dataIndex: "Value",
        width: "80%",
        render: (_, record) => (
          <Form.Item
            name={record.key}
            style={{ margin: 0 }}
            initialValue={record.Value}
          >
            <Input className="custom-batch-input" />
          </Form.Item>
        ),
      },
    ];

    const isEditing = (record) => record.key === editingKey;

    const mergedColumns = columns.map((col) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: (record) => ({
          record,
          inputType: "text",
          dataIndex: col.dataIndex,
          title: col.title,
          editing: isEditing(record),
          setEditingKey,
        }),
      };
    });

    useImperativeHandle(ref, () => ({
      async run() {
        let processedInput = userInput;

        onUpdateOutput(processedInput);
        return processedInput;
      },
      getInput() {
        return input;
      },
      setInput(newInput) {
        setInput(newInput);
      },
      setFileId(newFileId) {
        fetchFileData(newFileId);
      },
    }));

    useEffect(() => {
      if (selectedRow) {
        const updatedData = Object.entries(selectedRow).map(
          ([key, value], i) => ({
            key: i,
            Field: key,
            Value: value,
          })
        );

        setData(updatedData);
        form.setFieldsValue(
          updatedData.reduce(
            (prev, curr) => ({
              ...prev,
              [curr.key]: curr.Value,
            }),
            {}
          )
        );

        let newOutput = updatedData.map(({ Field, Value }) => ({
          Field,
          Value,
        }));

        setUserInput(newOutput);
        onUpdateOutput(newOutput);
      }
    }, [selectedRow, form]);

    useEffect(() => {
      if (data) {
        let newOutput = [];
        Object.entries(form.getFieldsValue()).forEach(([key, value]) => {
          let row = data.find((item) => item.key === Number(key));
          if (row) {
            newOutput.push({
              Field: row.Field,
              Value: value,
            });
          }
        });
        setUserInput(newOutput);
        onUpdateOutput(newOutput);
      }
    }, [data, form]);

    useEffect(() => {
      if (showFileModal) {
        fetchFiles()
          .then((response) => {
            if (response.data) {
              setFiles(
                response.data.files.filter((file) => file.type === "Table")
              );
            } else {
              message.error(response.data.error);
            }
          })
          .catch((error) => {
            console.error(error);
            message.error("An error occurred while fetching the files.");
          });
      }
    }, [showFileModal]);

    return (
      <div>
        {data ? (
          <div>
            <Form
              form={form}
              component={false}
              onFieldsChange={(_, allFields) => {
                if (data) {
                  let newOutput = [];
                  allFields.forEach(({ name, value }) => {
                    let row = data.find((item) => item.key === Number(name[0]));
                    if (row) {
                      newOutput.push({
                        Field: row.Field,
                        Value: value,
                      });
                    }
                  });
                  setUserInput(newOutput);
                  onUpdateOutput(newOutput);
                }
              }}
            >
              <Table
                className="custom-batch-input"
                components={{
                  body: {
                    cell: EditableCell,
                  },
                }}
                bordered
                dataSource={data}
                columns={mergedColumns}
                rowClassName="editable-row"
                pagination={false}
              />
            </Form>
            <div className="button-container">
              <div>
                <Button
                  onClick={() => setShowTableModal(true)}
                  className="component-button"
                >
                  Select data
                </Button>
                <Button
                  onClick={() => setShowFileModal(true)}
                  className="component-button"
                >
                  Change file
                </Button>
              </div>{" "}
              <Button type="primary" onClick={handleShowJobModal}>
                Run batch
              </Button>
              <JobModal
                isVisible={showJobModal}
                handleClose={handleJobModalClose}
              />
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowFileModal(true)}
            icon={<SelectOutlined />}
          >
            Select File
          </Button>
        )}
        <Modal
          title="Select Data"
          open={showTableModal}
          width="80%"
          footer={null}
          onCancel={() => setShowTableModal(false)}
        >
          <Table
            dataSource={formatDataForTable(fileData, currentPage, 20)}
            columns={
              fileData
                ? Object.keys(fileData).map((key) => {
                    const newKey = key === "key" ? "key_user" : key;
                    return {
                      title: newKey,
                      dataIndex: newKey,
                      render: (text) => (
                        <Tooltip
                          title={text.toString()}
                          overlayStyle={{ maxWidth: 600 }}
                        >
                          <div className="table-column">{text.toString()}</div>
                        </Tooltip>
                      ),
                    };
                  })
                : []
            }
            pagination={false}
            onRow={(record) => ({
              onClick: () => {
                setSelectedRow(record);
                setShowTableModal(false);
              },
            })}
            rowClassName="selectable-row"
          />
          <Pagination
            current={currentPage}
            onChange={(page) => setCurrentPage(page)}
            total={totalRows}
            pageSize={20}
            className="pagination"
          />
        </Modal>
        <Modal
          title={
            <div className="upload-button">
              <div>Files</div>
              <Tooltip title="Only tab delimited .txt, .csv or .tsv files are supported">
                <Upload
                  name="file"
                  accept=".tsv,.csv,.txt"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  customRequest={({ file, onSuccess }) => {
                    setFile(file);
                    onSuccess(null, file.response);
                  }}
                  onChange={(info) => {
                    if (info.file.status !== "uploading") {
                      setFile(null);
                      setShowFileModal(false);
                    }
                  }}
                >
                  <Button type="link" icon={<UploadOutlined />}>
                    Upload
                  </Button>
                </Upload>
              </Tooltip>
            </div>
          }
          open={showFileModal}
          onCancel={() => setShowFileModal(false)}
          width="80%"
          footer={null}
        >
          <Table
            dataSource={files}
            onRow={(record) => ({
              onClick: () => {
                fetchFileData(record.id);
                setShowFileModal(false);
              },
            })}
            rowKey="id"
            rowClassName="selectable-row"
          >
            <Table.Column title="Name" dataIndex="name" key="name" />
            <Table.Column
              title="Uploaded at"
              dataIndex="uploadedAt"
              key="uploadedAt"
              sorter={(a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt)}
              render={(uploadedAt) => formatTime(uploadedAt)}
            />
            <Table.Column
              title="Size"
              dataIndex="size"
              key="size"
              sorter={(a, b) => parseInt(a.size) - parseInt(b.size)}
              render={(size) => formatBytes(size)}
            />
          </Table>
        </Modal>
      </div>
    );
  }
);

export default BatchInput;
