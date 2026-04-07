(function() {
  'use strict';

  // Config from script tag data attributes
  var script = document.currentScript;
  var API_URL = script.getAttribute('data-api') || '';
  var CHANNEL_ID = script.getAttribute('data-channel') || '';
  var COLOR = script.getAttribute('data-color') || '#465FFF';
  var TITLE = script.getAttribute('data-title') || 'Chat';
  var SUBTITLE = script.getAttribute('data-subtitle') || 'Estamos online';
  var POSITION = script.getAttribute('data-position') || 'right';

  if (!API_URL || !CHANNEL_ID) {
    console.error('[CRM LP Widget] data-api e data-channel são obrigatórios');
    return;
  }

  // Generate or retrieve visitor ID
  var VISITOR_ID = localStorage.getItem('crm_lp_visitor') || ('v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  localStorage.setItem('crm_lp_visitor', VISITOR_ID);

  var conversationId = localStorage.getItem('crm_lp_conv_' + CHANNEL_ID) || null;
  var isOpen = false;
  var messages = [];
  var lastTimestamp = null;
  var pollInterval = null;
  var visitorName = '';

  // ==================== STYLES ====================
  var style = document.createElement('style');
  style.textContent = `
    #crm-lp-widget-btn{position:fixed;bottom:24px;${POSITION}:24px;z-index:99999;width:60px;height:60px;border-radius:50%;background:${COLOR};color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}
    #crm-lp-widget-btn:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(0,0,0,0.2)}
    #crm-lp-widget-btn svg{width:28px;height:28px}
    #crm-lp-widget-badge{position:absolute;top:-2px;right:-2px;background:#f04438;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px}
    #crm-lp-widget{position:fixed;bottom:96px;${POSITION}:24px;z-index:99999;width:380px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.12);display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    #crm-lp-widget.open{display:flex}
    #crm-lp-widget-header{background:${COLOR};color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between}
    #crm-lp-widget-header h3{font-size:15px;font-weight:600;margin:0}
    #crm-lp-widget-header p{font-size:12px;opacity:.8;margin:2px 0 0}
    #crm-lp-widget-header button{background:none;border:none;color:#fff;cursor:pointer;padding:4px;opacity:.8}
    #crm-lp-widget-header button:hover{opacity:1}
    #crm-lp-widget-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;background:#f9fafb}
    .crm-msg{max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.4;word-wrap:break-word}
    .crm-msg.contact{align-self:flex-end;background:${COLOR};color:#fff;border-bottom-right-radius:4px}
    .crm-msg.ai,.crm-msg.human{align-self:flex-start;background:#fff;color:#1d2939;border:1px solid #e4e7ec;border-bottom-left-radius:4px}
    .crm-msg .crm-sender{font-size:10px;font-weight:600;opacity:.6;margin-bottom:2px}
    .crm-msg .crm-time{font-size:10px;opacity:.5;text-align:right;margin-top:4px}
    #crm-lp-widget-input{padding:12px;border-top:1px solid #e4e7ec;display:flex;gap:8px;background:#fff}
    #crm-lp-widget-input input{flex:1;border:1px solid #d0d5dd;border-radius:8px;padding:10px 14px;font-size:14px;outline:none;transition:border .2s}
    #crm-lp-widget-input input:focus{border-color:${COLOR}}
    #crm-lp-widget-input button{background:${COLOR};color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;transition:opacity .2s}
    #crm-lp-widget-input button:hover{opacity:.9}
    #crm-lp-widget-input button:disabled{opacity:.5}
    #crm-lp-widget-name{padding:16px;background:#fff;border-top:1px solid #e4e7ec}
    #crm-lp-widget-name p{font-size:13px;color:#667085;margin:0 0 8px}
    #crm-lp-widget-name input{width:100%;border:1px solid #d0d5dd;border-radius:8px;padding:10px 14px;font-size:14px;outline:none;margin-bottom:8px}
    #crm-lp-widget-name button{width:100%;background:${COLOR};color:#fff;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer}
  `;
  document.head.appendChild(style);

  // ==================== HTML ====================
  // Float button
  var btn = document.createElement('button');
  btn.id = 'crm-lp-widget-btn';
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span id="crm-lp-widget-badge">0</span>';
  document.body.appendChild(btn);

  // Chat window
  var widget = document.createElement('div');
  widget.id = 'crm-lp-widget';
  widget.innerHTML = `
    <div id="crm-lp-widget-header">
      <div><h3>${TITLE}</h3><p>${SUBTITLE}</p></div>
      <button id="crm-lp-close">&times;</button>
    </div>
    <div id="crm-lp-widget-messages"></div>
    <div id="crm-lp-widget-name">
      <p>Como podemos te chamar?</p>
      <input type="text" placeholder="Seu nome" id="crm-lp-name-input" />
      <button id="crm-lp-name-btn">Iniciar conversa</button>
    </div>
    <div id="crm-lp-widget-input" style="display:none">
      <input type="text" placeholder="Digite sua mensagem..." id="crm-lp-msg-input" />
      <button id="crm-lp-send-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(widget);

  var messagesEl = document.getElementById('crm-lp-widget-messages');
  var nameSection = document.getElementById('crm-lp-widget-name');
  var inputSection = document.getElementById('crm-lp-widget-input');
  var msgInput = document.getElementById('crm-lp-msg-input');
  var sendBtn = document.getElementById('crm-lp-send-btn');
  var nameInput = document.getElementById('crm-lp-name-input');
  var nameBtn = document.getElementById('crm-lp-name-btn');

  // Check if already has a name saved
  var savedName = localStorage.getItem('crm_lp_name');
  if (savedName) {
    visitorName = savedName;
    nameSection.style.display = 'none';
    inputSection.style.display = 'flex';
  }

  // ==================== EVENTS ====================
  btn.addEventListener('click', function() {
    isOpen = !isOpen;
    widget.classList.toggle('open', isOpen);
    if (isOpen && conversationId) startPolling();
    else stopPolling();
  });

  document.getElementById('crm-lp-close').addEventListener('click', function() {
    isOpen = false;
    widget.classList.remove('open');
    stopPolling();
  });

  nameBtn.addEventListener('click', function() {
    var name = nameInput.value.trim();
    if (!name) return;
    visitorName = name;
    localStorage.setItem('crm_lp_name', name);
    nameSection.style.display = 'none';
    inputSection.style.display = 'flex';
    msgInput.focus();
  });

  nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') nameBtn.click();
  });

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  function sendMessage() {
    var text = msgInput.value.trim();
    if (!text) return;
    msgInput.value = '';
    sendBtn.disabled = true;

    // Show message immediately
    addMessage({ sender: 'contact', content: text, timestamp: new Date().toISOString() });

    fetch(API_URL + '/api/widget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: CHANNEL_ID,
        visitorId: VISITOR_ID,
        visitorName: visitorName,
        text: text,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      sendBtn.disabled = false;
      if (data.conversationId) {
        conversationId = data.conversationId;
        localStorage.setItem('crm_lp_conv_' + CHANNEL_ID, conversationId);
        startPolling();
      }
      if (data.reply) {
        addMessage({ sender: 'ai', content: data.reply, timestamp: new Date().toISOString() });
      }
    })
    .catch(function() { sendBtn.disabled = false; });
  }

  function addMessage(msg) {
    // Avoid duplicates
    var exists = messages.find(function(m) { return m.content === msg.content && m.sender === msg.sender && m.timestamp === msg.timestamp; });
    if (exists) return;

    messages.push(msg);
    var div = document.createElement('div');
    div.className = 'crm-msg ' + msg.sender;

    var html = '';
    if (msg.sender === 'human') html += '<div class="crm-sender">Atendente</div>';
    if (msg.sender === 'ai') html += '<div class="crm-sender">Assistente</div>';
    html += msg.content.replace(/\n/g, '<br>');

    var d = new Date(msg.timestamp);
    html += '<div class="crm-time">' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0') + '</div>';

    div.innerHTML = html;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function startPolling() {
    stopPolling();
    if (!conversationId) return;
    pollInterval = setInterval(pollMessages, 3000);
  }

  function stopPolling() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  }

  function pollMessages() {
    if (!conversationId) return;
    var url = API_URL + '/api/widget?conversationId=' + conversationId;
    if (lastTimestamp) url += '&after=' + encodeURIComponent(lastTimestamp);

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(msgs) {
        if (!Array.isArray(msgs)) return;
        msgs.forEach(function(msg) {
          if (msg.sender !== 'contact') {
            addMessage(msg);
          }
          lastTimestamp = msg.timestamp;
        });
      })
      .catch(function() {});
  }

  // Load existing messages if conversation exists
  if (conversationId) {
    fetch(API_URL + '/api/widget?conversationId=' + conversationId)
      .then(function(r) { return r.json(); })
      .then(function(msgs) {
        if (Array.isArray(msgs)) {
          msgs.forEach(function(msg) { addMessage(msg); });
          if (msgs.length > 0) lastTimestamp = msgs[msgs.length - 1].timestamp;
        }
      })
      .catch(function() {});
  }
})();
