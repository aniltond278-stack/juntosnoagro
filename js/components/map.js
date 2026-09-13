/**
 * JUNTOS NO AGRO - MAPA INTERATIVO E HERO OVERLAY COM GEOLOCALIZAÇÃO REAL (GPS)
 * Leaflet com tiles OpenStreetMap, marcadores broto/folha com efeito de pulso,
 * card flutuante e rastreamento GPS real do visitante conectado à Sede.
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

  init(containerId = 'agro-map-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[MapComponent] Contêiner #${containerId} não encontrado no DOM.`);
      return;
    }

    // Garante que a renderização do card flutuante sempre ocorra, mesmo se o Leaflet falhar
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
      container.style.minHeight = '400px';

      const settings = StorageService.getSettings();
      const sede = settings.sede || { name: 'Sede — Instrutor Principal', coords: [-14.235, -51.9253] };
      const points = settings.mapPoints || [];

      if (leafletMap) {
        try {
          leafletMap.remove();
        } catch (removeErr) {
          console.warn('[MapComponent] Aviso ao remover instância anterior do mapa:', removeErr);
        }
        leafletMap = null;
      }

      // Inicializa o mapa centralizado no Brasil
      leafletMap = window.L.map(containerId, {
        center: sede.coords,
        zoom: 4,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false
      });

      // Camada de Tiles limpa OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(leafletMap);

      // Camadas de marcadores e linhas
      markersLayer = window.L.layerGroup().addTo(leafletMap);
      linesLayer = window.L.layerGroup().addTo(leafletMap);

      this.renderMarkersAndLines(sede, points);

      // Solicita geolocalização nativa do usuário (GPS) de forma assíncrona e segura
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
      console.error('[MapComponent] Erro capturado e isolado ao montar o Leaflet Map:', err);
      this.renderFallbackMap(container);
    }
  },

  renderFallbackMap(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-emerald-950 text-white p-6 text-center select-none">
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
   * Solicita a geolocalização real do visitante via API nativa do navegador (HTTPS ou localhost)
   */
  requestUserGeolocation() {
    if (!navigator.geolocation) {
      console.log('[MapComponent] API de geolocalização não suportada neste navegador.');
      return;
    }

    // Configurações de precisão do GPS do dispositivo
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
      console.warn('[MapComponent] Aviso de geolocalização:', error.code, error.message);
      const gpsStatusEl = document.getElementById('map-gps-live-status');
      if (gpsStatusEl) {
        if (error.code === 1) { // PERMISSION_DENIED
          gpsStatusEl.innerHTML = `
            <span class="flex items-center gap-1.5 text-amber-600 font-medium">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              GPS: Permissão pendente
            </span>
            <span class="text-[10px] text-muted-foreground font-mono">Brasil</span>
          `;
        }
      }
    };

    try {
      navigator.geolocation.getCurrentPosition(successHandler, errorHandler, geoOptions);
    } catch (e) {
      console.warn('[MapComponent] Falha ao invocar getCurrentPosition:', e);
    }
  },

  /**
   * Plota a localização GPS real do visitante com marcador broto/pulso e linha até a Sede
   */
  plotUserLocation(lat, lng) {
    if (!leafletMap || !markersLayer || !linesLayer) return;

    const settings = StorageService.getSettings();
    const sede = settings.sede || { name: 'Sede — Instrutor Principal', coords: [-14.235, -51.9253] };

    // Limpa marcador anterior do usuário se houver
    if (this.userLocationMarker) {
      markersLayer.removeLayer(this.userLocationMarker);
    }
    if (this.userLocationLine) {
      linesLayer.removeLayer(this.userLocationLine);
    }

    // Marcador de localização do visitante com pulso esmeralda ativo
    const userIcon = L.divIcon({
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

    this.userLocationMarker = L.marker([lat, lng], { icon: userIcon })
      .bindPopup(`
        <div class="text-center p-1">
          <strong class="text-sm font-bold text-emerald-700">📍 Sua Localização Atual</strong><br>
          <span class="text-[11px] text-gray-500">Conectado em tempo real ao Juntos no Agro via GPS</span>
        </div>
      `);
    markersLayer.addLayer(this.userLocationMarker);

    // Linha de pulso visual conectando o visitante até a Sede Nacional
    this.userLocationLine = L.polyline([sede.coords, [lat, lng]], {
      className: 'agro-pulse-line',
      color: '#10B981',
      weight: 2.5,
      opacity: 0.8
    });
    linesLayer.addLayer(this.userLocationLine);

    // Atualiza o status de GPS no card flutuante
    const gpsStatusEl = document.getElementById('map-gps-live-status');
    if (gpsStatusEl) {
      gpsStatusEl.innerHTML = `
        <span class="flex items-center gap-1.5 text-emerald-600 font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          GPS Ativo · Você conectado
        </span>
      `;
    }

    // Suavemente enquadra a sede e o visitante
    try {
      const bounds = L.latLngBounds([sede.coords, [lat, lng]]);
      leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 7, animate: true });
    } catch {}
  },

  renderMarkersAndLines(sede, points) {
    if (!leafletMap || !markersLayer || !linesLayer) return;

    markersLayer.clearLayers();
    linesLayer.clearLayers();

    // 1. Marcador da Sede (Instrutor Principal) com efeito de destaque
    const instructorIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="agro-instructor-marker" title="${sede.name}">
          <div class="agro-instructor-ring"></div>
          <div class="agro-instructor-dot">⭐</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const sedeMarker = L.marker(sede.coords, { icon: instructorIcon })
      .bindPopup(`<strong class="text-sm font-semibold">${sede.name}</strong><br><span class="text-xs text-gray-500">Coordenação Técnica Nacional</span>`);
    markersLayer.addLayer(sedeMarker);

    // 2. Marcador Broto/Folha com Pulso Ativo nas Cidades Conectadas
    const sproutIcon = L.divIcon({
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

    points.filter(p => p.active !== false).forEach(p => {
      // Linha conectando Sede ao Ponto com efeito tracejado
      const line = L.polyline([sede.coords, p.coords], {
        className: 'agro-pulse-line',
        color: '#2E7D32',
        weight: 2,
        opacity: 0.55
      });
      linesLayer.addLayer(line);

      // Marcador no ponto
      const marker = L.marker(p.coords, { icon: sproutIcon })
        .bindPopup(`<strong class="text-sm font-semibold">${p.name}</strong><br><span class="text-xs text-gray-500">Pólo Conectado Ativo</span>`);
      markersLayer.addLayer(marker);
    });

    // Re-plota localização do usuário se já obtida
    if (this.userLocation) {
      this.plotUserLocation(this.userLocation[0], this.userLocation[1]);
    }
  },

  renderFloatingOverlay() {
    const overlay = document.getElementById('map-floating-overlay');
    if (!overlay) return;

    const settings = StorageService.getSettings();
    const points = settings.mapPoints || [];
    const activePoints = points.filter(p => p.active !== false);

    // Contagem de estados distintos
    const states = new Set();
    activePoints.forEach(p => {
      const parts = p.name.split(',');
      if (parts.length > 1) states.add(parts[1].trim());
    });
    const stateCount = states.size || 12;

    const isAdmin = AuthService.isAdmin();

    overlay.innerHTML = `
      <div class="glass-overlay rounded-2xl shadow-xl p-3.5 sm:p-4 w-64 sm:w-72 text-sm border border-border/80 animate-in-fade">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm leading-tight">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0"></span>
            <span>${settings.heroTitle || 'Conectando Produtores em Todo o Brasil'}</span>
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
            <span class="font-bold text-foreground">${activePoints.length + 1}</span>
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
    const sede = settings.sede || { name: 'Sede — Instrutor Principal', coords: [-14.235, -51.9253] };
    const points = settings.mapPoints || [];

    if (leafletMap) {
      this.renderMarkersAndLines(sede, points);
      this.renderFloatingOverlay();
      leafletMap.invalidateSize();
    }
  }
};
