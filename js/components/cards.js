/**
 * JUNTOS NO AGRO - GERENCIADOR DE CARDS DE CONTEÚDO E FILTROS
 * Implementa badges de formato, tempo estimado, borda dourada e selo de especialista,
 * botões de editar/excluir para Admin e correção do filtro de busca padrão.
 */

import { StorageService } from '../storage.js';
import { AuthService } from '../auth.js';

// Mapeamento de formatos com badges e ícones
export const FORMAT_BADGES = {
  video: { label: 'Videoaula', icon: 'video', emoji: '🎥', bg: 'bg-red-50 text-red-700 border-red-200' },
  pdf: { label: 'Guia PDF', icon: 'file-text', emoji: '📄', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  article: { label: 'Artigo Técnico', icon: 'book-open', emoji: '🔬', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  manual: { label: 'Manual Prático', icon: 'file-check', emoji: '📖', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
};

export const CardsComponent = {
  activeSearchQuery: '',
  selectedCategory: 'all',

  init() {
    this.bindEvents();
    this.renderAllSections();
  },

  bindEvents() {
    const searchInput = document.getElementById('content-search-input');
    const categorySelect = document.getElementById('content-category-filter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.activeSearchQuery = e.target.value.trim().toLowerCase();
        this.renderExploreSection();
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.renderExploreSection();
      });
    }
  },

  renderAllSections() {
    this.populateCategoryFilterDropdown();
    this.renderFeaturedSection();
    this.renderRecentSection();
    this.renderExploreSection();
  },

  populateCategoryFilterDropdown() {
    const select = document.getElementById('content-category-filter');
    if (!select) return;

    const categories = StorageService.getCategories();
    const currentValue = this.selectedCategory;

    select.innerHTML = `
      <option value="all">Todas as categorias (${StorageService.getContents().length})</option>
      ${categories.map(c => `
        <option value="${c.name}" ${currentValue === c.name ? 'selected' : ''}>
          ${c.icon || '🌱'} ${c.name}
        </option>
      `).join('')}
    `;
  },

  /**
   * Renderiza os cards marcados como Destaque / Referência
   */
  renderFeaturedSection() {
    const container = document.getElementById('featured-contents-container');
    if (!container) return;

    const allContents = StorageService.getContents();
    const featured = allContents.filter(c => c.is_featured);

    if (featured.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-8 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-dashed border-border p-6">
          <i data-lucide="star" class="w-8 h-8 mx-auto text-amber-400 mb-2 opacity-60"></i>
          Nenhum conteúdo marcado como destaque no momento.
        </div>
      `;
      return;
    }

    container.innerHTML = featured.map(item => this.createCardHTML(item, true)).join('');
    this.attachCardActions(container);
    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Renderiza os 4 a 8 conteúdos adicionados recentemente
   */
  renderRecentSection() {
    const container = document.getElementById('recent-contents-container');
    if (!container) return;

    const allContents = StorageService.getContents();
    const recent = allContents.slice(0, 8);

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-8 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-dashed border-border p-6">
          Nenhum conteúdo publicado ainda.
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(item => this.createCardHTML(item, false)).join('');
    this.attachCardActions(container);
    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Correção: exibe por padrão a lista INTEIRA de materiais cadastrados.
   * "Nenhum resultado encontrado" só aparece quando uma busca ativa não retornar nada.
   */
  renderExploreSection() {
    const container = document.getElementById('explore-contents-container');
    const emptyMsg = document.getElementById('explore-empty-message');
    if (!container) return;

    const allContents = StorageService.getContents();
    const query = this.activeSearchQuery;
    const cat = this.selectedCategory;

    // Filtra apenas se houver busca ou categoria selecionada
    const filtered = allContents.filter(item => {
      const matchText = !query || 
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));

      const matchCat = cat === 'all' || item.category === cat;

      return matchText && matchCat;
    });

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyMsg) {
        emptyMsg.classList.remove('hidden');
        emptyMsg.innerHTML = `
          <div class="py-12 text-center">
            <i data-lucide="search-x" class="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-50"></i>
            <p class="font-medium text-foreground">Nenhum resultado encontrado</p>
            <p class="text-xs text-muted-foreground mt-1">Nenhum conteúdo corresponde à sua busca por "${query}". Tente outros termos.</p>
          </div>
        `;
      }
    } else {
      if (emptyMsg) emptyMsg.classList.add('hidden');
      container.innerHTML = filtered.map(item => this.createCardHTML(item, item.is_featured)).join('');
      this.attachCardActions(container);
    }

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Gera o HTML estruturado de um Card com todos os badges, selo de especialista e botões de admin
   */
  createCardHTML(item, isFeatured) {
    const isAdmin = AuthService.isAdmin();
    const format = FORMAT_BADGES[item.media_type] || FORMAT_BADGES.article;
    const readingTime = item.reading_time || '10 min de leitura';

    return `
      <div class="group relative bg-card rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col ${
        isFeatured ? 'featured-card-border ring-1 ring-amber-500/30' : 'border-border hover:border-primary/40'
      }" data-content-id="${item.id}">
        
        <!-- Topo da Capa com Imagem e Badges Flutuantes -->
        <div class="relative h-44 w-full overflow-hidden bg-muted/60">
          <img 
            src="${item.image_url || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop'}" 
            alt="${item.title}"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onerror="this.src='https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none"></div>

          <!-- Badge de Formato no Topo Esquerdo -->
          <div class="absolute top-3 left-3 z-10">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm backdrop-blur-md bg-white/90 text-gray-900 dark:bg-gray-900/90 dark:text-gray-100 border border-white/20">
              <span>${format.emoji}</span>
              <span>${format.label}</span>
            </span>
          </div>

          <!-- Selo Recomendado pelo Especialista no Topo Direito (se destaque) -->
          ${isFeatured ? `
            <div class="absolute top-3 right-3 z-10">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-400/40">
                <i data-lucide="award" class="w-3.5 h-3.5 text-yellow-200"></i>
                Recomendado pelo Especialista
              </span>
            </div>
          ` : ''}

          <!-- Botões de Ação do Administrador (Editar e Excluir) -->
          ${isAdmin ? `
            <div class="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-black/65 backdrop-blur-md rounded-xl p-1 shadow-lg border border-white/20">
              <button 
                class="btn-edit-card p-1.5 rounded-lg bg-white/10 text-white hover:bg-primary hover:text-white transition text-xs flex items-center gap-1"
                title="Editar este conteúdo"
                data-id="${item.id}"
              >
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                <span class="text-[11px] font-medium pr-1">Editar</span>
              </button>
              <button 
                class="btn-delete-card p-1.5 rounded-lg bg-white/10 text-red-300 hover:bg-red-600 hover:text-white transition text-xs flex items-center gap-1"
                title="Excluir este conteúdo"
                data-id="${item.id}"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Corpo do Card -->
        <div class="p-4 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                ${item.category}
              </span>
              <span class="text-[11px] text-muted-foreground flex items-center gap-1">
                <i data-lucide="eye" class="w-3 h-3"></i> ${item.views || 0} acessos
              </span>
            </div>

            <h3 class="font-bold text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              ${item.title}
            </h3>

            <p class="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
              ${item.description}
            </p>
          </div>

          <!-- Rodapé do Card com Tempo Estimado e Acessar -->
          <div class="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span class="text-muted-foreground flex items-center gap-1 font-medium">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-muted-foreground"></i>
              ${readingTime}
            </span>

            <button 
              class="btn-access-content inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover hover:underline"
              data-id="${item.id}"
              data-url="${item.media_url || ''}"
            >
              <span>Acessar</span>
              <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Conecta eventos nos botões de cada card
   */
  attachCardActions(container) {
    // Botão Acessar
    container.querySelectorAll('.btn-access-content').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        const url = btn.dataset.url;
        StorageService.incrementContentView(id);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          // Modal de visualização completa
          window.dispatchEvent(new CustomEvent('view-content-detail', { detail: { id } }));
        }
      });
    });

    // Botão Editar (Admin)
    container.querySelectorAll('.btn-edit-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        window.dispatchEvent(new CustomEvent('open-edit-content-modal', { detail: { id } }));
      });
    });

    // Botão Excluir (Admin)
    container.querySelectorAll('.btn-delete-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        if (confirm('Tem certeza que deseja excluir este conteúdo técnico? Esta ação é irreversível.')) {
          StorageService.deleteContent(id);
        }
      });
    });
  }
};
