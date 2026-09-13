/**
 * JUNTOS NO AGRO - MODAIS INTERATIVOS
 * Gerencia os modais de Autenticação Admin, Edição de Conteúdo, Nova Categoria e Gestão do Mapa.
 */

import { StorageService } from '../storage.js';
import { AuthService } from '../auth.js';
import { SecurityService } from '../security.js';

export const ModalsComponent = {
  currentEditingContentId: null,
  tempCoverDataUrl: null,
  tempCatDataUrl: null,

  init() {
    this.bindAuthModalEvents();
    this.bindContentModalEvents();
    this.bindCategoryModalEvents();
    this.bindHeroMapModalEvents();

    // Eventos customizados
    window.addEventListener('open-login-modal', () => this.openLoginModal());
    window.addEventListener('open-new-content-modal', () => this.openContentModal(null));
    window.addEventListener('open-edit-content-modal', (e) => this.openContentModal(e.detail?.id));
    window.addEventListener('open-new-category-modal', () => this.openCategoryModal());
    window.addEventListener('open-hero-map-modal', () => this.openHeroMapModal());
  },

  /* =========================================================================
     1. MODAL DE AUTENTICAÇÃO / LOGIN ADMIN
     ========================================================================= */
  bindAuthModalEvents() {
    const modal = document.getElementById('modal-auth-login');
    const closeBtn = document.getElementById('btn-close-auth-modal');
    const form = document.getElementById('form-auth-login');
    const errorMsg = document.getElementById('auth-error-msg');

    if (!modal) return;

    const closeModal = () => {
      modal.classList.add('hidden');
      if (errorMsg) errorMsg.classList.add('hidden');
      if (form) form.reset();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const togglePassBtn = document.getElementById('btn-toggle-password-vis');
    const passInput = document.getElementById('auth-password');
    if (togglePassBtn && passInput) {
      togglePassBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.innerHTML = isPass 
          ? '<i data-lucide="eye-off" class="w-4 h-4"></i>'
          : '<i data-lucide="eye" class="w-4 h-4"></i>';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email')?.value || '';
        const password = document.getElementById('auth-password')?.value || '';
        const remember = document.getElementById('auth-remember')?.checked || false;

        const result = await AuthService.login(email, password, remember);

        if (result.success) {
          closeModal();
          if (window.app) {
            window.app.switchTab('admin');
          }
        } else {
          if (errorMsg) {
            errorMsg.textContent = result.error || 'Credenciais inválidas.';
            errorMsg.classList.remove('hidden');
          }
        }
      });
    }
  },

  openLoginModal() {
    const modal = document.getElementById('modal-auth-login');
    if (modal) {
      modal.classList.remove('hidden');
      document.getElementById('auth-email')?.focus();
    }
  },

  /* =========================================================================
     2. MODAL DE CONTEÚDO (CRIAR E EDITAR COM UPLOAD DE IMAGEM)
     ========================================================= */
  bindContentModalEvents() {
    const modal = document.getElementById('modal-content-editor');
    const closeBtn = document.getElementById('btn-close-content-modal');
    const cancelBtn = document.getElementById('btn-cancel-content-modal');
    const form = document.getElementById('form-content-editor');
    const fileInput = document.getElementById('content-cover-file');
    const previewImg = document.getElementById('content-cover-preview');

    if (!modal) return;

    const closeModal = () => {
      modal.classList.add('hidden');
      this.currentEditingContentId = null;
      this.tempCoverDataUrl = null;
      if (previewImg) previewImg.src = '';
      if (form) form.reset();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Upload seguro da foto de capa
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = SecurityService.validateFile(file, 'image');
        if (!validation.valid) {
          alert(validation.error);
          fileInput.value = '';
          return;
        }

        this.tempCoverDataUrl = await SecurityService.readFileAsDataURL(file);
        if (previewImg) {
          previewImg.src = this.tempCoverDataUrl;
          previewImg.classList.remove('hidden');
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('content-title')?.value;
        const category = document.getElementById('content-category')?.value;
        const media_type = document.getElementById('content-type')?.value;
        const reading_time = document.getElementById('content-reading-time')?.value;
        const description = document.getElementById('content-description')?.value;
        const media_url = document.getElementById('content-media-url')?.value;
        const is_featured = document.getElementById('content-is-featured')?.checked;

        if (!title || !category) {
          alert('Por favor, informe ao menos o título e a categoria do conteúdo.');
          return;
        }

        const dataPayload = {
          title,
          category,
          media_type,
          reading_time: reading_time || '10 min de leitura',
          description,
          media_url,
          is_featured: !!is_featured
        };

        if (this.tempCoverDataUrl) {
          dataPayload.image_url = this.tempCoverDataUrl;
        }

        if (this.currentEditingContentId) {
          // Edição de card existente
          StorageService.updateContent(this.currentEditingContentId, dataPayload);
          alert('Conteúdo atualizado com sucesso!');
        } else {
          // Novo card
          StorageService.addContent(dataPayload);
          alert('Novo conteúdo publicado com sucesso!');
        }

        closeModal();
      });
    }
  },

  openContentModal(contentId = null) {
    const modal = document.getElementById('modal-content-editor');
    const titleEl = document.getElementById('modal-content-title');
    const categorySelect = document.getElementById('content-category');
    const previewImg = document.getElementById('content-cover-preview');

    if (!modal) return;

    this.currentEditingContentId = contentId;
    this.tempCoverDataUrl = null;

    // Popula categorias
    if (categorySelect) {
      const cats = StorageService.getCategories();
      categorySelect.innerHTML = `
        <option value="">Selecione uma categoria...</option>
        ${cats.map(c => `<option value="${c.name}">${c.icon || '🌱'} ${c.name}</option>`).join('')}
      `;
    }

    if (contentId) {
      // Modo Edição
      if (titleEl) titleEl.textContent = 'Editar Conteúdo';
      const item = StorageService.getContents().find(c => c.id === contentId);
      if (item) {
        document.getElementById('content-title').value = item.title;
        document.getElementById('content-category').value = item.category;
        document.getElementById('content-type').value = item.media_type || 'article';
        document.getElementById('content-reading-time').value = item.reading_time || '10 min de leitura';
        document.getElementById('content-description').value = item.description || '';
        document.getElementById('content-media-url').value = item.media_url || '';
        document.getElementById('content-is-featured').checked = !!item.is_featured;

        if (item.image_url && previewImg) {
          previewImg.src = item.image_url;
          previewImg.classList.remove('hidden');
        } else if (previewImg) {
          previewImg.classList.add('hidden');
        }
      }
    } else {
      // Modo Novo
      if (titleEl) titleEl.textContent = 'Adicionar Novo Conteúdo';
      document.getElementById('form-content-editor')?.reset();
      if (previewImg) previewImg.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  /* =========================================================================
     3. MODAL DE CATEGORIA (CRIAR COM UPLOAD DE IMAGEM)
     ================================================= */
  bindCategoryModalEvents() {
    const modal = document.getElementById('modal-category-editor');
    const closeBtn = document.getElementById('btn-close-cat-modal');
    const cancelBtn = document.getElementById('btn-cancel-cat-modal');
    const form = document.getElementById('form-category-editor');
    const fileInput = document.getElementById('cat-cover-file');
    const previewImg = document.getElementById('cat-cover-preview');

    if (!modal) return;

    const closeModal = () => {
      modal.classList.add('hidden');
      this.tempCatDataUrl = null;
      if (previewImg) previewImg.src = '';
      if (form) form.reset();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = SecurityService.validateFile(file, 'image');
        if (!validation.valid) {
          alert(validation.error);
          fileInput.value = '';
          return;
        }

        this.tempCatDataUrl = await SecurityService.readFileAsDataURL(file);
        if (previewImg) {
          previewImg.src = this.tempCatDataUrl;
          previewImg.classList.remove('hidden');
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name')?.value;
        const description = document.getElementById('cat-description')?.value;
        const icon = document.getElementById('cat-icon')?.value;

        if (!name) {
          alert('Por favor, informe o nome da categoria.');
          return;
        }

        StorageService.addCategory({
          name,
          description,
          icon: icon || '🌱',
          image_url: this.tempCatDataUrl
        });

        alert(`Categoria "${name}" adicionada com sucesso!`);
        closeModal();
      });
    }
  },

  openCategoryModal() {
    const modal = document.getElementById('modal-category-editor');
    if (modal) {
      document.getElementById('form-category-editor')?.reset();
      const previewImg = document.getElementById('cat-cover-preview');
      if (previewImg) previewImg.classList.add('hidden');
      modal.classList.remove('hidden');
      document.getElementById('cat-name')?.focus();
    }
  },

  /* =========================================================================
     4. MODAL DO MAPA E HERO (EDITAR COORDENADAS E LOCAIS)
     ==================================================== */
  bindHeroMapModalEvents() {
    const modal = document.getElementById('modal-hero-map-editor');
    const closeBtn = document.getElementById('btn-close-map-modal');
    const cancelBtn = document.getElementById('btn-cancel-map-modal');
    const form = document.getElementById('form-hero-map-editor');
    const btnAddPoint = document.getElementById('btn-add-new-point');

    if (!modal) return;

    const closeModal = () => {
      modal.classList.add('hidden');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (btnAddPoint) {
      btnAddPoint.addEventListener('click', () => {
        const name = prompt('Nome da cidade e UF (ex: Campinas, SP):');
        if (!name || !name.trim()) return;

        const coordsStr = prompt('Coordenadas no formato Latitude, Longitude (ex: -22.905, -47.060):');
        if (!coordsStr) return;

        const parts = coordsStr.split(',').map(n => parseFloat(n.trim()));
        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
          alert('Coordenadas inválidas. Use o formato: -22.905, -47.060');
          return;
        }

        const settings = StorageService.getSettings();
        const points = settings.mapPoints || [];
        points.push({
          id: 'pt-' + Date.now(),
          name: name.trim(),
          coords: parts,
          active: true
        });

        StorageService.updateSettings({ mapPoints: points });
        this.renderMapPointsList();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const heroTitle = document.getElementById('edit-hero-title')?.value;
        const heroSubtitle = document.getElementById('edit-hero-subtitle')?.value;

        StorageService.updateSettings({
          heroTitle: heroTitle || 'Conectando Produtores em Todo o Brasil',
          heroSubtitle: heroSubtitle || ''
        });

        alert('Textos do Hero e Mapa atualizados com sucesso!');
        closeModal();
      });
    }
  },

  openHeroMapModal() {
    const modal = document.getElementById('modal-hero-map-editor');
    if (!modal) return;

    const settings = StorageService.getSettings();
    document.getElementById('edit-hero-title').value = settings.heroTitle || '';
    document.getElementById('edit-hero-subtitle').value = settings.heroSubtitle || '';

    this.renderMapPointsList();
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  renderMapPointsList() {
    const container = document.getElementById('map-points-editor-list');
    if (!container) return;

    const settings = StorageService.getSettings();
    const points = settings.mapPoints || [];

    container.innerHTML = `
      <div class="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
        ${points.map((p, idx) => `
          <div class="p-2.5 rounded-lg bg-muted/60 border border-border flex items-center justify-between text-xs">
            <div>
              <span class="font-semibold text-foreground">🌱 ${p.name}</span>
              <span class="text-[10px] text-muted-foreground block font-mono">[${p.coords.join(', ')}]</span>
            </div>
            <button type="button" class="btn-remove-point text-red-500 hover:text-red-700 p-1 rounded" data-index="${idx}" title="Remover ponto">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-remove-point').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const settings = StorageService.getSettings();
        const points = [...(settings.mapPoints || [])];
        points.splice(idx, 1);
        StorageService.updateSettings({ mapPoints: points });
        this.renderMapPointsList();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
};
