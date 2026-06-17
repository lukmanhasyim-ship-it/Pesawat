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

function getChatHeaderName() {
  const header = document.querySelector('header span[data-testid="conversation-info-header-chat-title"]') || 
                 document.querySelector('header span[dir="auto"]');
  return header ? header.innerText.trim() : "";
}

async function sendMessage(phone, message) {
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

    lastProcessedPhone = phone;

    log('Kotak pesan ditemukan');
    await insertTextToReactNode(textBox, message);
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
    const { phone, message: msgText } = message;
    sendMessage(phone, msgText).then((res) => {
      sendResponse({ status: res.status, reason: res.reason });
    }).catch((err) => {
      sendResponse({ status: 'fail', reason: err.message });
    });
    return true;
  }
});
