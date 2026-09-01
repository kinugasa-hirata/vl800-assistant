// Interactive Step-by-Step Workflow & Calibration Wizard Module

window.VL800_Wizard = {
  currentWorkflowId: 'scan_acq',

  init() {
    this.renderWorkflowList();
    this.renderWorkflowDetail('scan_acq');
    this.renderManualsList();
    this.renderFaultPresets();
  },

  renderWorkflowList() {
    const container = document.getElementById('workflow-selector-chips');
    if (!container) return;

    container.innerHTML = window.VL800_KB.workflows.map(wf => `
      <div class="chip ${wf.id === this.currentWorkflowId ? 'active' : ''}" onclick="window.VL800_Wizard.renderWorkflowDetail('${wf.id}')">
        ${wf.badge}
      </div>
    `).join('');
  },

  renderWorkflowDetail(wfId) {
    this.currentWorkflowId = wfId;
    this.renderWorkflowList();

    const wf = window.VL800_KB.workflows.find(w => w.id === wfId);
    const container = document.getElementById('workflow-detail-container');
    if (!container || !wf) return;

    const stepsHtml = wf.steps.map(s => `
      <div class="step-card">
        <div class="step-header">
          <div class="step-number">${s.num}</div>
          <div class="step-title">${s.title}</div>
        </div>
        <div class="step-desc">${s.desc}</div>
        ${s.tip ? `<div class="step-tip">💡 <strong>Point:</strong> ${s.tip}</div>` : ''}
      </div>
    `).join('');

    container.innerHTML = `
      <div style="margin-bottom: 14px;">
        <span class="badge info">${wf.badge}</span>
        <h2 style="font-size: 16px; font-weight: 800; color: #fff; margin-top: 4px;">${wf.title}</h2>
        <p style="font-size: 11px; color: var(--text-muted);">${wf.subtitle}</p>
        <div class="citation-badge" style="margin-top: 6px;">📘 ${wf.doc}</div>
      </div>
      <div class="wizard-steps">
        ${stepsHtml}
      </div>
    `;
  },

  renderManualsList(filter = '') {
    const container = document.getElementById('manuals-list-container');
    if (!container) return;

    const filtered = window.VL800_KB.manuals.filter(m => 
      !filter || m.title.includes(filter) || m.code.toLowerCase().includes(filter.toLowerCase()) || m.tag.includes(filter)
    );

    container.innerHTML = filtered.map(m => `
      <div class="action-card" onclick="window.VL800_App.switchTab('chat'); window.VL800_Chat.askPreset('${m.title}の内容や手順を詳しく教えて');">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="badge info">${m.code}</span>
          <span style="font-size: 11px; color: var(--text-muted);">${m.pages} ページ</span>
        </div>
        <div class="card-info" style="margin-top: 4px;">
          <h3 style="color: #fff; font-size: 14px;">${m.title}</h3>
          <p style="color: var(--text-secondary);">${m.subtitle}</p>
        </div>
      </div>
    `).join('');
  },

  renderFaultPresets() {
    const container = document.getElementById('home-fault-list');
    if (!container) return;

    container.innerHTML = window.VL800_KB.faults.slice(0, 4).map(f => `
      <div class="fault-card" onclick="window.VL800_Diagnostic.selectPresetFault('${f.id}')">
        <div class="fault-header">
          <span class="badge ${f.severity === 'error' ? 'error' : 'warn'}">${f.category}</span>
          <span style="font-size: 10px; color: var(--accent-cyan);">対処法を見る →</span>
        </div>
        <div class="fault-title">${f.title}</div>
        <div class="fault-symptom">${f.symptoms}</div>
      </div>
    `).join('');
  }
};
