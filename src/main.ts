import { app, BrowserWindow, dialog, IpcMainEvent } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';
import emailTemplate from './emailTemplate';
import { ipcMain } from 'electron';
import axios from 'axios';
import FormData from 'form-data';
import type { Element } from 'domhandler';
import Store from 'electron-store';

const store = new Store();

// Example: read the auth token and endpoint
// const authToken = store.get('authToken') as string;
// const uploadEndpoint = store.get('uploadEndpoint') as string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

type AppSettings = {
  campaignName?: string;
  autoCampaignEnabled?: boolean;
  autoCampaignPattern?: string;
  brand?: string;
  signupPromptHtml?: string;
};

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

function loadSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSettings(s: AppSettings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2), 'utf8');
}

let settingsCache: AppSettings = loadSettings();

ipcMain.handle('signup-prompt:get', async () => {
  return settingsCache.signupPromptHtml ?? DEFAULT_SIGNUP_PROMPT_HTML;
});

ipcMain.handle('signup-prompt:set', async (_evt, html: string) => {
  latestSignupPromptHtml = html;
  settingsCache = { ...settingsCache, signupPromptHtml: html };
  saveSettings(settingsCache);
  mainWindow?.webContents.send('signup-prompt:updated', html);
  return { ok: true };
});

ipcMain.handle('settings:get', async () => settingsCache);

ipcMain.handle('settings:update', async (_evt, patch: Partial<AppSettings>) => {
  settingsCache = { ...settingsCache, ...patch };
  saveSettings(settingsCache);
});

ipcMain.handle('save-html-to-disk', async (_evt, { html, defaultName }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save final HTML',
    defaultPath: `${(defaultName || 'newsletter').replace(/\s+/g, '_')}.html`,
    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
  });

  if (canceled || !filePath) return { ok: false, canceled: true };

  await fs.promises.writeFile(filePath, html, 'utf8');
  return { ok: true, filePath };
});



let mainWindow: BrowserWindow | null = null; // Declare mainWindow in a higher scope
let latestSignupPromptHtml: string | null = null;

const DEFAULT_SIGNUP_PROMPT_HTML = `<p style="font-size: 8px;line-height: 150%;color: #202020;">&nbsp;</p><table role="presentation" style="width: 100%;max-width: 620px;margin: 0 auto;border-radius: 5px;background-color: #FDf9ED;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;" cellspacing="0" cellpadding="10" align="center" width="100%" class="mobile-table" bgcolor="#FDf9ED"><tbody><tr><td align="center" valign="top" style="padding: 25px 20px 10px 20px;font-size: 36px;line-height: 125%;color: #0093ac;font-weight: normal;font-family: 'Raleway',Helvetica,Arial,Lucida,sans-serif;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;"><center>Tipline</center></td></tr><tr><td align="center" valign="top" style="padding: 0px 15px 25px 15px;color: #202020;font-weight: normal;line-height: 150%;font-size: 18px;font-family: 'Open Sans',Helvetica,Arial,Lucida,sans-serif;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;"><center>Got a confidential news tip? Drop us a line <a href="https://forms.gle/5eDFy7kJwa62H9KMA" target="_blank" style="color: #dd623c;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;text-decoration: underline;">here</a>.</center></td></tr></tbody></table><p style="font-size: 4px;line-height: 150%;">&nbsp;</p>`;


// Function to create the main application window
const createWindow = () => {
  // Create the browser window.
  console.log('Creating main window...');
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minHeight: 500,
    minWidth: 800,
    maximizable: true,
    minimizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Disable node integration for security. Do not change to true unless you are OK with security risks.
      contextIsolation: true, // Prevent direct access to Node.js APIs from rendered processes
    },
  });

  mainWindow.webContents.session.clearCache();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log('Main window created. Loading HTML...');
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }


  // Open the DevTools detached from the window
  console.log('🔍 Attempting to open DevTools...');
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  // Use on (not once) if you want the file upload to be triggerable multiple times (e.g., for “Re-Upload ZIP”).
  ipcMain.on('ready-to-upload', async () => {
    console.log(
      '📥 Renderer signaled ready-to-upload. Starting file upload...'
    );
    await handleFileUpload();
  });



  // Handle window close event
  mainWindow.on('closed', () => {
    mainWindow = null; // Allow garbage collection to free memory
  });
};

