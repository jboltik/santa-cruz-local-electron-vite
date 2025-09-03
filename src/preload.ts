// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, shell, IpcRendererEvent } from 'electron';
import { SaveHtmlArgs, SaveHtmlResult } from './global';

contextBridge.exposeInMainWorld('electron', {


  onUploadZipCanceled: (cb: () => void) =>
    ipcRenderer.on('upload-zip-canceled', () => cb()),
  onUploadZipFailed: (cb: (msg: string) => void) =>
    ipcRenderer.on('upload-zip-failed', (_e, msg) => cb(msg)),

  saveHtmlToDisk: (args: SaveHtmlArgs): Promise<SaveHtmlResult> =>
    ipcRenderer.invoke('save-html-to-disk', args),

  uploadZipFile: () => ipcRenderer.send('trigger-zip-upload'),
  
  // ✅ Select ZIP file from the main process
  selectZipFile: () => ipcRenderer.invoke('select-zip-file'),


  getSignupPrompt: (): Promise<string> =>
    ipcRenderer.invoke('signup-prompt:get'),
  setSignupPrompt: (html: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('signup-prompt:set', html),
  onSignupPromptUpdated: (cb: (html: string) => void) =>
    ipcRenderer.on('signup-prompt:updated', (_e, html) => cb(html)),
  removeSignupPromptListener: () =>
    ipcRenderer.removeAllListeners('signup-prompt:updated'),



  sendReadyToUpload: () => ipcRenderer.send('ready-to-upload'),



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

    ipcRenderer.on('html-file-processed', handler);
    return () => ipcRenderer.removeListener('html-file-processed', handler);
  },

  // generic ipc access for cleanup
  ipcRenderer: {
    send: ipcRenderer.send,
    on: ipcRenderer.on,
    removeAllListeners: ipcRenderer.removeAllListeners,
  },

  sendTestEmail: (payload: {
    title: string;
    subject: string;
    senderFromEmail: string;
    senderFromName: string;
    html: string;
    isTest: boolean;
    previewText?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> =>
    ipcRenderer.invoke('sendTestEmail', payload),

  sendNowEmail: (payload: {
    title: string;
    subject: string;
    senderFromEmail: string;
    senderFromName: string;
    html: string;
  }): Promise<{ success: boolean; message?: string; data?: any }> =>
    ipcRenderer.invoke('send-now-email', payload),

  sendScheduledEmail: (payload: {
    title: string;
    subject: string;
    senderFromEmail: string;
    senderFromName: string;
    html: string;
    sendTime: string; // Include send time for scheduling
  }): Promise<{ success: boolean; message?: string; data?: any }> =>
    ipcRenderer.invoke('send-scheduled-email', payload),

  // ✅ Expose a function to open links in an external browser
  // openExternalLink: (url: string) => shell.openExternal(url),

  openExternalLink: (url: string) => {
    console.log('🌐 Opening external link from preload:', url);
    shell.openExternal(url);
  },
});

type AppSettings = {
  campaignName?: string;
  autoCampaignEnabled?: boolean;
  autoCampaignPattern?: string;
  brand?: string;
};

contextBridge.exposeInMainWorld('settings', {
  get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  update: (patch: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke('settings:update', patch),
});