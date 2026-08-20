const statusEl = document.getElementById('status');
const statusPillWrap = document.getElementById('statusPillWrap');
const myIdEl = document.getElementById('myId');
const copyIdBtn = document.getElementById('copyIdBtn');
const peerIdInput = document.getElementById('peerIdInput');
const connectBtn = document.getElementById('connectBtn');
const shareBtn = document.getElementById('shareBtn');
const micBtn = document.getElementById('micBtn');
const stopBtn = document.getElementById('stopBtn');
const remoteVideo = document.getElementById('remoteVideo');
const remoteMic = document.getElementById('remoteMic');
const stageEmpty = document.getElementById('stageEmpty');
const liveBadge = document.getElementById('liveBadge');
const playOverlayBtn = document.getElementById('playOverlayBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const stageEl = document.getElementById('stage');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const qualityRes = document.getElementById('qualityRes');
const qualityFps = document.getElementById('qualityFps');
const qualityBitrate = document.getElementById('qualityBitrate');
const applyQualityBtn = document.getElementById('applyQualityBtn');

let peer = null;
let dataConn = null;
let screenStream = null;
let micStream = null;
let screenCall = null;
let micCall = null;
let micActive = false;

function log(msg, cls) {
  const div = document.createElement('div');
  div.className = 'msg ' + (cls || 'msg-sys');
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setStatus(text, connected) {
  statusEl.textContent = text;
  statusPillWrap.className = 'status-pill' + (connected ? ' live' : '');
}

function initPeer() {
  const shortId = Math.random().toString(36).substring(2, 8);
  peer = new Peer(shortId, {
    config: { iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]}
  });

  peer.on('open', id => {
    myIdEl.textContent = id;
    log('Seu ID está pronto: ' + id, 'msg-sys');
  });

  peer.on('connection', conn => {
    dataConn = conn;
    setupDataConn();
  });

  peer.on('call', call => {
    call.answer();
    call.on('stream', stream => {
      if (call.metadata && call.metadata.type === 'mic') {
        remoteMic.srcObject = stream;
        remoteMic.play().catch(() => {});
      } else {
        remoteVideo.srcObject = stream;
        stageEmpty.style.display = 'none';
        liveBadge.classList.add('show');
        setStatus('recebendo transmissão', true);
        remoteVideo.play().catch(() => {
          playOverlayBtn.classList.add('show');
        });
      }
    });
  });

  peer.on('error', err => log('Erro: ' + err.type, 'msg-sys'));
}

function setupDataConn() {
  setStatus('conectado', true);
  log('Conexão estabelecida.', 'msg-sys');

  dataConn.on('data', data => {
    if (data.type === 'chat') log(data.text, 'msg-them');
  });

  dataConn.on('close', () => {
    setStatus('desconectado', false);
    log('O outro lado desconectou.', 'msg-sys');
  });

  if (screenStream) {
    screenCall = peer.call(dataConn.peer, screenStream, { metadata: { type: 'screen' } });
    setTimeout(() => limitBitrate(screenCall, parseInt(qualityBitrate.value)), 1500);
  }
  if (micStream) {
    micCall = peer.call(dataConn.peer, micStream, { metadata: { type: 'mic' } });
    setTimeout(() => limitBitrate(micCall, 32), 1500);
  }
}

connectBtn.onclick = () => {
  const targetId = peerIdInput.value.trim();
  if (!targetId) return;
  dataConn = peer.connect(targetId);
  dataConn.on('open', () => setupDataConn());
};

copyIdBtn.onclick = () => {
  navigator.clipboard.writeText(myIdEl.textContent).then(() => {
    log('ID copiado.', 'msg-sys');
  }).catch(() => {});
};

shareBtn.onclick = async () => {
  try {
    const res = parseInt(qualityRes.value);
    const fps = parseInt(qualityFps.value);
    const kbps = parseInt(qualityBitrate.value);
    const heightMap = { 480: 480, 720: 720, 1080: 1080 };
    const widthMap = { 480: 854, 720: 1280, 1080: 1920 };

    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        frameRate: { ideal: fps, max: fps },
        width: { ideal: widthMap[res], max: widthMap[res] },
        height: { ideal: heightMap[res], max: heightMap[res] }
      },
      audio: { echoCancellation: true, noiseSuppression: true }
    });

    log(`Transmissão iniciada — ${res}p / ${fps}fps / ${kbps}kbps.`, 'msg-sys');
    stopBtn.disabled = false;
    shareBtn.disabled = true;
    stageEmpty.style.display = 'none';
    liveBadge.classList.add('show');

    screenStream.getVideoTracks()[0].onended = () => stopSharing();

    if (dataConn && dataConn.open) {
      screenCall = peer.call(dataConn.peer, screenStream, { metadata: { type: 'screen' } });
      setTimeout(() => limitBitrate(screenCall, kbps), 1500);
    }
  } catch (err) {
    log('Não foi possível compartilhar a tela.', 'msg-sys');
  }
};

