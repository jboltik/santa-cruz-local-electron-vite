// One item (image url) returned by the upload endpoint
export type ImageUploadResponseItem = {
  publicUrl: string;
};

// Full response (your endpoint returns an array)
export type ImageUploadResponse = ImageUploadResponseItem[];
