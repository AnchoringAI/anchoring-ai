import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Space, message, Progress, Modal } from "antd";
import MainHeader from "../../components/MainHeader/MainHeader";
import {
  listEmbeddings,
  stopEmbedding,
  deleteEmbedding,
  publishEmbedding,
} from "../../api/embedding.ts";
import { formatTime } from "../../utils/formatUtils";
import { useSelector } from "react-redux";
import "./EmbeddingsPage.less";

const EmbeddingsPage = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [uploaderId, setUploaderId] = useState("");
  //   const [filterByUploader, setFilterByUploader] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    if (user && user.id) {
      setUploaderId(user.id);
    }
  }, [user]);

  useEffect(() => {
    fetchEmbeddings();
  }, [currentPage, pageSize]);

  const fetchEmbeddings = () => {
    listEmbeddings(currentPage, pageSize)
      .then((response) => {
        const newData = response.embeddings
          .filter((embedding) =>
            embedding.embeddingName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
          .map((embedding) => {
            let progressPercentage;
            if (!embedding.progress || embedding.progress.total === undefined) {
              progressPercentage = 0;
            } else if (embedding.progress.total === 0) {
              progressPercentage = 100;
            } else {
              progressPercentage = parseFloat(
                (embedding.progress.completed / embedding.progress.total) * 100
              ).toFixed(0);
            }

            return {
              ...embedding,
              key: embedding.id,
              progressPercentage,
            };
          });
        setData(newData);
        setTotalPages(response.totalPages);
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while fetching embedding data.");
      });
  };

  const handleStop = (embeddingId) => {
    stopEmbedding(embeddingId)
      .then((response) => {
        message.success("Embedding being stopped.");
        if (response.success) {
          message.success("Embedding stopped successfully.");
          fetchEmbeddings();
        } else {
          message.error("An error occurred while stopping embedding.");
        }
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while stopping embedding.");
      });
  };

  const handleDelete = (embeddingId) => {
    deleteEmbedding(embeddingId)
      .then((response) => {
        if (response.success) {
          message.success("File deleted successfully.");
          fetchEmbeddings();
        } else {
          message.error("An error occurred while deleting the file.");
        }
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while deleting the file.");
      });
  };

  const handlePublish = (embeddingId) => {
    publishEmbedding(embeddingId)
      .then((response) => {
        if (response.success) {
          message.success("Embeded file published successfully");
          fetchEmbeddings();
        } else {
          message.error(response.message);
        }
      })
      .catch((error) => {
        console.error("Error publishing file", error);
        message.error("Error publishing file");
      });
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
    {
      title: "Progress",
      key: "progress",
      render: (text, record) => (
        <Progress
          className="custom-progress"
          percent={record.progressPercentage}
          status="active"
        />
      ),
      sorter: (a, b) => a.progressPercentage - b.progressPercentage,
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <div>
          {" "}
          {record.status == "completed" &&
            record.createdBy == user.id &&
            record.published == false && (
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
          {(record.status == "running" || record.status == "queued") &&
            record.createdBy == user.id && (
              <>
                <Button
                  type="link"
                  className="actionButton"
                  onClick={() => {
                    Modal.confirm({
                      title: "Are you sure you want to stop this process?",
                      onOk() {
                        handleStop(record.id);
                      },
                      onCancel() {},
                    });
                  }}
                >
                  Stop
                </Button>
              </>
            )}
          {(record.status == "completed" || record.status == "failed" || record.status == "stopped") &&
            record.createdBy == user.id && (
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
            <Button
              type="link"
              className="selectableTab"
              onClick={() => navigate("/data")}
            >
              Uploaded Files
            </Button>
            <Button type="link" className="selectedTab">
              Embedded Files
            </Button>
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
    </div>
  );
};

export default EmbeddingsPage;
