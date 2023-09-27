import axios, { AxiosResponse } from "axios";
import { camelizeKeys, decamelizeKeys } from "humps";

interface CreateJobRequest {
  createdBy: string;
  appId: string;
  fileId: string;
  taskName: string;
  inputVariables: object;
}

interface GetJobsRequest {
  page?: number;
  size?: number;
  createdBy?: string;
  appId?: string;
  fileId?: string;
}

interface Job {
  id: string;
  taskName: string;
  createdBy: string;
  appId: string;
  fileId: string;
  createdAt: Date;
  status: number;
  completedAt: Date | null;
  deletedAt: Date | null;
  result: object | null;
  message: object | null;
}

const BASE_URL = "/v1/task";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  transformRequest: [
    ...(axios.defaults.transformRequest as any[] || []),
    (data: object) => {
      const decamelizedData = decamelizeKeys(data);
      return decamelizedData;
    },
  ],
  transformResponse: [
    ...(axios.defaults.transformResponse as any[] || []),
    (data: any) => {
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Parsing failed with error: ", e);
          return data;
        }
      }

      if (data?.result?.result) {
        const originalResult = data.result.result;
        data = camelizeKeys(data);
        data.result.result = originalResult;
      } else {
        data = camelizeKeys(data);
      }

      return data;
    },
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

export const createJob = (request: CreateJobRequest): Promise<AxiosResponse<any>> => {
  const { inputVariables, ...restOfRequest } = request;
  const decamelizedData = decamelizeKeys(restOfRequest);
  return api.post(`${BASE_URL}/start`, { ...decamelizedData, input_variables: inputVariables });
};

export const getJobs = (request: GetJobsRequest): Promise<AxiosResponse<Job[]>> => {
  const params = decamelizeKeys(request);
  return api.get(`${BASE_URL}/list`, { params });
};

export const loadJob = (jobId: string): Promise<AxiosResponse<Job>> => {
  if (!jobId) {
    throw new Error("Job ID must be provided!");
  }

  return api.get(`${BASE_URL}/load/${jobId}`);
};

export const stopJob = async (jobId: string): Promise<AxiosResponse<any>> => {
  try {
    const response = await api.get(`${BASE_URL}/stop/${jobId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to stop job:", error);
    throw error;
  }
};

export const deleteJob = async (jobId: string): Promise<AxiosResponse<any>> => {
  try {
    const response = await api.delete(`${BASE_URL}/delete/${jobId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete job:", error);
    throw error;
  }
};

export const publishJob = async (jobId: string): Promise<AxiosResponse<any>> => {
  try {
    const response = await api.post(`${BASE_URL}/publish/${jobId}`);
    return camelizeKeys(response.data);
  } catch (error) {
    console.error("Job publishing failed with error: ", error);
    throw error;
  }
};