import * as api from "../../api/applications.ts";

export const SAVE_APPLICATION_REQUEST = "SAVE_APPLICATION_REQUEST";
export const SAVE_APPLICATION_SUCCESS = "SAVE_APPLICATION_SUCCESS";
export const SAVE_APPLICATION_FAILURE = "SAVE_APPLICATION_FAILURE";

const saveApplicationRequest = () => {
  return { type: SAVE_APPLICATION_REQUEST };
};

const saveApplicationSuccess = (application) => {
  return { type: SAVE_APPLICATION_SUCCESS, payload: application };
};

const saveApplicationFailure = (error) => {
  return { type: SAVE_APPLICATION_FAILURE, payload: error };
};

export const saveApplication = (data) => {
  return async (dispatch) => {
    dispatch(saveApplicationRequest());
    try {
      const response = await api.saveApplication(data);
      dispatch(saveApplicationSuccess(response.data));
      return response.data;
    } catch (error) {
      dispatch(saveApplicationFailure(error.message));
      throw error;
    }
  };
};
