import React, { useEffect, useState } from "react";
import { Table, Space, Input, Button, message } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import MainHeader from "../../components/MainHeader/MainHeader";
import { Link } from "react-router-dom";
import { getApplications } from "../../api/applications.ts";
import { formatTime } from "../../utils/formatUtils";
import "./PlaygroundHomePage.less";

const PlaygroundHomePage = () => {
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchApplications = () => {
    getApplications(currentPage, pageSize, searchTerm)
      .then((res) => {
        const newData = res.applications
          .map((app) => ({
            ...app,
            key: app.appId,
          }));
        setApplications(newData);
        setTotalPages(res.totalPages);
      })
      .catch((err) => {
        console.error(err);
        message.error("An error occurred while fetching applications.");
      });
  };

  useEffect(() => {
    fetchApplications();
  }, [currentPage, pageSize, searchTerm]);

  const columns = [
    {
      title: "Name",
      dataIndex: "appName",
      key: "appName",
      sorter: (a, b) => a.appName.localeCompare(b.appName),
      render: (appName, record) => (
        <Link to={`/playground/${record.appId}`}>{appName}</Link>
      ),
    },
    {
      title: "Created by",
      dataIndex: "createdByUsername",
      key: "createdByUsername",
      sorter: (a, b) => a.createdByUsername.localeCompare(b.createdByUsername),
    },
    {
      title: "Updated at",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      render: (updatedAt) => formatTime(updatedAt),
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (createdAt) => formatTime(createdAt),
    },
  ];

  return (
    <>
      <MainHeader />
      <div
        className="playground-page"
        style={{ width: "90%", margin: "20px auto", padding: "8px" }}
      >
        <Space
          style={{
            marginBottom: 16,
            marginTop: 64,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Input
            placeholder="Search applications"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Link to="/playground/new">
            <Button type="primary" icon={<PlusOutlined />}>
              New Application
            </Button>
          </Link>
        </Space>
        <Table
          columns={columns}
          dataSource={applications}
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
    </>
  );
};

export default PlaygroundHomePage;
