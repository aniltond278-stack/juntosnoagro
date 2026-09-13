/**
 * JUNTOS NO AGRO - MURAL DE DÃšVIDAS (KANBAN)
 * Gerenciamento de dÃºvidas com colunas Pendente, Em AnÃ¡lise e ConcluÃ­do,
 * modal de nova dÃºvida com upload seguro de fotos e vÃ­deos, e controles de Admin.
 * Tratamento robusto de estados de loading, error, isSubmitting e polling contÃ­nuo.
 */

import { QuestionService, StorageService } from '../storage.js';
import { AuthService } from '../auth.js';
import { SecurityService } from '../security.js';

export const DoubtsComponent = {
  selectedAttachments: [],
  activeKanbanTab: 'pending',
  isLoading: true,
  isSubmitting: false,
  error: null,
  pollingIntervalId: null,

  async init() {
    this.bindNewDoubtModalEvents();
    this.bindSyncButton();
    this.startPolling();
    await this.fetchData();
  },

  startPolling() {
    if (this.pollingIntervalId) clearInterval(this.pollingIntervalId);
    this.pollingIntervalId = setInterval(async () => {
      try {
        await QuestionService.getQuestions();
        if (!this.isLoading) {
          this.renderMural();
        }
      } catch (_) {}
    }, 5000);
  },

  async fetchData() {
    this.isLoading = true;
    this.error = null;
    this.renderMural();

    try {
      await QuestionService.getQuestions();
      this.isLoading = false;
      this.error = null;
    } catch (err) {
      console.error('[DoubtsComponent] Erro ao carregar dÃºvidas:', err);
      this.error = 'NÃ£o foi possÃ­vel carregar as dÃºvidas. Por favor, tente novamente.';
      this.isLoading = false;
    } finally {
      this.renderMural();
    }
  },

  bindSyncButton() {
    const syncBtn = document.getElementById('btn-sync-doubts-cloud');
    if (!syncBtn) return;

    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      syncBtn.classList.add('opacity-60');
      const badge = document.getElementById('cloud-sync-status-badge');
      if (badge) {
        badge.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-spin"></span>
          Sincronizando...
        `;
        badge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20';
      }

      await this.fetchData();

      setTimeout(() => {
        syncBtn.disabled = false;
        syncBtn.classList.remove('opacity-60');
        if (badge) {
          badge.innerHTML = `
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Nuvem Ativa
          `;
          badge.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
        }
      }, 500);
    });
  },

  renderMural() {
    const container = document.getElementById('doubts-kanban-board');
    if (!container) return;

    const columns = [
      { id: 'pending',   title: 'Pendente',   icon: 'clock',          color: 'amber',   bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/40' },
      { id: 'in_review', title: 'Em AnÃ¡lise', icon: 'search',         color: 'blue',    bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300/40' },
      { id: 'done',      title: 'ConcluÃ­do',  icon: 'check-circle-2', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/40' }
    ];

    // Estado 1: Erro de carregamento com botÃ£o de nova tentativa
    if (this.error) {
      container.innerHTML = `
        <div class="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-lg mx-auto">
          <i data-lucide="alert-triangle" class="w-8 h-8 text-red-500 mx-auto mb-2"></i>
          <p class="text-sm font-semibold text-red-700 dark:text-red-400 mb-4">${this.error}</p>
          <button id="btn-retry-fetch-doubts" class="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition shadow-sm">
            Tentar Novamente
          </button>
        </div>
      `;
      const retryBtn = document.getElementById('btn-retry-fetch-doubts');
      if (retryBtn) retryBtn.addEventListener('click', () => this.fetchData());
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Estado 2: Loading (Skeleton Loaders animados)
    if (this.isLoading) {
      const skeletonColumnHTML = `
        <div class="bg-card rounded-2xl border border-border p-4 space-y-3 animate-pulse">
          <div class="h-6 bg-muted rounded-lg w-1/3 mb-4"></div>
          <div class="h-28 bg-muted rounded-xl"></div>
          <div class="h-28 bg-muted rounded-xl"></div>
        </div>
      `;

      container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          ${skeletonColumnHTML}
          ${skeletonColumnHTML}
          ${skeletonColumnHTML}
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Estado 3: Dados carregados com sucesso
    const doubts = StorageService.getDoubts();
    const isAdmin = AuthService.isAdmin();
    const activeTab = this.activeKanbanTab || 'pending';

    // --- Mobile: seletor de abas + coluna Ãºnica ---
    const mobileTabsHTML = `
      <div class="md:hidden mb-4">
        <div class="flex rounded-xl overflow-hidden border border-border bg-muted/50">
          ${columns.map(col => {
            const count = doubts.filter(d => d.status === col.id).length;
            const isActive = col.id === activeTab;
            return `
              <button
                class="kanban-tab-btn flex-1 py-2.5 text-xs font-semibold flex flex-col items-center gap-0.5 transition-all
                  ${isActive ? 'bg-primary text-white shadow-inner' : 'text-muted-foreground hover:bg-muted'}"
                data-tab="${col.id}"
              >
                <i data-lucide="${col.icon}" class="w-3.5 h-3.5"></i>
                ${col.title}
                <span class="text-[10px] font-bold opacity-80">${count}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const mobileColumnHTML = (() => {
      const colDoubts = doubts.filter(d => d.status === activeTab);
      return `
        <div class="md:hidden bg-card rounded-2xl border border-border flex flex-col shadow-sm overflow-hidden">
          <div class="p-3 space-y-3 overflow-y-auto max-h-[65vh] scrollbar-thin">
            ${colDoubts.length === 0 ? `
              <div class="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-border/70 rounded-xl text-xs text-muted-foreground">
                <i data-lucide="inbox" class="w-6 h-6 mb-1 opacity-40"></i>
                Nenhuma dÃºvida nesta etapa.
              </div>
            ` : colDoubts.map(d => this.createDoubtCardHTML(d, isAdmin)).join('')}
          </div>
        </div>
      `;
    })();

    // --- Desktop: grid 3 colunas ---
    const desktopGridHTML = `
      <div class="hidden md:grid md:grid-cols-3 gap-5">
        ${columns.map(col => {
          const colDoubts = doubts.filter(d => d.status === col.id);
          return `
            <div class="bg-card rounded-2xl border border-border flex flex-col h-full shadow-sm overflow-hidden" data-column-status="${col.id}">
              <div class="p-3.5 border-b border-border flex items-center justify-between bg-muted/40">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center justify-center w-6 h-6 rounded-lg ${col.bg} text-xs font-bold">
                    <i data-lucide="${col.icon}" class="w-3.5 h-3.5"></i>
                  </span>
                  <h3 class="font-bold text-sm text-foreground">${col.title}</h3>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground">
                  ${colDoubts.length}
                </span>
              </div>
              <div class="p-3 space-y-3 flex-1 overflow-y-auto min-h-[350px] max-h-[620px] scrollbar-thin">
                ${colDoubts.length === 0 ? `
                  <div class="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-border/70 rounded-xl text-xs text-muted-foreground">
                    <i data-lucide="inbox" class="w-6 h-6 mb-1 opacity-40"></i>
                    Nenhuma dÃºvida nesta etapa.
                  </div>
                ` : colDoubts.map(d => this.createDoubtCardHTML(d, isAdmin)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = mobileTabsHTML + mobileColumnHTML + desktopGridHTML;

    // Eventos das abas mobile
    container.querySelectorAll('.kanban-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeKanbanTab = btn.dataset.tab;
        this.renderMural();
      });
    });

    this.attachDoubtCardEvents(container);
    if (window.lucide) window.lucide.createIcons();
  },

  createDoubtCardHTML(doubt, isAdmin) {
    const formattedDate = new Date(doubt.created_date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short'
    });

    const hasAttachments = doubt.attachments && doubt.attachments.length > 0;

    return `
      <div class="bg-background rounded-xl p-3.5 border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between group" data-doubt-id="${doubt.id}">
        <div>
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              ${doubt.category}
            </span>
            <span class="text-[11px] text-muted-foreground flex items-center gap-1">
              <i data-lucide="calendar" class="w-3 h-3"></i> ${formattedDate}
            </span>
          </div>

          <h4 class="font-semibold text-sm text-foreground leading-snug mb-1">
            ${doubt.title}
          </h4>

          <p class="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            ${doubt.description}
          </p>

          <!-- Anexos de fotos/vÃ­deos -->
          ${hasAttachments ? `
            <div class="mt-2.5 pt-2 border-t border-border/60">
              <span class="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1.5">
                <i data-lucide="paperclip" class="w-3 h-3"></i> ${doubt.attachments.length} anexo(s):
              </span>
              <div class="flex flex-wrap gap-1.5">
                ${doubt.attachments.map(att => `
                  <a href="${att.url}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-primary/10 text-[10px] text-foreground transition truncate max-w-[140px]">
                    <i data-lucide="${att.type === 'video' ? 'video' : 'image'}" class="w-3 h-3 text-primary shrink-0"></i>
                    <span class="truncate">${att.name}</span>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
          <span class="text-muted-foreground font-medium text-[11px] flex items-center gap-1">
            <i data-lucide="user" class="w-3 h-3"></i> ${doubt.author_name}
          </span>

          <!-- AÃ§Ãµes Administrativas -->
          ${isAdmin ? `
            <div class="flex items-center gap-1">
              <select class="select-change-status text-[11px] rounded bg-muted px-1.5 py-0.5 border border-border focus:ring-1 focus:ring-primary" data-id="${doubt.id}">
                <option value="pending" ${doubt.status === 'pending' ? 'selected' : ''}>Pendente</option>
                <option value="in_review" ${doubt.status === 'in_review' ? 'selected' : ''}>Em AnÃ¡lise</option>
                <option value="done" ${doubt.status === 'done' ? 'selected' : ''}>ConcluÃ­do</option>
              </select>
              <button class="btn-delete-doubt p-1 text-muted-foreground hover:text-red-600 rounded transition" data-id="${doubt.id}" title="Excluir dÃºvida">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  attachDoubtCardEvents(container) {
    // Troca de status pelo Administrador
    container.querySelectorAll('.select-change-status').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = sel.dataset.id;
        const newStatus = e.target.value;
        try {
          await QuestionService.updateQuestionStatus(id, newStatus);
        } catch (err) {
          console.error('[DoubtsComponent] Erro ao atualizar status:', err);
        }
      });
    });

    // ExclusÃ£o pelo Administrador
    container.querySelectorAll('.btn-delete-doubt').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Deseja excluir esta dÃºvida do mural?')) {
          try {
            await QuestionService.deleteQuestion(id);
          } catch (err) {
            console.error('[DoubtsComponent] Erro ao excluir dÃºvida:', err);
          }
        }
      });
    });
  },

  bindNewDoubtModalEvents() {
    const modal = document.getElementById('modal-new-doubt');
    const openBtn = document.getElementById('btn-open-new-doubt');
    const closeBtn = document.getElementById('btn-close-new-doubt');
    const cancelBtn = document.getElementById('btn-cancel-new-doubt');
    const form = document.getElementById('form-new-doubt');
    const categorySelect = document.getElementById('doubt-category');
    const fileInputPhotos = document.getElementById('doubt-file-photos');
    const fileInputVideos = document.getElementById('doubt-file-videos');
    const previewContainer = document.getElementById('doubt-attachments-preview');

    if (!modal || !form) return;

    // Popula dropdown de categorias
    const populateCategories = () => {
      const categories = StorageService.getCategories();
      if (categorySelect) {
        categorySelect.innerHTML = categories.map(c => `
          <option value="${c.name}">${c.icon || 'ðŸŒ±'} ${c.name}</option>
        `).join('');
      }
    };

    const openModal = () => {
      populateCategories();
      this.selectedAttachments = [];
      if (previewContainer) previewContainer.innerHTML = '';
      form.reset();
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    };

    const closeModal = () => {
      modal.classList.add('hidden');
      this.selectedAttachments = [];
      if (previewContainer) previewContainer.innerHTML = '';
      form.reset();
    };

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Fechar ao clicar no backdrop
    modal.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);

    // Upload de Fotos
    if (fileInputPhotos) {
      fileInputPhotos.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          const val = SecurityService.validateFile(file, 'image');
          if (!val.valid) {
            alert(val.error);
            continue;
          }
          const url = await SecurityService.readFileAsDataURL(file);
          this.selectedAttachments.push({ name: file.name, url, type: 'image' });
        }
        this.renderAttachmentsPreview(previewContainer);
        fileInputPhotos.value = '';
      });
    }

    // Upload de VÃ­deos
    if (fileInputVideos) {
      fileInputVideos.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          const val = SecurityService.validateFile(file, 'video');
          if (!val.valid) {
            alert(val.error);
            continue;
          }
          const url = await SecurityService.readFileAsDataURL(file);
          this.selectedAttachments.push({ name: file.name, url, type: 'video' });
        }
        this.renderAttachmentsPreview(previewContainer);
        fileInputVideos.value = '';
      });
    }

    // SubmissÃ£o do FormulÃ¡rio com bloqueio do botÃ£o e atualizaÃ§Ã£o imediata
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isSubmitting) return;

      const titleInput = document.getElementById('doubt-title');
      const authorInput = document.getElementById('doubt-author');
      const descInput = document.getElementById('doubt-description');
      const submitBtn = form.querySelector('button[type="submit"]');

      const title = titleInput?.value?.trim();
      const description = descInput?.value?.trim();
      const author_name = authorInput?.value?.trim() || 'Produtor Rural';
      const category = categorySelect?.value || 'Geral';

      if (!title || !description) {
        alert('Por favor, preencha o tÃ­tulo e a descriÃ§Ã£o da sua dÃºvida.');
        return;
      }

      this.isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-60', 'cursor-not-allowed');
        submitBtn.innerHTML = `
          <span class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
          Enviando dÃºvida...
        `;
      }

      try {
        await QuestionService.addQuestion({
          title,
          description,
          author_name,
          category,
          attachments: this.selectedAttachments
        });

        closeModal();
        await this.fetchData();
      } catch (err) {
        console.error('[DoubtsComponent] Erro ao enviar dÃºvida:', err);
        alert('Ocorreu um erro ao enviar sua dÃºvida. Por favor, tente novamente.');
      } finally {
        this.isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
          submitBtn.innerHTML = 'Enviar DÃºvida';
        }
      }
    });
  },

  renderAttachmentsPreview(container) {
    if (!container) return;
    if (this.selectedAttachments.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="mt-2.5 space-y-1.5">
        <span class="text-[11px] font-semibold text-muted-foreground block">Arquivos selecionados (${this.selectedAttachments.length}):</span>
        <div class="flex flex-wrap gap-2">
          ${this.selectedAttachments.map((att, idx) => `
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-xs text-foreground">
              <i data-lucide="${att.type === 'video' ? 'video' : 'image'}" class="w-3.5 h-3.5 text-primary"></i>
              <span class="truncate max-w-[140px] text-[11px]">${att.name}</span>
              <button type="button" class="btn-remove-att text-muted-foreground hover:text-red-500 ml-1 p-0.5" data-idx="${idx}">
                <i data-lucide="x" class="w-3 h-3"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-remove-att').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.selectedAttachments.splice(idx, 1);
        this.renderAttachmentsPreview(container);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
};
