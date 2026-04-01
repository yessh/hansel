export interface Post {
  id: number;
  userId: number;
  content: string;
  author: string;
  imageUrl: string | null;
  createdAt: string;
  latitude: number;
  longitude: number;
}

export interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface LikeStatus {
  count: number;
  liked: boolean;
}
