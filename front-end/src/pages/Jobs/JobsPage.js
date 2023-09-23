import React, { useState, useEffect } from "react";
import { Table, Progress, Button, Modal, message } from "antd";
import MainHeader from "../../components/MainHeader/MainHeader";
import { getJobs, stopJob, deleteJob, publishJob } from "../../api/job.ts";
import { formatTime, formatDuration } from "../../utils/formatUtils";
import "./JobsPage.less";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await getJobs({ page: currentPage, size: pageSize });
      if (response.status === 200) {
        setJobs(
          response.data.tasks.map((job) => {
            let progressPercentage = 0;

            if (job.progress) {
              if (job.progress.total === 0) {
                progressPercentage = 100;
              } else {
                progressPercentage = parseFloat(
                  (job.progress.completed / job.progress.total) * 100
                ).toFixed(0);
              }
            }

            return {
              ...job,
              progressPercentage,
            };
          })
        );
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch jobs: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    navigate(`/jobs/${record.id}`);
  };

  const handleStop = (jobId) => {
    stopJob(jobId)
      .then((response) => {
        message.success("Job being stopped.");
        if (response.success) {
          message.success("Job stopped successfully.");
          fetchJobs();
        } else {
          message.error("An error occurred while stopping embedding.");
        }
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while stopping embedding.");
      });
  };

  const handleDelete = (jobId) => {
    deleteJob(jobId)
      .then((response) => {
        if (response.success) {
          message.success("Job deleted successfully.");
          fetchJobs();
        } else {
          message.error("An error occurred while deleting the file.");
        }
      })
      .catch((error) => {
        console.error(error);
        message.error("An error occurred while deleting the file.");
      });
  };

  const handlePublish = (jobId) => {
    publishJob(jobId)
      .then((response) => {
        if (response.success) {
          message.success("Job published successfully");
          fetchJobs();
        } else {
          message.error(response.message);
        }
      })
      .catch((error) => {
        console.error("Error publishing job", error);
        message.error("Error publishing job");
      });
  };

  useEffect(() => {
    fetchJobs();
  }, [currentPage, pageSize]);

  const columns = [
    {
      title: "Job name",
      dataIndex: "taskName",
      key: "taskName",
      sorter: (a, b) => a.taskName.localeCompare(b.taskName),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) =>
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      filters: [...new Set(jobs.map((item) => item.status))].map((status) => {
        const capitalizedStatus =
          status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        return {
          text: capitalizedStatus,
          value: status,
        };
      }),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Created by",
      dataIndex: "createdByUsername",
      key: "createdByUsername",
      sorter: (a, b) => a.createdByUsername.localeCompare(b.createdByUsername),
    },
    {
      title: "Progress (%)",
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
      title: "Running time",
      key: "duration",
      render: (text, record) => {
        const referenceTime = record.completedAt
          ? new Date(record.completedAt)
          : new Date();
        const durationInSeconds = Math.round(
          (referenceTime - new Date(record.createdAt)) / 1000
        );
        return formatDuration(durationInSeconds);
      },
      sorter: (a, b) => {
        const referenceTimeA = a.completedAt
          ? new Date(a.completedAt)
          : new Date();
        const referenceTimeB = b.completedAt
          ? new Date(b.completedAt)
          : new Date();
        return (
          Math.round(referenceTimeA - new Date(a.createdAt) / 1000) -
          Math.round(referenceTimeB - new Date(b.createdAt) / 1000)
        );
      },
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => formatTime(createdAt),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    // {
    //   title: "Completed at",
    //   dataIndex: "completedAt",
    //   key: "completedAt",
    //   render: (completedAt) => (completedAt ? formatTime(completedAt) : "N/A"),
    //   sorter: (a, b) => new Date(a.completedAt) - new Date(b.completedAt),
    // },
    {
      title: "Actions",
      key: "Actions",
      render: (record) => (
        <div>
          {" "}
          {
            <>
              <Button
                type="link"
                className="actionButton"
                onClick={() => handleViewDetails(record)}
              >
                View details
              </Button>
              {" | "}
            </>
          }
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
          {(record.status == "completed" ||
            record.status == "failed" ||
            record.status == "stopped") &&
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
      <div style={{ width: "90%", margin: "20px auto", padding: "8px" }}>
        <h3 style={{ marginTop: "64px" }}>All jobs</h3>
        <Table
          loading={isLoading}
          columns={columns}
          dataSource={jobs}
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
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default JobsPage;