micBtn.onclick = async () => {
  if (micActive) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
    });
    micActive = true;
    micBtn.style.borderColor = 'var(--accent)';
    micBtn.style.color = 'var(--accent)';
    log('Microfone ativado.', 'msg-sys');

    if (dataConn && dataConn.open) {
      micCall = peer.call(dataConn.peer, micStream, { metadata: { type: 'mic' } });
      setTimeout(() => limitBitrate(micCall, 32), 1500);
    }
  } catch (err) {
    log('Não foi possível ativar o microfone.', 'msg-sys');
  }
};

function limitBitrate(call, kbps) {
  if (!call || !call.peerConnection) return;
  call.peerConnection.getSenders().forEach(sender => {
    if (!sender.track) return;
    const params = sender.getParameters();
    if (!params.encodings) params.encodings = [{}];
    params.encodings[0].maxBitrate = kbps * 1000;
    sender.setParameters(params).catch(() => {});
  });
}

function stopSharing() {
  if (screenStream) {
    screenStream.getTracks().forEach(t => t.stop());
    screenStream = null;
  }
  if (screenCall) screenCall.close();
  stopBtn.disabled = true;
  shareBtn.disabled = false;
  liveBadge.classList.remove('show');
  log('Transmissão parada.', 'msg-sys');
}
stopBtn.onclick = stopSharing;

sendBtn.onclick = () => {
  const text = chatInput.value.trim();
  if (!text || !dataConn || !dataConn.open) return;
  dataConn.send({ type: 'chat', text });
  log(text, 'msg-me');
  chatInput.value = '';
};
chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendBtn.click(); });

playOverlayBtn.onclick = () => {
  remoteVideo.play();
  remoteMic.play().catch(() => {});
  playOverlayBtn.classList.remove('show');
};

fullscreenBtn.onclick = () => {
  // iOS Safari não suporta Fullscreen API em elementos genéricos,
  // só tem fullscreen nativo do próprio <video>
  if (remoteVideo.webkitEnterFullscreen) {
    remoteVideo.webkitEnterFullscreen();
    return;
  }
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else if (stageEl.requestFullscreen) {
    stageEl.requestFullscreen();
  } else if (stageEl.webkitRequestFullscreen) {
    stageEl.webkitRequestFullscreen();
  }
};

applyQualityBtn.onclick = async () => {
  if (!screenStream) { log('Comece a compartilhar a tela primeiro.', 'msg-sys'); return; }
  const res = parseInt(qualityRes.value);
  const fps = parseInt(qualityFps.value);
  const kbps = parseInt(qualityBitrate.value);
  const heightMap = { 480: 480, 720: 720, 1080: 1080 };
  const widthMap = { 480: 854, 720: 1280, 1080: 1920 };
  const track = screenStream.getVideoTracks()[0];
  try {
    await track.applyConstraints({
      frameRate: { ideal: fps, max: fps },
      width: { ideal: widthMap[res], max: widthMap[res] },
      height: { ideal: heightMap[res], max: heightMap[res] }
    });
    if (screenCall) limitBitrate(screenCall, kbps);
    log(`Qualidade atualizada — ${res}p / ${fps}fps / ${kbps}kbps.`, 'msg-sys');
  } catch (err) {
    log('Não foi possível aplicar ao vivo. Pare e compartilhe de novo.', 'msg-sys');
  }
};

initPeer();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
