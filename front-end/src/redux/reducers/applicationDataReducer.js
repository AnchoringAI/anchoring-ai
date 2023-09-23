import { RESET_STATE } from "../actions/resetActions";

const initialState = {
  loadedApplicationData: {},
  applicationData: {},
};

const applicationDataReducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOAD_APPLICATION_DATA":
      return { ...state, loadedApplicationData: action.payload };
    case "UPDATE_APPLICATION_DATA":
      return { ...state, applicationData: action.payload };
    case RESET_STATE:
      return initialState;
    default:
      return state;
  }
};

export default applicationDataReducer;
