/**
 * JUNTOS NO AGRO - MURAL DE DÚVIDAS (KANBAN)
 * Gerenciamento de dúvidas com colunas Pendente, Em Análise e Concluído,
 * modal de nova dúvida com upload seguro de fotos e vídeos, e controles de Admin.
 */

import { StorageService } from '../storage.js';
import { AuthService } from '../auth.js';
import { SecurityService } from '../security.js';

export const DoubtsComponent = {
  selectedAttachments: [],
  activeKanbanTab: 'pending',

  init() {
    this.renderMural();
    this.bindNewDoubtModalEvents();
  },

  renderMural() {
    const container = document.getElementById('doubts-kanban-board');
    if (!container) return;

    const doubts = StorageService.getDoubts();
    const isAdmin = AuthService.isAdmin();

    const columns = [
      { id: 'pending',   title: 'Pendente',   icon: 'clock',          color: 'amber',   bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/40' },
      { id: 'in_review', title: 'Em Análise', icon: 'search',         color: 'blue',    bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300/40' },
      { id: 'done',      title: 'Concluído',  icon: 'check-circle-2', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/40' }
    ];

    const activeTab = this.activeKanbanTab || 'pending';

    // --- Mobile: seletor de abas + coluna única ---
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
      const col = columns.find(c => c.id === activeTab);
      const colDoubts = doubts.filter(d => d.status === activeTab);
      return `
        <div class="md:hidden bg-card rounded-2xl border border-border flex flex-col shadow-sm overflow-hidden">
          <div class="p-3 space-y-3 overflow-y-auto max-h-[65vh] scrollbar-thin">
            ${colDoubts.length === 0 ? `
              <div class="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-border/70 rounded-xl text-xs text-muted-foreground">
                <i data-lucide="inbox" class="w-6 h-6 mb-1 opacity-40"></i>
                Nenhuma dúvida nesta etapa.
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
                    Nenhuma dúvida nesta etapa.
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

          <!-- Anexos de fotos/vídeos -->
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

          <!-- Ações Administrativas -->
          ${isAdmin ? `
            <div class="flex items-center gap-1">
              <select class="select-change-status text-[11px] rounded bg-muted px-1.5 py-0.5 border border-border focus:ring-1 focus:ring-primary" data-id="${doubt.id}">
                <option value="pending" ${doubt.status === 'pending' ? 'selected' : ''}>Pendente</option>
                <option value="in_review" ${doubt.status === 'in_review' ? 'selected' : ''}>Em Análise</option>
                <option value="done" ${doubt.status === 'done' ? 'selected' : ''}>Concluído</option>
              </select>
              <button class="btn-delete-doubt p-1 text-muted-foreground hover:text-red-600 rounded transition" data-id="${doubt.id}" title="Excluir dúvida">
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
      sel.addEventListener('change', (e) => {
        const id = sel.dataset.id;
        const newStatus = e.target.value;
        StorageService.updateDoubtStatus(id, newStatus);
      });
    });

    // Exclusão pelo Administrador
    container.querySelectorAll('.btn-delete-doubt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Deseja excluir esta dúvida do mural?')) {
          StorageService.deleteDoubt(id);
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
    const attachmentsPreview = document.getElementById('doubt-attachments-preview');

    if (!modal) return;

    const openModal = () => {
      this.selectedAttachments = [];
      this.renderAttachmentPreviews();
      // Atualiza categorias
      if (categorySelect) {
        const cats = StorageService.getCategories();
        categorySelect.innerHTML = `
          <option value="Geral">Geral</option>
          ${cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
        `;
      }
      modal.classList.remove('hidden');
    };

    const closeModal = () => {
      modal.classList.add('hidden');
      if (form) form.reset();
      this.selectedAttachments = [];
      this.renderAttachmentPreviews();
    };

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Upload seguro de Fotos
    if (fileInputPhotos) {
      fileInputPhotos.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          const validation = SecurityService.validateFile(file, 'image');
          if (!validation.valid) {
            alert(validation.error);
            continue;
          }
          const dataUrl = await SecurityService.readFileAsDataURL(file);
          this.selectedAttachments.push({
            name: file.name,
            url: dataUrl,
            type: 'image'
          });
        }
        this.renderAttachmentPreviews();
        fileInputPhotos.value = '';
      });
    }

    // Upload seguro de Vídeos
    if (fileInputVideos) {
      fileInputVideos.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
          const validation = SecurityService.validateFile(file, 'media');
          if (!validation.valid) {
            alert(validation.error);
            continue;
          }
          const dataUrl = await SecurityService.readFileAsDataURL(file);
          this.selectedAttachments.push({
            name: file.name,
            url: dataUrl,
            type: 'video'
          });
        }
        this.renderAttachmentPreviews();
        fileInputVideos.value = '';
      });
    }

    // Envio do formulário
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('doubt-title')?.value;
        const description = document.getElementById('doubt-description')?.value;
        const author_name = document.getElementById('doubt-author')?.value;
        const category = document.getElementById('doubt-category')?.value;

        if (!title || !description) {
          alert('Por favor, preencha o título e a descrição da sua dúvida.');
          return;
        }

        StorageService.addDoubt({
          title,
          description,
          author_name,
          category,
          attachments: this.selectedAttachments
        });

        alert('Sua dúvida foi enviada com sucesso para a equipe técnica!');
        closeModal();
      });
    }
  },

  renderAttachmentPreviews() {
    const container = document.getElementById('doubt-attachments-preview');
    if (!container) return;

    if (this.selectedAttachments.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="flex flex-wrap gap-2 pt-2">
        ${this.selectedAttachments.map((att, idx) => `
          <div class="relative group bg-muted rounded-lg p-1.5 border border-border flex items-center gap-1.5 text-xs">
            ${att.type === 'image' ? `
              <img src="${att.url}" class="w-8 h-8 rounded object-cover" alt="Preview" />
            ` : `
              <span class="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                <i data-lucide="video" class="w-4 h-4"></i>
              </span>
            `}
            <span class="truncate max-w-[120px] text-[11px] font-medium">${att.name}</span>
            <button type="button" class="btn-remove-att text-red-500 hover:text-red-700 p-0.5 rounded" data-index="${idx}">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-remove-att').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.selectedAttachments.splice(idx, 1);
        this.renderAttachmentPreviews();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
};
