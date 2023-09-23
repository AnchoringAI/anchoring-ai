import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveApplication } from "../../../redux/actions/applicationActions";
import { message } from "antd";

export default function useSaveModule(
  title,
  setTitle,
  tags,
  setTags,
  appId,
  setAppId,
  setIsReloading,
  setIsChangeSaved
) {
  const [modalVisible, setModalVisible] = useState(false);
  const [saveType, setSaveType] = useState(2);
  const [modalTitle, setModalTitle] = useState(title);
  const [modalTags, setModalTags] = useState(tags);
  const [saveApplicationData, setSaveApplicationData] = useState(false);
  const [confirmSaving, setconfirmSaving] = useState(false);

  const dispatch = useDispatch();
  const applicationData = useSelector((state) => state.applicationData);

  const handleSaveButtonClick = () => {
    setModalVisible(true);
    setModalTitle(title);
    setModalTags(tags);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalSave = async () => {
    if (modalTitle.length <= 44) {
      setTitle(modalTitle);
      setTags(modalTags);
      setModalVisible(false);
      if (saveType === 2) {
        setAppId(null);
      }
      setSaveApplicationData(true);
    } else {
      message.error("Application name cannot exceed 44 characters.");
    }
  };

  useEffect(() => {
    if (saveApplicationData) {
      setconfirmSaving(true);
    }
  }, [saveApplicationData]);

  useEffect(() => {
    if (confirmSaving) {
      dispatch(saveApplication(applicationData.applicationData))
        .then((responseData) => {
          setAppId(responseData.id);
          setIsReloading(true);
          setIsChangeSaved(true);
          message.success("Application saved successfully");
        })
        .catch((error) => {
          console.error("Error saving application:", error);
        });
      setSaveApplicationData(false);
      setconfirmSaving(false);
    }
  }, [confirmSaving]);

  return {
    modalVisible,
    saveType,
    setSaveType,
    modalTitle,
    setModalTitle,
    modalTags,
    setModalTags,
    handleSaveButtonClick,
    handleModalCancel,
    handleModalSave,
  };
}
