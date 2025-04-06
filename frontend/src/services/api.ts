import axios from 'axios';
import {
  ApiKeyRequest,
  StartSessionRequest, // New request type for starting session
  SessionIdRequest, // New request type for step operations
  HeartbeatResponse,
  ConfigureResponse,
  StartSessionResponse, // New response type for session ID
  ExtractResponse,
  MatchResponse,
  CategorizeResponse
} from '../types/api'; // Assuming types are updated or created

// Base URL for the backend API
// Use environment variable or default for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- API Functions ---

/**
 * Configure the API key on the backend.
 */
export const configureApiKey = async (apiKey: string): Promise<ConfigureResponse> => {
  const response = await apiClient.post<ConfigureResponse>('/configure', { api_key: apiKey } as ApiKeyRequest);
  return response.data;
};

/**
 * Check the backend server status (heartbeat).
 * Requires API key to be configured first.
 */
export const checkHeartbeat = async (): Promise<HeartbeatResponse> => {
  const response = await apiClient.get<HeartbeatResponse>('/heartbeat');
  return response.data;
};

/**
 * Start a new analysis session with the backend.
 * Sends seller description and reviews, receives a session ID.
 */
export const startSession = async (data: StartSessionRequest): Promise<StartSessionResponse> => {
  const response = await apiClient.post<StartSessionResponse>('/start_session', data);
  return response.data; // Should contain { session_id: string }
};

/**
 * Request attribute extraction for a given session ID.
 */
export const extractAttributes = async (data: SessionIdRequest): Promise<ExtractResponse> => {
  const response = await apiClient.post<ExtractResponse>('/extract', data);
  return response.data; // Contains extracted_attributes and markdown
};

/**
 * Request attribute matching for a given session ID.
 */
export const matchAttributes = async (data: SessionIdRequest): Promise<MatchResponse> => {
  const response = await apiClient.post<MatchResponse>('/match', data);
  return response.data; // Contains all_dataframes and markdown
};

/**
 * Request attribute categorization for a given session ID.
 */
export const categorizeAttributes = async (data: SessionIdRequest): Promise<CategorizeResponse> => {
  const response = await apiClient.post<CategorizeResponse>('/categorize', data);
  return response.data; // Contains results and markdown
};

/**
 * Toggles parallel processing on the backend.
 */
export const toggleParallelProcessing = async (): Promise<{ message: string }> => {
  const response = await apiClient.get<{ message: string }>('/set_num_worker');
  return response.data;
};

// --- Error Handling (Optional Enhancement) ---
// You might want to add interceptors for global error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API call failed:', error.response?.data || error.message);
    // Re-throw the error so components can handle it locally if needed
    return Promise.reject(error);
  }
);

export default apiClient; // Export the configured client if needed elsewhere
