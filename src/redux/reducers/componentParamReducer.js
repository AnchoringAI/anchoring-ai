const initialState = {};

function componentParamReducer(state = initialState, action) {
  switch (action.type) {
    case "SET_COMPONENT_PARAM":
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          [action.payload.param]: action.payload.value,
        },
      };
    default:
      return state;
  }
}

export default componentParamReducer;
