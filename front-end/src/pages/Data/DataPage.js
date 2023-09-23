import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Input,
  Space,
  message,
  Upload,
  Modal,
  Tooltip,
} from "antd";
import { UploadOutlined, SearchOutlined } from "@ant-design/icons";
import MainHeader from "../../components/MainHeader/MainHeader";
import {
  uploadFile,
  fetchFiles,
  deleteFile,
  downloadFile,
  publishFile,
} from "../../api/file.ts";
import { createEmbedding } from "../../api/embedding.ts";
import { formatBytes, formatTime } from "../../utils/formatUtils";
import { useSelector } from "react-redux";
import "./DataPage.less";

const DataPage = () => {
  const [file, setFile] = useState();
  const [data, setData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [uploaderId, setUploaderId] = useState("");
  const [filterByUploader, setFilterByUploader] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [embeddingName, setEmbeddingName] = useState("");
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  const isValidFileType = (file) => {
    const validTypes = ["text/tab-separated-values", "text/plain", "text/csv"];
    return validTypes.includes(file.type);
  };
  
  const isValidFileSize = (file) => {
    return file.size / 1024 / 1024 < 15;
  };
  
  const logError = (error) => {
    console.error("Error Message: ", error.message);
    if (error.response) {
      console.error("Server Response: ", error.response);
    } else if (error.request) {
      console.error("Request: ", error.request);
    }
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
  
  useEffect(() => {
    setUploaderId(user?.id);
  }, [user]);
  
  useEffect(() => {
    fetchFileData();
  }, [currentPage, pageSize, user, searchTerm]);
  
  const handleUpload = async (file) => {
    if (!file) {
      message.error("Please select a file to upload.");
      return;
    }
  
    setShowUploadProgress(true);
  
    try {
      const response = await uploadFile(file, uploaderId, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });
  
      setShowUploadProgress(false);
  
      if (response.data.success) {
        message.success("File uploaded successfully!");
        setUploadProgress(0);
        fetchFileData();
        setFile(null);
      } else {
        message.error(response.data.error);
      }
    } catch (error) {
      setShowUploadProgress(false);
      logError(error);
  
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error("An error occurred while uploading the file.");
      }
    }
  };  
  
  const fetchFileData = () => {
    fetchFiles(currentPage, pageSize, filterByUploader)
      .then((response) => {
        const newData = response.data.files
          .filter((file) =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((file, index) => ({
            ...file,
            key: file.id,
          }));
        setData(newData);

        setTotalPages(response.data.totalPages);
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while fetching file data.");
      });
  };

  const handleDelete = (fileId) => {
    deleteFile(fileId)
      .then((response) => {
        if (response.data.success) {
          message.success(response.data.message);
          fetchFileData();
        } else {
          message.error(response.data.error);
        }
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while deleting the file.");
      });
  };

  const handleDownload = (fileId) => {
    downloadFile(fileId)
      .then(() => {
        message.success("File downloaded successfully!");
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while downloading the file.");
      });
  };

  const handlePublish = (fileId) => {
    publishFile(fileId)
      .then((response) => {
        if (response.success) {
          message.success("File published successfully");
          fetchFileData();
        } else {
          message.error(response.message);
        }
      })
      .catch((error) => {
        console.error("Error publishing File", error);
        message.error("Error publishing File");
      });
  };

  const onModalOk = () => {
    if (embeddingName.trim() === "") {
      message.error("The name for the embedded file cannot be empty.");
      return;
    }
    setIsModalVisible(false);

    createEmbedding(uploaderId, selectedFileId, embeddingName)
      .then((response) => {
        if (response.success) {
          message.success(`Embedding started successfully.`);
        } else {
          message.error(response.error || "An unknown error occurred.");
        }
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while embedding the text.");
      });
  };

  const onModalCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      filters: [...new Set(data.map((item) => item.type))].map((type) => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Uploaded at",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      sorter: (a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt),
      render: (uploadedAt) => {
        const date = new Date(uploadedAt);
        return `${formatTime(date.toISOString())}`;
      },
    },
    {
      title: "Uploaded by",
      dataIndex: "uploadedByUsername",
      key: "uploadedByUsername",
      sorter: (a, b) =>
        a.uploadedByUsername.localeCompare(b.uploadedByUsername),
    },

    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      sorter: (a, b) => parseInt(a.size) - parseInt(b.size),
      render: (size) => formatBytes(size),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <div>
          {(record.published == true || record.uploadedBy == user.id) && (
            <>
              <Button
                type="link"
                onClick={() => handleDownload(record.id)}
                className="actionButton"
              >
                Download
              </Button>
              {" | "}
            </>
          )}
          {record.type == "Plain Text" &&
            (record.published == true || record.uploadedBy === user.id) && (
              <>
                <Button
                  type="link"
                  className="actionButton"
                  onClick={() => {
                    setSelectedFileId(record.id);
                    setIsModalVisible(true);
                  }}
                >
                  Embed
                </Button>
                {" | "}
              </>
            )}
          {record.published == false && record.uploadedBy == user.id && (
            <>
              <Button
                type="link"
                className="actionButton"
                onClick={() => {
                  Modal.confirm({
                    title:
                      "Once you confirmed, the file will be accessible to all members in the community.",
                    onOk() {
                      handlePublish(record.id);
                    },
                    onCancel() {},
                  });
                }}
              >
                Publish
              </Button>
              {" | "}
            </>
          )}
          {record.uploadedBy == user.id && (
            <>
              <Button
                type="link"
                className="actionButton"
                onClick={() => {
                  Modal.confirm({
                    title: "Are you sure you want to delete this file?",
                    onOk() {
                      handleDelete(record.id);
                    },
                    onCancel() {},
                  });
                }}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <MainHeader />
      <div className="mainContent">
        <Space className="headerRow">
          <div className="buttonGroup">
            <Button type="link" className="selectedTab">
              Uploaded Files
            </Button>
            <Button
              type="link"
              className="selectableTab"
              onClick={() => navigate("/data/embeddings")}
            >
              Embedded Files
            </Button>
          </div>
          <div className="rightAligned">
            <Input
              className="searchInput"
              placeholder="Search files"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Tooltip title="Only .txt, tab delimited .csv or .tsv files are supported">
              <Upload
                name="file"
                accept=".csv,.tsv,.txt"
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={({ file, onSuccess }) => {
                  handleUpload(file);
                  onSuccess(null, file.response);
                }}
                onChange={(info) => {
                  if (info.file.status !== "uploading") {
                    setFile(null);
                  }
                }}
              >
                <Button icon={<UploadOutlined />} type="primary">
                  Upload
                </Button>
              </Upload>
            </Tooltip>
          </div>
        </Space>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            pageSize: pageSize,
            current: currentPage,
            total: totalPages * pageSize,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />
      </div>
      <Modal
        title="Are you sure you want to embed this file?"
        open={isModalVisible}
        onOk={onModalOk}
        onCancel={onModalCancel}
      >
        <p>If yes, please provide the name for your embedded file name:</p>
        <Input
          placeholder="Enter the name here"
          value={embeddingName}
          onChange={(e) => setEmbeddingName(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default DataPage;
