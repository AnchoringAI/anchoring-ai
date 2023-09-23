import React, { useEffect, useState, useCallback } from "react";
import { Card, Divider, Tag, Button } from "antd";
import MainHeader from "../../components/MainHeader/MainHeader";
import { ClockCircleOutlined } from "@ant-design/icons";
import { formatTime } from "../../utils/formatUtils";
import { Link } from "react-router-dom";
import { getApplications } from "../../api/applications.ts";
import "./HomePage.less";
import stringToColor from "string-to-color";
import color from "color";

const Avatar = ({ username }) => {
  const avatarColor = color(stringToColor(username)).darken(0.5).hex();
  const avatarLetter = username[0].toUpperCase();

  return (
    <div
      className="ant-dropdown-link avatar"
      style={{ backgroundColor: avatarColor }}
      onClick={(e) => e.preventDefault()}
    >
      {avatarLetter}
    </div>
  );
};

const ApplicationHomePage = () => {
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadApplications = useCallback(async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const res = await getApplications(page, size);
      setApplications((prevApps) => {
        const uniqueApps = [...new Set([...prevApps, ...res.applications])];
        return uniqueApps;
      });
      setTotalPages(res.totalPages);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop <
        document.documentElement.offsetHeight - 300 ||
      loading ||
      currentPage >= totalPages
    ) {
      return;
    }
    setCurrentPage((prevPage) => {
      const newPage = prevPage + 1;
      loadApplications(newPage);
      return newPage;
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll, currentPage, totalPages, loading]);

  return (
    <>
      <MainHeader />
      <div className="app-page">
        <div className="app-card-container">
          {applications.map((app) => (
            <Link
              to={`/apps/${app.appId}`}
              key={app.appId}
              className="app-card-link"
            >
              <Card className="app-card" bordered={false}>
                <div className="built-by-container">
                  <div className="built-by">
                    <Avatar username={app.createdByUsername} />
                    <span>{app.createdByUsername}</span>
                  </div>
                </div>
                <Divider className="card-divider" />
                <div className="app-card-appname">
                  <span className="app-card-appname-text">{app.appName}</span>
                </div>
                {app.tags && app.tags.length > 0 && (
                  <div className="app-card-tags">
                    {app.tags.map((tag, index) => (
                      <Tag key={`${app.appId}-${index}`} color="default">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}
                <Divider className="card-divider" />
                <div className="app-card-username">
                  <div className="app-card-createdat">
                    <ClockCircleOutlined className="app-card-createdat-icon" />
                    <span>{formatTime(app.createdAt)}</span>
                  </div>
                  <Button type="primary" ghost="true" className="open-button">
                    Open
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      {loading && <div>Loading...</div>}
    </>
  );
};

export default ApplicationHomePage;
