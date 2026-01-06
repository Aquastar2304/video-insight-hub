import apiClient from './client';
import { Segment, Insight } from './videos';

export const segmentsApi = {
  getInsights: async (segmentId: string): Promise<Insight[]> => {
    const response = await apiClient.get<{ insights: Insight[] }>(`/segments/${segmentId}/insights`);
    return response.data.insights;
  },
};

