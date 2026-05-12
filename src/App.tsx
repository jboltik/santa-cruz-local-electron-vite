import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment-timezone';
import emailTemplate from './emailTemplate';
import { html as cmHtml } from '@codemirror/lang-html';
import { keymap } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  search,
  searchKeymap,
  highlightSelectionMatches,
} from '@codemirror/search';
import {
  EditorView,
  ViewPlugin,
  Decoration,
  DecorationSet,
  MatchDecorator,
  ViewUpdate,
} from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { codeViewExtensions } from './editor/codeViewTheme';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import CreateCampaignButton from './components/CreateCampaignButton';


type MessageVariant = 'member' | 'nonmember';

const LOCAL_STORAGE_KEY_SIGNUP_PROMPT = 'signupPromptHtmlContent';

// build once (outside the component or with useMemo inside)
const CM_EXT = codeViewExtensions({
  tagTeal: '#0093ac',
  styleGray: '#9aa0a6',
  mcGray: '#aeb4bb', // slightly different gray
  linkLight: '#6ea8fe', // lighter blue for href="…"
  linkDark: '#0a58ca', // darker blue for URL inside quotes
  genericAttrGray: '#9aa0a6', // same as styleGray for target/align/valign
  nbsp: '#6fb1b8', // teal-ish for &nbsp;
});

