import { useState, useEffect } from "react";
import { message } from "antd";
import { uploadFile } from "../../../api/file.ts";
import { useSelector } from "react-redux";

export const useFileHandler = ({ file, fetchFileData, setFile }) => {
  const [uploadedBy, setUploadedBy] = useState("");
  const user = useSelector((state) => state.user.user);

  const logError = (error) => {
    console.error("Error Message: ", error.message);
    if (error.response) {
      console.error("Server Response: ", error.response);
    } else if (error.request) {
      console.error("Request: ", error.request);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      setUploadedBy(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (file) {
      uploadFile(file, uploadedBy)
        .then((response) => {
          if (response.data.success) {
            message.success("File uploaded successfully!");
            fetchFileData(response.data.fileId);
            setFile(null);
          } else {
            message.error(response.data.error);
          }
        })
        .catch((error) => {
          logError(error);

          if (error.response?.data?.error) {
            message.error(error.response.data.error);
          } else {
            message.error("An error occurred while uploading the file.");
          }
        });
    }
  }, [file, uploadedBy, fetchFileData, setFile]);
};



