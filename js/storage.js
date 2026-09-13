/**
 * JUNTOS NO AGRO - SERVIÇO DE ARMAZENAMENTO E DADOS REATIVOS
 * Mantém todos os conteúdos, categorias, dúvidas, mensagens do chat e configurações institucionais.
 */

import { SecurityService } from './security.js';

const STORAGE_KEYS = {
  SETTINGS: 'juntos_agro_site_settings',
  CATEGORIES: 'juntos_agro_categories',
  CONTENTS: 'juntos_agro_contents',
  DOUBTS: 'juntos_agro_doubts',
  CHAT_CONVERSATIONS: 'juntos_agro_chat_conversations',
  CHAT_MESSAGES: 'juntos_agro_chat_messages',
  METRICS: 'juntos_agro_metrics'
};

// Imagens originais de alta qualidade do Base44 para categorias
const CATEGORY_IMAGES = {
  'Irrigação': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/5f35dbdb2_generated_image.png',
  'Solos': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/bebd8a33d_generated_image.png',
  'Proteção de Plantas': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/a2af95ecd_generated_image.png',
  'Pecuária': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/cf6dc398c_generated_image.png',
  'Mecanização': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/ed67ea14f_generated_image.png'
};

const INITIAL_SETTINGS = {
  projectName: 'Juntos no Agro',
  slogan: 'Capacitação Agropecuária',
  description: 'Plataforma líder em capacitação, conteúdo técnico qualificado e suporte direto ao produtor rural brasileiro.',
  heroTitle: 'Conectando Produtores em Todo o Brasil',
  heroSubtitle: 'Capacitação, conteúdo técnico e suporte para o setor agropecuário brasileiro.',
  phone: '(88) 98117-1939',
  email: 'contato@juntosnoagro.com.br',
  instagram: '@juntosnoagro',
  bannerImage: 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/73f734e12_generated_image.png',
  sede: {
    name: 'Sede — Instrutor Principal',
    coords: [-14.235, -51.9253] // Centro geográfico do Brasil
  },
  cloudDbEndpoint: 'https://juntosnoagro-db-default-rtdb.firebaseio.com',
  mapPoints: []
};

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Irrigação', description: 'Técnicas eficientes de manejo de água e gotejamento', icon: '💧', image_url: CATEGORY_IMAGES['Irrigação'] },
  { id: 'cat-2', name: 'Solos', description: 'Correção de acidez, adubação e conservação do solo', icon: '🌱', image_url: CATEGORY_IMAGES['Solos'] },
  { id: 'cat-3', name: 'Proteção de Plantas', description: 'Controle fitossanitário integrado e defensivos', icon: '🛡️', image_url: CATEGORY_IMAGES['Proteção de Plantas'] },
  { id: 'cat-4', name: 'Pecuária', description: 'Manejo de pastagens, nutrição e sanidade animal', icon: '🐂', image_url: CATEGORY_IMAGES['Pecuária'] },
  { id: 'cat-5', name: 'Mecanização', description: 'Operação, regulagem e manutenção de máquinas agrícolas', icon: '🚜', image_url: CATEGORY_IMAGES['Mecanização'] }
];