// ✅ Handle ZIP File Upload and Extract HTML
async function handleFileUpload() {
  console.log('Handling file upload...');
  if (!mainWindow) {
    console.log('Main window is not available.');
    return;
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Upload your ZIP folder from Google Docs',
    message: `To download from Google Docs: Go to File > Download > Web Page (.html, zipped).`,
    properties: ['openFile'],
    filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
  });

  if (result.canceled || !result.filePaths.length) {
    console.log('File selection canceled.');
    mainWindow?.webContents.send('upload-zip-canceled');
    return;
  }

  console.log('ZIP file selected:', result.filePaths[0]);
  const zipFilePath = result.filePaths[0];
  console.log('ZIP file selected:', zipFilePath);

  try {
    // Extract ZIP contents
    const tempExtractPath = path.join(
      app.getPath('temp'),
      `extracted_${Date.now()}`
    );
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(tempExtractPath, true);
    console.log('Extracted to:', tempExtractPath);

    // Find the HTML file
    const files = fs.readdirSync(tempExtractPath);
    console.log('📂 Extracted files:', files); // 🔍 Add this log here

    const imageFolderPath = path.join(tempExtractPath, 'images');
    const imageFiles = fs.existsSync(imageFolderPath)
      ? fs
          .readdirSync(imageFolderPath)
          .filter((file) => /\.(jpe?g|png)$/i.test(file))
      : [];

    console.log('🖼️ Found images:', imageFiles);

    const uploadedImages = await Promise.all(
      imageFiles.map(async (file) => {
        console.log(`🔍 Processing image: ${file}`);

        const originalPath = path.join(imageFolderPath, file);
        if (!fs.existsSync(originalPath)) {
          console.error(`❌ File does not exist: ${originalPath}`);
          return null;
        }

        // ✅ Rename the image before uploading
        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, '-')
          .split('.')[0];
        const newFileName = `${file.split('.')[0]}_${timestamp}.${file.split('.').pop()}`;
        const newPath = path.join(imageFolderPath, newFileName);

        try {
          fs.renameSync(originalPath, newPath);
          console.log(`🔄 Renamed ${file} ➝ ${newFileName}`);
        } catch (error) {
          console.error(`❌ Rename failed for ${originalPath}:`, error);
          return null;
        }

        console.log(`📤 Uploading image: ${newPath}`);
        const url = await uploadImageToS3(newPath);

        if (!url) {
          console.error(`❌ Upload failed for: ${newPath}`);
          return null;
        }

        return { originalFile: file, newFile: newFileName, url };
      })
    ).then((results) => results.filter((image) => image !== null));

    console.log(`✅ Uploaded images:`, uploadedImages);


    // Process the html file and read the content
    const htmlFile = files.find((file) => file.endsWith('.html'));

    if (htmlFile) {
      const htmlFilePath = path.join(tempExtractPath, htmlFile);
      console.log('✅ HTML File Found:', htmlFilePath);

      // preserve original
      let rawHtmlContent = fs.readFileSync(htmlFilePath, 'utf8');

      console.log(
        '✅ Raw HTML contains Cyberhaven link:',
        rawHtmlContent.includes('cyberhaven.com/blog')
      );
      let htmlContent = rawHtmlContent; // use a mutable copy

    
      const $ = cheerio.load(htmlContent);
     
      // ✅ First extract the DESCRIPTION paragraph cleanly before removing it
      const paragraphs = $('p');
      let foundDescriptionParagraph = '';

      // ✅ Extract description
      paragraphs.each((_, p) => {
        const text = $(p).text().trim();

        if (text.startsWith('DESCRIPTION:')) {
          // let rawHtml = $(p).html()?.trim() || '';
          // const $desc = cheerio.load(`<div>${rawHtml}</div>`);

          // let rawHtml = $(p).html()?.trim() || '';

          // Remove "DESCRIPTION:" from beginning of raw HTML string
          // rawHtml = rawHtml.replace(/^DESCRIPTION:\s*/i, '');

          // Now load it into Cheerio for further processing
          // const $desc = cheerio.load(`<div>${rawHtml}</div>`);

          let fullText = $(p).text().trim();
          if (fullText.toUpperCase().startsWith('DESCRIPTION:')) {
            fullText = fullText.replace(/^DESCRIPTION:\s*/i, '');
          }
          const $desc = cheerio.load(`<div>${fullText}</div>`);

          $desc('sup a[href^="#cmnt"]').closest('sup').remove();
          $desc('span').each((_, el) => {
            const $el = $desc(el);
            if ($el.text().trim() === 'DESCRIPTION:') {
              $el.remove();
            }
          });
          $desc('span').each((_, el) => {
            const $el = $desc(el);
            $el.replaceWith($el.html() || '');
          });
          $desc('a[href^="https://www.google.com/url?q="]').each((_, el) => {
            const $link = $desc(el);
            const rawHref = $link.attr('href') || '';
            const match = rawHref.match(/q=([^&]+)/);
            if (match && match[1]) {
              const cleanUrl = decodeURIComponent(match[1]);
              $link.attr('href', cleanUrl);
            }
          });


        }
      });


      htmlContent = $.html();

      // 🔄 Replace image paths with uploaded URLs
      uploadedImages.forEach(({ originalFile, url }) => {
        htmlContent = htmlContent.replace(
          new RegExp(`images/${originalFile}`, 'g'),
          url
        );
      });

      console.log('✅ Image URLs replaced in HTML');

      // console.log('Before replacement, emailTemplate:', emailTemplate);


  

      // Now process via Cheerio
      const { processedHTML, previewText, subjectFromH1, linkResults } =
        await processAndValidateHtml(htmlContent);

      const previewTextLimited =
        previewText.split(' ').slice(0, 15).join(' ') + '...';

      console.log('✅ Processed HTML generated.');
    

      const finalEmailHtml = emailTemplate
        .replace('{{INSERTED_PREVIEW_TEXT}}', previewTextLimited)
        .replace('{{INSERTED_HTML}}', processedHTML);
       
      // console.log('📧 Final finalEmailHtml content preview (500 chars):');
      // console.log(finalEmailHtml.slice(0, 500));

  

      const finalHtmlPath = path.join(tempExtractPath, 'final_email.html');
      fs.writeFileSync(finalHtmlPath, finalEmailHtml, 'utf8');

      
      const $raw = cheerio.load(processedHTML);
      const rawBodyHtml =
        $raw('body').html()?.trim() || processedHTML;

      // ✅ Send finalEmailHtml (with all {{}} replacements) to renderer
      mainWindow?.webContents.send(
          'html-file-processed',
          processedHTML,        // ← body-only (left editor)
          previewText,          // ← full preview text (unlimited)
          subjectFromH1,        // ← default subject
          finalEmailHtml,       // ← FULL html w/ template (right iframe)
          linkResults           // ← link check results
        );
    } else {
      console.log('❌ No HTML file found in ZIP.');
    }
  } catch (error) {
    console.error('❌ Error extracting ZIP:', error);
    mainWindow?.webContents.send('upload-zip-failed', String(error));
  }
}

