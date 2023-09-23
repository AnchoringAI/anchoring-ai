import axios from "axios";
import { camelizeKeys } from "humps";
import { Dispatch } from "redux";
import { setUserData } from "../redux/actions/userActions";

const BASE_URL = "/v1/user";

interface NestedLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    username: string;
    id: string;
  };
}

interface RegisterResponse {
  success: boolean;
  message: string;
}

interface DbUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  active: boolean;
  authenticated: boolean;
  anonymous: boolean;
  create_at: string;
}

const transformResponseData = (data: any) => {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error("Parsing failed with error: ", e);
      return data;
    }
  }
  return camelizeKeys(data);
};

const api = axios.create({
  baseURL: BASE_URL,
  transformResponse: [
    ...(axios.defaults.transformResponse as any[]),
    transformResponseData
  ],
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.XAuthorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (
  email: string,
  password: string,
  dispatch: Dispatch
): Promise<NestedLoginResponse> => {
  const response = await api.post<NestedLoginResponse>("/login", { email, password });

  const { token, username, id } = response.data.data;

  if (response.data.success) {
    localStorage.setItem("username", username!);
    localStorage.setItem("token", token!);
    localStorage.setItem("userId", id!);

    dispatch(
      setUserData({ username: username!, id: id! })
    );
  }

  return response.data;
};

export const register = async (
  username: string,
  email: string,
  password: string
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>("/register", { username, email, password });

  return response.data;
};

export const logout = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post("/logout");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  return response.data;
};

export const checkAuthStatus = async (): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const response = await api.get("/login_required_test", config);

  return response.data;
};
