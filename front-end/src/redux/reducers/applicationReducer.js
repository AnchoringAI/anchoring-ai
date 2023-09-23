import {
  SAVE_APPLICATION_REQUEST,
  SAVE_APPLICATION_SUCCESS,
  SAVE_APPLICATION_FAILURE,
} from "../actions/applicationActions";

const initialState = {
  loading: false,
  application: {},
  error: "",
};

const applicationReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAVE_APPLICATION_REQUEST:
      return { ...state, loading: true };
    case SAVE_APPLICATION_SUCCESS:
      return {
        ...state,
        loading: false,
        application: action.payload,
        error: "",
      };
    case SAVE_APPLICATION_FAILURE:
      return {
        ...state,
        loading: false,
        application: {},
        error: action.payload,
      };
    default:
      return state;
  }
};

export default applicationReducer;
