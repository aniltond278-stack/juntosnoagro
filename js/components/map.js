/**
 * JUNTOS NO AGRO - MAPA INTERATIVO E HERO OVERLAY COM GEOLOCALIZAÇÃO REAL (GPS)
 * Leaflet com tiles OpenStreetMap, marcadores reais calculados dinamicamente do banco de dados,
 * overlay dinâmico (sem dados fictícios), rastreamento GPS real do visitante e
 * prevenção contra captura indevida de rolagem mobile (Scroll Trap prevention).
 */

import { StorageService } from '../storage.js';
import { AuthService } from '../auth.js';

let leafletMap = null;
let markersLayer = null;
let linesLayer = null;

export const MapComponent = {
  userLocationMarker: null,
  userLocationLine: null,
  userLocation: null,
  isInteracting: false,

  init(containerId = 'agro-map-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[MapComponent] Contêiner #${containerId} não encontrado no DOM.`);
      return;
    }

    // Garante a renderização do card flutuante sempre
    try {
      this.renderFloatingOverlay();
    } catch (overlayErr) {
      console.error('[MapComponent] Falha ao renderizar overlay flutuante:', overlayErr);
    }

    // Verificação de disponibilidade da biblioteca global Leaflet (L)
    if (typeof window.L === 'undefined' || !window.L || !window.L.map) {
      console.warn('[MapComponent] Biblioteca Leaflet (L) não carregada ou bloqueada. Ativando fallback estático.');
      this.renderFallbackMap(container);
      return;
    }

    try {
      // Garante dimensões computadas no contêiner antes de montar o Leaflet
      container.style.height = '100%';
      container.style.minHeight = '350px';

      const settings = StorageService.getSettings();
      const points = settings.mapPoints || [];

      if (leafletMap) {
        try {
          leafletMap.remove();
        } catch (removeErr) {
          console.warn('[MapComponent] Aviso ao remover instância anterior do mapa:', removeErr);
        }
        leafletMap = null;
      }

      // Detecção de mobile para prevenir scroll trap no toque
      const isMobile = (window.L.Browser && window.L.Browser.mobile) || window.innerWidth < 768;
      this.isInteracting = !isMobile;

      // Permite rolagem vertical nativa da página sem prender o dedo quando travado
      container.style.touchAction = isMobile ? 'pan-y' : 'auto';

      // Inicializa o mapa com coordenadas padrão centralizadas no Brasil (zoom 4)
      leafletMap = window.L.map(containerId, {
        center: [-14.2350, -51.9253],
        zoom: 4,
        zoomControl: false,
        scrollWheelZoom: false, // Desativado para não capturar a rolagem do mouse
        dragging: !isMobile,     // Desativado por padrão no mobile
        touchZoom: !isMobile,    // Desativado por padrão no mobile
        tap: !isMobile,          // Desativado por padrão no mobile
        attributionControl: false
      });

      // Camada de Tiles limpa OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(leafletMap);

      // Camadas de marcadores e linhas
      markersLayer = window.L.layerGroup().addTo(leafletMap);
      linesLayer = window.L.layerGroup().addTo(leafletMap);

      // Renderiza apenas marcadores reais cadastrados
      this.renderMarkersAndLines(points);

      // Configura botão de alternância de interação para telas touch
      this.setupInteractionToggle();

      // Solicita geolocalização nativa real do visitante
      this.requestUserGeolocation();

      // Ajusta redimensionamento defensivo após montagem no DOM
      setTimeout(() => {
        if (leafletMap) {
          try { leafletMap.invalidateSize(); } catch (_) {}
        }
      }, 300);

      window.addEventListener('resize', () => {
        if (leafletMap) {
          try { leafletMap.invalidateSize(); } catch (_) {}
        }
      });
    } catch (err) {
      console.error('[MapComponent] Erro capturado ao montar o Leaflet Map:', err);
      this.renderFallbackMap(container);
    }
  },

  /**
   * Configura o botão de alternar interação no mapa (evita scroll trap no mobile)
   */
  setupInteractionToggle() {
    const toggleBtn = document.getElementById('btn-toggle-map-interaction');
    const container = document.getElementById('agro-map-container');
    if (!toggleBtn) return;

    // Atualiza o visual do botão
    const updateButtonUI = (btn) => {
      const iconEl = btn.querySelector('#map-interaction-icon');
      const textEl = btn.querySelector('#map-interaction-text');

      if (this.isInteracting) {
        if (iconEl) iconEl.textContent = '🔒';
        if (textEl) textEl.textContent = 'Travar Mapa';
        btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white border border-primary shadow-lg text-xs font-bold transition select-none';
        if (container) container.style.touchAction = 'none';
      } else {
        if (iconEl) iconEl.textContent = '🔓';
        if (textEl) textEl.textContent = 'Interagir com o Mapa';
        btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/95 dark:bg-card/95 backdrop-blur-md border border-border text-foreground shadow-lg text-xs font-semibold hover:bg-card transition select-none';
        if (container) container.style.touchAction = 'pan-y';
      }
    };

    updateButtonUI(toggleBtn);

    // Substitui nó para garantir event listener limpo sem duplicidade
    const newBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!leafletMap) return;

      this.isInteracting = !this.isInteracting;

      if (this.isInteracting) {
        leafletMap.dragging.enable();
        if (leafletMap.touchZoom) leafletMap.touchZoom.enable();
        if (leafletMap.tap) leafletMap.tap.enable();
      } else {
        leafletMap.dragging.disable();
        if (leafletMap.touchZoom) leafletMap.touchZoom.disable();
        if (leafletMap.tap) leafletMap.tap.disable();
      }

      updateButtonUI(newBtn);
    });
  },

  renderFallbackMap(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="w-full h-full min-h-[350px] flex flex-col items-center justify-center bg-emerald-950 text-white p-6 text-center select-none">
        <span class="text-4xl mb-3">🌾</span>
        <h4 class="text-lg font-bold text-emerald-300">Rede Nacional Juntos no Agro</h4>
        <p class="text-xs text-emerald-100/80 max-w-md mt-1">Conectando produtores, especialistas e pesquisadores em todo o território brasileiro.</p>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-[11px] font-semibold text-emerald-200 mt-4 border border-emerald-700">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Rede Conectada ao Vivo
        </span>
      </div>
    `;
  },

  /**
   * Solicita a geolocalização real do visitante via API nativa do navegador
   */
  requestUserGeolocation() {
    if (!navigator.geolocation) {
      console.log('[MapComponent] API de geolocalização não suportada neste navegador.');
      if (leafletMap) {
        leafletMap.setView([-14.2350, -51.9253], 4);
      }
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    };

    const successHandler = (position) => {
      const { latitude, longitude } = position.coords;
      this.userLocation = [latitude, longitude];
      this.plotUserLocation(latitude, longitude);
      console.log(`[MapComponent] GPS capturado com sucesso: lat=${latitude}, lng=${longitude}`);
    };

    const errorHandler = (error) => {
      console.warn('[MapComponent] Geolocalização indisponível ou negada:', error.code, error.message);
      // Se a permissão for negada, centraliza na coordenada padrão do Brasil sem marcadores falsos
      if (leafletMap) {
        leafletMap.setView([-14.2350, -51.9253], 4);
      }
      const gpsStatusEl = document.getElementById('map-gps-live-status');
      if (gpsStatusEl) {
        gpsStatusEl.innerHTML = `
          <span class="flex items-center gap-1.5 text-amber-600 font-medium">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            GPS: Localização padrão
          </span>
          <span class="text-[10px] text-muted-foreground font-mono">Brasil</span>
        `;
      }
    };

    try {
      navigator.geolocation.getCurrentPosition(successHandler, errorHandler, geoOptions);
    } catch (e) {
      console.warn('[MapComponent] Falha ao invocar getCurrentPosition:', e);
      if (leafletMap) {
        leafletMap.setView([-14.2350, -51.9253], 4);
      }
    }
  },

  /**
   * Plota APENAS o marcador real do usuário e recentraliza com zoom 10
   */
  plotUserLocation(lat, lng) {
    if (!leafletMap || !markersLayer) return;

    // Validação de latitude/longitude
    const isValid = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    if (!isValid) {
      leafletMap.setView([-14.2350, -51.9253], 4);
      return;
    }

    // Limpa marcador anterior do usuário se houver
    if (this.userLocationMarker) {
      markersLayer.removeLayer(this.userLocationMarker);
      this.userLocationMarker = null;
    }
    if (this.userLocationLine) {
      if (linesLayer) linesLayer.removeLayer(this.userLocationLine);
      this.userLocationLine = null;
    }

    // Marcador de localização do visitante com pulso esmeralda ativo
    const userIcon = window.L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="agro-pulse-marker" title="Você está aqui">
          <div class="agro-pulse-ring" style="background-color: rgba(16, 185, 129, 0.55); animation-duration: 1.4s;"></div>
          <div class="agro-pulse-dot" style="background: #10B981; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(16, 185, 129, 0.9);">📍</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.userLocationMarker = window.L.marker([lat, lng], { icon: userIcon })
      .bindPopup(`
        <div class="text-center p-1">
          <strong class="text-sm font-bold text-emerald-700">📍 Sua Localização Atual</strong><br>
          <span class="text-[11px] text-gray-500">Conectado em tempo real ao Juntos no Agro via GPS</span>
        </div>
      `);
    markersLayer.addLayer(this.userLocationMarker);

    // Recentraliza a visão do mapa nas coordenadas reais do visitante com zoom adequado (zoom 10)
    leafletMap.setView([lat, lng], 10);

    // Atualiza o status de GPS no card flutuante
    const gpsStatusEl = document.getElementById('map-gps-live-status');
    if (gpsStatusEl) {
      gpsStatusEl.innerHTML = `
        <span class="flex items-center gap-1.5 text-emerald-600 font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          GPS Ativo · Você conectado
        </span>
        <span class="text-[10px] text-muted-foreground font-mono">Ao vivo</span>
      `;
    }
  },

  /**
   * Renderiza apenas marcadores reais cadastrados no banco de dados (sem dados mockados)
   */
  renderMarkersAndLines(points) {
    if (!leafletMap || !markersLayer || !linesLayer) return;

    markersLayer.clearLayers();
    linesLayer.clearLayers();

    const activePoints = (points || []).filter(p => p.active !== false);

    if (activePoints.length > 0) {
      const sproutIcon = window.L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="agro-pulse-marker">
            <div class="agro-pulse-ring"></div>
            <div class="agro-pulse-dot">🌱</div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      activePoints.forEach(p => {
        if (p.coords && Array.isArray(p.coords) && p.coords.length === 2) {
          const marker = window.L.marker(p.coords, { icon: sproutIcon })
            .bindPopup(`<strong class="text-sm font-semibold">${p.name}</strong><br><span class="text-xs text-gray-500">Ponto Ativo Cadastrado</span>`);
          markersLayer.addLayer(marker);
        }
      });
    }

    // Re-plota localização do usuário se já obtida
    if (this.userLocation) {
      this.plotUserLocation(this.userLocation[0], this.userLocation[1]);
    }
  },

  /**
   * Card flutuante sobre o mapa com estatísticas calculadas DINAMICAMENTE
   */
  renderFloatingOverlay() {
    const overlay = document.getElementById('map-floating-overlay');
    if (!overlay) return;

    const settings = StorageService.getSettings();
    const points = settings.mapPoints || [];
    const activePoints = points.filter(p => p.active !== false);

    // Contagem de estados reais distintos baseada apenas em pontos cadastrados
    const states = new Set();
    activePoints.forEach(p => {
      const parts = p.name ? p.name.split(',') : [];
      if (parts.length > 1) {
        states.add(parts[parts.length - 1].trim());
      } else if (p.state) {
        states.add(p.state.trim());
      }
    });

    const stateCount = states.size;       // Exibe '0' se não houver dados
    const pointsCount = activePoints.length; // Exibe '0' se não houver dados

    const isAdmin = AuthService.isAdmin();

    overlay.innerHTML = `
      <div class="glass-overlay rounded-2xl shadow-xl p-3.5 sm:p-4 w-64 sm:w-72 text-sm border border-border/80 animate-in-fade">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm leading-tight min-w-0">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0"></span>
            <span class="truncate">${settings.heroTitle || 'Conectando Produtores em Todo o Brasil'}</span>
          </div>
          ${isAdmin ? `
            <button id="btn-edit-map-hero" title="Editar Hero e Mapa" class="p-1 rounded text-primary hover:bg-primary/10 transition shrink-0">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
          ` : ''}
        </div>

        <p class="text-[11px] sm:text-xs text-muted-foreground mb-2.5 leading-snug">
          Rede nacional de capacitação técnica, troca de experiências e suporte agronômico.
        </p>

        <div class="space-y-1.5 sm:space-y-2 text-xs border-t border-border pt-2">
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground flex items-center gap-1.5">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-primary"></i> Estados ativos
            </span>
            <span class="font-bold text-foreground">${stateCount}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground flex items-center gap-1.5">
              <i data-lucide="radio" class="w-3.5 h-3.5 text-primary"></i> Pontos conectados
            </span>
            <span class="font-bold text-foreground">${pointsCount}</span>
          </div>
          <div id="map-gps-live-status" class="flex items-center justify-between pt-1 border-t border-border/60">
            <span class="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sinal estável · ao vivo
            </span>
            <span class="text-[10px] text-muted-foreground font-mono">100% On-line</span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Configura botão de edição caso Admin
    const editBtn = document.getElementById('btn-edit-map-hero');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-hero-map-modal'));
      });
    }
  },

  refresh() {
    const settings = StorageService.getSettings();
    const points = settings.mapPoints || [];

    if (leafletMap) {
      this.renderMarkersAndLines(points);
      this.renderFloatingOverlay();
      this.setupInteractionToggle();
      leafletMap.invalidateSize();
    }
  }
};
