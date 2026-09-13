/**
 * JUNTOS NO AGRO - CONTROLADOR PRINCIPAL DA APLICAÇÃO (APP.JS)
 * Coordena navegação por abas, sincronização de estado, reatividade e rodapé institucional.
 */

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { MapComponent } from './components/map.js';
import { CardsComponent } from './components/cards.js';
import { DoubtsComponent } from './components/doubts.js';
import { ChatComponent } from './components/chat.js';
import { AdminPanelComponent } from './components/admin.js';
import { ModalsComponent } from './components/modals.js';

class AppController {
  constructor() {
    this.activeTab = 'conteudo'; // 'conteudo' | 'duvidas' | 'chat' | 'admin'
    this.currentTheme = localStorage.getItem('juntos_agro_theme') || 'light';
    this.currentFontSize = localStorage.getItem('juntos_agro_fontsize') || 'md';
  }

  init() {
    // 1. Inicializa serviços centrais
    StorageService.init();
    AuthService.init();

    // 2. Aplica preferências salvas de tema e acessibilidade
    this.applyTheme(this.currentTheme);
    this.applyFontSize(this.currentFontSize);

    // 3. Inicializa componentes de forma resiliente e isolada
    const safeInit = (name, fn) => {
      try {
        fn();
      } catch (err) {
        console.error(`[AppController] Erro ao inicializar ${name}:`, err);
      }
    };

    safeInit('ModalsComponent', () => ModalsComponent.init());
    safeInit('CardsComponent', () => CardsComponent.init());
    safeInit('DoubtsComponent', () => DoubtsComponent.init());
    safeInit('ChatComponent', () => ChatComponent.init());
    safeInit('AdminPanelComponent', () => AdminPanelComponent.init());
    safeInit('MapComponent', () => MapComponent.init());

    // 4. Vincula eventos de navegação e interface
    safeInit('Navigation', () => this.bindNavigation());
    safeInit('HeaderAndPreferences', () => this.bindHeaderAndPreferences());
    safeInit('HeaderAndFooter', () => this.renderHeaderAndFooter());

    // 5. Ouve mudanças de autenticação e de dados (Reatividade Completa)
    AuthService.onAuthStateChanged(() => this.handleAuthChange());
    StorageService.subscribe((resource) => this.handleDataChange(resource));

    // Lucide Icons
    try {
      if (window.lucide) window.lucide.createIcons();
    } catch (_) {}
  }

