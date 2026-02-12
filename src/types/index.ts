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
  youtube_video_id?: string | null;
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
  youtube_video_id?: string | null;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
}
