import axios from 'axios';
import { SPOTIFY_API_BASE_URL } from '../config';

interface SpotifyError {
  status: number;
  message: string;
}

class SpotifyApiError extends Error {
  status: number;
  
  constructor({ status, message }: SpotifyError) {
    super(message);
    this.status = status;
    this.name = 'SpotifyApiError';
  }
}

export const spotifyApi = axios.create({
  baseURL: SPOTIFY_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
spotifyApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
spotifyApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      throw new SpotifyApiError({
        status: error.response.status,
        message: error.response.data?.error?.message || 'Spotify API error'
      });
    }
    throw error;
  }
);

export { SpotifyApiError }; 