function extractClassMappings(htmlContent: string) {
  const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (!styleMatch) {
    console.warn('No style section found.');
    return {};
  }

  const styleContent = styleMatch[1];
  const classMappings: Record<string, string[]> = {};

  // Find class definitions (e.g., .c8 { font-style: italic; })
  const classRegex = /\.(c\d+)\s*{([^}]+)}/g;
  let match;

  while ((match = classRegex.exec(styleContent)) !== null) {
    const className = match[1]; // e.g., "c8"
    const properties = match[2].toLowerCase(); // CSS properties

    classMappings[className] = [];

    if (properties.includes('font-style:italic')) {
      classMappings[className].push('italic');
    }
    if (properties.includes('font-weight:700')) {
      classMappings[className].push('bold');
    }
    if (properties.includes('text-decoration:underline')) {
      classMappings[className].push('underline');
    }
  }

  return classMappings;
}

interface ApiResponse {
  publicUrl: string;
}

// BELOW IS THE LATEST FUNCITON TO USE
async function uploadImageToS3(
  imagePath: string,
  retries = 3
): Promise<string | null> {
  console.log(`📡 Uploading image: ${imagePath}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      const response = await axios.post<ApiResponse[]>(
        'https://hd1b1k93od.execute-api.us-east-1.amazonaws.com/uploads',
        formData,
        {
          headers: { ...formData.getHeaders() },
          timeout: 30000, // Increase timeout to 30s
        }
      );

      if (response.data?.length > 0 && response.data[0]?.publicUrl) {
        console.log(
          `✅ Image uploaded successfully: ${response.data[0].publicUrl}`
        );
        return response.data[0].publicUrl;
      } else {
        console.error(
          `❌ Unexpected API Response (Attempt ${attempt}):`,
          response.data
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          `❌ Upload error (Attempt ${attempt}): ${error.code} - ${error.message}`
        );
      } else {
        console.error(`❌ Unknown error (Attempt ${attempt}):`, error);
      }

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff (2s, 4s, 8s)
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`🚨 Upload failed after ${retries} attempts: ${imagePath}`);
  return null;
}

/* Google Docs exports text formatting via CSS classes, not inline tags like <b>, <em>, etc.
This function translates those classes into semantic HTML tags — which is better for email clients (like Mailchimp) and easier to style consistently.
*/

function cleanGoogleRedirect(href: string): string {
  try {
    const url = new URL(href);
    const realUrl = url.searchParams.get('q');
    return realUrl || href;
  } catch {
    return href;
  }
}

function processFormatting(
  $: cheerio.CheerioAPI,
  classMappings: Record<string, string[]>
) {
  $('span').each((_, el) => {
    const $el = $(el);
    const classAttr = $el.attr('class');
    if (!classAttr) return;

    const classList = classAttr.split(' ');
    let content = $el.html() || '';
    const originalText = content;
    let tagsApplied: string[] = [];

    // Apply formatting based on class mappings
    if (classList.some((cls) => classMappings[cls]?.includes('bold'))) {
      content = `<b>${content}</b>`;
      tagsApplied.push('bold');
    }
    if (classList.some((cls) => classMappings[cls]?.includes('italic'))) {
      content = `<em>${content}</em>`;
      tagsApplied.push('italic');
    }
    if (classList.some((cls) => classMappings[cls]?.includes('underline'))) {
      content = `<u>${content}</u>`;
      tagsApplied.push('underline');
    }

    let trailingSpace = '';

    // ✅ Handle next text node
    const nextNode = el.nextSibling;
    if (
      nextNode &&
      nextNode.type === 'text' &&
      'data' in nextNode &&
      typeof nextNode.data === 'string'
    ) {
      const match = nextNode.data.match(/^(\s+)/);
      if (match) {
        trailingSpace = match[1] === '\u00A0' ? '&nbsp;' : match[1];
        console.log(
          '→ Found trailing space in text node:',
          JSON.stringify(trailingSpace)
        );
        nextNode.data = nextNode.data.slice(trailingSpace.length);
      } else {
        console.log(
          '→ No leading space in next text node:',
          JSON.stringify(nextNode.data)
        );
      }
    }

    // ✅ Handle next <span> node that contains only a space or &nbsp;
    else if (nextNode && nextNode.type === 'tag' && nextNode.name === 'span') {
      const $next = $(nextNode);
      const nextHtml = $next.html()?.trim();
      if (nextHtml === '&nbsp;' || nextHtml === '\u00A0' || nextHtml === ' ') {
        trailingSpace = '&nbsp;';
        $next.remove();
        console.log(
          '→ Found trailing space in next <span> tag, removing sibling and keeping space.'
        );
      }
    } else {
      console.log('→ No valid next node for trailing space.');
    }

    const newHtml = content + trailingSpace;
    console.log('→ Replacing span with:', JSON.stringify(newHtml));
    console.log('→ Tags applied:', tagsApplied.join(', ') || 'none');
    console.log('→ Original innerHTML:', JSON.stringify(originalText));

    $el.replaceWith($.parseHTML(newHtml));
  });
}

function cleanEmptyBoldTags($: cheerio.CheerioAPI) {
  $('b').each((_, element) => {
    const $element = $(element);
    if ($element.text().trim() === '') {
      $element.remove(); // Remove the <b> tag if it's empty
    }
  });
}

function updateImageStyles($: cheerio.CheerioAPI) {
  $('img').each((_, el) => {
    // Maniupulate the image element

    // scrub title attribute on images
    const $img = $(el);
    $img.removeAttr('title');

    //Scrub title on links too 
    $('a[title]').removeAttr('title');

    // ✅ Remove the existing "style" attribute
    $img.removeAttr('style');

    // ✅ Set the new style attribute
    $img.attr(
      'style',
      `margin: 0; padding: 0;margin: 0;width:100%;padding: 0;max-width:640px;height: auto !important;`
    );
    $img.attr('class', 'edit-img');

    // ✅ Set the width attribute explicitly
    // $img.attr('width', '600');

    // ✅ Add alt="###" if alt is empty or missing
    const currentAlt = $img.attr('alt');
    if (!currentAlt || currentAlt.trim() === '') {
      $img.attr('alt', '###');
    }

    // ✅ Check if the image is already inside a <center> tag
    if ($img.parent().is('center')) {
      return; // Skip wrapping if already inside a <center>
    }

    // ✅ Wrap image inside a <center> tag
    $img.wrap('<center></center>');
  });

  console.log('✅ Image styles updated!');
}



// ✅ Function to Modify HTML Using Cheerio
async function modifyHtml(incomingHtmlContent: string) {
  const classMappings = extractClassMappings(incomingHtmlContent);
  const $ = cheerio.load(incomingHtmlContent);

  $('img[title]').removeAttr('title');

  // Normalization function for text comparison of Hot Job 
  const norm = (s: string) =>
    s.replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[.:–—-]+$/g, '');

  $('head').remove(); // Remove <head> tag


  $('p').each((index, el) => {
    const $p = $(el);
    const tagChildren = $p.contents().filter((_, node) => node.type === 'tag');

    console.log(`🔍 <p> index ${index} preview:`, $.html($p).slice(0, 80));
    console.log(`🔍 Tag child count: ${tagChildren.length}`);

    if (tagChildren.length === 1) {
      const firstTag = tagChildren[0] as Element; // Use Element from domhandler
      if ('name' in firstTag) {
        console.log(`🔍 First tag name: <${firstTag.name}>`);

        if (firstTag.name === 'span') {
          const $span = $(firstTag);
          const spanTagChildren = $span
            .contents()
            .filter((_, node) => node.type === 'tag');

          console.log(`🔍 Descendant tags:`);
          spanTagChildren.each((i, node) => {
            if ('name' in node) {
              console.log(`   ${i + 1}: <${(node as Element).name}>`);
            }
          });

          if (
            spanTagChildren.length === 1 &&
            'name' in spanTagChildren[0] &&
            (spanTagChildren[0] as Element).name === 'img'
          ) {
            console.log(
              `✅ Unwrapping <p><span><img></span></p> at index ${index}`
            );
            $p.replaceWith($span);
          }
        }
      }
    }
  });

  // Setting width and adding inline styles to each image tag
  $('img').each(function () {
    $(this).attr('width', '100%'); // Set width attribute
    $(this).css('max-width', '600px'); // Add CSS for responsive images
    $(this).css('height', 'auto'); // Maintain aspect ratio
    $(this).css('text-decoration', 'none');
    $(this).css('padding-bottom', '10px');
    $(this).css('margin-bottom', '10px');
    $(this).css('display', 'block');
    $(this).css('outline', 'none');
    $(this).css('padding-top', '15px');
    $(this).css('margin-top', '15px');
    $(this).css('font-size', '18px');
    $(this).css('font-family', 'helvetica, sans-serif');
    $(this).css('font-weight', '700');
  });

  // Set width attribute on all <img> tags
  // $('img').each((_, img) => {
  //   $(img).attr('width', '600'); // Set width attribute to "600"
  // });

  // Apply formatting dynamically based on extracted styles
  processFormatting($, classMappings);

  // ✅ Update image styles
  updateImageStyles($);

  cleanEmptyBoldTags($);

  // ✅ Remove all <div> elements and their contents
  // This is footer links producted by document comments
  $('div').remove();

  // ✅ Remove all remaining <span> tags while keeping their content
  $('span').each((_, el) => {
    const content = $(el).html() || '';
    $(el).replaceWith(content);
  });

  $('p:empty').remove(); // Remove empty paragraphs

  // ✅ Remove comment references like <sup><a href="#cmnt1">[a]</a></sup>
  $('sup a[href^="#cmnt"]').closest('sup').remove();

  $('a').each((index, el) => {
    const $el = $(el);
    const href = $el.attr('href');

    if (href && href.startsWith('https://www.google.com/url?q=')) {
      const cleanUrl = cleanGoogleRedirect(href);
      console.log(
        `🔗 Cleaning redirect link:\n  From: ${href}\n  To:   ${cleanUrl}`
      );
      $el.attr('href', cleanUrl);
    }
  });

  $('*').removeAttr('class'); // Remove all classes
  $('*').removeAttr('id'); // Remove all IDs
  $('*').removeAttr('start'); // Remove start attributes

  // 🧹 Remove empty/near-empty headings (h2–h6)
(() => {
  let removed = 0;

  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    const $el = $(el);

    // Text, normalized (treat &nbsp; as space)
    const text = $el
      .text()
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Raw inner HTML to detect "only breaks/&nbsp;"
    const html = ($el.html() || '').trim();

    const onlyBreaks = html === '' || /^(\s|&nbsp;|<br\s*\/?>)*$/i.test(html);

    // Treat lone punctuation/markers as “empty” too (e.g. a stray pipe or dash)
    const onlyPunct = text.length > 0 && /^[\|•·\-\u2013\u2014_.,:;]+$/u.test(text);

    if (text === '' || onlyBreaks || onlyPunct) {
      $el.remove();
      removed++;
    }
  });

  if (removed) {
    console.log(`🧹 Removed ${removed} empty headings (h1–h6).`);
  }
})();



// $('img').removeAttr('style'); Remove inline styles from images



// Add class to images
$('img').addClass('edit-img');


// Add headline style to h1  
  $('h1').each((index, el) => {
    const $el = $(el);
    $el.attr(
      'style',
      `margin-bottom: 0px;padding: 10px 15px 5px 10px;text-align: center;font-family: 'Raleway',Helvetica,Arial,Lucida,sans-serif;font-size: 32px;line-height: 125%;color: #202020;font-weight: bold;display: block;margin: 0;`
    );
    $el.attr('mc:edit', `mainheader${index + 1}`);
  });

