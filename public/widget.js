(function() {
  'use strict';
  var script = document.currentScript;
  var API_URL = script.getAttribute('data-api') || '';
  var CHANNEL_ID = script.getAttribute('data-channel') || '';
  if (!API_URL || !CHANNEL_ID) return;

  var VISITOR_ID = localStorage.getItem('crm_lp_vid') || ('v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  localStorage.setItem('crm_lp_vid', VISITOR_ID);
  var conversationId = localStorage.getItem('crm_lp_c_' + CHANNEL_ID) || null;
  var isOpen = false, messages = [], lastTs = null, poll = null, vName = localStorage.getItem('crm_lp_name') || '';

  // Defaults (overridden by server config)
  var cfg = { color: '#465FFF', title: 'Chat', subtitle: 'Estamos online', position: 'right', agentName: 'Atendente', agentAvatar: null, askName: true, welcomeMessage: null };

  // Load config from server
  fetch(API_URL + '/api/widget?channelId=' + CHANNEL_ID).then(function(r) { return r.json(); }).then(function(d) {
    if (d.color) cfg.color = d.color;
    if (d.title) cfg.title = d.title;
    if (d.subtitle) cfg.subtitle = d.subtitle;
    if (d.position) cfg.position = d.position;
    if (d.agentName) cfg.agentName = d.agentName;
    if (d.agentAvatar) cfg.agentAvatar = d.agentAvatar;
    if (d.askName === false) cfg.askName = false;
    if (d.welcomeMessage) cfg.welcomeMessage = d.welcomeMessage;
    init();
  }).catch(function() { init(); });

  function init() {
    // Styles
    var pos = cfg.position === 'left' ? 'left' : 'right';
    var s = document.createElement('style');
    s.textContent = [
      '#clw-btn{position:fixed;bottom:24px;' + pos + ':24px;z-index:99999;width:60px;height:60px;border-radius:50%;background:' + cfg.color + ';color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;transition:transform .2s}',
      '#clw-btn:hover{transform:scale(1.1)}',
      '#clw-btn svg{width:28px;height:28px}',
      '#clw-badge{position:absolute;top:-2px;right:-2px;background:#f04438;color:#fff;font-size:11px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px}',
      '#clw{position:fixed;bottom:96px;' + pos + ':24px;z-index:99999;width:380px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.12);display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif}',
      '#clw.open{display:flex}',
      '#clw-hdr{background:' + cfg.color + ';color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between}',
      '#clw-hdr h3{font-size:15px;font-weight:600;margin:0}#clw-hdr p{font-size:12px;opacity:.8;margin:2px 0 0}',
      '#clw-hdr button{background:none;border:none;color:#fff;cursor:pointer;font-size:20px;opacity:.8}#clw-hdr button:hover{opacity:1}',
      '#clw-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;background:#f9fafb}',
      '.clw-m{max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word}',
      '.clw-m.contact{align-self:flex-end;background:' + cfg.color + ';color:#fff;border-bottom-right-radius:4px}',
      '.clw-m.ai,.clw-m.human{align-self:flex-start;background:#fff;color:#1d2939;border:1px solid #e4e7ec;border-bottom-left-radius:4px}',
      '.clw-agent{display:flex;align-items:center;gap:6px;margin-bottom:4px}',
      '.clw-agent img{width:20px;height:20px;border-radius:50%;object-fit:cover}',
      '.clw-agent span{font-size:11px;font-weight:600;color:#667085}',
      '.clw-time{font-size:10px;opacity:.5;text-align:right;margin-top:4px}',
      '#clw-inp{padding:12px;border-top:1px solid #e4e7ec;display:flex;gap:8px}',
      '#clw-inp input{flex:1;border:1px solid #d0d5dd;border-radius:8px;padding:10px 14px;font-size:14px;outline:none}',
      '#clw-inp input:focus{border-color:' + cfg.color + '}',
      '#clw-inp button{background:' + cfg.color + ';color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer}',
      '#clw-inp button:disabled{opacity:.5}',
      '#clw-name{padding:20px;text-align:center}',
      '#clw-name p{font-size:14px;color:#667085;margin:0 0 12px}',
      '#clw-name input{width:100%;border:1px solid #d0d5dd;border-radius:8px;padding:10px 14px;font-size:14px;outline:none;margin-bottom:10px;text-align:center}',
      '#clw-name button{width:100%;background:' + cfg.color + ';color:#fff;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:600;cursor:pointer}',
    ].join('');
    document.head.appendChild(s);

    // Button
    var btn = document.createElement('button');
    btn.id = 'clw-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span id="clw-badge">0</span>';
    document.body.appendChild(btn);

    // Widget
    var w = document.createElement('div');
    w.id = 'clw';
    var showInput = vName || !cfg.askName;
    w.innerHTML =
      '<div id="clw-hdr"><div><h3>' + cfg.title + '</h3><p>' + cfg.subtitle + '</p></div><button id="clw-x">&times;</button></div>' +
      '<div id="clw-msgs"></div>' +
      (showInput ? '' : '<div id="clw-name"><p>Como podemos te chamar?</p><input type="text" placeholder="Seu nome" id="clw-ni" /><button id="clw-nb">Iniciar conversa</button></div>') +
      '<div id="clw-inp" style="' + (showInput ? '' : 'display:none') + '"><input type="text" placeholder="Digite sua mensagem..." id="clw-mi" /><button id="clw-sb"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg></button></div>';
    document.body.appendChild(w);

    var msgsEl = document.getElementById('clw-msgs');
    var miEl = document.getElementById('clw-mi');
    var sbEl = document.getElementById('clw-sb');
    var niEl = document.getElementById('clw-ni');
    var nbEl = document.getElementById('clw-nb');
    var inpSec = document.getElementById('clw-inp');
    var nameSec = document.getElementById('clw-name');

    btn.onclick = function() {
      isOpen = !isOpen;
      w.classList.toggle('open', isOpen);
      if (isOpen) { startPoll(); if (miEl) miEl.focus(); }
      else stopPoll();
    };
    document.getElementById('clw-x').onclick = function() { isOpen = false; w.classList.remove('open'); stopPoll(); };

    if (nbEl) {
      nbEl.onclick = function() {
        var n = niEl.value.trim();
        if (!n) return;
        vName = n;
        localStorage.setItem('crm_lp_name', n);
        nameSec.style.display = 'none';
        inpSec.style.display = 'flex';
        miEl.focus();
        // Start conversation and send welcome
        startConversation();
      };
      niEl.onkeydown = function(e) { if (e.key === 'Enter') nbEl.click(); };
    } else if (showInput) {
      // Already has name, start conversation
      startConversation();
    }

    sbEl.onclick = sendMsg;
    miEl.onkeydown = function(e) { if (e.key === 'Enter') sendMsg(); };

    function startConversation() {
      fetch(API_URL + '/api/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: CHANNEL_ID, visitorId: VISITOR_ID, visitorName: vName, action: 'start' }),
      }).then(function(r) { return r.json(); }).then(function(d) {
        if (d.conversationId) {
          conversationId = d.conversationId;
          localStorage.setItem('crm_lp_c_' + CHANNEL_ID, conversationId);
        }
        if (d.welcome) addMsg({ sender: 'ai', content: d.welcome, timestamp: new Date().toISOString() });
        startPoll();
      }).catch(function() {});
    }

    function sendMsg() {
      var t = miEl.value.trim();
      if (!t) return;
      miEl.value = '';
      sbEl.disabled = true;
      addMsg({ sender: 'contact', content: t, timestamp: new Date().toISOString() });
      fetch(API_URL + '/api/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: CHANNEL_ID, visitorId: VISITOR_ID, visitorName: vName, text: t }),
      }).then(function(r) { return r.json(); }).then(function(d) {
        sbEl.disabled = false;
        if (d.conversationId && !conversationId) {
          conversationId = d.conversationId;
          localStorage.setItem('crm_lp_c_' + CHANNEL_ID, conversationId);
          startPoll();
        }
        if (d.reply) addMsg({ sender: 'ai', content: d.reply, timestamp: new Date().toISOString() });
      }).catch(function() { sbEl.disabled = false; });
    }

    function addMsg(m) {
      var dup = messages.find(function(x) { return x.content === m.content && x.sender === m.sender && Math.abs(new Date(x.timestamp) - new Date(m.timestamp)) < 2000; });
      if (dup) return;
      messages.push(m);
      var div = document.createElement('div');
      div.className = 'clw-m ' + m.sender;
      var h = '';
      if (m.sender !== 'contact') {
        h += '<div class="clw-agent">';
        if (cfg.agentAvatar) h += '<img src="' + cfg.agentAvatar + '" alt="" />';
        h += '<span>' + (m.sender === 'ai' ? cfg.agentName : cfg.agentName) + '</span></div>';
      }
      h += m.content.replace(/\n/g, '<br>');
      var d = new Date(m.timestamp);
      h += '<div class="clw-time">' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</div>';
      div.innerHTML = h;
      msgsEl.appendChild(div);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    function startPoll() { stopPoll(); if (conversationId) poll = setInterval(pollMsgs, 3000); }
    function stopPoll() { if (poll) { clearInterval(poll); poll = null; } }

    function pollMsgs() {
      if (!conversationId) return;
      var url = API_URL + '/api/widget?conversationId=' + conversationId;
      if (lastTs) url += '&after=' + encodeURIComponent(lastTs);
      fetch(url).then(function(r) { return r.json(); }).then(function(ms) {
        if (!Array.isArray(ms)) return;
        ms.forEach(function(m) { if (m.sender !== 'contact') addMsg(m); lastTs = m.timestamp; });
      }).catch(function() {});
    }

    // Load existing messages
    if (conversationId) {
      fetch(API_URL + '/api/widget?conversationId=' + conversationId)
        .then(function(r) { return r.json(); })
        .then(function(ms) {
          if (!Array.isArray(ms)) return;
          ms.forEach(function(m) { addMsg(m); });
          if (ms.length) lastTs = ms[ms.length - 1].timestamp;
        }).catch(function() {});
    }
  }
})();
