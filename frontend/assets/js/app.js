const form = document.querySelector('#chatForm');
const input = document.querySelector('#message');
const messages = document.querySelector('#messages');
const send = document.querySelector('#send');
const toast = document.querySelector('#toast');
const authGate = document.querySelector('#authGate');
const historyList = document.querySelector('#historyList');
const newChatButton = document.querySelector('#newChat');
const themeButton = document.querySelector('#theme');

const HISTORY_KEY = 'cloudnova.conversations.v1';
const THEME_KEY = 'cloudnova.theme.v1';
let toastTimer;
let loggedIn = false;
let conversations = loadConversations();
let activeConversationId = null;

function notify(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function uid() {
  return (globalThis.crypto?.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}
function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(c => c && c.id && Array.isArray(c.messages)) : [];
  } catch { return []; }
}
function saveConversations() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations)); }
  catch { notify('Browser storage is full. Delete some old conversations.'); }
}
function currentConversation() { return conversations.find(c => c.id === activeConversationId) || null; }
function createConversation() {
  const c = { id: uid(), title: 'New chat', pinned: false, updatedAt: Date.now(), messages: [] };
  conversations.unshift(c);
  activeConversationId = c.id;
  saveConversations();
  renderHistory();
  renderMessages();
  input?.focus();
  return c;
}
function titleFrom(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  return cleaned.length > 34 ? `${cleaned.slice(0, 34)}…` : (cleaned || 'New chat');
}
function renderHistory() {
  if (!historyList) return;
  historyList.replaceChildren();
  const ordered = [...conversations].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  if (!ordered.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = 'Your conversations will appear here.';
    historyList.appendChild(empty);
    return;
  }
  for (const c of ordered) {
    const item = document.createElement('div');
    item.className = `history-item${c.id === activeConversationId ? ' active' : ''}${c.pinned ? ' pinned' : ''}`;
    const open = document.createElement('button');
    open.type = 'button'; open.className = 'history-open';
    open.title = c.title;
    open.textContent = `${c.pinned ? '📌 ' : ''}${c.title}`;
    open.addEventListener('click', () => {
      activeConversationId = c.id;
      renderHistory(); renderMessages();
      document.querySelector('#chat')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const actions = document.createElement('div');
    actions.className = 'history-actions';
    const pin = document.createElement('button');
    pin.type = 'button'; pin.className = 'history-action'; pin.textContent = c.pinned ? 'Unpin' : 'Pin';
    pin.title = c.pinned ? 'Unpin conversation' : 'Pin conversation';
    pin.setAttribute('aria-label', pin.title);
    pin.addEventListener('click', e => { e.stopPropagation(); c.pinned = !c.pinned; saveConversations(); renderHistory(); });
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'history-action delete'; del.textContent = '×';
    del.title = 'Delete conversation'; del.setAttribute('aria-label', del.title);
    del.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Delete “${c.title}”? This cannot be undone.`)) return;
      conversations = conversations.filter(x => x.id !== c.id);
      if (activeConversationId === c.id) activeConversationId = null;
      saveConversations(); renderHistory();
      if (!activeConversationId) renderMessages();
    });
    actions.append(pin, del); item.append(open, actions); historyList.appendChild(item);
  }
}
function addMessage(text, who = 'assistant', shouldSave = true) {
  const c = currentConversation();
  const row = document.createElement('div');
  row.className = `message ${who === 'user' ? 'user' : 'assistant'}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble'; bubble.textContent = String(text ?? '');
  row.appendChild(bubble);
  const tools = document.createElement('div'); tools.className = 'message-tools';
  const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'copy-message';
  copy.textContent = 'Copy'; copy.title = 'Copy message';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(String(text ?? '')); copy.textContent = 'Copied'; notify('Message copied.'); }
    catch { fallbackCopy(String(text ?? '')); copy.textContent = 'Copied'; notify('Message copied.'); }
    setTimeout(() => { copy.textContent = 'Copy'; }, 1300);
  });
  tools.appendChild(copy); row.appendChild(tools); messages.appendChild(row);
  if (shouldSave && c) {
    c.messages.push({ role: who === 'user' ? 'user' : 'assistant', content: String(text ?? ''), at: Date.now() });
    if (c.title === 'New chat' && who === 'user') c.title = titleFrom(text);
    c.updatedAt = Date.now(); saveConversations(); renderHistory();
  }
  messages.scrollTop = messages.scrollHeight;
}
function fallbackCopy(text) {
  const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
  document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
}
function renderMessages() {
  if (!messages) return;
  messages.replaceChildren();
  const c = currentConversation();
  if (!c || !c.messages.length) {
    const welcome = document.createElement('div'); welcome.className = 'welcome';
    const star = document.createElement('span'); star.textContent = '✦';
    const copy = document.createElement('div'); const heading = document.createElement('b'); heading.textContent = 'Welcome to CloudNova AI';
    const p = document.createElement('p'); p.textContent = 'Your next idea starts here. What would you like to work on?';
    copy.append(heading, p); welcome.append(star, copy); messages.appendChild(welcome); return;
  }
  for (const m of c.messages) addMessage(m.content, m.role, false);
  messages.scrollTop = messages.scrollHeight;
}
async function checkSession() {
  try {
    const r = await fetch('/api/auth/me'); if (!r.ok) throw Error('Not signed in');
    const data = await r.json(); loggedIn = true;
    const name = data.user?.name || 'User';
    const profileName = document.querySelector('.profile b'); if (profileName) profileName.textContent = `${name}'s workspace`;
    const avatar = document.querySelector('.profile .avatar'); if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    document.querySelector('.top-actions .auth-link')?.remove();
    const signup = document.querySelector('.top-actions .auth-primary');
    if (signup && !signup.dataset.logoutBound) {
      signup.textContent = 'Log out'; signup.href = '#'; signup.dataset.logoutBound = '1';
      signup.addEventListener('click', async e => { e.preventDefault(); await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/login'; });
    }
    authGate?.classList.remove('show');
  } catch { loggedIn = false; }
  return loggedIn;
}
function showAuthGate() { if (!loggedIn && authGate) authGate.classList.add('show'); }
function looksLikeTopicRequest(text) {
  const cleaned = String(text || '').trim();
  if (cleaned.length < 12) return false;
  return !/^(hi|hello|hey|thanks|thank you|ok|okay|bye|good morning|good afternoon|good evening)[.!?\s]*$/i.test(cleaned);
}
function imageSearchTerms(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\b(explain|describe|tell me about|show me|give me|what is|what are|how does|how do|how to|in simple words|with an example|step by step|please|can you|could you|i am|i'm|a simple|real[- ]world|example|examples|images|pictures|photos|about|the|and|for|with|from|into|this|that)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 90);
}
async function addTopicImages(query, afterRow) {
  if (!afterRow || !looksLikeTopicRequest(query)) return;
  const terms = imageSearchTerms(query);
  if (!terms || terms.length < 3) return;
  const wrap = document.createElement('section');
  wrap.className = 'image-results loading';
  wrap.setAttribute('aria-label', 'Related topic images');
  const head = document.createElement('div');
  head.className = 'image-results-head';
  head.textContent = '▧ Images related to your topic';
  wrap.appendChild(head);
  afterRow.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
  try {
    const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
    endpoint.search = new URLSearchParams({
      action: 'query', generator: 'search', gsrsearch: `${terms} filetype:bitmap`,
      gsrnamespace: '6', gsrlimit: '6', prop: 'imageinfo', iiprop: 'url',
      iiurlwidth: '480', format: 'json', origin: '*'
    }).toString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error('Image search unavailable');
    const data = await response.json();
    const pages = Object.values(data?.query?.pages || {}).filter(p => p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url).slice(0, 6);
    wrap.classList.remove('loading');
    if (!pages.length) {
      wrap.remove();
      return;
    }
    const grid = document.createElement('div'); grid.className = 'image-results-grid';
    for (const page of pages) {
      const info = page.imageinfo[0];
      const src = info.thumburl || info.url;
      if (!src) continue;
      const card = document.createElement('a');
      card.className = 'topic-image-card'; card.href = info.descriptionurl || info.url || src;
      card.target = '_blank'; card.rel = 'noopener noreferrer';
      card.title = page.title || 'Open image source';
      const img = document.createElement('img'); img.src = src; img.alt = String(page.title || terms).replace(/^File:/, '').replace(/_/g, ' '); img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      const caption = document.createElement('span'); caption.textContent = String(page.title || 'Related image').replace(/^File:/, '').replace(/_/g, ' ');
      card.append(img, caption); grid.appendChild(card);
    }
    if (!grid.children.length) { wrap.remove(); return; }
    wrap.appendChild(grid);
    const note = document.createElement('div'); note.className = 'image-results-note';
    note.textContent = 'Images from Wikimedia Commons. Select an image to view its source and license details.';
    wrap.appendChild(note);
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    // Image lookup is optional: chat still works if the network blocks Commons.
    wrap.remove();
    console.info('Topic image search unavailable:', error?.name || 'request failed');
  }
}

async function sendMessage(text) {
  text = text.trim(); if (!text || send.disabled) return;
  if (!loggedIn) { showAuthGate(); return; }
  if (!currentConversation()) createConversation();
  messages.querySelector('.welcome')?.remove();
  addMessage(text, 'user'); input.value = ''; send.disabled = true; send.innerHTML = 'Thinking…';
  const pending = document.createElement('div'); pending.className = 'message assistant pending';
  const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = 'CloudNova is thinking…'; pending.appendChild(bubble); messages.appendChild(pending);
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
    const data = await response.json();
    if (response.status === 401) { loggedIn = false; pending.remove(); showAuthGate(); return; }
    if (!response.ok) throw Error(data.detail || `Request failed (${response.status})`);
    pending.remove(); addMessage(data.reply || 'The AI returned an empty response.', 'assistant');
    const assistantRow = messages.querySelector('.message.assistant:last-of-type');
    if (data.mode !== 'error' && data.mode !== 'setup') addTopicImages(text, assistantRow);
    if (data.mode === 'setup' || data.mode === 'error') notify(data.reply || 'Gemini connection failed. Check the VS Code terminal.');
  } catch (error) {
    pending.remove(); const msg = `Could not get an AI response. ${error.message || 'Check the backend terminal.'}`;
    addMessage(msg, 'assistant'); notify('Chat request failed. Check the VS Code terminal.');
  } finally { send.disabled = false; send.innerHTML = 'Send <b>↑</b>'; input.focus(); }
}

form?.addEventListener('submit', e => { e.preventDefault(); sendMessage(input.value); });
input?.addEventListener('focus', () => { if (!loggedIn) showAuthGate(); });
input?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); } });
document.querySelector('#gateClose')?.addEventListener('click', () => authGate?.classList.remove('show'));
authGate?.addEventListener('click', e => { if (e.target === authGate) authGate.classList.remove('show'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') authGate?.classList.remove('show'); });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.prompt; if (loggedIn) sendMessage(input.value); else showAuthGate(); }));
function selectView(view) {
  document.querySelectorAll('.nav').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  const title = document.querySelector('#pageTitle'); if (title) title.textContent = view;
  if (view !== 'Chat') notify(`${view} will be built in a later project phase.`);
  else document.querySelector('#chat')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.querySelector('#sidebar')?.classList.remove('open');
}
document.querySelectorAll('.nav').forEach(n => n.addEventListener('click', () => selectView(n.dataset.view)));
document.querySelectorAll('.feature[data-view]').forEach(n => n.addEventListener('click', () => selectView(n.dataset.view)));
function setTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  document.body.classList.toggle('dark', theme === 'dark');
  if (themeButton) { themeButton.textContent = theme === 'light' ? '☾ Dark mode' : '☼ Light mode'; themeButton.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'; }
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}
setTheme((() => { try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch { return 'dark'; } })());
themeButton?.addEventListener('click', () => { const next = document.body.classList.contains('light') ? 'dark' : 'light'; setTheme(next); notify(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled.`); });
document.querySelector('#language')?.addEventListener('click', () => notify('Language selection will be added in the multilingual phase.'));
document.querySelector('#settings')?.addEventListener('click', () => notify('Settings will be built in a later phase.'));
document.querySelector('#menu')?.addEventListener('click', () => document.querySelector('#sidebar')?.classList.toggle('open'));
newChatButton?.addEventListener('click', () => createConversation());
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (loggedIn) input?.focus(); else showAuthGate(); } });

renderHistory();
if (conversations.length) { activeConversationId = [...conversations].sort((a,b) => b.updatedAt-a.updatedAt)[0].id; renderHistory(); renderMessages(); }
checkSession();
