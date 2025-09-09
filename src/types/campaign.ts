// src/types/campaign.ts
export interface CreateCampaignPayload {
  listId: string;
  subjectLine: string;
  fromName: string;
  fromEmail: string;
  isDisabled?: boolean;

  html: string;              // full templated HTML
  previewText?: string;

  campaignName?: string;
  folderId?: string;
  tracking?: {
    opens?: boolean;
    htmlClicks?: boolean;
    textClicks?: boolean;
    ecomm360?: boolean;
  };

  validateLinks?: boolean;   // defaults to app setting if undefined
}

// export interface CreateCampaignResult {
//   success: boolean;
//   message: string;
//   data?: {
//     id?: string;
//     status?: string;   // e.g. "save"
//     webUrl?: string;
//     archiveUrl?: string;
//     raw?: any;
//   };
// }

export type CreateCampaignResult = {
  success: boolean;
  message: string;
  data?: any;
};

export type CreateCampaignButtonProps = {
  finalEmailHtml: string;    // processed HTML
  previewText: string;       // from onHtmlFileProcessed
  subjectFromH1: string;     // default subject
  senderFromName: string;    // user input or settings
  senderFromEmail: string;   // user input or settings
  listId?: string;            // Mailchimp Audience ID
  campaignName?: string;     // optional (settings)
  isDisabled?: boolean;      // disable button
};