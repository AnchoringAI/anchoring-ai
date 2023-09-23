export const SET_JOB_NAME = "SET_JOB_NAME";
export const SET_IS_JOB_CREATED = "SET_IS_JOB_CREATED";

export const setJobName = (jobName) => ({
  type: SET_JOB_NAME,
  payload: jobName,
});

export const setIsJobCreated = (isJobCreated) => ({
  type: SET_IS_JOB_CREATED,
  payload: isJobCreated,
});
