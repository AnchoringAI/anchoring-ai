import axios, { AxiosResponse } from "axios";
import { camelizeKeys, decamelizeKeys } from "humps";

interface User {
  id: string;
  username: string;
}

interface App {
  appId: string;
  appName: string;
  createdBy: User;
  tags: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
  chain: any;
  deletedAt: Date | null;
}

interface AppListResponse {
  applications: App[];
  totalPages: number;
}

interface AppResponse {
  application: App;
}

interface ApplicationData {
  [key: string]: any;
}

function fromApiResponse(apiApp: any): App {
  if (apiApp.id !== undefined) {
    const { id, ...rest } = apiApp;
    return {
      ...rest,
      appId: id,
    };
  }

  return apiApp;
}

function toApiResponse(data: ApplicationData): any {
  if ("appId" in data) {
    const { appId, ...rest } = data;
    return {
      id: appId,
      ...rest,
    };
  }

  return data;
}

const api = axios.create({
  baseURL: "/v1/app",
  headers: { "Content-Type": "application/json" },
  transformRequest: [
    (data: ApplicationData | undefined) =>
      data ? JSON.stringify(decamelizeKeys(toApiResponse(data))) : data,
    ...(axios.defaults.transformRequest
      ? [axios.defaults.transformRequest].flat()
      : []),
  ],

  transformResponse: [
    ...(axios.defaults.transformResponse
      ? [axios.defaults.transformResponse].flat()
      : []),
    (data: any) => {
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Parsing failed with error: ", e);
          return data;
        }
      }

      data = camelizeKeys(data);

      if (data.applications) {
        data.applications = data.applications.map(fromApiResponse);
      }

      if (data.application) {
        data.application = fromApiResponse(data.application);
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

export const saveApplication = async (
  data: ApplicationData
): Promise<AxiosResponse<any>> => {
  return await api.post("/modify", decamelizeKeys(toApiResponse(data)));
};

export const getApplication = async (id: string): Promise<AppResponse> => {
  const response: AxiosResponse = await api.get(`/load/${id}`);
  return { application: fromApiResponse(response.data) };
};

export const getApplications = async (
  page: number,
  size: number,
  app_name?: string,
  created_by?: string,
  tags?: string[],
  description?: string
): Promise<AppListResponse> => {
  let params: any = { page, size };

  if (app_name) {
    params.app_name = app_name;
  }

  if (created_by) {
    params.created_by = created_by;
  }

  if (tags) {
    params.tags = tags.join(",");
  }

  if (description) {
    params.description = description;
  }

  const response: AxiosResponse = await api.get(`/list`, { params });
  return {
    applications: response.data.applications.map(fromApiResponse),
    totalPages: response.data.totalPages,
  };
};

export const deleteApplication = async (appId: string): Promise<any> => {
  try {
    const response: AxiosResponse = await api.delete(`/delete/${appId}`);
    return camelizeKeys(response.data);
  } catch (error) {
    console.error("Delete application failed with error: ", error);
    throw error;
  }
};

export const publishApplication = async (id: string): Promise<any> => {
  try {
    const response: AxiosResponse = await api.post(`/publish/${id}`);
    return camelizeKeys(response.data);
  } catch (error) {
    console.error("Publish application failed with error: ", error);
    throw error;
  }
};
