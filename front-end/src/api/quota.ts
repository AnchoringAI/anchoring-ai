import axios, { AxiosResponse } from "axios";
import { camelizeKeys, decamelizeKeys } from "humps";

interface QuotaResponse {
  data: number;
}

const BASE_URL = "/v1/quota";

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
      data = camelizeKeys(data);
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

export const getQuota = (): Promise<AxiosResponse<QuotaResponse>> => {
  return api.get(`${BASE_URL}/check`);
};