// Before H2 styles insert tipline (signup prompt)
const signupPromptHtml = latestSignupPromptHtml || DEFAULT_SIGNUP_PROMPT_HTML;

// Add markers around the tipline for easy identification later if needed
const TIPLINE_START = '<!--TIPLINE_START-->';
const TIPLINE_END   = '<!--TIPLINE_END-->';
const wrappedTipline = `${TIPLINE_START}${signupPromptHtml}${TIPLINE_END}`;

// Insert the signup prompt right above the H2 that reads "Hot jobs"
const $hotJobsH2 = $('h2')
  .filter((_, el) => norm($(el).text()) === 'hot jobs')
  .first();

if ($hotJobsH2.length) {
  $hotJobsH2.before(wrappedTipline);
} else {
  const $h2s = $('h2');

  if ($h2s.length >= 2) {
    // before the second <h2>
    $h2s.eq(1).before(wrappedTipline);
  } else if ($h2s.length === 1) {
    // fallback: after the only <h2> (effectively “between” h2 and the rest)
    $h2s.eq(0).after(wrappedTipline);
  } else {
    // no <h2> at all → fallback to before first <h3> or top of body
    const $firstH3 = $('h3').first();
    if ($firstH3.length) $firstH3.before(signupPromptHtml);
    else $('body').prepend(signupPromptHtml);
  }
}


