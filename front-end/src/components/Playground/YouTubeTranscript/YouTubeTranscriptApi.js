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

export const callYouTubeTranscript = async (input) => {
  try {
    const response = await api.post(
      "/youtube_transcript",
      JSON.stringify(
        decamelizeKeys({
          videoUrl: input
        })
      ),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.result;
  } catch (error) {
    let errorMessage = 'An unexpected error occurred.';
    if (error.response) {
      const { status, data } = error.response;
      // Customize the message based on status code if needed
      switch (status) {
        case 400:
          errorMessage = 'Bad Request: The server cannot process the request due to a client error.';
          break;
        case 401:
          errorMessage = 'Unauthorized: Authentication is required and has failed or has not been provided.';
          break;
        case 403:
          errorMessage = 'Forbidden: You do not have the necessary permissions to access this.';
          break;
        case 404:
          errorMessage = 'Not Found: The requested resource could not be found.';
          break;
        // Add more cases as necessary
      }
      // Use the server's error message if available
      errorMessage = (data && data.message) || data.error || errorMessage;
    } else if (error.request) {
      errorMessage = 'No response received from the server, possible timeout.';
    } else {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
};
