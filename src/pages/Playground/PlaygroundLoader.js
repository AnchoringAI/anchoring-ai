import { useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";
import { useParams, useMatch } from "react-router-dom";
import { Skeleton } from "antd";
import { getApplication } from "../../api/applications.ts";
import { loadShareLinkApp } from "../../api/sharedLink.ts";
import PlaygroundPage from "./PlaygroundPage";

function PlaygroundLoader() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const isSharedApp = useMatch("/shared/playground/:id");

  useEffect(() => {
    const loadApplicationData = isSharedApp ? loadShareLinkApp : getApplication;

    loadApplicationData(id)
      .then((res) => {
        const loadedApplicationData = res;
        dispatch({
          type: "LOAD_APPLICATION_DATA",
          payload: loadedApplicationData.application,
        });

        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, [id, dispatch]);

  if (isLoading) {
    return (
      <div>
        <Skeleton active />
      </div>
    );
  }

  return <PlaygroundPage />;
}

export default PlaygroundLoader;
