import apiClient from './client';

export interface SearchResult {
  segmentId: string;
  videoId: string;
  videoTitle: string;
  segmentTitle: string;
  segmentText: string;
  timestamp: number;
  similarity: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
}

export const searchApi = {
  search: async (
    query: string,
    scope: 'video' | 'library' = 'library',
    videoId?: string,
    limit = 20
  ): Promise<SearchResponse> => {
    const response = await apiClient.post<SearchResponse>('/search', {
      query,
      scope,
      videoId,
      limit,
    });
    return response.data;
  },
};

