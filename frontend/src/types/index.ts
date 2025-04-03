export interface AnalysisRequest {
  seller_description: string;
  reviews: string[];
}

export interface ExtractionRequest {
  reviews: string[];
}

export interface MatchingRequest {
  seller_description: string;
  extracted_attributes: any[];
}

export interface CategoryRequest {
  all_dataframes: any[];
}

export interface ExtractResponse {
  extracted_attributes: any[];
}

export interface MatchResponse {
  all_dataframes: any[];
}

export interface FullPipelineResponse {
  categories: Record<string, any>;
  all_attributes: any[];
}
