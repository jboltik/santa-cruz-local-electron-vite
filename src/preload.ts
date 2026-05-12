// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, shell, IpcRendererEvent } from 'electron';
import type { SaveHtmlArgs, SaveHtmlResult } from './types/shared';
import type { AppSettings } from './types/AppSettings';
import type { CreateCampaignPayload, CreateCampaignResult, MessageVariant } from './types/campaign';



contextBridge.exposeInMainWorld('electron', {

   // user clicks upload button
  sendReadyToUpload: (): void => ipcRenderer.send('ready-to-upload'),


  // optional UX: let renderer know dialog was canceled
  onUploadZipCanceled: (cb: () => void) => {
    ipcRenderer.on('upload-zip-canceled', cb);
    return () => ipcRenderer.removeListener('upload-zip-canceled', cb);
  },

  onUploadZipFailed: (cb: (msg: string) => void) =>
    ipcRenderer.on('upload-zip-failed', (_e, msg) => cb(msg)),

  saveHtmlToDisk: (args: SaveHtmlArgs): Promise<SaveHtmlResult> =>
    ipcRenderer.invoke('save-html-to-disk', args),

  // uploadZipFile: () => ipcRenderer.send('trigger-zip-upload'),
  
  // ✅ Select ZIP file from the main process
  // selectZipFile: () => ipcRenderer.invoke('select-zip-file'),


  getSignupPrompt: (): Promise<string> =>
    ipcRenderer.invoke('signup-prompt:get'),
  setSignupPrompt: (html: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('signup-prompt:set', html),
  resetSignupPrompt: (): Promise<{ ok: boolean }> =>          
    ipcRenderer.invoke('signup-prompt:reset'),
  onSignupPromptUpdated: (cb: (html: string) => void) =>
    ipcRenderer.on('signup-prompt:updated', (_e, html) => cb(html)),
  removeSignupPromptListener: () =>
    ipcRenderer.removeAllListeners('signup-prompt:updated'),
  
  
  
  // getMessageVariant: (): Promise<{
  //   selectedMessageVariant: MessageVariant;
  //   html: string;
  //   memberMessageHtml: string;
  //   nonmemberMessageHtml: string;
  // }> => ipcRenderer.invoke('message-variant:get'),

  // setSelectedMessageVariant: (
  //   variant: MessageVariant
  // ): Promise<{
  //   ok: boolean;
  //   selectedMessageVariant: MessageVariant;
  //   html: string;
  // }> => ipcRenderer.invoke('message-variant:set-selected', variant),

  // setMessageHtml: (args: {
  //   variant: MessageVariant;
  //   html: string;
  // }): Promise<{ ok: boolean }> =>
  //   ipcRenderer.invoke('message-html:set', args),

  // getMessageHtml: (variant?: MessageVariant): Promise<string> =>
  //   ipcRenderer.invoke('message-html:get', variant),

 getMessageVariant: (): Promise<{
  selectedMessageVariant: 'member' | 'nonmember';
  html: string;
  memberMessageHtml: string;
  nonmemberMessageHtml: string;
}> => ipcRenderer.invoke('message-variant:get'),

setSelectedMessageVariant: (
  variant: 'member' | 'nonmember'
): Promise<{
  ok: boolean;
  selectedMessageVariant: 'member' | 'nonmember';
  html: string;
}> => ipcRenderer.invoke('message-variant:set-selected', variant),

setMessageHtml: (args: {
  variant: 'member' | 'nonmember';
  html: string;
}): Promise<{ ok: boolean }> => ipcRenderer.invoke('message-html:set', args),

getMessageHtml: (
  variant?: 'member' | 'nonmember'
): Promise<string> => ipcRenderer.invoke('message-html:get', variant),

  

  // ✅ Listen for when ZIP file is selected
  onZipFileSelected: (callback: (filePath: string) => void) =>
    ipcRenderer.on('zip-file-selected', (_event, filePath) =>
      callback(filePath)
    ),

  // ✅ Expose 'onHtmlFileProcessed' to receive processed HTML


  onHtmlFileProcessed: (
    cb: (
      processedHTML: string,        // ← body-only (left editor)
      previewText: string,          // ← full preview text (unlimited)
      subjectFromH1: string,        // ← default subject
      finalEmailHtml: string,       // ← FULL html w/ template (right iframe)
      linkResults: { link: string; status: string | number }[]
      // bodyHtml: string,
      // previewText: string,
      // subjectFromH1: string,
      // finalHtml: string,
      // linkResults: { link: string; status: string | number }[]
    ) => void
  ) => {
    const handler = (
      _ev: any,
       processedHTML: string,
        previewText: string,
        subjectFromH1: string,
        finalEmailHtml: string,
        linkResults: { link: string; status: string | number }[]
    ) => cb(processedHTML, previewText, subjectFromH1, finalEmailHtml, linkResults);
    // const handler = (
    //   _e: IpcRendererEvent,
    //   bodyHtml: string,
    //   previewText: string,
    //   subjectFromH1: string,
    //   finalHtml: string,
    //   linkResults: { link: string; status: string | number }[]
    // ) => cb(bodyHtml, previewText, subjectFromH1, finalHtml, linkResults);

    // ipcRenderer.on('html-file-processed', handler);
    // return () => ipcRenderer.removeListener('html-file-processed', handler);
    ipcRenderer.on('html-file-processed', (_e, processedHTML, previewText, subjectFromH1, finalEmailHtml, linkResults) =>
    cb(processedHTML, previewText, subjectFromH1, finalEmailHtml, linkResults));
  },

  // generic ipc access for cleanup
  ipcRenderer: {
    send: ipcRenderer.send,
    on: ipcRenderer.on,
    once: ipcRenderer.once,
    removeListener: ipcRenderer.removeListener,
    removeAllListeners: ipcRenderer.removeAllListeners,
  },

  createCampaign: (payload: CreateCampaignPayload): Promise<CreateCampaignResult> =>
  ipcRenderer.invoke('create-campaign', payload),

  sendTestEmail: (payload: {
    title: string;
    subject: string;
    senderFromEmail: string;
    senderFromName: string;
    html: string;
    isTest: boolean;
    previewText?: string;
    messageVariant?: MessageVariant;
  }): Promise<{ success: boolean; message: string; data?: any }> =>
    ipcRenderer.invoke('sendTestEmail', payload),

  sendNowEmail: (payload: {
    title: string;
    subject: string;
    senderFromEmail: string;
    senderFromName: string;
    html: string;
    isTest: boolean;
    previewText?: string;
    messageVariant?: MessageVariant;
  }): Promise<{ success: boolean; message?: string; data?: any }> =>
    ipcRenderer.invoke('send-now-email', payload),

  sendScheduledEmail: (payload: {
    title: string;
    subject: string;
    senderFromEmail: string;
    senderFromName: string;
    html: string;
    isTest: boolean;
    previewText?: string;
    sendTime: string; // Include send time for scheduling
    messageVariant?: MessageVariant;
  }): Promise<{ success: boolean; message?: string; data?: any }> =>
    ipcRenderer.invoke('send-scheduled-email', payload),

  // ✅ Expose a function to open links in an external browser
  // openExternalLink: (url: string) => shell.openExternal(url),

  openExternalLink: (url: string) => {
    console.log('🌐 Opening external link from preload:', url);
    shell.openExternal(url);
  },
});



contextBridge.exposeInMainWorld('settings', {
  get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  update: (patch: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke('settings:update', patch),
});