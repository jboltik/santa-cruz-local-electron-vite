export type AppSettings = {
  campaignName?: string;
  autoCampaignEnabled?: boolean;
  autoCampaignPattern?: string;
  brand?: string;
  signupPromptHtml?: string;
  memberMessageHtml?: string;
  nonmemberMessageHtml?: string;
  selectedMessageVariant?: 'member' | 'nonmember';
  linkCheckerEnabled?: boolean;
};
