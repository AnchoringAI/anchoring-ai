import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, message } from "antd";
import MainHeader from "../../components/MainHeader/MainHeader";
import PlaygroundSider from "../../components/Playground/Sider/Sider";
import "./PlaygroundPage.less";
import ComponentCard from "../../components/Playground/ComponentCard/ComponentCard";
import TitleCard from "../../components/Playground/TitleCard/TitleCard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { convertChains } from "../../utils/dataUtils";
import { resetState } from "../../redux/actions/resetActions";
import { createJob } from "../../api/job.ts";
import { setIsJobCreated, setJobName } from "../../redux/actions/jobActions";

const { Content } = Layout;

const PlaygroundPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [components, setComponents] = useState([]);
  const [componentIdIndexMap, setComponentIdIndexMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [title, setTitle] = useState("Application Name");
  const [tags, setTags] = useState([]);
  const [appId, setAppId] = useState("");
  const [isEditMode, setIsEditMode] = useState(true);
  const [applicationVariables, setApplicationVariables] = useState([]);
  const [variablesProcessed, setVariablesProcessed] = useState(false);
  const [loadedVariables, setLoaedVariables] = useState([]);
  const [batchData, setBatchData] = useState(null);
  const [createdBy, setCreatedBy] = useState("");
  const [chain, setChain] = useState("");
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
  const componentParams = useSelector((state) => state.componentParams);
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
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
      setTags(loadedApplicationData.tags);
      setTitle(loadedApplicationData.appName);
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

  const extractNumberFromTitle = (title, prefix) => {
    if (title.startsWith(prefix)) {
      const number = title.replace(prefix, "").match(/\d+/);
      return number ? parseInt(number[0], 10) : 0;
    }
    return null;
  };

  const generateTitle = (type, components) => {
    let prefix = "";

    switch (type) {
      case "openai":
        prefix = "Model ";
        break;
      case "text-input":
      case "batch-input":
        prefix = "Input ";
        break;
      case "output":
        prefix = "Output ";
        break;
      case "tag-parser":
      case "doc-search":
        prefix = "Plug-in ";
        break;
      default:
        return "";
    }

    const relevantComponents = components.filter(
      (comp) =>
        comp.title && extractNumberFromTitle(comp.title, prefix) !== null
    );

    const maxNumber = relevantComponents.reduce((max, comp) => {
      const number = extractNumberFromTitle(comp.title, prefix);
      return number !== null ? Math.max(max, number) : max;
    }, 0);

    return `${prefix}${maxNumber + 1}`;
  };

  const handleMenuClick = (e) => {
    const activeMenuItem = e.keyPath[0];
    const activeSubMenu = e.keyPath[1];

    switch (`${activeSubMenu}.${activeMenuItem}`) {
      case "models.openai":
        setComponents((prevComponents) => [
          ...prevComponents,
          {
            id: Date.now(),
            type: "openai",
            title: generateTitle("openai", prevComponents),
            isAppInput: 0,
            isAppOutput: 1,
            activeSubMenu,
          },
        ]);
        break;

      case "models.google":
        setComponents((prevComponents) => [
          ...prevComponents,
          {
            id: Date.now(),
            type: "google",
            title: generateTitle("google", prevComponents),
            isAppInput: 0,
            isAppOutput: 1,
            activeSubMenu,
          },
        ]);
        break;

      case "data.text-input":
        setComponents((prevComponents) => [
          ...prevComponents,
          {
            id: Date.now(),
            type: "text-input",
            title: generateTitle("text-input", prevComponents),
            isAppInput: 1,
            isAppOutput: 0,
            activeSubMenu,
          },
        ]);
        break;

      case "data.batch-input":
        if (components.some((comp) => comp.type === "batch-input")) {
          message.error(
            "Only one batch-input component is allowed for each application"
          );
        } else {
          setComponents((prevComponents) => [
            ...prevComponents,
            {
              id: Date.now(),
              type: "batch-input",
              title: generateTitle("batch-input", prevComponents),
              isAppInput: 1,
              isAppOutput: 0,
              activeSubMenu,
            },
          ]);
        }
        break;

      case "data.output":
        setComponents((prevComponents) => [
          ...prevComponents,
          {
            id: Date.now(),
            type: "output",
            title: generateTitle("output", prevComponents),
            isAppInput: 0,
            isAppOutput: 1,
            activeSubMenu,
          },
        ]);
        break;

      case "plugins.tag-parser":
        setComponents((prevComponents) => [
          ...prevComponents,
          {
            id: Date.now(),
            type: "tag-parser",
            title: generateTitle("tag-parser", prevComponents),
            isAppInput: 0,
            isAppOutput: 1,
            activeSubMenu,
          },
        ]);
        break;

      case "plugins.doc-search":
        setComponents((prevComponents) => [
          ...prevComponents,
          {
            id: Date.now(),
            type: "doc-search",
            title: generateTitle("doc-search", prevComponents),
            isAppInput: 0,
            isAppOutput: 1,
            activeSubMenu,
          },
        ]);
        break;
      default:
        return;
    }
  };

  const updateComponentOutput = (id, output) => {
    setComponents((prevComponents) =>
      prevComponents.map((comp) =>
        comp.id === id ? { ...comp, output: output } : comp
      )
    );
  };

  const updateComponentTitle = (id, newTitle) => {
    setComponents((prevComponents) => {
      const oldTitle = prevComponents.find((comp) => comp.id === id)?.title;

      if (oldTitle) {
        const updatedComponents = prevComponents.map((comp) =>
          comp.id === id ? { ...comp, title: newTitle } : comp
        );

        const fullyUpdatedComponents = getUpdatedComponents(
          updatedComponents,
          oldTitle,
          newTitle
        );

        return fullyUpdatedComponents;
      }

      return prevComponents;
    });
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

  const getUpdatedComponents = (newComponents, oldTitle, newTitle) => {
    return newComponents.map((comp) => {
      const ref = refMap[comp.type]?.current?.[componentIdIndexMap[comp.id]];
      if (ref) {
        let updatedInput = ref.getInput();

        const oldTitlePattern = new RegExp(`\\{${oldTitle}\\}`, "g");
        updatedInput = updatedInput.replaceAll(
          oldTitlePattern,
          `{${newTitle}}`
        );

        ref.setInput(updatedInput);

        return { ...comp, input: updatedInput };
      }
      return comp;
    });
  };

  const deleteComponent = (id) => {
    setComponents((prevComponents) => {
      const newComponents = prevComponents.filter((comp) => comp.id !== id);

      generateIdIndexMap(newComponents);

      return newComponents;
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index !== destination.index) {
      const newComponents = Array.from(components);
      const [reorderedComponent] = newComponents.splice(source.index, 1);
      newComponents.splice(destination.index, 0, reorderedComponent);

      generateIdIndexMap(newComponents);

      setComponents(newComponents);
    }
  };

  useEffect(() => {
    let applicationData = {
      appId: appId,
      appName: title,
      createdBy: user.id,
      tags: tags,
      chain: [],
    };

    for (const component of components) {
      const componentRef =
        refMap[component.type].current[componentIdIndexMap[component.id]];

      if (componentRef && componentRef.run) {
        applicationData.chain.push({
          id: component.id,
          type: component.type,
          title: component.title,
          isAppInput: component.isAppInput,
          isAppOutput: component.isAppOutput,
          input: component.input,
          parameters: componentParams[component.id],
        });
      }
    }

    setChain(applicationData.chain);
    dispatch({ type: "UPDATE_APPLICATION_DATA", payload: applicationData });
  }, [
    components,
    refMap,
    componentIdIndexMap,
    componentParams,
    title,
    tags,
    appId,
    user.id,
    dispatch,
  ]);

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
        <PlaygroundSider onMenuClick={handleMenuClick} />
        <Layout className="layout">
          <Layout>
            <Content className="playgroundContent">
              <TitleCard
                title={title}
                setTitle={setTitle}
                appId={appId}
                setAppId={setAppId}
                setIsReloading={setIsReloading}
                tags={tags}
                setTags={setTags}
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
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="droppableComponents">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {components.map((component, index) => (
                        <Draggable
                          key={component.id}
                          draggableId={component.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <ComponentCard
                                component={component}
                                index={index}
                                components={components}
                                refMap={refMap}
                                deleteComponent={deleteComponent}
                                updateComponentTitle={updateComponentTitle}
                                updateComponentOutput={updateComponentOutput}
                                updateComponentInput={updateComponentInput}
                                updateComponentFileId={updateComponentFileId}
                                updateComponentUserInput={
                                  updateComponentUserInput
                                }
                                updateComponentIsAppInput={
                                  updateComponentIsAppInput
                                }
                                updateComponentIsAppOutput={
                                  updateComponentIsAppOutput
                                }
                                dragHandleProps={provided.dragHandleProps}
                                isChangeSaved={isChangeSaved}
                                isEditMode={isEditMode}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </Content>
          </Layout>
        </Layout>
      </div>
  );
};

export default PlaygroundPage;
