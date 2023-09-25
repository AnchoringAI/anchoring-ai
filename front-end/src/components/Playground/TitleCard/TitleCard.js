import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Button,
  Input,
  Dropdown,
  Modal,
  Radio,
  message,
  Form,
  Select,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  ShareAltOutlined,
  CloudUploadOutlined,
  EllipsisOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  deleteApplication,
  publishApplication,
} from "../../../api/applications.ts";
import { useNavigate, useMatch } from "react-router-dom";
import useSaveModule from "./SaveModule";
import useShareModule from "./ShareModule";
import "./TitleCard.less";

const TitleCard = ({
  isEditMode,
  title,
  setTitle,
  appId,
  setAppId,
  setIsReloading,
  resourceId,
  tags,
  setTags,
  description,
  setDescription,
  onRunAllComponents,
  isRunning,
  onStopAllComponents,
  isCreator,
  isPublished,
  setIsChangeSaved,
}) => {
  const predefinedTags = [
    "Batch Processing",
    "Chat",
    "Claude",
    "Content Generation",
    "E-commerce",
    "Evaluation",
    "Finance",
    "Grounding",
    "GPT-3.5",
    "GPT-4",
    "Game",
    "Programming",
    "Search",
    "Translation",
  ];
  const [editMode, setEditMode] = useState(false);
  const [localTitle, setLocalTitle] = useState("Application Name");
  const {
    modalVisible,
    saveType,
    setSaveType,
    modalTitle,
    setModalTitle,
    modalTags,
    setModalTags,
    modalDescription,
    setModalDescription,
    handleSaveButtonClick,
    handleModalCancel,
    handleModalSave,
  } = useSaveModule(
    title,
    setTitle,
    tags,
    setTags,
    description,
    setDescription,
    appId,
    setAppId,
    setIsReloading,
    setIsChangeSaved
  );
  const {
    shareModalVisible,
    shareLink,
    handleShareClick,
    handleShareModalCancel,
  } = useShareModule(appId);

  const navigate = useNavigate();
  const isSharedApp = useMatch("/shared/apps/:id");

  const handleTagChange = (value) => {
    if (value.length > 6) {
      message.warning("You can select a maximum of 6 tags.");
      return;
    }

    const filteredTags = value.filter((tag) => tag.length <= 20);
    setModalTags(filteredTags);
  };

  const handleDescriptionChange = (value) => {
    if (value.length >= 80) {
      message.warning("Description cannot exceed 80 characters.");
      return;
    }

    setModalDescription(value);
  };

  const handleEditClick = () => {
    setEditMode(true);
    setLocalTitle(title);
  };

  const handleSaveIconClick = () => {
    if (localTitle.length <= 44) {
      setTitle(localTitle);
      setEditMode(false);
    } else {
      message.error("Application name cannot exceed 44 characters.");
    }
  };

  const handleTitleChange = (e) => {
    setLocalTitle(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSaveIconClick();
      e.preventDefault();
    }
  };

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleDeleteClick = () => {
    Modal.confirm({
      title: "Are you sure you want to delete this application?",
      async onOk() {
        try {
          const response = await deleteApplication(appId);
          if (response.success) {
            message.success("Application deleted successfully");
            navigate("/apps");
          } else {
            message.error(response.data.error);
          }
        } catch (error) {
          console.error("Error deleting application", error);
          message.error("Error deleting application");
        }
      },
      onCancel() {},
    });
  };

  const handlePublishClick = () => {
    Modal.confirm({
      title: "Are you ready to publish this application?",
      content: (
        <div>
          <p>
            Once you confirmed, the application will be accessible to all
            members in the community. Please remember to save all changes before
            publishing.
          </p>
        </div>
      ),
      async onOk() {
        try {
          const response = await publishApplication(appId);
          if (response.success) {
            message.success("Application published successfully");
          } else {
            message.error(response.message);
          }
        } catch (error) {
          console.error("Error publishing application", error);
          message.error("Error publishing application");
        }
      },
      onCancel() {},
    });
  };

  const handleShareLinkCopy = () => {
    navigator.clipboard.writeText(shareLink);
    message.success("Copied to clipboard!");
  };

  const getMenuProps = () => {
    let items = [];

    if (isCreator || isPublished) {
      items = [
        ...items,
        {
          label: "Share",
          key: "1",
          icon: <ShareAltOutlined />,
          onClick: handleShareClick,
        },
      ];
      if (isCreator) {
        items = [
          ...items,
          {
            label: "Publish",
            key: "2",
            icon: <CloudUploadOutlined />,
            onClick: handlePublishClick,
          },
          {
            label: "Delete",
            key: "3",
            icon: <DeleteOutlined />,
            onClick: handleDeleteClick,
          },
        ];
      }
    }

    return { items };
  };

  const menuProps = getMenuProps();

  return (
    <div className="titleCard">
      <Row justify="space-between" align="middle">
        <Col>
          {editMode ? (
            <div className="edit-mode">
              <Input
                value={localTitle}
                onChange={handleTitleChange}
                onKeyPress={handleKeyPress}
                onBlur={handleSaveIconClick}
                autoFocus
                className="title-input"
              />
              <SaveOutlined
                className="save-icon"
                onClick={handleSaveIconClick}
              />
            </div>
          ) : (
            <div className="title-text">
              {localTitle}{" "}
              {isEditMode ? (
                <>
                  <EditOutlined
                    className="edit-icon"
                    onClick={handleEditClick}
                  />
                </>
              ) : null}
            </div>
          )}
        </Col>
        <Col>
          <Button
            danger={isRunning ? true : false}
            type="primary"
            onClick={isRunning ? onStopAllComponents : onRunAllComponents}
          >
            {isRunning ? "Stop" : "Run App"}
          </Button>
          {isEditMode ? (
            <>
              <Button
                className="save-button"
                type="default"
                onClick={handleSaveButtonClick}
              >
                Save
              </Button>
              {menuProps.items.length > 0 && (
                <Dropdown
                  menu={menuProps}
                  className="more-button"
                  placement="bottom"
                >
                  <Button>
                    <EllipsisOutlined />
                  </Button>
                </Dropdown>
              )}
            </>
          ) : (
            <Button
              className="explore-button"
              type="default"
              onClick={() => {
                if (isSharedApp) {
                  navigate(`/shared/playground/${resourceId}`);
                } else {
                  navigate(`/playground/${appId}`);
                }
              }}
            >
              Explore
            </Button>
          )}
        </Col>
      </Row>
      <Modal
        title="Save Application"
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSave}
        okText="Save"
        okButtonProps={{ disabled: (modalTitle?.trim() ?? "") === "" }}
        cancelButtonProps={{ className: "modal-cancel-button" }}
      >
        <Radio.Group
          className="save-type-radio"
          onChange={(e) => setSaveType(e.target.value)}
          value={saveType}
        >
          <Tooltip
            title={
              !appId
                ? "Please save it as a new application before overwriting."
                : ""
            }
          >
            <Radio value={1} disabled={!appId || appId === "" || !isCreator}>
              Save (Overwrite)
            </Radio>
          </Tooltip>
          <Radio value={2}>Save as</Radio>
        </Radio.Group>

        <Input
          addonBefore="Name"
          value={modalTitle}
          onChange={(e) => setModalTitle(e.target.value)}
          required
          placeholder="Application Name"
        />
        <Input
          addonBefore="Description"
          value={modalDescription}
          maxLength={82}
          className="description-input"
          onChange={(e) => setModalDescription(e.target.value)}
          placeholder="Add description (optional)"
        />
        <Select
          mode="tags"
          className="tag-select"
          maxTagTextLength={20}
          placeholder="Add tags (optional)"
          value={modalTags}
          onChange={handleTagChange}
        >
          {predefinedTags.map((tag) => (
            <Select.Option key={tag} value={tag}>
              {tag}
            </Select.Option>
          ))}
        </Select>
      </Modal>
      <Modal
        title="Share application"
        open={shareModalVisible}
        onCancel={handleShareModalCancel}
        onOk={handleShareLinkCopy}
        okText="Copy link"
      >
        <Form>
          <p className="modal-description">
            Anyone with this link will have access to the application:
          </p>
          {shareLink && <div className="share-link-container">{shareLink}</div>}
        </Form>
      </Modal>
    </div>
  );
};

export default TitleCard;
