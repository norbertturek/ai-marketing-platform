export type PostResponse = {
  id: string;
  projectId: string;
  content: string | null;
  imageUrls: string[];
  videoUrls: string[];
  platform: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
};
