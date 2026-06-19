console.log('%c[Pesawat]', 'color:#25D366;font-weight:bold', 'Content Script Loaded');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function log(...args) {
  console.log('%c[Pesawat]', 'color:#25D366;font-weight:bold', ...args);
}

let lastProcessedPhone = null;

function checkForErrorPopup() {
  const dialogs = document.querySelectorAll('div[role="dialog"], div[data-testid="popup-contents"], div[class*="popup"]');
  for (const dialog of dialogs) {
    const text = dialog.innerText || "";
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes('invalid') || 
      lowerText.includes('tidak valid') || 
      lowerText.includes('tidak terdaftar') || 
      lowerText.includes('not registered') || 
      lowerText.includes('bukan nomor') ||
      lowerText.includes('url is invalid') ||
      lowerText.includes('url tidak valid')
    ) {
      log('Pop-up nomor tidak valid:', text.trim());
      const closeBtn = dialog.querySelector('button') || 
                       dialog.querySelector('div[role="button"]') ||
                       dialog.querySelector('[class*="button"]');
      if (closeBtn) {
        closeBtn.click();
        log('Pop-up ditutup.');
      }
      return true;
    }
  }
  return false;
}

async function insertTextToReactNode(element, text) {
  element.focus();
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
  await sleep(250);

  try {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(pasteEvent);
  } catch (e) {
    log('ClipboardEvent gagal, fallback insertText:', e.message);
    document.execCommand('insertText', false, text);
  }

  element.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await sleep(600);
}

function checkForBusinessPopup() {
  const blockMsg = document.querySelector('div[data-testid="block-message"]');
  if (blockMsg) {
    log('WA Business AI auto-reply block terdeteksi');
    const toggle = blockMsg.querySelector('a[data-testid="toggle-ai-reply-status"]');
    if (toggle) {
      toggle.click();
      log('Klik "Tanggapi secara manual"');
      return true;
    }
  }
  return false;
}

function getChatHeaderName() {
  const header = document.querySelector('header span[data-testid="conversation-info-header-chat-title"]') || 
                 document.querySelector('header span[dir="auto"]');
  return header ? header.innerText.trim() : "";
}

async function attachFiles(attachments, textBox) {
  const dt = new DataTransfer();

  for (const att of attachments) {
    const binary = atob(att.base64);
    const buf = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
    const blob = new Blob([buf], { type: att.mime });
    const file = new File([blob], att.name, { type: att.mime });
    dt.items.add(file);
  }

  textBox.focus();

  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: dt,
    bubbles: true,
    cancelable: true
  });

  textBox.dispatchEvent(pasteEvent);
  log(attachments.length + ' file(s) ditempelkan');
}

function findActiveInput() {
  return document.querySelector(
    'div[data-testid="media-caption-input"], ' +
    'div[contenteditable="true"][data-tab="10"], ' +
    'div[contenteditable="true"][data-tab="1"], ' +
    'footer div[contenteditable="true"], ' +
    'div[data-testid="conversation-compose-box-input"] div[contenteditable="true"], ' +
    'div[aria-label*="caption"], ' +
    'div[aria-label*="Caption"], ' +
    'div[aria-label*="Type a message"], ' +
    'div[aria-label*="Ketik pesan"]'
  );
}

async function sendMessage(phone, message, attachments = []) {
  try {
    log('Memulai pengiriman ke:', phone);

    const previousContactName = getChatHeaderName();
    const isDifferentNumber = lastProcessedPhone !== null && lastProcessedPhone !== phone;

    const chatUrl = `https://web.whatsapp.com/send?phone=${phone}`;
    log('Buka:', chatUrl);
    const link = document.createElement('a');
    link.href = chatUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    log('Loading chat', phone, '...');
    await sleep(2500);

    let textBox = null;
    let attempts = 0;
    let isInvalid = false;

    while (!textBox && attempts < 15) {
      if (checkForErrorPopup()) {
        isInvalid = true;
        break;
      }
      checkForBusinessPopup();

      const currentContactName = getChatHeaderName();

      const candidateTextBox =
        document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
        document.querySelector('div[contenteditable="true"][data-tab="1"]') ||
        document.querySelector('footer div[contenteditable="true"]') ||
        document.querySelector('div[data-testid="conversation-compose-box-input"] div[contenteditable="true"]') ||
        document.querySelector('div[aria-label*="Type a message"]') ||
        document.querySelector('div[aria-label*="Ketik pesan"]');

      if (candidateTextBox && isDifferentNumber && currentContactName === previousContactName) {
        log('Header belum berubah, masih loading...');
        await sleep(500);
        attempts++;
        continue;
      }

      textBox = candidateTextBox;

      if (!textBox) {
        const errorPanel = document.querySelector(
          'div[data-testid="conversation-panel-body"], ' +
          'div[data-testid="conversation-panel-error"]'
        );
        if (errorPanel && /tidak terdaftar|not registered|tidak tersedia|invalid/i.test(errorPanel.textContent)) {
          isInvalid = true;
          break;
        }
        await sleep(500);
        attempts++;
      }
    }

    if (isInvalid) {
      throw new Error(`SKIP_INVALID_NUMBER: Nomor ${phone} tidak terdaftar di WhatsApp.`);
    }

    if (!textBox) {
      throw new Error('Kotak pesan tidak ditemukan. Gagal memuat obrolan.');
    }

    if (checkForBusinessPopup()) {
      await sleep(1500);
    }
    if (checkForErrorPopup()) {
      throw new Error('WA Business AI auto-reply blocking input');
    }

    lastProcessedPhone = phone;

    if (attachments.length > 0) {
      log('Upload', attachments.length, 'lampiran');
      await attachFiles(attachments, textBox);
      await sleep(4000);

      if (checkForErrorPopup()) {
        throw new Error('Gagal upload lampiran');
      }

      const currentInput = findActiveInput();
      if (currentInput) textBox = currentInput;

      if (message) {
        await insertTextToReactNode(textBox, message);
      }
    } else {
      log('Kotak pesan ditemukan');
      await insertTextToReactNode(textBox, message);
    }

    await sleep(1000);

    const sendButton =
      document.querySelector('span[data-icon="send"]')?.closest('button') ||
      document.querySelector('button[aria-label="Send"]') ||
      document.querySelector('button[data-testid="compose-btn-send"]');

    if (sendButton) {
      sendButton.click();
      log('Pesan ke', phone, 'berhasil dikirim.');
    } else {
      const enterEvent = new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
      });
      textBox.dispatchEvent(enterEvent);
      log('Pesan ke', phone, 'dikirim via Enter.');
    }

    await sleep(2000);
    log('OK:', phone);
    return { status: 'success', reason: '' };

  } catch (error) {
    log('ERROR:', error.message);
    return { status: 'fail', reason: error.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ pong: true });
  } else if (message.action === 'send') {
    const { phone, message: msgText, attachments } = message;
    sendMessage(phone, msgText, attachments || []).then((res) => {
      sendResponse({ status: res.status, reason: res.reason });
    }).catch((err) => {
      sendResponse({ status: 'fail', reason: err.message });
    });
    return true;
  }
});
