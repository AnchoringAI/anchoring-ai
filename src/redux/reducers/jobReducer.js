import { SET_JOB_NAME, SET_IS_JOB_CREATED } from "../actions/jobActions";

const initialState = {
  jobName: "",
  isJobCreated: false,
};

const jobReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_JOB_NAME:
      return {
        ...state,
        jobName: action.payload,
      };
    case SET_IS_JOB_CREATED:
      return {
        ...state,
        isJobCreated: action.payload,
      };
    default:
      return state;
  }
};

export default jobReducer;
