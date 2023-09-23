import axios from "axios";
import { camelizeKeys, decamelizeKeys } from "humps";

const BASE_URL = "/v1/embedding";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.XAuthorization = `Bearer ${token}`;
  }

  if (config.data) {
    config.data = decamelizeKeys(config.data);
  }

  return config;
});

api.interceptors.response.use((response) => {
  if (response.data) {
    response.data = camelizeKeys(response.data);
  }
  return response;
});

export const createEmbedding = async (
  created_by: string,
  file_id: string,
  embedding_name: string
): Promise<any> => {
  try {
    const requestData = {
      created_by: created_by,
      file_id: file_id,
      embedding_name: embedding_name,
      doc_transformer: {
        type: "text_splitter",
        parameters: {
          chunk_size: 256,
          chunk_overlap: 20,
        },
      },
      embedding_model: {
        model_provider: "openai",
        parameters: {
          model: "text-embedding-ada-002",
          embedding_ctx_length: 8191,
          chunk_size: 256,
          max_retries: 6,
          request_timeout: 600,
        },
      },
      vector_store: {
        vector_store_provider: "lancedb",
        parameters: {
          mode: "overwrite",
        },
      },
    };

    const response = await api.post("/create", requestData);
    return response.data;
  } catch (error) {
    console.error("Failed to create embedding:", error);
    throw error;
  }
};

export const listEmbeddings = async (
  page: number,
  size: number,
  createdBy?: string,
  fileId?: string
): Promise<any> => {
  try {
    const params = { page, size, created_by: createdBy, file_id: fileId };
    const response = await api.get("/list", { params });
    return response.data;
  } catch (error) {
    console.error("Failed to list embeddings:", error);
    throw error;
  }
};

export const stopEmbedding = async (embeddingId: string): Promise<any> => {
  try {
    const response = await api.get(`/stop/${embeddingId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to stop embedding:", error);
    throw error;
  }
};

export const deleteEmbedding = async (embeddingId: string): Promise<any> => {
  try {
    const response = await api.delete(`/delete/${embeddingId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete embedding:", error);
    throw error;
  }
};

export const publishEmbedding = async (embeddingId: string): Promise<any> => {
  try {
    const response = await api.post(`/publish/${embeddingId}`);
    return camelizeKeys(response.data);
  } catch (error) {
    console.error("Embedded file publishing failed with error: ", error);
    throw error;
  }
};

export const searchRelatedDocument = async (
  embeddingId: string,
  input: string
): Promise<any> => {
  try {
    const requestData = {
      embedding_id: embeddingId,
      input: input,
      input_variables: {},
      parameters: {
        top_n: 3,
      },
    };

    const response = await api.post("/search", requestData);
    return response.data;
  } catch (error) {
    console.error("Failed to search related document:", error);
    throw error;
  }
};
