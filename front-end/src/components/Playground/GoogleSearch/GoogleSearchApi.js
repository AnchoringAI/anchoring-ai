import axios from "axios";
import { decamelizeKeys } from "humps";

const BASE_URL = "/v1/task";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.XAuthorization = `Bearer ${token}`;
  }
  return config;
});

export const callGoogleSearch = async (
  input,
  numResults
) => {
  try {
    const response = await api.post(
      "/google_search",
      JSON.stringify(
        decamelizeKeys({
          query: input,
          numResults: numResults
        })
      ),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.status !== 200) {
      throw new Error(`Error: ${response.statusText}`);
    }
    return response.data.result;
  } catch (error) {
    if (error.response) {
      throw new Error(`Error: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Error: No response received from the server, possible timeout.');
    } else {
      throw new Error('Error:' + error.message);
    }
  }
};
