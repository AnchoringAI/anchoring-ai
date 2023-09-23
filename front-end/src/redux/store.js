import { configureStore } from "@reduxjs/toolkit";
import thunk from "redux-thunk";
import rootReducer from "./reducers";
import { setUserData } from "./actions/userActions";

const store = configureStore({
  reducer: rootReducer,
  middleware: [thunk],
});

const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");
if (userId && username) {
  store.dispatch(setUserData({ id: userId, name: username }));
}

export default store;
