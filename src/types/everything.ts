/** Raw result from Everything HTTP JSON API */
export interface EverythingRawResult {
  name: string;
  path: string;
  size: number;
  date_modified: number; // Windows FILETIME (100ns intervals since 1601-01-01)
  /** "file" or "folder" (Everything HTTP server JSON format) */
  type?: string;
  /** Windows file attributes bitmask (0x10 = FILE_ATTRIBUTE_DIRECTORY) */
  attributes?: number;
}

/** Raw JSON response from Everything HTTP server */
export interface EverythingRawResponse {
  query: string;
  totalResults: number;
  results: EverythingRawResult[];
}

/** Normalized file/folder result for the client */
export interface EverythingFileResult {
  name: string;
  path: string;
  fullPath: string;
  size: number;
  dateModified: string; // ISO 8601
  isFolder: boolean;
}

/** Response from GET /api/everything */
export interface EverythingSearchResponse {
  results: EverythingFileResult[];
  totalResults: number;
  query: string;
  elapsed: number;
}

/** Sort field options */
export type EverythingSortField = "name" | "size" | "date_modified";

/** Parameters for the everything-client search */
export interface EverythingSearchParams {
  search?: string;
  path?: string;
  offset?: number;
  count?: number;
  sort?: EverythingSortField;
  ascending?: boolean;
}
