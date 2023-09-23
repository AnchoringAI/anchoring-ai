import React from "react";
import { Modal, Form, Input } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setJobName, setIsJobCreated } from "../../../redux/actions/jobActions";

const JobModal = ({ isVisible, handleClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const jobName = useSelector((state) => state.job.jobName);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        form.resetFields();
        dispatch(setJobName(values.jobName));
        handleClose();
      })
      .catch((info) => {
        console.log("Validation failed:", info);
      });
  };

  useEffect(() => {
    if (jobName !== "") {
      dispatch(setIsJobCreated(true));
    }
  }, [jobName, dispatch]);

  const handleCancel = () => {
    dispatch(setJobName(""));
    dispatch(setIsJobCreated(false));
    handleClose();
  };

  return (
    <Modal
      title="Submit batch job"
      open={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <p>Remember to save your application before submitting batch jobs.</p>
      <Form form={form} layout="vertical" name="form_in_modal">
        <Form.Item
          name="jobName"
          rules={[
            {
              required: true,
              message: "Please provide a job name.",
            },
            {
              max: 56,
              message: "job name should not exceed 56 characters.",
            },
          ]}
        >
          <Input placeholder="Add a name for your job" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JobModal;
