import axios from "axios";
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
  createdAt: Date;
  updatedAt: Date;
  chain: any;
  deletedAt: Date | null;
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
  baseURL: "/v1/shared",
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

export const generateShareLink = async (
  resourceType: string,
  resourceId: string,
  expiresAt: string | null
): Promise<any> => {
  try {
    const response = await api.post("/generate", {
      resource_type: resourceType,
      resource_id: resourceId,
      expires_at: expiresAt,
    });

    if (response.data && response.data.shareLinkId) {
      const path = window.location.pathname.split('/')[1];
      response.data.shareableUrl = `${window.location.origin}/shared/${path}/${response.data.shareLinkId}`;
    }

    return response.data;
  } catch (error) {
    console.error("Failed to generate share link:", error);
    throw error;
  }
};

export const loadShareLinkApp = async (
  linkId: string
): Promise<AppResponse> => {
  try {
    const response = await api.get(`/app/${linkId}`);
    return { application: fromApiResponse(response.data) };
  } catch (error) {
    console.error("Failed to load share link app:", error);
    throw error;
  }
};

export const loadShareLinkTask = async (linkId: string): Promise<any> => {
  try {
    const response = await api.get(`/task/${linkId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to load share link task:", error);
    throw error;
  }
};
