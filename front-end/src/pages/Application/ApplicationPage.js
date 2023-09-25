import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, message } from "antd";
import MainHeader from "../../components/MainHeader/MainHeader";
import "./ApplicationPage.less";
import ComponentCard from "../../components/Playground/ComponentCard/ComponentCard";
import TitleCard from "../../components/Playground/TitleCard/TitleCard";
import { convertChains } from "../../utils/dataUtils";
import { resetState } from "../../redux/actions/resetActions";
import { createJob } from "../../api/job.ts";
import { setIsJobCreated, setJobName } from "../../redux/actions/jobActions";

const { Content } = Layout;

const ApplicationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [components, setComponents] = useState([]);
  const [componentIdIndexMap, setComponentIdIndexMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [title, setTitle] = useState("Application Name");
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");
  const [appId, setAppId] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [applicationVariables, setApplicationVariables] = useState([]);
  const [variablesProcessed, setVariablesProcessed] = useState(false);
  const [loadedVariables, setLoaedVariables] = useState([]);
  const [batchData, setBatchData] = useState(null);
  const [createdBy, setCreatedBy] = useState("");
  const [isReloading, setIsReloading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isChangeSaved, setIsChangeSaved] = useState(false);
  const isRunningRef = useRef(isRunning);
  const passedApplicationVariables = location.state?.applicationVariables;
  const { loadedApplicationData } = useSelector(
    (state) => state.applicationData
  );
  const user = useSelector((state) => state.user.user);
  const jobName = useSelector((state) => state.job.jobName);
  const isJobCreated = useSelector((state) => state.job.isJobCreated);

  useEffect(() => {
    if (user && user.id) {
      setIsCreator(user.id === createdBy);
    }
  }, [user, createdBy]);

  useEffect(() => {
    let timeout;

    if (isChangeSaved) {
      timeout = setTimeout(() => {
        setIsChangeSaved(false);
      }, 60000);
    }

    return () => clearTimeout(timeout);
  }, [isChangeSaved]);

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isChangeSaved]);

  const handleBeforeUnload = (event) => {
    if (!isChangeSaved) {
      event.preventDefault();
      event.returnValue = "Changes you made may not be saved.";
    }
  };

  useEffect(() => {
    let initialComponents;
    if (loadedApplicationData.appId) {
      initialComponents = convertChains(loadedApplicationData.chain);
      setAppId(loadedApplicationData.appId);
      setTitle(loadedApplicationData.appName);
      setTags(loadedApplicationData.tags);
      setDescription(loadedApplicationData.description);
      setCreatedBy(loadedApplicationData.createdBy);
      setIsPublished(loadedApplicationData.published);
    } else {
      initialComponents = [
        {
          id: Date.now(),
          type: "text-input",
          title: "Input 1",
          isAppInput: 1,
          isAppOutput: 0,
        },
        {
          id: Date.now() + 1,
          type: "openai",
          title: "Model 1",
          isAppInput: 0,
          isAppOutput: 1,
        },
      ];
    }

    setComponents(initialComponents);
    generateIdIndexMap(initialComponents);
  }, [loadedApplicationData]);

  useEffect(() => {
    if (passedApplicationVariables) {
      generateIdIndexMap(components);
      setLoaedVariables(passedApplicationVariables);
    }
  }, [passedApplicationVariables]);

  useEffect(() => {
    if (
      loadedVariables.length > 0 &&
      !variablesProcessed &&
      components.length > 0 &&
      Object.keys(componentIdIndexMap).length > 0
    ) {
      updateApplicationVariables(components, loadedVariables);
      setVariablesProcessed(true);
    }
  }, [loadedVariables, variablesProcessed, components]);

  const generateIdIndexMap = (components) => {
    let newMap = {};
    components.forEach((component, index) => {
      newMap[component.id] = index;
    });

    setComponentIdIndexMap(newMap);
  };

  useEffect(() => {
    generateIdIndexMap(components);
  }, [components]);

  useEffect(() => {
    generateIdIndexMap(components);
  }, [components]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    return () => {
      dispatch(resetState());
    };
  }, [dispatch]);

  const [refMap, setRefMap] = useState({
    openai: useRef([]),
    "text-input": useRef([]),
    "batch-input": useRef([]),
    output: useRef([]),
    "tag-parser": useRef([]),
    "doc-search": useRef([]),
  });

  const updateComponentOutput = (id, output) => {
    setComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === id ? { ...comp, output: output } : comp
      )
    );
  };

  const updateComponentInput = (id, newInput) => {
    setComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === id ? { ...comp, input: newInput } : comp
      )
    );
  };

  const updateComponentIsAppInput = (id, newValue) => {
    setComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === id ? { ...comp, isAppInput: newValue ? 1 : 0 } : comp
      )
    );
  };

  const updateComponentIsAppOutput = (id, newValue) => {
    setComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === id ? { ...comp, isAppOutput: newValue ? 1 : 0 } : comp
      )
    );
  };

  const updateComponentUserInput = (id, newUserInput) => {
    setComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === id ? { ...comp, userInput: newUserInput } : comp
      )
    );
  };

  const updateComponentFileId = (id, newFileId) => {
    setComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === id ? { ...comp, fileId: newFileId } : comp
      )
    );
  };

  const stopAllComponents = () => {
    setIsRunning(false);
    setIsLoading(false);
  };

  const updateApplicationVariables = (
    passedComponents,
    passedApplicationVariables
  ) => {
    return passedComponents.map((comp) => {
      const ref = refMap[comp.type].current[componentIdIndexMap[comp.id]];
      if (ref) {
        const matchingVariable = passedApplicationVariables.find(
          (variable) => variable.id === comp.id
        );

        if (matchingVariable) {
          switch (matchingVariable.type) {
            case "text-input":
              ref.setUserInput(matchingVariable.userInput);
              break;
            case "batch-input":
              ref.setFileId(matchingVariable.fileId);
              break;
            default:
              // Handle other types or ignore if needed
              break;
          }
        }

        return { ...comp };
      }
      return comp;
    });
  };

  const runAllComponents = async () => {
    setIsLoading(true);
    setIsRunning(true);
    let currentOutput = "";
    try {
      for (const component of components) {
        const componentRef =
          refMap[component.type].current[componentIdIndexMap[component.id]];
        if (componentRef && componentRef.run) {
          currentOutput = await componentRef.run();
          if (currentOutput instanceof Error) {
            throw currentOutput;
          }
          updateComponentOutput(component.id, currentOutput);
        }
        if (!isRunningRef.current) {
          break;
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    let fileId = null;
    let inputVariables = {};

    for (const component of components) {
      if (component.type === "batch-input" && fileId === null) {
        fileId = component.fileId;
      }

      if (component.type === "text-input" && component.input) {
        let inputKey = component.input.replace(/[{}]/g, "");
        inputVariables[inputKey] = component.userInput;
      }
    }
    const newBatchData = {
      appId: appId,
      appName: title,
      createdBy: user.id,
      taskName: jobName,
      fileId: fileId,
      inputVariables: inputVariables,
    };
    setBatchData(newBatchData);
  }, [components, appId, title, jobName, user.id, dispatch]);

  useEffect(() => {
    if (isJobCreated) {
      createJob(batchData)
        .then((response) => {
          if (response.data.success) {
            navigate(`/jobs/${response.data.taskId}`);
          } else {
            message.error("Failed to create job.");
          }
        })
        .catch((error) => {
          message.error("Failed to create job. Please try again later.");
        });
      dispatch(setJobName(""));
      dispatch(setIsJobCreated(false));
    }
  }, [isJobCreated]);

  useEffect(() => {
    const variableComponents = [];

    for (const component of components) {
      let variableComponent;

      if (component.type === "text-input") {
        variableComponent = {
          id: component.id,
          type: component.type,
          userInput: component.userInput,
        };
        variableComponents.push(variableComponent);
      } else if (component.type === "batch-input") {
        variableComponent = {
          id: component.id,
          type: component.type,
          fileId: component.fileId,
        };
        variableComponents.push(variableComponent);
      }
    }

    setApplicationVariables(variableComponents);
  }, [components, appId]);

  useEffect(() => {
    if (appId && isReloading) {
      setIsReloading(false);
      navigate(`/playground/${appId}`, {
        replace: true,
        state: { applicationVariables },
      });
    }
  }, [appId, isReloading]);

  return (
    <div className="myLayout">
      <MainHeader />
      <Layout className="layout">
        <Layout>
          <Content className="applicationContent">
            <TitleCard
              title={title}
              setTitle={setTitle}
              appId={appId}
              setAppId={setAppId}
              setIsReloading={setIsReloading}
              tags={tags}
              setTags={setTags}
              description={description}
              setDescription={setDescription}
              onRunAllComponents={runAllComponents}
              onStopAllComponents={stopAllComponents}
              isLoading={isLoading}
              isRunning={isRunning}
              isCreator={isCreator}
              isPublished={isPublished}
              setIsChangeSaved={setIsChangeSaved}
              setIsEditMode={setIsEditMode}
              isEditMode={isEditMode}
            />

            <div>
              {components.map((component, index) => (
                <div key={component.id}>
                  <ComponentCard
                    component={component}
                    index={index}
                    components={components}
                    refMap={refMap}
                    updateComponentOutput={updateComponentOutput}
                    updateComponentInput={updateComponentInput}
                    updateComponentFileId={updateComponentFileId}
                    updateComponentUserInput={updateComponentUserInput}
                    updateComponentIsAppInput={updateComponentIsAppInput}
                    updateComponentIsAppOutput={updateComponentIsAppOutput}
                    isChangeSaved={isChangeSaved}
                    isEditMode={isEditMode}
                  />
                </div>
              ))}
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default ApplicationPage;
