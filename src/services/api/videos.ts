import apiClient from './client';

export interface Video {
  id: string;
  user_id: string;
  title: string;
  original_url?: string;
  storage_url: string;
  duration_seconds?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

export interface VideoListResponse {
  videos: Video[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
  };
}

export interface VideoStatus {
  status: string;
  progress: number;
  currentStage: string;
  error?: string;
}

export const videosApi = {
  upload: async (file: File, title?: string): Promise<Video> => {
    const formData = new FormData();
    formData.append('video', file);
    if (title) {
      formData.append('title', title);
    }

    const response = await apiClient.post<{ video: Video }>('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // You can emit this to a progress callback if needed
        }
      },
    });

    return response.data.video;
  },

  submitUrl: async (url: string, title?: string): Promise<Video> => {
    const response = await apiClient.post<{ video: Video }>('/videos/submit-url', {
      url,
      title,
    });
    return response.data.video;
  },

  getAll: async (limit = 20, offset = 0, status?: string): Promise<VideoListResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (status) {
      params.append('status', status);
    }

    const response = await apiClient.get<VideoListResponse>(`/videos?${params.toString()}`);
    return response.data;
  },

  getById: async (videoId: string): Promise<Video> => {
    const response = await apiClient.get<{ video: Video; processing?: any }>(`/videos/${videoId}`);
    return response.data.video;
  },

  getStatus: async (videoId: string): Promise<VideoStatus> => {
    const response = await apiClient.get<VideoStatus>(`/videos/${videoId}/status`);
    return response.data;
  },

  delete: async (videoId: string): Promise<void> => {
    await apiClient.delete(`/videos/${videoId}`);
  },
};

