import { SET_USER_DATA } from "../actions/userActions";

const initialState = {
  user: {
    username: localStorage.getItem("username") || null,
    userId: localStorage.getItem("userId") || null,
  },
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER_DATA:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export default userReducer;