// Add section style to h2  
  $('h2').each((index, el) => {
    const $el = $(el);

    // Set h2 inline styles
    $el.attr(
      'style',
      `display: block;padding: 25px 0px 15px 0px;font-size: 36px;line-height: 125%;color: #0093ac;font-weight: normal;font-family: 'Raleway',Helvetica,Arial,Lucida,sans-serif;margin: 0;`
    );

    // Insert spacer paragraph before the h2
    $el.before(
      '<p style="border: 1px solid #efefef;font-size: 0px;line-height: 0px;color: #202020;">&nbsp;</p>'
    );
    $el.attr('mc:edit', `secth2${index + 1}`);
  });

// Last h2 is orange
const finalH2Style =
  "padding: 25px 0px 15px 0px;display: block;text-align: left;text-transform: uppercase;text-decoration: none;font-weight: bold;font-size: 26px;color: #dd623c;font-family: 'Raleway',Helvetica,Arial,Lucida,sans-serif;margin: 0;padding-top: 25px;";

const $lastH2 = $('h2').last();
$lastH2
  .addClass('final')             
  .attr('style', finalH2Style);


// Add subhead style to h3
  $('h3').each((index, el) => {
    const $el = $(el);
    $el.attr(
      'style',
      `margin-top: 2px;display: block;text-align: center;font-family: 'Open Sans',Helvetica,Arial,Lucida,sans-serif;font-size: 22px;line-height: 125%;padding: 2px 15px 10px 15px;margin-bottom: 7px;color: #202020;font-weight: normal;margin: 0;`
    );
    $el.attr('mc:edit', `sub${index + 1}`);
  });

  // Add caption style to h4
  $('h4').each((index, el) => {
    const $el = $(el);
    $el.attr(
      'style',
      `font-weight: 400;color: #7E8498;font-family: 'Raleway',Helvetica,Arial,Lucida,sans-serif;font-size: 14px;line-height: 17px;display: block;padding-top: 3px;margin-top: 3px;text-align: right;padding-bottom: 10px;margin-bottom: 0px;`
    );
    $el.attr('mc:edit', `cap${index + 1}`);
  });

  // stat of the month blue box inside h5
  $('h5').each((index, el) => {
    const $h5 = $(el);
    $h5
      .addClass('cme')
      .attr(
        'style',
        'color: #ffffff;background-color: #0093ac;display: inline-block;padding: 20px 20px;font-size: 36px;line-height: 100%;margin-top: 10px;margin-bottom: 10px;margin: 0;'
      )
      .attr('mc:edit', `h5cme${index + 1}`);

    // Wrap in <center> (avoid double-wrapping)
    if (($h5.parent()[0]?.tagName || '').toLowerCase() !== 'center') {
      $h5.wrap('<center></center>');
    }
  });