const INITIAL_CONTENTS = [
  {
    id: 'cnt-1',
    title: 'Manejo de Irrigação por Gotejamento em Altas Produtividades',
    category: 'Irrigação',
    description: 'Guia passo a passo para calcular a lâmina de irrigação ideal e evitar desperdício de água e energia elétrica no pomar.',
    media_type: 'video', // 'video' | 'pdf' | 'article' | 'manual'
    reading_time: '18 min',
    media_url: 'https://www.youtube.com',
    image_url: CATEGORY_IMAGES['Irrigação'],
    is_featured: true,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'cnt-2',
    title: 'Correção de Acidez do Solo: Calagem e Gessagem Estratégica',
    category: 'Solos',
    description: 'Aprenda a interpretar laudos laboratoriais de solo e calcular doses precisas de calcário dolomítico e gesso agrícola.',
    media_type: 'pdf',
    reading_time: '12 min de leitura',
    media_url: 'https://www.embrapa.br',
    image_url: CATEGORY_IMAGES['Solos'],
    is_featured: true,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'cnt-3',
    title: 'Manejo Integrado de Pragas (MIP) na Cultura da Soja e Milho',
    category: 'Proteção de Plantas',
    description: 'Metodologias de amostragem no campo, identificação de lagartas e percevejos e momento correto de aplicação.',
    media_type: 'article',
    reading_time: '10 min de leitura',
    media_url: 'https://www.embrapa.br',
    image_url: CATEGORY_IMAGES['Proteção de Plantas'],
    is_featured: true,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 'cnt-4',
    title: 'Suplementação Mineral e Proteica para Bovinos no Período Seco',
    category: 'Pecuária',
    description: 'Estratégias de terminação a pasto e formulação de proteinados de baixo consumo para manter ganho de peso na estiagem.',
    media_type: 'manual',
    reading_time: '15 min de leitura',
    media_url: '',
    image_url: CATEGORY_IMAGES['Pecuária'],
    is_featured: false,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: 'cnt-5',
    title: 'Calibração de Pulverizadores de Barra e Bicos Anti-Deriva',
    category: 'Mecanização',
    description: 'Protocolo de aferição de vazão por ponta, cálculo da velocidade de trabalho e redução de perdas por evaporação.',
    media_type: 'video',
    reading_time: '22 min',
    media_url: 'https://www.youtube.com',
    image_url: CATEGORY_IMAGES['Mecanização'],
    is_featured: false,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'cnt-6',
    title: 'Fertirrigação: Nutrição de Precisão Via Água de Rega',
    category: 'Irrigação',
    description: 'Compatibilidade de fertilizantes solúveis, injeção por venturi e cálculo de condutividade elétrica em hortaliças.',
    media_type: 'pdf',
    reading_time: '14 min de leitura',
    media_url: 'https://www.embrapa.br',
    image_url: CATEGORY_IMAGES['Irrigação'],
    is_featured: false,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 12).toISOString()
  }
];

const INITIAL_DOUBTS = [];

