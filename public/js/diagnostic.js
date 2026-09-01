// Visual Diagnostic & Camera Trouble Shooter Module for VL-800

window.VL800_Diagnostic = {
  activeStream: null,
  currentImageData: null,

  init() {
    const fileInput = document.getElementById('camera-file-input');
    const uploadBtn = document.getElementById('btn-upload-photo');
    const captureBtn = document.getElementById('btn-snap-photo');
    const startCamBtn = document.getElementById('btn-start-camera');

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    if (startCamBtn) {
      startCamBtn.addEventListener('click', () => this.startLiveCamera());
    }

    if (captureBtn) {
      captureBtn.addEventListener('click', () => this.captureFromStream());
    }
  },

  async startLiveCamera() {
    const video = document.getElementById('live-video');
    const placeholder = document.getElementById('viewfinder-placeholder');
    const reticle = document.getElementById('reticle-overlay');
    const startBtn = document.getElementById('btn-start-camera');
    const snapBtn = document.getElementById('btn-snap-photo');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        this.activeStream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        if (reticle) reticle.style.display = 'block';
        if (startBtn) startBtn.style.display = 'none';
        if (snapBtn) snapBtn.style.display = 'inline-flex';
      } else {
        alert('カメラへのアクセスがサポートされていません。「写真をアップロード」をご利用ください。');
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      alert('カメラの起動に失敗しました。写真のアップロード機能をご利用ください。');
    }
  },

  captureFromStream() {
    const video = document.getElementById('live-video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    this.currentImageData = dataUrl;

    // Stop stream
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => track.stop());
      this.activeStream = null;
    }
    video.style.display = 'none';

    // Show captured image preview
    this.showImagePreview(dataUrl);
    this.runAnalysis(dataUrl);
  },

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.currentImageData = dataUrl;
      this.showImagePreview(dataUrl);
      this.runAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  },

  showImagePreview(dataUrl) {
    const previewImg = document.getElementById('captured-preview-img');
    const placeholder = document.getElementById('viewfinder-placeholder');
    const reticle = document.getElementById('reticle-overlay');
    const liveVideo = document.getElementById('live-video');
    const startBtn = document.getElementById('btn-start-camera');
    const snapBtn = document.getElementById('btn-snap-photo');

    if (liveVideo) liveVideo.style.display = 'none';
    if (placeholder) placeholder.style.display = 'none';
    if (reticle) reticle.style.display = 'block';
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (snapBtn) snapBtn.style.display = 'none';

    if (previewImg) {
      previewImg.src = dataUrl;
      previewImg.style.display = 'block';
    }
  },

  async runAnalysis(imageBase64) {
    const resultCard = document.getElementById('diag-result-container');
    if (!resultCard) return;

    resultCard.classList.add('active');
    resultCard.innerHTML = `
      <div style="text-align: center; padding: 24px;">
        <div style="display: inline-block; width: 28px; height: 28px; border: 3px solid var(--accent-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;"></div>
        <p style="font-size: 13px; font-weight: 700; color: #fff;">AI画像診断を実行中...</p>
        <p style="font-size: 11px; color: var(--text-muted);">スキャンメッシュ・エラー表示・表面状態をマニュアルと照合しています</p>
      </div>
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    `;

    const apiKey = localStorage.getItem('vl800_gemini_api_key') || '';

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64,
          clientApiKey: apiKey
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const result = await response.json();
      this.renderDiagnosticResult(result);

    } catch (err) {
      console.warn('API call failed, falling back to smart local rule matcher:', err);
      // Local fallback diagnosis
      const fallback = window.VL800_KB.faults[0];
      this.renderDiagnosticResult({
        issue_title: fallback.title,
        severity: fallback.severity,
        detected_symptoms: fallback.symptoms,
        root_cause: fallback.causes.join(' / '),
        step_by_step_fix: fallback.solutions,
        manual_citation: fallback.citation,
        estimated_fix_time: '約3分',
        source: 'local_offline'
      });
    }
  },

  renderDiagnosticResult(data) {
    const resultCard = document.getElementById('diag-result-container');
    if (!resultCard) return;

    const badgeClass = data.severity === 'critical' || data.severity === 'error' ? 'error' : 'warn';
    const stepsHtml = (data.step_by_step_fix || []).map(s => `<li>${s}</li>`).join('');

    resultCard.innerHTML = `
      <div class="diag-header">
        <div>
          <span class="badge ${badgeClass}">${data.severity ? data.severity.toUpperCase() : 'DIAGNOSIS'}</span>
          <h3 style="margin-top: 4px;">${data.issue_title || '診断完了'}</h3>
        </div>
        <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 600;">⏱ ${data.estimated_fix_time || '即時'}</span>
      </div>

      <div class="diag-section-label">検出された症状</div>
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${data.detected_symptoms || '画像から特徴を抽出しました'}</p>

      <div class="diag-section-label">推定原因</div>
      <div class="diag-cause-text">${data.root_cause || '測定条件またはアライメントの再確認が必要です。'}</div>

      <div class="diag-section-label" style="margin-top: 12px;">推奨対処手順</div>
      <ol class="diag-steps-list">
        ${stepsHtml}
      </ol>

      <div class="citation-badge">
        📘 ${data.manual_citation || 'VL-800 マニュアル'}
      </div>

      <div style="display: flex; gap: 8px; margin-top: 14px;">
        <button class="btn-secondary" onclick="window.VL800_App.switchTab('chat'); window.VL800_Chat.askPreset('この診断結果（${data.issue_title}）についてさらに詳しく教えて');">
          💬 AIに詳しく質問
        </button>
        <button class="btn-secondary" onclick="window.VL800_App.switchTab('manuals');">
          📖 マニュアルを開く
        </button>
      </div>
    `;
  },

  selectPresetFault(faultId) {
    const fault = window.VL800_KB.faults.find(f => f.id === faultId);
    if (!fault) return;

    window.VL800_App.switchTab('diagnostic');
    this.renderDiagnosticResult({
      issue_title: fault.title,
      severity: fault.severity,
      detected_symptoms: fault.symptoms,
      root_cause: fault.causes.join(' / '),
      step_by_step_fix: fault.solutions,
      manual_citation: fault.citation,
      estimated_fix_time: '約2〜5分',
      source: 'preset_knowledge'
    });
  }
};
