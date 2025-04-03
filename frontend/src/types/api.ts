// --- Request Payloads ---
export interface ApiKeyRequest {
  api_key: string;
}

export interface StartSessionRequest {
  seller_description: string;
  reviews: string[];
}

export interface SessionIdRequest {
  session_id: string;
}

// --- Response Payloads ---
export interface ConfigureResponse {
  message: string;
}

export interface HeartbeatResponse {
  status: string; // e.g., "heartbeat success", "heartbeat failed"
}

export interface StartSessionResponse {
  session_id: string;
}

// Define structure for extracted attributes if not already defined elsewhere
export interface ExtractedAttribute {
  attribute: string;
  value: string;
}

export interface ExtractResponse {
  extracted_attributes: ExtractedAttribute[][]; // Array of arrays (one per review)
  markdown: string;
}

// (DFs converted to records)
export interface MatchedAttributeRecord {
  attribute: string;
  value: string;
  status: 'missing' | 'matching' | 'contradictory' | 'partially_matching';
  evidence: string | null;
}

export interface MatchResponse {
  all_dataframes: MatchedAttributeRecord[][]; // Array of arrays (one per review's dataframe)
  markdown: string;
}

export interface CategorizedItem {
    attribute: string;
    value: string;
    evidence: string | null;
    // Category is handled by the structure below
}

export interface CategorizedResult {
  [status: string]: { // e.g., "missing", "matching"
    [category: string]: CategorizedItem[]; // e.g., "physical attribute"
  };
}


export interface CategorizeResponse {
  results: CategorizedResult;
  markdown: string;
}

// Structure for potential error responses from FastAPI/HTTPExceptions
export interface ErrorResponse {
  detail: string;
}