export const StorageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    } else {
      try {
        const parsedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
        if (Array.isArray(parsedSettings.mapPoints) && parsedSettings.mapPoints.some(p => p.id === 'pt-1' && p.name && p.name.includes('Manaus'))) {
          parsedSettings.mapPoints = [];
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsedSettings));
        }
      } catch (_) {}
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTENTS)) {
      localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(INITIAL_CONTENTS));
    }

    // Limpeza de dúvidas mockadas antigas se existirem no navegador
    const existingDoubts = localStorage.getItem(STORAGE_KEYS.DOUBTS);
    if (!existingDoubts) {
      localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify([]));
    } else {
      try {
        const parsed = JSON.parse(existingDoubts);
        // Se ainda contiver as dúvidas mockadas antigas (dbt-1, dbt-2, dbt-3 com textos padrão), limpa para iniciar zerado
        const isMocked = Array.isArray(parsed) && parsed.some(d => d.id === 'dbt-1' && d.author_name === 'José Ribeiro (GO)');
        if (isMocked) {
          localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify([]));
        }
      } catch (_) {
        localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify([]));
      }
    }

    // Limpeza de métricas fictícias antigas (ex: 1280 base)
    const existingMetrics = localStorage.getItem(STORAGE_KEYS.METRICS);
    if (!existingMetrics || parseInt(existingMetrics, 10) >= 1280) {
      localStorage.setItem(STORAGE_KEYS.METRICS, '1');
    }

    if (!localStorage.getItem(STORAGE_KEYS.CHAT_CONVERSATIONS)) {
      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify([]));
    }

    // Inicializa canal BroadcastChannel para sincronização instantânea entre abas e janelas
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('juntos_agro_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event && event.data) {
            const { resource, payload, action } = event.data;
            if (resource === 'doubts') {
              if (action === 'CREATE' && payload) {
                const localDoubts = this.getDoubts();
                if (!localDoubts.some(d => d.id === payload.id)) {
                  localDoubts.unshift(payload);
                  localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(localDoubts));
                  this.emitChange('doubts');
                }
              } else if (action === 'UPDATE' && payload) {
                const localDoubts = this.getDoubts();
                const item = localDoubts.find(d => d.id === payload.id);
                if (item) {
                  Object.assign(item, payload);
                  localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(localDoubts));
                  this.emitChange('doubts');
                }
              } else if (action === 'DELETE' && payload) {
                let localDoubts = this.getDoubts();
                localDoubts = localDoubts.filter(d => d.id !== payload.id);
                localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(localDoubts));
                this.emitChange('doubts');
              } else {
                this.emitChange('doubts');
              }
            } else if (resource) {
              this.emitChange(resource);
            }
          }
        };
      }
    } catch (bcErr) {
      console.warn('[StorageService] BroadcastChannel indisponível:', bcErr);
    }

    // Ouve sincronização entre abas/janelas via evento nativo de storage
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.DOUBTS) {
        this.emitChange('doubts');
      } else if (event.key === STORAGE_KEYS.CONTENTS) {
        this.emitChange('contents');
      } else if (event.key === STORAGE_KEYS.CHAT_CONVERSATIONS || event.key === STORAGE_KEYS.CHAT_MESSAGES) {
        this.emitChange('chat');
      } else if (event.key === STORAGE_KEYS.SETTINGS) {
        this.emitChange('settings');
      } else if (event.key === STORAGE_KEYS.CATEGORIES) {
        this.emitChange('categories');
      }
    });

    // Inicia sincronização com banco de dados em nuvem
    this.initCloudSync();

    // Incrementa contagem de acessos real do site
    this.recordSiteVisit();
  },

  /* --- BANCO DE DADOS EM NUVEM (CLOUD SYNC) --- */
  broadcastChannel: null,
  cloudSyncIntervalId: null,
  isCloudSyncing: false,
  cloudStatus: { connected: false, lastSync: null },

  getCloudEndpoint() {
    const settings = this.getSettings();
    return (settings.cloudDbEndpoint || 'https://juntosnoagro-db-default-rtdb.firebaseio.com').trim().replace(/\/+$/, '');
  },

  initCloudSync() {
    // 1. Busca inicial imediata ao carregar a página
    this.fetchDoubtsFromCloud();

    // 2. Polling contínuo em segundo plano a cada 8 segundos (sincronização multi-dispositivo)
    if (!this.cloudSyncIntervalId) {
      this.cloudSyncIntervalId = setInterval(() => {
        this.fetchDoubtsFromCloud();
      }, 8000);
    }

    // 3. Sincroniza imediatamente quando a janela/aba volta a ficar ativa
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.fetchDoubtsFromCloud();
        }
      });
      window.addEventListener('focus', () => {
        this.fetchDoubtsFromCloud();
      });
    }
  },

  async fetchDoubtsFromCloud() {
    if (this.isCloudSyncing) return null;
    this.isCloudSyncing = true;

    try {
      const endpoint = this.getCloudEndpoint();
      const url = `${endpoint}/doubts.json`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        this.cloudStatus.connected = false;
        return null;
      }

      const remoteData = await res.json();
      this.cloudStatus.connected = true;
      this.cloudStatus.lastSync = new Date().toISOString();

      if (!remoteData) return [];

      let remoteDoubts = [];
      if (Array.isArray(remoteData)) {
        remoteDoubts = remoteData.filter(Boolean);
      } else if (typeof remoteData === 'object') {
        remoteDoubts = Object.keys(remoteData).map(k => ({
          ...remoteData[k],
          id: remoteData[k].id || k
        }));
      }

      // Mescla com dúvidas locais (preserva dúvidas locais recentes e adiciona as da nuvem)
      const localDoubts = this.getDoubts();
      const localMap = new Map(localDoubts.map(d => [d.id, d]));
      let hasChanges = false;

      remoteDoubts.forEach(rd => {
        if (!rd || !rd.id) return;
        const local = localMap.get(rd.id);
        if (!local || JSON.stringify(local) !== JSON.stringify(rd)) {
          localMap.set(rd.id, rd);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        const merged = Array.from(localMap.values()).sort((a, b) => {
          return new Date(b.created_date || 0) - new Date(a.created_date || 0);
        });
        localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(merged));
        this.emitChange('doubts');
      }

      return remoteDoubts;
    } catch (err) {
      this.cloudStatus.connected = false;
      return null;
    } finally {
      this.isCloudSyncing = false;
    }
  },

  broadcastSync(resource, action, payload) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          resource,
          action,
          payload,
          timestamp: Date.now()
        });
      } catch (_) {}
    }
  },

  /* --- SETTINGS --- */
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...INITIAL_SETTINGS, ...JSON.parse(data) } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...newSettings,
      projectName: SecurityService.sanitizeText(newSettings.projectName || current.projectName),
      slogan: SecurityService.sanitizeText(newSettings.slogan || current.slogan),
      heroTitle: SecurityService.sanitizeText(newSettings.heroTitle || current.heroTitle),
      heroSubtitle: SecurityService.sanitizeText(newSettings.heroSubtitle || current.heroSubtitle),
      phone: SecurityService.sanitizeText(newSettings.phone || current.phone),
      email: SecurityService.sanitizeText(newSettings.email || current.email),
      instagram: SecurityService.sanitizeText(newSettings.instagram || current.instagram)
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.emitChange('settings');
    return updated;
  },

  /* --- CATEGORIES --- */
  getCategories() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  addCategory({ name, description, icon, image_url }) {
    const categories = this.getCategories();
    const newCat = {
      id: 'cat-' + Date.now(),
      name: SecurityService.sanitizeText(name),
      description: SecurityService.sanitizeText(description || ''),
      icon: SecurityService.sanitizeText(icon || '🌱'),
      image_url: image_url || CATEGORY_IMAGES[name] || ''
    };
    categories.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.emitChange('categories');
    return newCat;
  },

  updateCategory(id, updates) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return null;

    categories[index] = {
      ...categories[index],
      ...updates,
      name: updates.name ? SecurityService.sanitizeText(updates.name) : categories[index].name,
      description: updates.description ? SecurityService.sanitizeText(updates.description) : categories[index].description
    };
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.emitChange('categories');
    return categories[index];
  },

  deleteCategory(id) {
    let categories = this.getCategories();
    categories = categories.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.emitChange('categories');
    return true;
  },

  /* --- CONTENTS --- */
  getContents() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTENTS);
      return data ? JSON.parse(data) : INITIAL_CONTENTS;
    } catch {
      return INITIAL_CONTENTS;
    }
  },

  addContent(item) {
    const contents = this.getContents();
    const newContent = {
      id: 'cnt-' + Date.now(),
      title: SecurityService.sanitizeText(item.title),
      category: SecurityService.sanitizeText(item.category),
      description: SecurityService.sanitizeText(item.description || ''),
      media_type: item.media_type || 'article',
      reading_time: SecurityService.sanitizeText(item.reading_time || '10 min de leitura'),
      media_url: SecurityService.sanitizeUrl(item.media_url || ''),
      image_url: item.image_url || CATEGORY_IMAGES[item.category] || '',
      is_featured: !!item.is_featured,
      views: 0,
      created_date: new Date().toISOString()
    };
    contents.unshift(newContent);
    localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(contents));
    this.emitChange('contents');
    return newContent;
  },

  updateContent(id, updates) {
    const contents = this.getContents();
    const index = contents.findIndex(c => c.id === id);
    if (index === -1) return null;

    contents[index] = {
      ...contents[index],
      ...updates,
      title: updates.title ? SecurityService.sanitizeText(updates.title) : contents[index].title,
      category: updates.category ? SecurityService.sanitizeText(updates.category) : contents[index].category,
      description: updates.description ? SecurityService.sanitizeText(updates.description) : contents[index].description,
      reading_time: updates.reading_time ? SecurityService.sanitizeText(updates.reading_time) : contents[index].reading_time,
      media_url: updates.media_url !== undefined ? SecurityService.sanitizeUrl(updates.media_url) : contents[index].media_url,
      image_url: updates.image_url !== undefined ? updates.image_url : contents[index].image_url,
      is_featured: updates.is_featured !== undefined ? !!updates.is_featured : contents[index].is_featured
    };
    localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(contents));
    this.emitChange('contents');
    return contents[index];
  },

  incrementContentView(id) {
    const contents = this.getContents();
    const item = contents.find(c => c.id === id);
    if (item) {
      item.views = (item.views || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(contents));
      this.emitChange('contents');
    }
  },

  deleteContent(id) {
    let contents = this.getContents();
    contents = contents.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(contents));
    this.emitChange('contents');
    return true;
  },

  /* --- DOUBTS (MURAL) COM PERSISTÊNCIA EM NUVEM --- */
  getDoubts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOUBTS);
      return data ? JSON.parse(data) : INITIAL_DOUBTS;
    } catch {
      return INITIAL_DOUBTS;
    }
  },

  addDoubt({ title, description, author_name, category, attachments = [] }) {
    const doubts = this.getDoubts();
    const newDoubt = {
      id: 'dbt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: SecurityService.sanitizeText(title),
      description: SecurityService.sanitizeText(description),
      author_name: SecurityService.sanitizeText(author_name || 'Produtor Anônimo'),
      category: SecurityService.sanitizeText(category || 'Geral'),
      status: 'pending',
      attachments: (attachments || []).map(att => ({
        name: SecurityService.sanitizeText(att.name || 'anexo'),
        url: att.url,
        type: att.type || 'image'
      })),
      created_date: new Date().toISOString()
    };

    // 1. Gravação local com emissão imediata para interface reativa
    doubts.unshift(newDoubt);
    localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(doubts));
    this.emitChange('doubts');

    // 2. Transmissão imediata via BroadcastChannel para outras abas abertas
    this.broadcastSync('doubts', 'CREATE', newDoubt);

    // 3. Persistência remota em nuvem (assíncrona e resiliente)
    this.saveDoubtToCloud(newDoubt);

    return newDoubt;
  },

  updateDoubtStatus(id, newStatus) {
    const doubts = this.getDoubts();
    const item = doubts.find(d => d.id === id);
    if (item) {
      item.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(doubts));
      this.emitChange('doubts');
      this.broadcastSync('doubts', 'UPDATE', { id, status: newStatus });
      this.updateDoubtInCloud(id, { status: newStatus });
    }
    return item;
  },

  deleteDoubt(id) {
    let doubts = this.getDoubts();
    doubts = doubts.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(doubts));
    this.emitChange('doubts');
    this.broadcastSync('doubts', 'DELETE', { id });
    this.deleteDoubtFromCloud(id);
    return true;
  },

  /**
   * Envia uma nova dúvida para a nuvem
   */
  async saveDoubtToCloud(doubt) {
    try {
      const endpoint = this.getCloudEndpoint();
      const url = `${endpoint}/doubts/${encodeURIComponent(doubt.id)}.json`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doubt),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.cloudStatus.connected = true;
        this.cloudStatus.lastSync = new Date().toISOString();
        return true;
      }
    } catch (err) {
      // Resiliente: a dúvida permanece no cache local
      console.warn('[StorageService] Nuvem temporariamente inacessível. Dúvida mantida localmente:', err);
    }
    return false;
  },

  /**
   * Atualiza o status de uma dúvida na nuvem
   */
  async updateDoubtInCloud(id, updates) {
    try {
      const endpoint = this.getCloudEndpoint();
      const url = `${endpoint}/doubts/${encodeURIComponent(id)}.json`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (err) {
      console.warn('[StorageService] Erro ao sincronizar atualização na nuvem:', err);
      return false;
    }
  },

  /**
   * Remove uma dúvida da nuvem
   */
  async deleteDoubtFromCloud(id) {
    try {
      const endpoint = this.getCloudEndpoint();
      const url = `${endpoint}/doubts/${encodeURIComponent(id)}.json`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: 'DELETE',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (err) {
      console.warn('[StorageService] Erro ao remover dúvida da nuvem:', err);
      return false;
    }
  },

  /* --- CHAT PRIVADO --- */
  getChatConversations() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getOrCreateVisitorConversation(visitorId) {
    const convs = this.getChatConversations();
    let conv = convs.find(c => c.id === visitorId);
    if (!conv) {
      conv = {
        id: visitorId || 'conv-' + Date.now(),
        visitor_name: 'Produtor ' + Math.floor(1000 + Math.random() * 9000),
        last_message: '',
        last_activity: Date.now(),
        unread_count_admin: 0,
        answered: false
      };
      convs.unshift(conv);
      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(convs));
      this.emitChange('chat');
    }
    return conv;
  },

  getMessages(conversationId) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      const allMessages = data ? JSON.parse(data) : [];
      return allMessages.filter(m => m.conversation_id === conversationId);
    } catch {
      return [];
    }
  },

  addMessage({ conversation_id, sender, text, attachments = [], audio_url = null }) {
    const allData = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    const messages = allData ? JSON.parse(allData) : [];

    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      conversation_id,
      sender: sender === 'admin' ? 'admin' : 'visitor',
      text: SecurityService.sanitizeText(text || ''),
      attachments: attachments || [],
      audio_url: audio_url || null,
      created_date: new Date().toISOString()
    };

    messages.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));

    // Atualiza conversa
    const convs = this.getChatConversations();
    const conv = convs.find(c => c.id === conversation_id);
    if (conv) {
      conv.last_message = text ? SecurityService.sanitizeText(text) : (audio_url ? 'Mensagem de áudio' : 'Anexo enviado');
      conv.last_activity = Date.now();
      if (sender === 'visitor') {
        conv.unread_count_admin = (conv.unread_count_admin || 0) + 1;
        conv.answered = false;
      } else {
        conv.unread_count_admin = 0;
        conv.answered = true;
      }
      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(convs));
    }

    this.emitChange('chat');
    return newMsg;
  },

  /* --- METRICS / KPIS --- */
  recordSiteVisit() {
    let visits = parseInt(localStorage.getItem(STORAGE_KEYS.METRICS) || '0', 10);
    visits += 1;
    localStorage.setItem(STORAGE_KEYS.METRICS, visits.toString());
  },

  getKPIs() {
    const contents = this.getContents();
    const doubts = this.getDoubts();
    const convs = this.getChatConversations();
    const realVisits = parseInt(localStorage.getItem(STORAGE_KEYS.METRICS) || '0', 10);

    // Total de acessos = visitas reais + visualizações reais de conteúdos
    const totalViews = contents.reduce((acc, c) => acc + (c.views || 0), 0);
    const totalAccesses = realVisits + totalViews;

    // Conteúdos publicados
    const publishedCount = contents.length;

    // Dúvidas pendentes (reflete em tempo real a quantidade exata de perguntas cadastradas)
    const pendingDoubts = doubts.filter(d => d.status === 'pending').length;

    // Taxa de resposta no chat
    const totalConvs = convs.length;
    const answeredConvs = convs.filter(c => c.answered).length;
    const responseRate = totalConvs === 0 ? 100 : Math.round((answeredConvs / totalConvs) * 100);

    return {
      totalAccesses,
      publishedCount,
      pendingDoubts,
      responseRate
    };
  },

  /* --- EVENT BUS / REATIVIDADE --- */
  listeners: [],
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },
  emitChange(resource) {
    this.listeners.forEach(cb => cb(resource));
  }
};
