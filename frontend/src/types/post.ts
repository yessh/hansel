export interface Post {
  id: number;
  content: string;
  author: string;
  imageUrl: string | null;
  createdAt: string;
  latitude: number;
  longitude: number;
}
