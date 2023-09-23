import { combineReducers } from "redux";
import applicationReducer from "./applicationReducer";
import applicationDataReducer from "./applicationDataReducer";
import componentParamReducer from "./componentParamReducer";
import userReducer from "./userReducer";
import jobReducer from "./jobReducer";

const rootReducer = combineReducers({
  user: userReducer,
  application: applicationReducer,
  applicationData: applicationDataReducer,
  componentParams: componentParamReducer,
  job: jobReducer,
});

export default rootReducer;
