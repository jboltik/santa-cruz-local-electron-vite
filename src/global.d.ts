// src/global.d.ts
export {}; // keep this so the file is a module

import type { AppSettings } from './types/AppSettings';
import type { CreateCampaignPayload, CreateCampaignResult } from './types/campaign';
import type { SaveHtmlArgs, SaveHtmlResult } from './types/shared';

declare global {
  interface Window {
    settings: {
      get(): Promise<AppSettings>;
      update(patch: Partial<AppSettings>): Promise<void>;
    };

    electron: {
      // Upload flow + external links
      onUploadZipCanceled: (callback: () => void) => void;
      onUploadZipFailed: (callback: (message: string) => void) => void;
      openExternalLink: (url: string) => void;
      sendReadyToUpload: () => void;

      // Tipline / signup prompt
      getSignupPrompt: () => Promise<string>;
      setSignupPrompt: (html: string) => Promise<{ ok: boolean }>;
      resetSignupPrompt: () => Promise<{ ok: true }>;
      onSignupPromptUpdated: (callback: (html: string) => void) => void;
      removeSignupPromptListener: () => void;

      // Member / nonmember messages
      getMessageVariant: () => Promise<{
        selectedMessageVariant: 'member' | 'nonmember';
        html: string;
        memberMessageHtml: string;
        nonmemberMessageHtml: string;
      }>;

      setSelectedMessageVariant: (
        variant: 'member' | 'nonmember'
      ) => Promise<{
        ok: boolean;
        selectedMessageVariant: 'member' | 'nonmember';
        html: string;
      }>;

      setMessageHtml: (args: {
        variant: 'member' | 'nonmember';
        html: string;
      }) => Promise<{ ok: boolean }>;

      getMessageHtml: (
        variant?: 'member' | 'nonmember'
      ) => Promise<string>;

      // Optional
      selectZipFile: () => Promise<void>;

      // Processed HTML from main
      onHtmlFileProcessed: (
        callback: (
          processedHTML: string,
          previewText: string,
          subjectFromH1: string,
          finalEmailHtml: string,
          linkResults: { link: string; status: string | number }[]
        ) => void
      ) => () => void; // returns unsubscribe

      // Mail actions
      sendTestEmail: (payload: {
        title: string;
        subject: string;
        senderFromEmail: string;
        senderFromName: string;
        messageVariant?: 'member' | 'nonmember';
        html: string;
        isTest: boolean;
        previewText?: string;
      }) => Promise<{ success: boolean; message: string; data?: any }>;

      sendNowEmail: (payload: {
        title: string;
        subject: string;
        senderFromEmail: string;
        senderFromName: string;
        messageVariant?: 'member' | 'nonmember';
        html: string;
        isTest?: boolean;
        previewText?: string;
      }) => Promise<{ success: boolean; message?: string; data?: any }>;

      sendScheduledEmail: (payload: {
        title: string;
        subject: string;
        senderFromEmail: string;
        senderFromName: string;
        messageVariant?: 'member' | 'nonmember';
        html: string;
        sendTime: string;
        isTest?: boolean;
        previewText?: string;
      }) => Promise<{ success: boolean; message?: string; data?: any }>;

      // New create-campaign
      createCampaign: (payload: CreateCampaignPayload) => Promise<CreateCampaignResult>;

      // File save
      saveHtmlToDisk: (args: SaveHtmlArgs) => Promise<SaveHtmlResult>;

      // Minimal ipc pass-throughs for security: 
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, func: (...args: any[]) => void) => void;
        once: (channel: string, func: (...args: any[]) => void) => void;
        removeListener: (channel: string, func: (...args: any[]) => void) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
  }
}

// Allow importing PNGs in the renderer
declare module '*.png' {
  const value: string;
  export default value;
}