// Paragraph text style
  $('p').each((index, el) => {
    const $el = $(el);
    $el.attr(
      'style',
      `font-size: 18px;line-height: 150%;color: #202020;`
    );
    $el.attr('mc:edit', `paragr${index + 1}`);
  });


$('li').each((index, el) => {
  const $el = $(el);
  $el.attr(
    'style',
    `line-height: 150%; font-size: 18px; font-family: 'Open Sans',Helvetica,Arial,Lucida,sans-serif;`
  );
  $el.attr('mc:edit', `listel${index + 1}`);
});

// List link style
  $('li a').each((_, el) => {
    const $el = $(el);
    $el.attr('style', 'text-decoration: underline;color: #dd623c;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;');
  });

  // Caption link style
  $('h4 a').each((_, el) => {
    const $el = $(el);
    $el.attr('style', 'text-decoration: underline;color: #dd623c;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;');
  });



// Convert <h6>...[<a href="...">Text</a>]...</h6> into styled CTA using that href
$('h6').each((_, el) => {
  const $old = $(el);

  // Use the first anchor inside the h6; if none, do nothing
  const $origA = $old.find('a[href]').first();
  if (!$origA.length) return;

  const href = $origA.attr('href')!;
  const text = $origA.text().trim() || $old.text().trim();

  // Build new <h6>
  const $newH6 = $('<h6></h6>');
  $newH6.attr(
    'style',
    'display: block;text-align: center;padding-top: 8px;margin-top: 8px;margin: 0;padding: 0;'
  );

  // Build new <a>
  const $newA = $('<a></a>');
  $newA.attr('href', href);
  $newA.attr(
    'style',
    'background-color: #dd623c;border-radius: 2px;color: #ffffff;text-decoration: none;padding: 10px;font-size: 18px;background: #dd623c;border: 5px solid  #dd623c;border-color: #dd623c;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;'
  );
  $newA.attr('target', $origA.attr('target') || '_blank');
  if ($origA.attr('rel')) $newA.attr('rel', $origA.attr('rel')!);

  // Underlined text (avoid innerHTML; keep it safe)
  const $u = $('<u></u>').text(text);
  $newA.append($u);

  $newH6.append($newA);
  $old.replaceWith($newH6);
});

