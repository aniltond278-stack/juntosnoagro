/**
 * JUNTOS NO AGRO - PAINEL DE GESTÃO DO ADMINISTRADOR
 * Contém os 4 KPIs em tempo real no topo, botões de ação rápida (+ Categoria e + Conteúdo),
 * gráficos analíticos, gerenciador de categorias e formulário Edite-Tudo institucional.
 * Polling automático a cada 5 segundos para sincronização de dúvidas e KPIs entre dispositivos.
 */

import { QuestionService, ChatService, StorageService } from '../storage.js';
import { AuthService } from '../auth.js';
import { SecurityService } from '../security.js';

let chartThemesInstance = null;
let chartDoubtsInstance = null;
let adminPollingId = null;

export const AdminPanelComponent = {
  init() {
    this.renderKPIs();
    this.renderQuickActions();
    this.renderCharts();
    this.renderCategoryManager();
    this.renderInstitutionalSettingsForm();
    this.bindEvents();
    this.startPolling();
  },

  startPolling() {
    if (adminPollingId) clearInterval(adminPollingId);
    adminPollingId = setInterval(async () => {
      try {
        await QuestionService.getQuestions();
        this.renderKPIs();
      } catch (_) {}
    }, 5000);
  },

  /**
   * Renderiza a linha com os 4 Cards de KPIs em tempo real
   */
  renderKPIs() {
    const container = document.getElementById('admin-kpis-container');
    if (!container) return;

    const kpis = StorageService.getKPIs();

    container.innerHTML = `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1: Total de Acessos -->
        <div class="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <i data-lucide="bar-chart-3" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Acessos</p>
            <p class="text-2xl font-black text-foreground mt-0.5">${kpis.totalAccesses.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <!-- KPI 2: Conteúdos Publicados -->
        <div class="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <i data-lucide="book-marked" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conteúdos Ativos</p>
            <p class="text-2xl font-black text-foreground mt-0.5">${kpis.publishedCount}</p>
          </div>
        </div>

        <!-- KPI 3: Dúvidas Pendentes -->
        <div class="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <i data-lucide="help-circle" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dúvidas Pendentes</p>
            <p class="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">${kpis.pendingDoubts}</p>
          </div>
        </div>

        <!-- KPI 4: Taxa de Resposta no Chat -->
        <div class="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <i data-lucide="message-circle" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxa no Chat</p>
            <p class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">${kpis.responseRate}%</p>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Posiciona os botões de ação rápida no topo do painel
   */
  renderQuickActions() {
    const container = document.getElementById('admin-quick-actions-top');
    if (!container) return;

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-2xl border border-border mb-6">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
          <span class="text-xs font-bold text-foreground">Ações Rápidas de Administração</span>
        </div>
        <div class="flex items-center gap-2.5">
          <button id="btn-admin-add-category" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary/90 transition shadow-sm">
            <i data-lucide="folder-plus" class="w-4 h-4"></i>
            <span>+ Categoria</span>
          </button>
          <button id="btn-admin-add-content" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover transition shadow-sm">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>+ Conteúdo</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-admin-add-category')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-new-category-modal'));
    });

    document.getElementById('btn-admin-add-content')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-new-content-modal'));
    });

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Renderiza os 2 gráficos analíticos do Painel
   */
  renderCharts() {
    const ctxThemes = document.getElementById('chart-themes-canvas');
    const ctxDoubts = document.getElementById('chart-doubts-canvas');

    if (!window.Chart) return;

    const contents = StorageService.getContents();
    const doubts = StorageService.getDoubts();

    // 1. Temas de conteúdo mais acessados
    const themeViews = {};
    contents.forEach(c => {
      const cat = c.category || 'Outros';
      themeViews[cat] = (themeViews[cat] || 0) + (c.views || 0);
    });

    const themeLabels = Object.keys(themeViews);
    const themeData = Object.values(themeViews);

    if (ctxThemes) {
      if (chartThemesInstance) chartThemesInstance.destroy();
      chartThemesInstance = new Chart(ctxThemes, {
        type: 'bar',
        data: {
          labels: themeLabels.length > 0 ? themeLabels : ['Sem dados'],
          datasets: [{
            label: 'Visualizações',
            data: themeData.length > 0 ? themeData : [0],
            backgroundColor: '#2E7D32',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 2. Dúvidas enviadas por categoria
    const doubtCounts = {};
    doubts.forEach(d => {
      const cat = d.category || 'Geral';
      doubtCounts[cat] = (doubtCounts[cat] || 0) + 1;
    });

    const doubtLabels = Object.keys(doubtCounts);
    const doubtData = Object.values(doubtCounts);

    if (ctxDoubts) {
      if (chartDoubtsInstance) chartDoubtsInstance.destroy();
      chartDoubtsInstance = new Chart(ctxDoubts, {
        type: 'bar',
        data: {
          labels: doubtLabels.length > 0 ? doubtLabels : ['Sem dados'],
          datasets: [{
            label: 'Dúvidas Enviadas',
            data: doubtData.length > 0 ? doubtData : [0],
            backgroundColor: '#F57F17',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  },

  /**
   * Gerenciador de Categorias (Criar, renomear e excluir)
   */
  renderCategoryManager() {
    const container = document.getElementById('admin-categories-manager');
    if (!container) return;

    const categories = StorageService.getCategories();

    container.innerHTML = `
      <div class="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-bold text-base text-foreground">Gerenciador de Categorias</h3>
            <p class="text-xs text-muted-foreground">Crie, renomeie ou remova categorias gerais do acervo</p>
          </div>
          <button id="btn-manager-add-cat" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition">
            + Nova Categoria
          </button>
        </div>

        <div class="divide-y divide-border">
          ${categories.map(c => `
            <div class="py-3 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-xl shrink-0">${c.icon || '🌱'}</span>
                <div class="truncate">
                  <p class="font-semibold text-xs text-foreground truncate">${c.name}</p>
                  <p class="text-[11px] text-muted-foreground truncate">${c.description || 'Sem descrição'}</p>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button class="btn-rename-cat p-1.5 text-muted-foreground hover:text-primary rounded" data-id="${c.id}" data-name="${c.name}">
                  <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button class="btn-delete-cat p-1.5 text-muted-foreground hover:text-red-600 rounded" data-id="${c.id}" data-name="${c.name}">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btn-manager-add-cat')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-new-category-modal'));
    });

    container.querySelectorAll('.btn-rename-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const currentName = btn.dataset.name;
        const newName = prompt('Novo nome para a categoria:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
          StorageService.updateCategory(id, { name: newName.trim() });
        }
      });
    });

    container.querySelectorAll('.btn-delete-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (confirm(`Tem certeza que deseja remover a categoria "${name}"?`)) {
          StorageService.deleteCategory(id);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Formulário Edite-Tudo: Configurações Institucionais, Contatos e Mapa
   */
  renderInstitutionalSettingsForm() {
    const container = document.getElementById('admin-settings-form-container');
    if (!container) return;

    const settings = StorageService.getSettings();

    container.innerHTML = `
      <form id="form-site-settings" class="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <div>
          <h3 class="font-bold text-base text-foreground">Configurações Institucionais e Edite-Tudo</h3>
          <p class="text-xs text-muted-foreground">Altere os dados exibidos no Header, Banner, Rodapé e Canais de Contato</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="font-semibold block mb-1">Nome do Projeto</label>
            <input type="text" id="set-project-name" value="${settings.projectName}" class="w-full h-9 rounded-lg border border-input bg-background px-3 focus:ring-1 focus:ring-primary" required />
          </div>

          <div>
            <label class="font-semibold block mb-1">Slogan (Header)</label>
            <input type="text" id="set-slogan" value="${settings.slogan}" class="w-full h-9 rounded-lg border border-input bg-background px-3 focus:ring-1 focus:ring-primary" required />
          </div>

          <div class="md:col-span-2">
            <label class="font-semibold block mb-1">Texto do Hero (Card Flutuante do Mapa)</label>
            <input type="text" id="set-hero-title" value="${settings.heroTitle}" class="w-full h-9 rounded-lg border border-input bg-background px-3 focus:ring-1 focus:ring-primary" required />
          </div>

          <div class="md:col-span-2">
            <label class="font-semibold block mb-1">Descrição do Banner / Rodapé</label>
            <textarea id="set-hero-subtitle" rows="2" class="w-full rounded-lg border border-input bg-background p-3 focus:ring-1 focus:ring-primary">${settings.heroSubtitle}</textarea>
          </div>

          <div>
            <label class="font-semibold block mb-1">Telefone / WhatsApp (com DDD)</label>
            <input type="text" id="set-phone" value="${settings.phone || '(88) 98117-1939'}" class="w-full h-9 rounded-lg border border-input bg-background px-3 focus:ring-1 focus:ring-primary" required />
          </div>

          <div>
            <label class="font-semibold block mb-1">E-mail Oficial</label>
            <input type="email" id="set-email" value="${settings.email || 'contato@juntosnoagro.com.br'}" class="w-full h-9 rounded-lg border border-input bg-background px-3 focus:ring-1 focus:ring-primary" required />
          </div>

          <div>
            <label class="font-semibold block mb-1">Instagram (@)</label>
            <input type="text" id="set-instagram" value="${settings.instagram || '@juntosnoagro'}" class="w-full h-9 rounded-lg border border-input bg-background px-3 focus:ring-1 focus:ring-primary" required />
          </div>

          <div>
            <label class="font-semibold block mb-1">Gerenciar Pontos do Mapa</label>
            <button type="button" id="btn-manage-map-points" class="w-full h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-2">
              <i data-lucide="map" class="w-3.5 h-3.5 text-primary"></i>
              <span>Editar Coordenadas do Mapa (${settings.mapPoints?.length || 0} locais)</span>
            </button>
          </div>
        </div>

        <div class="pt-3 border-t border-border flex justify-end">
          <button type="submit" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover transition shadow-sm flex items-center gap-2">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Salvar Alterações Globais</span>
          </button>
        </div>
      </form>
    `;

    const form = document.getElementById('form-site-settings');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        StorageService.updateSettings({
          projectName: document.getElementById('set-project-name').value,
          slogan: document.getElementById('set-slogan').value,
          heroTitle: document.getElementById('set-hero-title').value,
          heroSubtitle: document.getElementById('set-hero-subtitle').value,
          phone: document.getElementById('set-phone').value,
          email: document.getElementById('set-email').value,
          instagram: document.getElementById('set-instagram').value
        });
        alert('Configurações do site atualizadas com sucesso!');
      });
    }

    document.getElementById('btn-manage-map-points')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-hero-map-modal'));
    });

    if (window.lucide) window.lucide.createIcons();
  },

  bindEvents() {
    // Monitora eventos globais de atualização
  }
};
