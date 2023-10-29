import React from "react";
import { Drawer, Form, Slider, Tooltip } from "antd";
import "./GoogleSearchSettings.less";

const GoogleSearchSettings = ({
  open,
  onClose,
  numResults,
  setNumResults,
}) => {
  return (
    <Drawer
      title={"Google Search Settings"}
      width={360}
      onClose={onClose}
      open={open}
      bodyStyle={{ paddingBottom: 80 }}
    >
      <Form layout="vertical" hideRequiredMark>
        <Form.Item
          label={
            <Tooltip
              title={"The number of search results returned from Google."}
            >
              <div className="labelContainer">
                <span>{"Number of Results"}</span>
                <span>{numResults}</span>
              </div>
            </Tooltip>
          }
        >
          <Slider
            defaultValue={numResults}
            min={1}
            max={10}
            onChange={setNumResults}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default GoogleSearchSettings;