// ----- Insert a snippet above every <h2> -----
const H2_SNIPPET_HTML = `<p data-h2-snippet="1" style="border: 1px solid #efefef;font-size:0;line-height:0;color:#202020;">&nbsp;</p>`;

// If you need to skip the last orange h2, switch to: $('h2').not('.final').each(...)
$('h2').each((_, el) => {
  const $h2 = $(el);

  // avoid duplicates if processing runs twice
  const hasSnippetAlready =
    $h2.prev().is('[data-h2-snippet]') ||
    $h2.prevAll('[data-h2-snippet]').first().next()[0] === el; // nearest previous is the snippet

  if (!hasSnippetAlready) {
    $h2.before(H2_SNIPPET_HTML);
  }
});
// ----------------------------------------------




  let previewText = $('p').first().text().trim();
  let subjectFromH1: string =
  $('h1')
    .first()
    .text()
    .replace(/\u00A0/g, ' ')   // turn NBSP into space
    .replace(/\s+/g, ' ')      // collapse whitespace
    .trim() || '';             // fallback to empty string
  const words = previewText.split(/\s+/).slice(0, 15);
  previewText = words.join(' ') + (words.length >= 15 ? '...' : '');

  // process links inside paragraphs
  $('p a').each(function (this: any) {
    const $this = $(this);
    $this.attr(
      'style',
      `color:#dd623c;
      text-decoration: underline;
      -webkit-text-size-adjust:100%
			-ms-text-size-adjust:100%;
     `
    );
    $this.attr('target', '_blank');
  });

  // ✅ Ensure links wrapping images have no styling
  $('a:has(img)').each((_, el) => {
    const $link = $(el);

    // Ensure the <a> tag explicitly removes styles
    $link.attr(
      'style',
      'border: none; text-decoration: none; outline: none; display: inline-block;'
    );

    // Also ensure images inside links have no border or outline
    $link
      .find('img')
      .attr('style', 'border: none; outline: none; display: block;');
  });

  $('a:has(img)').css('text-decoration', 'none');

  // ✅ Ensure all links open in a new tab
  $('a').each((_, el) => {
    const $el = $(el);
    const target = $el.attr('target');

    // Only set if not already explicitly defined
    if (target !== '_blank') {
      $el.attr('target', '_blank');
    }
  });

 
  // Final steps
  const FinalHtmlContent = $('html').contents();
  $.root().empty().append(FinalHtmlContent);
  const bodyContent = $('body').contents();
  $('body').replaceWith(bodyContent);

  return { html: $.html(), previewText, subjectFromH1 };
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);
// Log when Electron app is ready
app.on('ready', () => {
  console.log('Electron app is ready.');
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Function to check if links are valid
async function validateLinks(htmlContent: string) {
  const $ = cheerio.load(htmlContent);

  const links: string[] = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (
      href &&
      !href.startsWith('#cmnt') && // Ignore Google comment links
      !href.startsWith('mailto:') // Ignore mailto links
    ) {
      links.push(href);
    }
  });

  if (links.length === 0) {
    return [];
  }

  console.log(`🔗 Checking ${links.length} links...`);

  const linkStatus = await Promise.all(
    links.map(async (link) => {
      try {
        const response = await axios.get(link, {
          timeout: 5000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
          },
        });
        return { link, status: response.status };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return { link, status: error.response.status };
        } else {
          return { link, status: '❌ Network Error' };
        }
      }
    })
  );

  console.log(`✅ Link check completed:`, linkStatus);

  // ✅ Filter out LinkedIn 999 errors
  const failedLinks = linkStatus.filter((result) => {
    const isLinkedIn = result.link.includes('linkedin.com');
    return result.status !== 200 && !(isLinkedIn && result.status === 999);
  });

  if (failedLinks.length > 0 && mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Broken Links Detected',
      message: `Some links failed to resolve:\n\n${failedLinks
        .map((l) => `${l.status} - ${l.link}`)
        .join('\n')}`,
      buttons: ['OK'],
    });
  }

  return linkStatus;
}

