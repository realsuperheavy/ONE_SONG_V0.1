export interface SongRequest {
  id: string;
  song: {
    title: string;
    artist: string;
  };
  status: 'pending' | 'approved' | 'rejected';
} 