import axios from "axios";

const BASE_URL = "/v1/user/apikey";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.XAuthorization = `Bearer ${token}`;
  }
  return config;
});

export const registerApiKey = async (
  apiKey: string,
  apiType: string
): Promise<any> => {
  try {
    const response = await api.post("", { api_key: apiKey, api_type: apiType });
    return response.data;
  } catch (error) {
    console.error("Failed to register API key:", error);
    throw error;
  }
};

export const fetchApiKeys = async (): Promise<any> => {
  try {
    const response = await api.get("");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    throw error;
  }
};
