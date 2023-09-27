import React, { useEffect, useState } from "react";
import { Card, Progress, Table, Skeleton, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { formatDuration } from "../../utils/formatUtils";
import { loadJob, stopJob, deleteJob } from "../../api/job.ts";
import MainHeader from "../../components/MainHeader/MainHeader";
import loadingImage from "../../assets/undraw_loading.svg";
import "./JobDetailPage.less";
import moment from "moment";

const JobDetailPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataAvailable, setIsDataAvailable] = useState(false);

  const getCurrentUTCDate = () => {
    return moment.utc().format("YYYY-MM-DD HH:mm:ss");
  };

  const processJobData = (jobData) => {
    const referenceTime = jobData.completedAt
      ? moment.utc(jobData.completedAt).format("YYYY-MM-DD HH:mm:ss")
      : getCurrentUTCDate();

    const runningTimeInSeconds = moment
      .utc(referenceTime)
      .diff(moment.utc(jobData.createdAt), "seconds");

    if (jobData.result) {
      setIsDataAvailable(true);
      jobData.totalTasks = jobData.result.progress.total;
      jobData.completedTasks = jobData.result.progress.completed;
      jobData.runningTime = formatDuration(runningTimeInSeconds);
      jobData.progress = (
        (jobData.result.progress.completed / jobData.result.progress.total) *
        100
      ).toFixed(1);

      if (jobData.result.result.length > 0) {
        const columnOrder = jobData.columnOrder || [];
        const allKeys = Object.keys(jobData.result.result[0]);

        const sortedKeys = [...columnOrder]
          .filter((key) => allKeys.includes(key))
          .concat(allKeys.filter((key) => !columnOrder.includes(key)));

        jobData.dynamicColumns = sortedKeys.map((key) => ({
          title: key,
          dataIndex: key,
          key: key,
        }));
      } else {
        jobData.dynamicColumns = [];
      }
      setJob(jobData);
    } else {
      setIsDataAvailable(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadJob(id)
      .then((response) => {
        processJobData(response.data);
      })
      .catch((error) => {
        console.error("Failed to load job: ", error);
        setIsLoading(false);
      });
  }, [id]);

  const escapeSpecialChars = (str) => {
    return str
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  };

  const downloadDataAsTxtFile = () => {
    if (job && job.result && job.result.result.length > 0) {
      const data = job.result.result;
      const columnOrder = job.columnOrder || [];

      const headers = columnOrder.filter((header) =>
        Object.keys(data[0]).includes(header)
      );

      const rows = data
        .map((row) =>
          headers
            .map((header) => {
              const cellData = row[header];
              if (typeof cellData === "string") {
                return escapeSpecialChars(cellData);
              }
              return cellData || "";
            })
            .join("\t")
        )
        .join("\n");

      const fileContent = [headers.join("\t"), rows].join("\n");

      const blob = new Blob([fileContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${job.taskName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton active />
      </div>
    );
  }

  if (!isDataAvailable) {
    return (
      <div className="loadingContainer">
        <MainHeader />
        <div style={{ textAlign: "center" }}>
          <img
            src={loadingImage}
            alt="Loading graphic"
            className="loadingImage"
          />

          <h3 className="loadingText">
            The data for this page is being loaded...
          </h3>

          <p className="subText">Please check back in a moment.</p>

          <Button type="primary" onClick={() => window.location.reload()}>
            Try reloading
          </Button>
        </div>
      </div>
    );
  }

  const { totalTasks, completedTasks } = job;
  const failedTasks = 0;
  const progress = ((completedTasks / totalTasks) * 100).toFixed(1);

  return (
    <div>
      <MainHeader />
      <div className="pageContainer">
        <div className="headerContainer">
          <h3 className="jobDetailsHeader">{job.taskName}</h3>
          <Button icon={<DownloadOutlined />} type="primary" onClick={downloadDataAsTxtFile} className="downloadButton">
            Download
          </Button>
        </div>
        <div className="detailsContainer">
          <div className="innerDetailsContainer">
            <Card title="Total tasks" className="card">
              <p className="cardText">{totalTasks}</p>
            </Card>
            <Card title="Completed tasks" className="card">
              <p className="cardText">{completedTasks}</p>
            </Card>
            <Card title="Running time" className="card">
              <p className="cardText">{job.runningTime}</p>
            </Card>
          </div>
          <Card title="Progress" className="progressCard">
            <div className="progressContainer">
              <Progress
                className="progressStyle"
                percent={progress}
                status="active"
              />
              <p className="progressText">
                <span>
                  {`${completedTasks} out of ${totalTasks} successful`}
                  <span className="greyText"> ({`${failedTasks} failed`})</span>
                </span>
              </p>
            </div>
          </Card>
        </div>
        <Table
          className="tableStyle"
          columns={job.dynamicColumns}
          dataSource={job.result.result.map((item, index) => ({
            ...item,
            key: index,
          }))}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default JobDetailPage;
