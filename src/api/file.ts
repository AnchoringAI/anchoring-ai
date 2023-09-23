import axios, { AxiosResponse } from "axios";
import { camelizeKeys } from "humps";

// Define the Interface
interface DbFile {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  uploadedByUsername: string;
  uploadedAt: Date;
  size: number;
  content: any;
  deletedAt: Date | null;
}

const BASE_URL = "/v1/file";

const api = axios.create({
  headers: {
    "Content-Type": "multipart/form-data",
  },
  transformResponse: [
    ...(Array.isArray(axios.defaults.transformResponse) ? axios.defaults.transformResponse : []),
    (data: any) => {
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Parsing failed with error: ", e);
          return data;
        }
      }
      return camelizeKeys(data);
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

export const uploadFile = (file: File, uploadedBy: string, onUploadProgress: any): Promise<AxiosResponse<any>> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploaded_by", uploadedBy);
  return api.post(`${BASE_URL}/upload`, formData, { onUploadProgress });
};

export const fetchFiles = (page: number, size: number, filterByUploader: string | null = null): Promise<AxiosResponse<DbFile[]>> => {
  api.defaults.headers["Content-Type"] = "application/json";
  const params: { page: number; size: number; uploaded_by?: string } = { page, size };
  if (filterByUploader) {
    params.uploaded_by = filterByUploader;
  }
  return api.get(`${BASE_URL}/list`, { params }).finally(() => {
    api.defaults.headers["Content-Type"] = "multipart/form-data";
  });
};

export const fetchFile = (fileId: string): Promise<AxiosResponse<DbFile>> => {
  api.defaults.headers["Content-Type"] = "application/json";
  return api.get(`${BASE_URL}/load/${fileId}`).finally(() => {
    api.defaults.headers["Content-Type"] = "multipart/form-data";
  });
};

export const downloadFile = async (fileId: string): Promise<void> => {
  const downloadApi = axios.create({
    responseType: 'blob',
  });

  try {
    const response = await downloadApi.get(`${BASE_URL}/download/${fileId}`);

    const blob = new Blob([response.data], { type: response.headers['content-type'] });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = response.headers['x-file-name'] || `file_${fileId}.extension`;
    link.href = url;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('File download failed:', error);
  }
};

export const deleteFile = (fileId: string): Promise<AxiosResponse<any>> => {
  api.defaults.headers["Content-Type"] = "application/json";
  return api.delete(`${BASE_URL}/delete/${fileId}`).finally(() => {
    api.defaults.headers["Content-Type"] = "multipart/form-data";
  });
};

export const embedText = (fileId: string): Promise<AxiosResponse<any>> => {
  api.defaults.headers["Content-Type"] = "application/json";
  return api.post(`${BASE_URL}/embed_text/${fileId}`).finally(() => {
    api.defaults.headers["Content-Type"] = "multipart/form-data";
  });
};

export const publishFile = (id: string): Promise<AxiosResponse<any>> => {
  api.defaults.headers["Content-Type"] = "application/json";
  return api.post(`${BASE_URL}/publish/${id}`).then(response => {
    return camelizeKeys(response.data);
  }).catch(error => {
    console.error("File publishing failed with error: ", error);
    throw error;
  }).finally(() => {
    api.defaults.headers["Content-Type"] = "multipart/form-data";
  });
};
