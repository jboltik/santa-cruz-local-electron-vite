// src/components/CreateCampaignButton.tsx
import React, { useState } from 'react';
import type { CreateCampaignButtonProps } from '../types/campaign';

export default function CreateCampaignButton({
  finalEmailHtml,
  previewText,
  subjectFromH1,
  senderFromName,
  senderFromEmail,
  listId,
  campaignName,
}: CreateCampaignButtonProps) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      const payload = {
        listId,
        subjectLine: subjectFromH1 || 'Untitled Campaign',
        fromName: senderFromName,
        fromEmail: senderFromEmail,
        html: finalEmailHtml,
        previewText,
        campaignName,
        tracking: { opens: true, htmlClicks: true },
        validateLinks: false,
      } as const;

      const result = await window.electron.createCampaign(payload);

      if (result.success) {
        console.log('✅ Draft created (logged):', result.data);
        alert('Draft created (logged).');
      } else {
        console.error('❌ Create campaign failed:', result.message);
        alert(`Create campaign failed: ${result.message}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={onClick} disabled={busy}>
      {busy ? 'Creating…' : 'Create Campaign (Draft)'}
    </button>
  );
}
