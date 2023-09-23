export const setComponentParam = (id, param, value) => {
  return {
    type: "SET_COMPONENT_PARAM",
    payload: { id, param, value },
  };
};