  /* =========================================================================
     NAVEGAÇÃO POR ABAS
     ========================================================================= */
  bindNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Botão de rodapé para navegar
    document.querySelectorAll('.footer-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        this.switchTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Gaveta lateral mobile (Drawer)
    const btnToggleDrawer = document.getElementById('btn-mobile-menu-toggle');
    const btnCloseDrawer = document.getElementById('btn-close-mobile-drawer');
    const drawerBackdrop = document.getElementById('mobile-drawer-backdrop');
    const drawerMenu = document.getElementById('mobile-drawer-menu');

    const openDrawer = () => {
      if (drawerBackdrop && drawerMenu) {
        drawerBackdrop.classList.remove('hidden');
        drawerMenu.classList.remove('hidden');
        drawerMenu.classList.add('drawer-open');
        const theme = this.currentTheme || document.documentElement.getAttribute('data-theme') || 'light';
        drawerMenu.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
        drawerMenu.style.opacity = '1';
        document.body.style.overflow = 'hidden';
      }
    };

    const closeDrawer = () => {
      if (drawerBackdrop && drawerMenu) {
        drawerBackdrop.classList.add('hidden');
        drawerMenu.classList.add('hidden');
        drawerMenu.classList.remove('drawer-open');
        document.body.style.overflow = '';
      }
    };

    if (btnToggleDrawer) btnToggleDrawer.addEventListener('click', openDrawer);
    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

    // Botões dentro da gaveta mobile
    document.querySelectorAll('.mobile-drawer-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
        closeDrawer();
      });
    });
  }

  switchTab(tabId) {
    // Se tentar acessar aba admin sem estar logado, abre modal de login
    if (tabId === 'admin' && !AuthService.isAdmin()) {
      window.dispatchEvent(new CustomEvent('open-login-modal'));
      return;
    }

    this.activeTab = tabId;

    // Atualiza botões de navegação
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isCurrent = btn.dataset.tab === tabId;
      if (isCurrent) {
        btn.classList.remove('text-muted-foreground', 'hover:text-foreground');
        btn.classList.add('bg-card', 'text-primary', 'shadow-sm');
      } else {
        btn.classList.remove('bg-card', 'text-primary', 'shadow-sm');
        btn.classList.add('text-muted-foreground', 'hover:text-foreground');
      }
    });

    // Mostra/Oculta seções de conteúdo
    const sections = ['conteudo', 'duvidas', 'chat', 'admin'];
    sections.forEach(s => {
      const el = document.getElementById(`tab-content-${s}`);
      if (el) {
        if (s === tabId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    // Se mudou para conteúdo, redimensiona mapa
    if (tabId === 'conteudo') {
      setTimeout(() => MapComponent.refresh(), 100);
    }

    // Se mudou para admin, recalcula KPIs e gráficos
    if (tabId === 'admin') {
      AdminPanelComponent.renderKPIs();
      AdminPanelComponent.renderCharts();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  /* =========================================================================
     CABEÇALHO, PREFERÊNCIAS E RODAPÉ INSTITUCIONAL (EDITE-TUDO)
     ========================================================================= */
  renderHeaderAndFooter() {
    const settings = StorageService.getSettings();

    // Atualiza Header
    const projNameEl = document.getElementById('header-project-name');
    const sloganEl = document.getElementById('header-slogan');
    if (projNameEl) projNameEl.textContent = settings.projectName;
    if (sloganEl) sloganEl.textContent = settings.slogan;

    // Atualiza Banner Superior
    const bannerTitle = document.getElementById('hero-banner-title');
    const bannerSubtitle = document.getElementById('hero-banner-subtitle');
    if (bannerTitle) bannerTitle.textContent = settings.projectName;
    if (bannerSubtitle) bannerSubtitle.textContent = settings.heroSubtitle;

    // Atualiza Rodapé Institucional de 3 Colunas
    const footerAboutTitle = document.getElementById('footer-about-title');
    const footerAboutText = document.getElementById('footer-about-text');
    const footerInsta = document.getElementById('footer-instagram');
    const footerEmail = document.getElementById('footer-email');
    const footerPhone = document.getElementById('footer-phone');
    const footerWhatsappLink = document.getElementById('footer-whatsapp-link');

    if (footerAboutTitle) footerAboutTitle.textContent = settings.projectName;
    if (footerAboutText) footerAboutText.textContent = settings.description;

    if (footerInsta) {
      footerInsta.textContent = settings.instagram || '@juntosnoagro';
      footerInsta.href = `https://instagram.com/${(settings.instagram || 'juntosnoagro').replace('@', '')}`;
    }

    if (footerEmail) {
      footerEmail.textContent = settings.email || 'contato@juntosnoagro.com.br';
      footerEmail.href = `mailto:${settings.email || 'contato@juntosnoagro.com.br'}`;
    }

    const cleanPhone = (settings.phone || '88 98117-1939').replace(/\D/g, '');
    const phoneDisplay = settings.phone || '(88) 98117-1939';

    if (footerPhone) footerPhone.textContent = phoneDisplay;
    if (footerWhatsappLink) {
      footerWhatsappLink.href = `https://wa.me/55${cleanPhone}`;
    }
  }

  bindHeaderAndPreferences() {
    const btnPref = document.getElementById('btn-preferences-toggle');
    const menuPref = document.getElementById('preferences-dropdown');
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    const labelTheme = document.getElementById('label-current-theme');
    const btnFontSm = document.getElementById('btn-font-sm');
    const btnFontMd = document.getElementById('btn-font-md');
    const btnFontLg = document.getElementById('btn-font-lg');

    // Menu de preferências
    if (btnPref && menuPref) {
      btnPref.addEventListener('click', (e) => {
        e.stopPropagation();
        menuPref.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!menuPref.contains(e.target) && e.target !== btnPref) {
          menuPref.classList.add('hidden');
        }
      });
    }

    // Alternar tema
    const toggleThemeFn = () => {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);
    };

    if (btnToggleTheme) btnToggleTheme.addEventListener('click', toggleThemeFn);
    const btnDrawerToggleTheme = document.getElementById('btn-drawer-toggle-theme');
    if (btnDrawerToggleTheme) btnDrawerToggleTheme.addEventListener('click', toggleThemeFn);

    // Ajuste de tamanho de fonte
    if (btnFontSm) btnFontSm.addEventListener('click', () => this.applyFontSize('sm'));
    if (btnFontMd) btnFontMd.addEventListener('click', () => this.applyFontSize('md'));
    if (btnFontLg) btnFontLg.addEventListener('click', () => this.applyFontSize('lg'));
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('juntos_agro_theme', theme);
    const label = document.getElementById('label-current-theme');
    if (label) label.textContent = theme === 'light' ? 'Claro' : 'Escuro';
    const drawerLabel = document.getElementById('label-drawer-theme');
    if (drawerLabel) drawerLabel.textContent = theme === 'light' ? 'Claro' : 'Escuro';
    const drawerMenu = document.getElementById('mobile-drawer-menu');
    if (drawerMenu) {
      drawerMenu.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
      drawerMenu.style.opacity = '1';
    }
  }

  applyFontSize(size) {
    this.currentFontSize = size;
    localStorage.setItem('juntos_agro_fontsize', size);
    if (size === 'sm') document.documentElement.style.fontSize = '14px';
    else if (size === 'md') document.documentElement.style.fontSize = '16px';
    else if (size === 'lg') document.documentElement.style.fontSize = '18px';
  }

  /* =========================================================================
     TRATAMENTO DE AUTENTICAÇÃO E REATIVIDADE
     ========================================================================= */
  handleAuthChange() {
    const isAdmin = AuthService.isAdmin();
    const user = AuthService.getCurrentUser();

    // 1. Atualiza botões do cabeçalho
    const authBtnContainer = document.getElementById('header-auth-controls');
    if (authBtnContainer) {
      if (isAdmin) {
        authBtnContainer.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
              <span>Admin Conectado</span>
            </span>
            <button id="btn-header-logout" class="p-2 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition" title="Encerrar Sessão">
              <i data-lucide="log-out" class="w-4 h-4"></i>
            </button>
          </div>
        `;
        document.getElementById('btn-header-logout')?.addEventListener('click', () => {
          if (confirm('Deseja encerrar sua sessão de Administrador?')) {
            AuthService.logout();
            this.switchTab('conteudo');
          }
        });
      } else {
        authBtnContainer.innerHTML = `
          <button id="btn-header-login" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition">
            <i data-lucide="lock" class="w-3.5 h-3.5"></i>
            <span>Painel Admin</span>
          </button>
        `;
        document.getElementById('btn-header-login')?.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('open-login-modal'));
        });
      }
    }

    // 2. Mostra/oculta aba de Gestão na navegação superior e mobile
    const adminNavTab = document.getElementById('nav-tab-admin-item');
    const mobileDrawerAdminBtn = document.getElementById('mobile-drawer-admin-btn');
    const mobileBottomAdminBtn = document.getElementById('mobile-bottom-admin-btn');
    const mobileDrawerAuthArea = document.getElementById('mobile-drawer-auth-area');

    if (adminNavTab) {
      if (isAdmin) adminNavTab.classList.remove('hidden');
      else adminNavTab.classList.add('hidden');
    }

    if (mobileDrawerAdminBtn) {
      if (isAdmin) mobileDrawerAdminBtn.classList.remove('hidden');
      else mobileDrawerAdminBtn.classList.add('hidden');
    }

    if (mobileBottomAdminBtn) {
      if (isAdmin) mobileBottomAdminBtn.classList.remove('hidden');
      else mobileBottomAdminBtn.classList.add('hidden');
    }

    if (mobileDrawerAuthArea) {
      if (isAdmin) {
        mobileDrawerAuthArea.innerHTML = `
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold mb-1.5">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              <span>Administrador</span>
            </div>
            <button id="btn-mobile-drawer-logout" class="w-full py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 font-semibold text-xs transition flex items-center justify-center gap-1.5">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Encerrar Sessão
            </button>
          </div>
        `;
        document.getElementById('btn-mobile-drawer-logout')?.addEventListener('click', () => {
          AuthService.logout();
          this.switchTab('conteudo');
          document.getElementById('btn-close-mobile-drawer')?.click();
        });
      } else {
        mobileDrawerAuthArea.innerHTML = `
          <button id="btn-mobile-drawer-login" class="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover transition flex items-center justify-center gap-2 shadow-sm">
            <i data-lucide="lock" class="w-3.5 h-3.5"></i> Acessar Painel Admin
          </button>
        `;
        document.getElementById('btn-mobile-drawer-login')?.addEventListener('click', () => {
          document.getElementById('btn-close-mobile-drawer')?.click();
          window.dispatchEvent(new CustomEvent('open-login-modal'));
        });
      }
    }

    // 3. Atualiza componentes sensíveis a permissão
    CardsComponent.renderAllSections();
    DoubtsComponent.renderMural();
    ChatComponent.render();
    MapComponent.renderFloatingOverlay();

    if (window.lucide) window.lucide.createIcons();
  }

  handleDataChange(resource) {
    if (resource === 'settings') {
      this.renderHeaderAndFooter();
      MapComponent.refresh();
    } else if (resource === 'contents') {
      CardsComponent.renderAllSections();
      AdminPanelComponent.renderKPIs();
      AdminPanelComponent.renderCharts();
    } else if (resource === 'categories') {
      CardsComponent.populateCategoryFilterDropdown();
      AdminPanelComponent.renderCategoryManager();
    } else if (resource === 'doubts') {
      DoubtsComponent.renderMural();
      AdminPanelComponent.renderKPIs();
      AdminPanelComponent.renderCharts();
    } else if (resource === 'chat') {
      ChatComponent.render();
      AdminPanelComponent.renderKPIs();
    }
  }
}

// Inicializa a aplicação ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
});
