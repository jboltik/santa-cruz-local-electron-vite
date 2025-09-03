export {};

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

declare global {
  interface Window {
    electron: {
      onUploadZipCanceled: (callback: () => void) => void;
      onUploadZipFailed: (callback: (message: string) => void) => void; 
      openExternalLink: (url: string) => void;
      sendReadyToUpload: () => void;
      
      getSignupPrompt: () => Promise<string>;
      setSignupPrompt: (html: string) => Promise<{ ok: boolean }>;
   
      onSignupPromptUpdated: (callback: (html: string) => void) => void;
      removeSignupPromptListener: () => void;  

      selectZipFile: () => Promise<void>;
      onZipFileSelected: (callback: (filePath: string) => void) => void;
      onHtmlFileProcessed: (
        callback: (
          // bodyHtml: string,
          // html: string,
          // previewText: string,
          // subjectFromH1: string,
          // rawHtml: string,
          // linkResults: { link: string; status: string | number }[]
          // bodyHtml: string,  // converted HTML (no template)
          // html: string,  // original HTML (as uploaded)
          processedHTML: string,
          previewText: string,
          subjectFromH1: string,
          // rawHtml: string, // FULL html (template + body)
          // finalHtml: string, // FULL html (template + body)
          finalEmailHtml: string,
          linkResults: { link: string; status: string | number }[]
        ) => void
      ) => () => void;


      sendTestEmail: (payload: {
        title: string;
        subject: string;
        senderFromEmail: string;
        senderFromName: string;
        isTest: boolean;
        previewText?: string;
        html: string;
      }) => Promise<{ success: boolean; message: string; data?: any }>;

      sendNowEmail: (payload: {
        title: string;
        subject: string;
        senderFromEmail: string;
        senderFromName: string;
        isTest: boolean;
        previewText?: string;
        html: string;
      }) => Promise<{ success: boolean; message?: string; data?: any }>;

      sendScheduledEmail: (payload: {
        title: string;
        subject: string;
        senderFromEmail: string;
        senderFromName: string;
        html: string;
        isTest: boolean;
        previewText?: string;
        sendTime: string;
      }) => Promise<{ success: boolean; message?: string; data?: any }>;

      saveHtmlToDisk: (args: SaveHtmlArgs) => Promise<SaveHtmlResult>;

      // openExternalLink: (url: string) => void;
      // triggerFileUpload: (htmlContent: string) => void;
      // removeEventListener: (
      //   event: string,
      //   callback: (...args: any[]) => void
      // ) => void;
  
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        on: (channel: string, func: (...args: any[]) => void) => void;
        once: (channel: string, func: (...args: any[]) => void) => void;
        removeListener: (
          channel: string,
          func: (...args: any[]) => void
        ) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
    settings: {
        get(): Promise<{
          campaignName?: string;
          autoCampaignEnabled?: boolean;
          autoCampaignPattern?: string;
          brand?: string;
          signupPromptHtml?: string;
        }>;
        update(patch: Partial<{
          campaignName: string;
          autoCampaignEnabled: boolean;
          autoCampaignPattern: string;
          brand: string;
          signupPromptHtml: string;
        }>): Promise<void>;
    };
  }
}

// Add support for importing PNG files
declare module '*.png' {
  const value: string;
  export default value;
}
