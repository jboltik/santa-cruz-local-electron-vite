// src/types/shared.ts
export type AuthorData = {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  professionalUrl?: string;
};

export type SaveHtmlArgs = {
  html: string;
  defaultName?: string;
};

export type SaveHtmlResult =
  | { ok: true; filePath: string }
  | { ok: false; canceled?: true; error?: string };