const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 4; hour <= 21; hour++) {
    for (let minute of [0, 15, 30, 45]) {
      const time = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`;
      options.push(time);
    }
  }
  return options;
};

// helpers
const applyPattern = (pattern: string, brand: string, m: moment.Moment) =>
  pattern
    .replace('{brand}', brand)
    .replace('{MMMM}', m.format('MMMM'))
    .replace('{MMM}', m.format('MMM'))
    .replace('{YYYY}', m.format('YYYY'))
    .replace('{YY}', m.format('YY'));

const computeDateFromScheduleOrNow = (
  scheduleDate?: string,
  scheduleTime?: string
) => {
  if (scheduleDate && scheduleTime) {
    // use local time zone (simplest); or swap in tz() if you want a fixed zone
    return moment(`${scheduleDate}T${scheduleTime}`);
  }
  return moment(); // now (local)
};

const getNextSunday = () => {
  const today = moment();

  // 0 = Sunday
  const daysUntilSunday = today.day() === 0 ? 0 : 7 - today.day();

  return today.clone().add(daysUntilSunday, 'days');
};

const buildDefaultCampaignName = (
  variant: 'MEMBER' | 'nonmember' = 'MEMBER',
  date = getNextSunday()
) => {
  return `${date.format('YYYYMMDD')} ${variant} newsletter`;
};

const getCampaignVariantLabel = (variant: MessageVariant) =>
  variant === 'member' ? 'MEMBER' : 'nonmember';

// 🧪 Debug Electron preload injection
console.log('🤖 electron object:', window.electron);
console.log('🧩 ipcRenderer.on exists:', !!window.electron?.ipcRenderer?.on);

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Form Fields for email send function
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [userEditedCampaign, setUserEditedCampaign] = useState(false);
  const [autoCampaignEnabled, setAutoCampaignEnabled] = useState(true);
  const [autoCampaignPattern, setAutoCampaignPattern] = useState(
    '{YYYYMMDD} MEMBER newsletter'
  );
  const [brand, setBrand] = useState('Santa Cruz Local'); // optional
  const [hasUploadedZip, setHasUploadedZip] = useState(
    () => sessionStorage.getItem('hasUploadedZip') === 'true'
  );
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const shouldFlashUpload = isProcessingUpload || !hasUploadedZip;
  const [senderFromName, setSenderFromName] = useState('Santa Cruz Local staff (Kara, Alexandria, Nik, Jay, Fidel, Amaya & Jesse)');
  const [senderFromEmail, setSenderFromEmail] = useState(
    'info@santacruzlocal.org'
  );

  const [linkResults, setLinkResults] = useState<
    { link: string; status: string }[]
  >([]);

  const [linkCheckerEnabled, setLinkCheckerEnabled] = useState(true);

  const cmViewRef = useRef<EditorView | null>(null);
  // Lightweight outline of headings
  type OutlineItem = { level: number; text: string; index: number };
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  // HTML Content & Change Tracking
  const [processedHtml, setProcessedHtml] = useState<string | null>(null);
  const [rawHtml, setRawHtml] = useState<string>('');
  const [finalHtml, setFinalHtml] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // ✅ NEW: Track Search Input
  const textAreaRef = useRef<HTMLTextAreaElement>(null); // ✅ NEW: Ref for Highlighting Search

  // Refs for syncing scroll
  const rawHtmlRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLIFrameElement | null>(null);

  // Save the latest version in case user edits
  const [savedHtml, setSavedHtml] = useState<string>(''); // ✅ Stores the last saved state
  const [savedSubject, setSavedSubject] = useState(subject);
  const [savedPreviewText, setSavedPreviewText] = useState(previewText);
  const [savedCampaignName, setSavedCampaignName] = useState(campaignName);
  const [savedSenderFromName, setSavedSenderFromName] =
    useState(senderFromName);
  const [savedSenderFromEmail, setSavedSenderFromEmail] =
    useState(senderFromEmail);
  const [isSavingFinal, setIsSavingFinal] = useState(false);

  // Menu popup for default insert for signup CTA
  const [showSignupPromptEditor, setShowSignupPromptEditor] = useState(false);

  // Feedback on buttons
  const [testStatus, setTestStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const [showLinkErrors, setShowLinkErrors] = useState(true);

  const [isTestButtonDisabled, setIsTestButtonDisabled] = useState(false);
  const [isSendNowButtonDisabled, setIsSendNowButtonDisabled] = useState(false);
  const [isScheduleButtonDisabled, setIsScheduleButtonDisabled] =
    useState(false);

  const [isNowSending, setIsNowSending] = useState(false);
  const [nowSendMessage, setNowSendMessage] = useState<string | null>(null);

  const [isScheduleSending, setIsScheduleSending] = useState(false);
  const [scheduleSendMessage, setScheduleSendMessage] = useState<string | null>(
    null
  );

  const [signupPromptHtmlContent, setSignupPromptHtmlContent] = useState('');
  const [selectedMessageVariant, setSelectedMessageVariant] =
  useState<MessageVariant>('member');

  const [userEditedSubject, setUserEditedSubject] = useState(false);
  const userEditedSubjectRef = useRef(userEditedSubject);

  const sanitizeFilename = (s: string) =>
    (s || 'newsletter')
      .trim()
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const handleDownloadFinalHtml = async () => {
    if (!finalHtml) return;
    setIsSavingFinal(true);
    try {
      const defaultName = sanitizeFilename(
        campaignName || subject || 'newsletter'
      );
      const res = await window.electron.saveHtmlToDisk({
        html: finalHtml,
        defaultName,
      });
      if (res?.ok) {
        alert(`✅ Saved: ${res.filePath}`);
      } else {
        alert('❌ Failed to save HTML.');
      }
    } finally {
      setIsSavingFinal(false);
    }
  };

  useEffect(() => {
    window.settings.get().then((s) => {
      if (s.linkCheckerEnabled !== undefined) {
        setLinkCheckerEnabled(s.linkCheckerEnabled);
      }
    });
  }, []);

  const toggleLinkChecker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.checked;
    setLinkCheckerEnabled(newVal);
    window.settings.update({ linkCheckerEnabled: newVal });
  };

  // (optional) default to OS preference
  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql) return;
    setDarkMode(mql.matches);
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);

  // Build extensions *based on* dark mode
  const CM_EXT = React.useMemo(
    () =>
      codeViewExtensions({
        tagTeal: '#00a7be', // slight bump for contrast on dark
        styleGray: darkMode ? '#b8c0cc' : '#9aa0a6',
        mcGray: darkMode ? '#c3c9d1' : '#aeb4bb',
        linkLight: darkMode ? '#9cc0ff' : '#6ea8fe',
        linkDark: darkMode ? '#6b93f0' : '#0a58ca',
        nbsp: darkMode ? '#8fd3da' : '#6fb1b8',
      }),
    [darkMode]
  );

  const brightContent = React.useMemo(
    () =>
      syntaxHighlighting(
        HighlightStyle.define([
          // text between tags
          { tag: t.content, color: '#eef2f7' }, // or '#f3f4f6'
        ]),
        { fallback: true }
      ),
    []
  );

  // Add a tiny base theme so editor chrome matches dark mode nicely
  const chromeTheme = React.useMemo(
    () =>
      EditorView.theme(
        darkMode
          ? {
              '&': { backgroundColor: '#0f111a' },

              // ⬅︎ new: make default/plain text near-white on dark
              '.cm-content, .cm-line': { color: '#eef2f7' }, // or '#f3f4f6'

              '.cm-content': { caretColor: '#ffffff' },
              '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection':
                {
                  backgroundColor: '#2a2f45',
                },
              '.cm-gutters': {
                backgroundColor: '#0f111a',
                color: '#8b90a0',
                border: 'none',
              },
            }
          : {
              '&': { backgroundColor: '#ffffff', color: '#111827' },
              '.cm-gutters': {
                backgroundColor: '#ffffff',
                color: '#6b7280',
                border: 'none',
              },
            },
        { dark: darkMode }
      ),
    [darkMode]
  );

  useEffect(() => {
    (async () => {
      const s = await window.settings.get();
      // populate toggles/pattern/brand so the UI knows current defaults
      setAutoCampaignEnabled(s.autoCampaignEnabled ?? true);
      setAutoCampaignPattern(
        s.autoCampaignPattern ?? '{YYYYMMDD} MEMBER newsletter'
      );

      setBrand(s.brand ?? 'Santa Cruz Local');


      // if a specific name was previously saved, keep it
      if (s.campaignName) {
        setCampaignName(s.campaignName);
        setUserEditedCampaign(true); // prevents auto-regeneration from overwriting
      } else if (s.autoCampaignEnabled ?? true) {
        const d = computeDateFromScheduleOrNow(scheduleDate, scheduleTime);
        setCampaignName(buildDefaultCampaignName('MEMBER'));
    
      }
    })();
  }, []); // run once on mount

  useEffect(() => {
    if (!autoCampaignEnabled || userEditedCampaign) return;

    const dateForName = scheduleDate
      ? moment(scheduleDate)
      : getNextSunday();

    // setCampaignName(buildDefaultCampaignName('MEMBER', dateForName));
    setCampaignName(
      buildDefaultCampaignName(
        selectedMessageVariant === 'member' ? 'MEMBER' : 'nonmember',
        dateForName
      )
    );
  }, [scheduleDate, autoCampaignEnabled, userEditedCampaign, selectedMessageVariant]);

  useEffect(() => {
    window.electron.ipcRenderer.on(
      'send-test-email-success',
      (_event, result) => {
        alert(
          `✅ Sent successfully! Campaign ID: ${result.data?.campaign_id || 'N/A'}`
        );
      }
    );

    window.electron.ipcRenderer.on('send-test-email-error', (_event, error) => {
      alert(
        `❌ Failed to send:\n${typeof error.message === 'string' ? error.message : JSON.stringify(error.message)}`
      );
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('send-test-email-success');
      window.electron.ipcRenderer.removeAllListeners('send-test-email-error');
    };
  }, []);

  // // Update local storage whenever the signup prompt content changes
  // useEffect(() => {
  //   localStorage.setItem(
  //     LOCAL_STORAGE_KEY_SIGNUP_PROMPT,
  //     signupPromptHtmlContent
  //   );
  // }, [signupPromptHtmlContent]);

  useEffect(() => {
    const handleCanceled = () => setIsProcessingUpload(false);
    const handleFailed = (msg: string) => {
      setIsProcessingUpload(false);
      alert(`Upload failed: ${msg}`);
    };

    window.electron.onUploadZipCanceled(handleCanceled);
    window.electron.onUploadZipFailed(handleFailed);

    return () => {
      // remove by channel name using the exposed ipcRenderer
      window.electron.ipcRenderer.removeAllListeners('upload-zip-canceled');
      window.electron.ipcRenderer.removeAllListeners('upload-zip-failed');
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.electron.getMessageVariant();
        setSelectedMessageVariant(result.selectedMessageVariant);
        setSignupPromptHtmlContent(result.html);
      } catch {
        // As a last resort, at least don't blank it out
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY_SIGNUP_PROMPT);
        if (cached && cached.trim()) setSignupPromptHtmlContent(cached);
      }
    })();
  }, []);

  useEffect(() => {
    const cb = (html: string) => setSignupPromptHtmlContent(html);
    window.electron.onSignupPromptUpdated(cb);
    return () => window.electron.removeSignupPromptListener();
  }, []);

  // Function to handle welcome message  HTML content changes (e.g., from a textarea)
  const handleSignupPromptContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setSignupPromptHtmlContent(event.target.value);
  };

  const handleSelectedMessageVariantChange = async (
  variant: MessageVariant
) => {
  const result = await window.electron.setSelectedMessageVariant(variant);

  setSelectedMessageVariant(result.selectedMessageVariant);
  setSignupPromptHtmlContent(result.html);

  const dateForName = scheduleDate ? moment(scheduleDate) : getNextSunday();
  const campaignVariant =
    result.selectedMessageVariant === 'member' ? 'MEMBER' : 'nonmember';

  const newName = buildDefaultCampaignName(campaignVariant, dateForName);
  setCampaignName(newName);
  setUserEditedCampaign(false);
  window.settings.update({ campaignName: newName });
};

  // const saveSignupPromptToLocalStorage = async () => {
  //   const html = signupPromptHtmlContent?.trim();
  //   if (!html) {
  //     alert('Tipline content is empty — not saving.');
  //     return;
  //   }
  //   localStorage.setItem(LOCAL_STORAGE_KEY_SIGNUP_PROMPT, html);
  //   await window.electron.setSignupPrompt(html);
  //   alert('Tipline edit saved');
  // };

  const saveSignupPromptToLocalStorage = async () => {
  const html = signupPromptHtmlContent?.trim();
  if (!html) {
    alert('Message content is empty — not saving.');
    return;
  }

  localStorage.setItem(
    `${LOCAL_STORAGE_KEY_SIGNUP_PROMPT}:${selectedMessageVariant}`,
    html
  );

  await window.electron.setMessageHtml({
    variant: selectedMessageVariant,
    html,
  });

  alert(
    `${selectedMessageVariant === 'member' ? 'Member' : 'Nonmember'} message saved`
  );
};

  const resetToDefault = async () => {
    await window.electron.resetSignupPrompt(); // call the new handler
    // UI will update from the 'signup-prompt:updated' event
  };

  const upsertTiplineBeforeSecondH2 = (html: string, tipHtml: string) => {
    const START = '<!--TIPLINE_START-->';
    const END = '<!--TIPLINE_END-->';
    const re = new RegExp(`${START}[\\s\\S]*?${END}`, 'i');

    // If empty, remove existing block (if present) and return
    if (!tipHtml?.trim()) {
      return html.replace(re, '');
    }

    // Replace in-place if found
    if (re.test(html)) {
      return html.replace(re, `${START}${tipHtml}${END}`);
    }

    // Otherwise insert before 2nd <h2> (your rule)
    try {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;

      const h2s = wrapper.querySelectorAll('h2');
      const holder = document.createElement('div');
      holder.innerHTML = `${START}${tipHtml}${END}`;

      if (h2s.length >= 2) {
        h2s[1].parentNode?.insertBefore(holder, h2s[1]);
      } else if (h2s.length === 1) {
        h2s[0].after(holder);
      } else {
        const h3 = wrapper.querySelector('h3');
        if (h3) h3.parentNode?.insertBefore(holder, h3);
        else wrapper.prepend(holder);
      }
      return wrapper.innerHTML;
    } catch {
      let count = 0;
      return html.replace(/<h2\b/gi, (m) =>
        ++count === 2 ? `${START}${tipHtml}${END}${m}` : m
      );
    }
  };

  useEffect(() => {
    const handleProcessed = (
      bodyHtml: string,
      previewTextFromMain: string,
      subjectFromH1: string,
      finalHtmlFromMain: string,
      linkResultsFromMain: { link: string; status: string | number }[]
    ) => {
      // LEFT editor shows the body-only converted html
      setProcessedHtml(bodyHtml);
      setRawHtml(bodyHtml);

      // RIGHT preview shows full template html
      setFinalHtml(finalHtmlFromMain);

      // For sending / downloading we want the FULL html by default
      setSavedHtml(finalHtmlFromMain);

      // preview text + subject defaults
      setPreviewText(previewTextFromMain);
      setSavedPreviewText(previewTextFromMain);

      // if (!userEditedSubject && subjectFromH1) {
      if (!userEditedSubjectRef.current && subjectFromH1) {
        setSubject(subjectFromH1);
        setSavedSubject(subjectFromH1);
      }

      // links
      if (Array.isArray(linkResultsFromMain)) {
        setLinkResults(
          linkResultsFromMain.map(({ link, status }) => ({
            link,
            status: String(status),
          }))
        );
      } else {
        setLinkResults([]);
      }

      setHasUploadedZip(true);
      sessionStorage.setItem('hasUploadedZip', 'true');
      setIsProcessingUpload(false);
      setHasChanges(false);
    };

    // Subscribe…
    const off = window.electron.onHtmlFileProcessed(handleProcessed);
    // …and unsubscribe when the effect re-runs or component unmounts
    return off;
  }, []);

  // useEffect(() => {
  //   if (!processedHtml) return;

  //   const html = emailTemplate
  //     .replace('{{INSERTED_PREVIEW_TEXT}}', previewText || '')
  //     .replace('{{INSERTED_HTML}}', processedHtml);

  //   console.log(
  //     '🧪 Generating finalHtml with processedHtml:',
  //     processedHtml.slice(0, 300)
  //   );
  //   console.log('🧪 Resulting finalHtml (first 300):', html.slice(0, 300));

  //   setFinalHtml(html);
  // }, [
  //   processedHtml,
  //   previewText,
  // ]);

  const checkHasChanges = (
    previewTextVal: string | null = previewText,
    htmlVal: string = rawHtml,
    subjectVal: string = subject,
    campaignNameVal: string = campaignName,
    senderFromNameVal: string = senderFromName,
    senderFromEmailVal: string = senderFromEmail
  ) => {
    setHasChanges(
      previewTextVal !== savedPreviewText ||
        htmlVal !== savedHtml ||
        subjectVal !== savedSubject ||
        campaignNameVal !== savedCampaignName ||
        senderFromNameVal !== savedSenderFromName ||
        senderFromEmailVal !== savedSenderFromEmail
    );
  };

  // ✅ Track Changes in Raw HTML
  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setRawHtml(newHtml);

    // ✅ Compare new HTML with saved HTML to detect changes
    setHasChanges(
      newHtml !== savedHtml ||
        subject !== savedSubject ||
        previewText !== savedPreviewText
    );
  };

  useEffect(() => {
    userEditedSubjectRef.current = userEditedSubject;
  }, [userEditedSubject]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubject = e.target.value;
    setUserEditedSubject(true);
    userEditedSubjectRef.current = true;
    setSubject(newSubject);

    // ✅ Detect changes
    setHasChanges(
      newSubject !== savedSubject ||
        rawHtml !== savedHtml ||
        previewText !== savedPreviewText
    );
  };

  const handlePreviewTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPreviewText = e.target.value;
    setPreviewText(newPreviewText);

    // ✅ Detect changes
    setHasChanges(
      newPreviewText !== savedPreviewText ||
        rawHtml !== savedHtml ||
        subject !== savedSubject
    );
  };

  const handleCampaignNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCampaignName = e.target.value;
    setCampaignName(newCampaignName);
    setUserEditedCampaign(true); // <- user has overridden; stop auto updates
    checkHasChanges(undefined, undefined, undefined, newCampaignName);

    // persist
    window.settings.update({ campaignName: newCampaignName });
  };

  const handleSenderFromNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSenderFromName = e.target.value;
    setSenderFromName(newSenderFromName);
    checkHasChanges(
      undefined,
      undefined,
      undefined,
      undefined,
      newSenderFromName
    );
  };

  const handleSenderFromEmailChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSenderFromEmail = e.target.value;
    setSenderFromEmail(newSenderFromEmail);
    checkHasChanges(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      newSenderFromEmail
    );
  };

  // ✅ Save Changes
  // const handleSaveChanges = () => {
  //   // LEFT editor contains body-only in rawHtml
  //   setProcessedHtml(rawHtml);

  //   // Build a fresh full html and save it
  //   const recomposed = emailTemplate
  //   .replace('{{INSERTED_PREVIEW_TEXT}}', previewText || '')
  //   .replace('{{INSERTED_HTML}}', rawHtml);

  //   setFinalHtml(recomposed);
  //   setSavedHtml(recomposed);

  //   setSavedSubject(subject);
  //   setSavedPreviewText(previewText);
  //   setSavedCampaignName(campaignName);
  //   setSavedSenderFromName(senderFromName);
  //   setSavedSenderFromEmail(senderFromEmail);

  //   setHasChanges(false);
  //   console.log('Changes saved (full HTML refreshed)');
  // };

  const handleSaveChanges = () => {
    // Take the editor body, ensure tipline is present & up-to-date
    const bodyWithTip = upsertTiplineBeforeSecondH2(
      rawHtml,
      signupPromptHtmlContent
    );

    setProcessedHtml(bodyWithTip);

    const recomposed = emailTemplate
      .replace('{{INSERTED_PREVIEW_TEXT}}', previewText || '')
      .replace('{{INSERTED_HTML}}', bodyWithTip);

    setFinalHtml(recomposed);
    setSavedHtml(recomposed);
    setSavedSubject(subject);
    setSavedPreviewText(previewText);
    setSavedCampaignName(campaignName);
    setSavedSenderFromName(senderFromName);
    setSavedSenderFromEmail(senderFromEmail);
    setHasChanges(false);
    console.log('Changes saved (full HTML refreshed)');
  };

  // ✅ Handle Search Functionality
  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    const textArea = textAreaRef.current;
    if (!textArea) return;

    const index = rawHtml.indexOf(searchTerm);
    if (index !== -1) {
      textArea.focus();
      textArea.setSelectionRange(index, index + searchTerm.length);
    } else {
      alert(`"${searchTerm}" not found.`);
    }
  };

  // ✅ Allow "Enter" key to trigger search
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  // Handle Scheduling
  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isScheduleSending) return;

    // ✅ Check for required scheduling inputs
    if (!scheduleDate || !scheduleTime) {
      alert('❌ Please select both a date and a time to schedule the email.');
      return;
    }

    setIsScheduleSending(true);
    setScheduleSendMessage('📅 Scheduling email...');

    // ✅ Safely parse sendTime using time zone

    const payload = {
      title: campaignName,
      messageVariant: selectedMessageVariant,
      subject: subject,
      senderFromEmail: senderFromEmail,
      senderFromName: senderFromName,
      html: savedHtml,
      // sendTime: moment(`${scheduleDate}T${scheduleTime}`)
      //   .tz('America/New_York', true)
      //   .toISOString(),
      sendTime: moment(`${scheduleDate}T${scheduleTime}`).toISOString(),
      isTest: false, // ✅ Send to production list
      previewText: previewText || '',
    };

    console.log('📤 Scheduling email with payload:', payload);

    try {
      if (!window.electron?.sendScheduledEmail) {
        throw new Error('Electron API not available');
      }

      const result = await window.electron.sendScheduledEmail(payload);

      if (result.success) {
        const campaignId = result.data?.campaign_id || 'N/A';
        const reportUrl = `https://us9.admin.mailchimp.com/analytics/reports/overview?id=${campaignId}`;
        const campaignsUrl = 'https://us9.admin.mailchimp.com/campaigns/';
        alert(
          `✅ Email scheduled!\n\nCampaign ID: ${campaignId}\n\n` +
            `See all Campaigns in MailChimp:\n${campaignsUrl}`
        );

        setScheduleSendMessage('✅ Email scheduled successfully!');
        setShowScheduleModal(false); // ✅ close modal on success
      } else {
        const detail =
          result.data?.response?.data?.detail ||
          result.data?.detail ||
          result.message ||
          '❌ Failed to schedule email';

        alert(`❌ Failed to schedule email:\n\n${detail}`);
        setScheduleSendMessage('❌ Failed to schedule email.');
      }
    } catch (error: any) {
      console.error('❌ Error during scheduling:', error);

      const detail =
        error?.response?.data?.detail ||
        error?.data?.detail ||
        error?.message ||
        'Unexpected error';

      alert(`❌ An unexpected error occurred:\n\n${detail}`);
      setScheduleSendMessage('❌ Unexpected error occurred.');
    }

    setIsScheduleSending(false);

    // Optional: disable/enable button for UX pacing
    setIsScheduleButtonDisabled(true);
    setTimeout(() => {
      setIsScheduleButtonDisabled(false);
      setScheduleSendMessage(null);
    }, 5000);
  };

  const handleSendTest = async () => {
    if (isTestButtonDisabled) return;

    setIsTestButtonDisabled(true);
    setTestStatus('loading');
    setTestMessage('📨 Sending test email...');

    if (!finalHtml) {
      alert('❌ Final HTML is not ready yet');
      return;
    }

    const testcampaignName = `[TEST] ${campaignName}`;

    const payload = {
      title: testcampaignName,
      messageVariant: selectedMessageVariant,
      subject: `[TEST] ${subject}`,
      senderFromEmail: senderFromEmail,
      senderFromName: senderFromName,
      html: savedHtml,
      isTest: true,
      previewText: previewText || '',
    };

    console.log('📤 Sending test email with payload:', payload);

    try {
      if (!window.electron?.sendTestEmail) {
        throw new Error('Electron API not available');
      }

      const result = await window.electron.sendTestEmail(payload);

      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message);

        const campaignId = result.data?.campaign_id || 'N/A';

        // const reportUrl = `https://us9.admin.mailchimp.com/analytics/reports/overview?id=${campaignId}`;
        // const campaignsUrl = 'https://us9.admin.mailchimp.com/campaigns/';
        alert(
          `✅ Test email sent!\n\nCampaign ID: ${campaignId}\n\n`
          // `View Campaign Report:\n${reportUrl}\n\n` +
          // `See all Campaigns (better to see sending status):\n${campaignsUrl}`
        );
      } else {
        setTestStatus('error');
        setTestMessage(result.message || '❌ Something went wrong');

        // ✅ Enhanced detail lookup
        const detail =
          result.data?.response?.data?.detail ||
          result.data?.detail ||
          result.message ||
          '❌ Failed to send test email';

        alert(`❌ Failed to send test email:\n\n${detail}`);
      }
    } catch (error: any) {
      console.error('❌ Error sending test email:', error);
      setTestStatus('error');

      const detail =
        error?.response?.data?.detail ||
        error?.data?.detail ||
        error?.message ||
        'Unexpected error';

      setTestMessage('❌ Unexpected error occurred.');
      alert(`❌ An unexpected error occurred.\n\n${detail}`);
    }

    // Reset state after 5 seconds
    setTimeout(() => {
      setTestStatus('idle');
      setTestMessage(null);
      setIsTestButtonDisabled(false);
    }, 5000);
  };

  // Production Send
  const handleSendNow = async () => {
    if (isSendNowButtonDisabled || isNowSending) return;

    setIsNowSending(true);
    setNowSendMessage('📤 Sending email now...');

    if (!finalHtml) {
      alert('❌ Final HTML is not ready yet');
      setIsNowSending(false);
      return;
    }

    const payload = {
      title: campaignName,
      messageVariant: selectedMessageVariant,
      subject: subject,
      senderFromEmail: senderFromEmail,
      senderFromName: senderFromName,
      html: savedHtml,
      isTest: false, // ✅ Send to production list
      previewText: previewText || '',
    };

    console.log('📤 Sending "Now" email with payload:', payload);

    try {
      if (!window.electron?.sendNowEmail) {
        throw new Error('Electron API not available');
      }

      const result = await window.electron.sendNowEmail(payload);

      if (result.success) {
        const campaignId = result.data?.campaign_id || 'N/A';
        setNowSendMessage('✅ Email sent immediately!');

        // const reportUrl = `https://us9.admin.mailchimp.com/analytics/reports/overview?id=${campaignId}`;
        // const campaignsUrl = 'https://us9.admin.mailchimp.com/campaigns/';
        // const campaignDraftUrl = `https://us10.admin.mailchimp.com/campaigns/edit?id=${campaignId}`

        alert(`✅ Draft Created :)\n\nCampaign ID: ${campaignId}\n\n`);

        // alert(
        //   `✅ Email sent immediately!\n\nCampaign ID: ${campaignId}\n\n` +
        //     `View Campaign Report:\n${reportUrl}\n\n` +
        //     `See All Campaigns (better for sending status):\n${campaignsUrl}`
        // );
      } else {
        const detail =
          result.data?.response?.data?.detail ||
          result.data?.detail ||
          result.message ||
          '❌ Failed to send email';

        setNowSendMessage('❌ Failed to send email');
        alert(`❌ Failed to send email:\n\n${detail}`);
      }
    } catch (error: any) {
      console.error('❌ Error sending "Now" email:', error);

      const detail =
        error?.response?.data?.detail ||
        error?.data?.detail ||
        error?.message ||
        'Unexpected error';

      setNowSendMessage('❌ Unexpected error occurred.');
      alert(`❌ An unexpected error occurred.\n\n${detail}`);
    }

    setIsNowSending(false);
  };

  // Decide why the button is disabled (if at all)
  const downloadDisableReason = !hasUploadedZip
    ? 'To download HTML, first upload a ZIP file.'
    : isProcessingUpload
      ? 'Processing uploaded content…'
      : !finalHtml
        ? 'HTML not ready'
        : hasChanges
          ? 'Save changes first so preview & download match'
          : isSavingFinal
            ? 'Saving…'
            : undefined;

  const isDownloadDisabled = Boolean(downloadDisableReason);

  // Styles
  const downloadBaseStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    marginLeft: '15px',
    transition: 'filter 120ms ease, opacity 120ms ease',
  };

  const downloadEnabledStyle: React.CSSProperties = {
    backgroundColor: '#4caf50',
    color: 'white',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
  };

  const downloadDisabledStyle: React.CSSProperties = {
    backgroundColor: '#e6e6e6', // more muted than #ccc
    color: '#8a8a8a',
    border: '1px solid #d7d7d7',
    cursor: 'not-allowed',
    opacity: 0.6,
    filter: 'grayscale(60%) saturate(60%)',
  };

  function buildOutlineFromHtml(src: string): OutlineItem[] {
    const items: OutlineItem[] = [];
    const re = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const level = Number(m[1].slice(1));
      const raw = m[2]
        .replace(/<[^>]+>/g, '') // strip tags
        .replace(/\s+/g, ' ')
        .trim();
      if (raw) items.push({ level, text: raw, index: m.index });
    }
    return items;
  }

  useEffect(() => {
    setOutline(buildOutlineFromHtml(rawHtml));
  }, [rawHtml]);

  // Format HTML in the editor using Prettier
  const formatHtmlInEditor = React.useCallback(async () => {
    try {
      // Dynamically import Prettier and the HTML plugin
      const [{ default: prettier }, htmlMod] = await Promise.all([
        import('prettier/standalone'),
        import('prettier/plugins/html'),
      ]);
      const htmlPlugin = (htmlMod as any).default ?? htmlMod;

      // Preserve selection & scroll so formatting feels seamless
      const view = cmViewRef.current;
      const sel = view?.state.selection;
      const scrollTop = view?.scrollDOM.scrollTop ?? 0;

      const formatted = await prettier.format(rawHtml, {
        parser: 'html',
        plugins: [htmlPlugin],
        printWidth: 100,
        tabWidth: 2,
        useTabs: false,
        htmlWhitespaceSensitivity: 'ignore',
        embeddedLanguageFormatting: 'off',
        singleAttributePerLine: true,
        proseWrap: 'preserve',
        endOfLine: 'lf',
      });
      setRawHtml(formatted);

      // Restore editor selection & scroll after the re-render
      requestAnimationFrame(() => {
        if (view) {
          if (sel) view.dispatch({ selection: sel });
          view.scrollDOM.scrollTop = scrollTop;
        }
      });
    } catch (e) {
      console.error(e);
      alert('Prettier failed to format this HTML. Check console for details.');
    }
  }, [rawHtml]);

  const formatKeymap = React.useMemo(
    () =>
      keymap.of([
        {
          key: 'Mod-Shift-f',
          run: () => {
            formatHtmlInEditor();
            return true;
          },
        },
      ]),
    [formatHtmlInEditor]
  );

  // ── Toolbar button styles (one height to rule them all) ───────────────────────
  const BTN_H = 36; // px

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: BTN_H,
    padding: '0 14px', // unified horizontal padding
    lineHeight: `${BTN_H}px`, // keeps text centered vertically if it wraps to inline
    borderRadius: 5,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'filter 120ms ease, opacity 120ms ease',
    gap: 8, // space between icon + text if you use an icon span
  };

  const btnNeutral: React.CSSProperties = {
    background: '#e6e6e6',
    color: '#111',
  };
  const btnPrimary: React.CSSProperties = {
    background: '#4d63ff',
    color: '#fff',
  };
  const btnSuccess: React.CSSProperties = {
    background: '#28a745',
    color: '#fff',
  };
  const btnWarn: React.CSSProperties = { background: '#ffde97', color: '#444' };

  const btnDisabled: React.CSSProperties = {
    background: '#e6e6e6',
    color: '#8a8a8a',
    cursor: 'not-allowed',
    opacity: 0.6,
    filter: 'grayscale(60%) saturate(60%)',
  };

  // Handy helper
  const merge = (...objs: React.CSSProperties[]) => Object.assign({}, ...objs);

  // Optional: tiny icon wrapper so emojis don’t change height
  const Icon: React.FC<React.PropsWithChildren> = ({ children }) => (
    <span aria-hidden style={{ display: 'inline-block', lineHeight: 1 }}>
      {children}
    </span>
  );

  // ── Footer button styles (a bit shorter than the toolbar)
  const FOOTER_H = 32;

  const btnFooterBase: React.CSSProperties = {
    ...btnBase,
    height: FOOTER_H,
    lineHeight: `${FOOTER_H}px`,
    padding: '0 12px',
    fontSize: 13,
    fontWeight: 600,
  };

  const toggleWrap: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: BTN_H,
    padding: '0 10px',
    color: '#cfd3dc', // subtle label on dark bg
    borderRadius: 5,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap',
  };

  const toggleCheckbox: React.CSSProperties = {
    margin: 0,
    width: 16,
    height: 16,
  };

  return (
    <>
      {/* 🔥 Flash animation keyframes */}
      <style>{`
      @keyframes flash {
        0%, 100% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); transform: scale(1); }
        50%      { box-shadow: 0 0 14px rgba(255, 215, 0, 0.9); transform: scale(1.03); }
      }
    `}</style>
      <div
        style={{
          overflowY: 'auto', // Enable vertical scrolling
          height: '100vh', // Full height of the viewport
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ margin: 20, paddingTop: '0px' }}>
          {/* Row 1: Settings */}
          <div
            style={{
              margin: '10px',
              fontWeight: 'bold',
              fontSize: '1.4em',
              display: 'flex', // Enable flexbox for the container
              flexDirection: 'row', // Align children in a row
              alignItems: 'flex-start', // Align items at the top of the container
              gap: '15px', // Optional: Adds space between each column
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div style={{ flex: 1.7 }}>
                <label
                  style={{
                    fontSize: '0.6em',
                    fontWeight: 'normal',
                    color: '#ffffff',
                    verticalAlign: 'top',
                    paddingLeft: '5px',
                  }}
                >
                  Campaign Name (internal):
                </label>
                <div style={{ marginTop: '4px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '0.55em',
                    fontWeight: 'normal',
                    color: '#ffffff',
                    marginRight: '8px',
                  }}
                >
                  Issue type:
                </span>

                <button
                  type="button"
                  onClick={() => handleSelectedMessageVariantChange('member')}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    marginRight: '6px',
                    cursor: 'pointer',
                    fontWeight: selectedMessageVariant === 'member' ? 'bold' : 'normal',
                    backgroundColor: selectedMessageVariant === 'member' ? '#4d63ff' : '#e6e6e6',
                    color: selectedMessageVariant === 'member' ? '#fff' : '#111',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Member
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectedMessageVariantChange('nonmember')}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    cursor: 'pointer',
                    fontWeight: selectedMessageVariant === 'nonmember' ? 'bold' : 'normal',
                    backgroundColor: selectedMessageVariant === 'nonmember' ? '#4d63ff' : '#e6e6e6',
                    color: selectedMessageVariant === 'nonmember' ? '#fff' : '#111',
                    border: 'none',
                    borderRadius: '4px',
                  }}
                >
                  Nonmember
                </button>
              </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextSunday = getNextSunday();
                    const newName = buildDefaultCampaignName(
                      getCampaignVariantLabel(selectedMessageVariant),
                      nextSunday
                    );
                    setCampaignName(newName);
                    setUserEditedCampaign(false);
                    setSavedCampaignName(newName);
                    window.settings.update({ campaignName: newName });
                  }}
                  style={{
                    marginLeft: '8px',
                    height: '30px',
                    padding: '0 10px',
                    cursor: 'pointer',
                  }}
                >
                  Use next Sunday
                </button>
                <input
                  type="date"
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (!selectedDate) return;

                    const newName = buildDefaultCampaignName(
                      getCampaignVariantLabel(selectedMessageVariant),
                      moment(selectedDate)
                    );
                    setScheduleDate(selectedDate);
                    setCampaignName(newName);
                    setUserEditedCampaign(false);
                    window.settings.update({ campaignName: newName });
                  }}
                  style={{
                    marginLeft: '8px',
                    height: '30px',
                    padding: '0 8px',
                  }}
                />
                <input
                  type="text"
                  value={campaignName}
                  onChange={handleCampaignNameChange}
                  // onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name"
                  style={{
                    width: '85%',
                    backgroundColor: 'lightGray',
                    height: '30px',
                    padding: '5px 10px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1.6 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  {' '}
                  {/* Container for From Name*/}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flex: 1,
                    }}
                  >
                    <label
                      style={{
                        fontSize: '0.6em',
                        fontWeight: 'normal',
                        color: '#ffffff',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      From Name:
                    </label>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={senderFromName}
                        onChange={handleSenderFromNameChange}
                        // onChange={(e) => setSenderFromName(e.target.value)}
                        placeholder="Enter sender's name"
                        style={{
                          width: '100%',
                          height: '30px',
                          padding: '5px 10px',
                          boxSizing: 'border-box',
                          backgroundColor: 'lightGray',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '0.6em',
                      fontWeight: 'normal',
                      color: '#ffffff',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      paddingRight: '3px',
                    }}
                  >
                    From Email:
                  </label>
                  <input
                    type="text"
                    value={senderFromEmail}
                    onChange={handleSenderFromEmailChange}
                    // onChange={(e) => setSenderFromEmail(e.target.value)}
                    placeholder="Enter sender's email"
                    style={{
                      width: '100%',
                      height: '30px',
                      padding: '5px 10px',
                      boxSizing: 'border-box',
                      backgroundColor: 'lightGray',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ flexGrow: 2 }}>
              {/* Column for Subject Line and Preview Text */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                {' '}
                {/* Container for Subject Line */}
                <label
                  style={{
                    fontSize: '0.6em',
                    fontWeight: 'normal',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={handleSubjectChange}
                  placeholder="Enter subject line"
                  style={{
                    flexGrow: 1,
                    width: '100%',
                    height: '30px',
                    padding: '5px 10px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {' '}
                {/* Container for Preview Text */}
                <label
                  style={{
                    fontSize: '0.6em',
                    fontWeight: 'normal',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                  }}
                >
                  Preview Text:
                </label>
                <input
                  type="text"
                  value={previewText || ''}
                  onChange={handlePreviewTextChange}
                  placeholder="Enter preview text"
                  style={{
                    flexGrow: 1,
                    width: '100%',
                    height: '30px',
                    padding: '5px 10px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Placeholder */}

          {/* ── Top toolbar row (one flex row, three children) ─────────────── */}
          <div
            style={{
              padding: '0 10px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            {/* Left cluster */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleSaveChanges}
                disabled={!hasChanges}
                style={merge(btnBase, hasChanges ? btnSuccess : btnDisabled)}
              >
                Save Changes
              </button>

              <button
                onClick={() => {
                  setIsProcessingUpload(true);
                  window.electron.sendReadyToUpload();
                }}
                disabled={isProcessingUpload}
                style={merge(
                  btnBase,
                  isProcessingUpload ? btnDisabled : btnNeutral,
                  shouldFlashUpload
                    ? { animation: 'flash 1.1s ease-in-out infinite' }
                    : {}
                )}
                title={
                  shouldFlashUpload
                    ? 'Start here: upload your Google Docs ZIP'
                    : undefined
                }
              >
                <Icon>📤</Icon> Upload Google Doc ZIP File
              </button>

              <button
                onClick={handleDownloadFinalHtml}
                disabled={isDownloadDisabled}
                title={downloadDisableReason}
                aria-disabled={isDownloadDisabled}
                style={merge(
                  btnBase,
                  isDownloadDisabled ? btnDisabled : btnNeutral
                )}
              >
                <Icon>⬇️</Icon>{' '}
                {isSavingFinal ? 'Saving…' : 'Download Full HTML'}
              </button>
            </div>

            {/* Right cluster (push to the far right) */}
            <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
              <button
                onClick={handleSendTest}
                disabled={hasChanges || testStatus === 'loading'}
                style={merge(
                  btnBase,
                  hasChanges || testStatus === 'loading'
                    ? btnDisabled
                    : btnPrimary
                )}
              >
                {testStatus === 'loading' ? '⏳ Sending...' : 'Send Test'}
              </button>

              {/* <CreateCampaignButton
      isDisabled={hasChanges || isSavingFinal || !finalHtml}
      finalEmailHtml={finalEmailHtml}
      previewText={previewText}
      subjectFromH1={subjectFromH1}
      senderFromName={form.senderFromName}
      senderFromEmail={form.senderFromEmail}
      listId={form.listId}
      campaignName={settings.campaignName}
    /> */}

              <button
                onClick={handleSendNow}
                disabled={hasChanges || isNowSending}
                style={merge(
                  btnBase,
                  hasChanges || isNowSending ? btnDisabled : btnWarn,
                  isNowSending ? { opacity: 0.8 } : {}
                )}
              >
                {isNowSending ? '⏳ Creating Draft...' : 'Create Draft in MC'}
              </button>

              {/* <button
      onClick={handleSchedule}
      disabled={hasChanges}
      style={merge(btnBase, hasChanges ? btnDisabled : btnWarn)}
    >
      Schedule
    </button> */}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div
              style={{
                padding: '10px',
                width: '50%',
                minWidth: '620px',
              }}
            >
              <CodeMirror
                value={rawHtml}
                height="500px"
                theme={darkMode ? oneDark : undefined}
                extensions={[
                  ...CM_EXT,
                  keymap.of([
                    {
                      key: 'Mod-Shift-f',
                      run: () => (formatHtmlInEditor(), true),
                    },
                  ]),
                  ...(darkMode ? [brightContent] : []),
                  chromeTheme,
                ]}
                onCreateEditor={(view) => (cmViewRef.current = view)}
                onChange={(value) => {
                  setRawHtml(value);
                  // keep your existing change tracking logic:
                  setHasChanges(
                    value !== savedHtml ||
                      subject !== savedSubject ||
                      previewText !== savedPreviewText
                  );
                }}
              />

              <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                <label
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  Dark editor
                </label>

                <button
                  onClick={formatHtmlInEditor}
                  style={merge(btnFooterBase, btnNeutral, { marginLeft: 8 })}
                >
                  Format HTML
                </button>

                <button
                  onClick={() => setShowSignupPromptEditor(true)}
                  style={merge(btnFooterBase, {
                    background: '#9d8189',
                    color: '#fff',
                    marginLeft: 8,
                  })}
                >
                  <Icon>✏️</Icon> Edit Non/Member Message
                </button>

                {/* Settings: Enable Link Checker (moved down here) */}
                <label
                  style={{
                    color: '#cfd3dc',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginLeft: 12,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={linkCheckerEnabled}
                    onChange={toggleLinkChecker}
                    style={{ margin: 0 }}
                  />
                  Enable Link Checker
                </label>
              </div>
            </div>

            <div
              style={{
                padding: '10px',
                width: '50%',
                minWidth: '650px',
              }}
            >
              {/* <iframe
                ref={previewRef}
                title="HTML Preview"
                style={{
                  width: '650px',
                  height: '500px',
                  border: '1px solid #ccc',
                  overflowY: 'auto',
                  colorScheme: 'light !important',
                }}
                srcDoc={processedHtml || '<p>Waiting for processed HTML...</p>'} */}
              <iframe
                ref={previewRef}
                title="HTML Preview"
                style={{
                  width: '650px',
                  height: '500px',
                  border: '1px solid #ccc',
                  overflowY: 'auto',
                  colorScheme: 'light !important',
                }}
                srcDoc={finalHtml || '<p>Waiting for Uploaded Document...</p>'}
                onLoad={() => {
                  const previewDoc =
                    previewRef.current?.contentWindow?.document;
                  if (previewDoc) {
                    // Inject a <style> tag to override dark mode in preview only
                    const styleTag = previewDoc.createElement('style');
                    styleTag.innerHTML = `
     /* Force light preview */
  :root { color-scheme: light; }
  body {
    background: #ffffff !important;
    color: #16191E !important;
  }

  /* Base text to match template */
  p, li, ol, ul {
    color: #000000 !important;
    font-family: 'Open Sans', Helvetica, Arial, Lucida, sans-serif !important;
  }

  /* Headings: match your inline styles in the conversion */
  h1, h2, h4, h5 {
    font-family: 'Raleway', Helvetica, Arial, Lucida, sans-serif !important;
  }
  h3 {
    font-family: 'Open Sans', Helvetica, Arial, Lucida, sans-serif !important;
  }
  h6 {
    font-family: 'Open Sans', Helvetica, Arial, Lucida, sans-serif !important;
  }

  /* Specific color tweaks used in your template */
  .olc-t > h3 { color: #4d63ff !important; }
  h2.mh2s, .dmjl { color: #004A8F !important; }

  /* Job/section tables: keep light bg + dark text */
  table.oot,
  table.oot-b,
  table.oot-r,
  table.left_column,
  table.right_column,
  table.otcc,
  table.otc,
  table.otc-img,
  td.olc,
  td.olc-t,
  td.orc-img {
    background-color: #ffffff !important;
    color: #000000 !important;
  }

  /* Captions */
  h5.caption, .caption {
    font-size: 14px !important;
    font-weight: normal !important;
    line-height: 125% !important;
    display: block !important;
    text-align: center !important;
    color: #000000 !important;
  }

  /* Body blocks */
  #bodyTable { background-color: #004A8F; }
  .dbk, .body-copy {
    background-color: #ffffff !important;
    color: #000000 !important;
  }

  /* Links */
  .headerLink { color: #ffffff !important; }
  .shl, .shl h3.jobtitle {
    color: #000000 !important;
    background-color: transparent !important;
    font-weight: 600 !important;
  }
  a.dml { color: #ffffff !important; text-decoration: underline !important; }
  a.dmla { color: #2484C6 !important; }

  /* Your newsletter link color choices in content */
  li a, p a {
    color: #dd623c !important;
    text-decoration: underline !important;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }

  /* Footer tones */
  .footer, .m_oot { background-color: #292a33 !important; }
  .m_olc > p, .fot > p, .ftt > p {
    color: #B3B3B3 !important;
    font-family: Helvetica, Arial, sans-serif !important;
  }
  .fot > p > a { color: #2484C6 !important; }

  /* Ordered lists */
  ol {
    list-style-type: decimal !important;
    margin-left: 1.5em !important;
    padding-left: 0 !important;
  }
  ol li {
    display: list-item !important;
    color: #000000 !important;
    font-family: 'Open Sans', Helvetica, Arial, Lucida, sans-serif !important;
  }

  /* Keep table cell descendants readable in preview */
  td.olc *, td.orc-img *, td.olc-t *, td.right_column *, td.left_column * {
    color: #000000 !important;
    background-color: transparent !important;
  }

  /* Paragraphs that might carry inline styles from source */
  p.sdsn, .sdsn p, .sdsn, p.sdsn[style] { color: #000000 !important; }
                `;
                    previewDoc.head.appendChild(styleTag);

                    // Also disable dark mode media queries inside the iframe
                    const disableDarkModeMeta =
                      previewDoc.createElement('meta');
                    disableDarkModeMeta.name = 'color-scheme';
                    disableDarkModeMeta.content = 'light only';
                    previewDoc.head.prepend(disableDarkModeMeta);
                    previewDoc.head.appendChild(disableDarkModeMeta);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {showScheduleModal && (
        <div
          className="modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '5px',
            }}
          >
            <h3>Schedule Email</h3>
            <div>
              <label>Schedule Date:</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div>
              {/* <label>Schedule Time in EST:</label> */}
              <div
                style={{ marginTop: '10px', fontSize: '12px', color: '#555' }}
              >
                Schedule Time in your current time zone:{' '}
                <strong>
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </strong>
              </div>

              <select
                onChange={(e) => {
                  console.log('🕒 Selected time:', e.target.value);
                  setScheduleTime(e.target.value);
                }}
                value={scheduleTime}
                style={{ marginTop: '10px' }}
              >
                {generateTimeOptions().map((time) => (
                  <option key={time} value={time}>
                    {moment(time, 'HH:mm').format('h:mm A')}
                  </option>
                ))}
              </select>
            </div>
            <div className="button-group">
              {/* <button
                onClick={handleSaveSchedule}
                disabled={isScheduleButtonDisabled}
              >
                Schedule Email
              </button> */}
              <button
                onClick={handleSaveSchedule}
                disabled={isScheduleButtonDisabled || isScheduleSending}
                style={{
                  backgroundColor: isScheduleSending ? '#ccc' : '#d1ffd6',
                  color: '#444',
                  padding: '10px 20px',
                  border: 'none',
                  cursor: isScheduleSending ? 'not-allowed' : 'pointer',
                  borderRadius: '5px',
                }}
              >
                {isScheduleSending ? '📅 Scheduling...' : 'Schedule Email'}
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🔗 Link Validation Errors (Only shown if there are failures) */}
      // 🔗 Link Validation Errors (Only shown if there are failures)
      {showLinkErrors &&
        linkResults.some(({ status }) => Number(status) !== 200) && (
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '10px',
              backgroundColor: '#ffcccc', // Light red background for visibility
              border: '1px solid red',
              marginTop: '10px',
              borderRadius: '5px',
              position: 'relative', // ✅ Needed for positioning the close button
            }}
          >
            <button
              onClick={() => setShowLinkErrors(false)} // ✅ Hide errors when clicked
              style={{
                position: 'absolute',
                top: '5px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: 'black',
              }}
            >
              ✖
            </button>
            <h3 style={{ color: 'red' }}>⚠️ Link Validation Errors</h3>
            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
              {linkResults
                .filter(({ status }) => Number(status) !== 200)
                .map(({ link, status }, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>
                    ❌{' '}
                    <a
                      href={link}
                      onClick={(e) => {
                        e.preventDefault();
                        window.electron.openExternalLink(link);
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'red',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      {link}
                    </a>{' '}
                    (<strong>{status}</strong>)
                  </li>
                ))}
            </ul>
          </div>
        )}
      {showSignupPromptEditor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              width: '90%',
              maxWidth: '800px',
              height: '80%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* <h2>Edit Tipline Section</h2> */}
            <h2>Edit {selectedMessageVariant === 'member' ? 'Member' : 'Nonmember'} Message</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              onClick={() => handleSelectedMessageVariantChange('member')}
              style={{
                fontWeight: selectedMessageVariant === 'member' ? 'bold' : 'normal',
              }}
            >
              Member Message
            </button>
            <button
              onClick={() => handleSelectedMessageVariantChange('nonmember')}
              style={{
                fontWeight: selectedMessageVariant === 'nonmember' ? 'bold' : 'normal',
              }}
            >
              Nonmember Message
            </button>
          </div>
            <textarea
              value={signupPromptHtmlContent}
              onChange={handleSignupPromptContentChange}
              style={{
                flexGrow: 1,
                width: '100%',
                height: '100%',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={saveSignupPromptToLocalStorage}>💾 Save</button>
              <button onClick={resetToDefault}>🔄 Reset</button>
              <button onClick={() => setShowSignupPromptEditor(false)}>
                ❌ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;