// ✅ Run the link checker after modifying HTML

// REPLACE your current processAndValidateHtml with this
async function processAndValidateHtml(htmlContent: string) {
  const { html: processedHTML, previewText, subjectFromH1 } = await modifyHtml(htmlContent);

  // ✅ Validate links
  const linkResults = await validateLinks(processedHTML);

  // ✅ Just return (don't send here)
  return { processedHTML, previewText, subjectFromH1, linkResults };
}


ipcMain.handle('sendTestEmail', async (_event, payload) => {
  const { html, ...rest } = payload;
  console.log('📤 [Logging only] Would send test email with payload:', rest);

  // console.log('📤 Received test email payload from renderer:', payload);

  // try {
  //   const response = await axios.post(
  //     'https://hd1b1k93od.execute-api.us-east-1.amazonaws.com/mailchimp',
  //     {
  //       ...payload,
  //       isTest: true,
  //     },
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'x-api-key': 'YOUR_SHARED_SECRET'
  //       },
  //     }
  //   );

  //   console.log('✅ Test email sent successfully:', response.data);
  //   return {
  //     success: true,
  //     message: 'Test email sent!',
  //     data: response.data,
  //   };
  // } catch (error) {
  //   console.error('❌ Error sending test email:', error);

  //   if (axios.isAxiosError(error)) {
  //     const detail = error.response?.data?.detail;
  //     const fallback = error.message || 'Request failed';

  //     return {
  //       success: false,
  //       message: detail || fallback,
  //       data: error.response?.data || null,
  //     };
  //   }

  //   return {
  //     success: false,
  //     message: 'Unknown error occurred',
  //     data: null,
  //   };
  // }
});



ipcMain.handle('send-now-email', async (event, payload) => {
  const { html, ...rest } = payload;
  console.log('📤 [Logging only] Would send email with payload:', rest);

  // console.log('📤 Sending Now email request received:', payload);

  // try {
  //   const response = await axios.post(
  //     'https://hd1b1k93od.execute-api.us-east-1.amazonaws.com/mailchimp', // ✅ Replace with your actual API Gateway/Lambda endpoint
  //     payload,
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'x-api-key': 'YOUR_SHARED_SECRET'
  //       },
  //     }
  //   );

  //   console.log('✅ Email sent immediately:', response.data);
  //   return {
  //     success: true,
  //     message: 'Production email sent!',
  //     data: response.data,
  //   };
  //   // event.reply('send-now-email-success', response.data);
  // } catch (error) {
  //   console.error('❌ Error sending test email:', error);

  //   if (axios.isAxiosError(error)) {
  //     const detail = error.response?.data?.detail;
  //     const fallback = error.message || 'Request failed';

  //     return {
  //       success: false,
  //       message: detail || fallback,
  //       data: error.response?.data || null,
  //     };
  //   }

  //   return {
  //     success: false,
  //     message: 'Unknown error occurred',
  //     data: null,
  //   };
  // }
});

ipcMain.handle('send-scheduled-email', async (event, payload) => {
  const { html, ...rest } = payload;
  console.log('📤 [Logging only] Would schedule email with payload:', rest);

  // console.log('📅 Scheduling email:', payload);

  // try {
  //   const response = await axios.post(
  //     'https://hd1b1k93od.execute-api.us-east-1.amazonaws.com/mailchimp',
  //     {
  //       ...payload,
  //       isTest: false,
  //     },
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'x-api-key': 'YOUR_SHARED_SECRET'
  //       },
  //     }
  //   );

  //   console.log('✅ Email scheduled successfully:', response.data);
  //   return {
  //     success: true,
  //     message: 'Email Scheduled!',
  //     data: response.data,
  //   };
  // } catch (error) {
  //   console.error('❌ Error scheduling email:', error);

  //   if (axios.isAxiosError(error)) {
  //     const detail = error.response?.data?.detail;
  //     const fallback = error.message || 'Request failed';

  //     return {
  //       success: false,
  //       message: detail || fallback,
  //       data: error.response?.data || null,
  //     };
  //   }

  //   return {
  //     success: false,
  //     message: 'Unknown error occurred',
  //     data: null,
  //   };
  // }
});

// ipcMain.on('update-signup-prompt', async (_event, contentToSend: string) => {
//   console.log('📥 Got contentToSend from renderer:', contentToSend);

//   // Save it in memory for later use during file processing
//   latestSignupPromptHtml = contentToSend;

//   console.log(`Signup prompt saved to memory contentToSend:`, contentToSend);
// });


app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
