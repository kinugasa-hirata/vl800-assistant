// Main Application Orchestrator for Keyence VL-800 Mobile Assistant

window.VL800_App = {
  currentTab: 'home',

  init() {
    console.log('[VL-800 Assist] App initializing...');

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
        .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
    }

    // Tab Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Settings Modal
    const settingsBtn = document.getElementById('btn-open-settings');
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('btn-close-settings');
    const saveApiKeyBtn = document.getElementById('btn-save-apikey');
    const apiKeyInput = document.getElementById('input-gemini-api-key');

    if (settingsBtn && modal) {
      settingsBtn.addEventListener('click', () => {
        if (apiKeyInput) {
          apiKeyInput.value = localStorage.getItem('vl800_gemini_api_key') || '';
        }
        modal.classList.add('active');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (saveApiKeyBtn && apiKeyInput && modal) {
      saveApiKeyBtn.addEventListener('click', () => {
        localStorage.setItem('vl800_gemini_api_key', apiKeyInput.value.trim());
        alert('APIキー設定を保存しました。');
        modal.classList.remove('active');
      });
    }

    // Manual Search Filter
    const searchInput = document.getElementById('manual-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        window.VL800_Wizard.renderManualsList(e.target.value.trim());
      });
    }

    // Initialize Submodules
    if (window.VL800_Diagnostic) window.VL800_Diagnostic.init();
    if (window.VL800_Chat) window.VL800_Chat.init();
    if (window.VL800_Wizard) window.VL800_Wizard.init();

    // Check Network Status
    this.updateOnlineStatus();
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
  },

  switchTab(tabId) {
    if (!tabId) return;
    this.currentTab = tabId;

    // Update Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Views
    document.querySelectorAll('.tab-view').forEach(view => {
      if (view.id === `view-${tabId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Scroll to top
    const content = document.querySelector('.app-content');
    if (content) content.scrollTop = 0;
  },

  updateOnlineStatus() {
    const pill = document.getElementById('connection-status-pill');
    if (!pill) return;

    if (navigator.onLine) {
      pill.innerHTML = `<span class="status-dot"></span> オフライン対応`;
      pill.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    } else {
      pill.innerHTML = `<span class="status-dot" style="background: #F59E0B;"></span> オフライン稼働中`;
      pill.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.VL800_App.init();
});
