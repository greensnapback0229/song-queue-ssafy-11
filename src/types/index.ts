export interface QueueItem {
  id: number;
  name: string;
  reason: string;
  position: number;
  created_at: string;
}

export interface SongHistory {
  id: number;
  name: string;
  reason: string;
  song_title: string;
  completed_at: string;
}

export interface Comment {
  nickname: string;
  content: string;
  timestamp: number;
}

export interface SingingSession {
  id: number;
  name: string;
  reason: string;
  song_title: string;
  started_at: string;
}
