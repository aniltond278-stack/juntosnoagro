/**
 * JUNTOS NO AGRO - SERVIÃ‡O DE ARMAZENAMENTO E BANCO DE DADOS EM NUVEM
 * - ConteÃºdos, categorias e configuraÃ§Ãµes institucionais.
 * - DÃºvidas do Mural e Chat Privado sincronizados 100% via Banco de Dados na Nuvem (Cloud DB).
 * - Sem dependÃªncia de localStorage para dados compartilhados entre dispositivos.
 */

import { SecurityService } from './security.js';

const STORAGE_KEYS = {
  SETTINGS: 'juntos_agro_site_settings',
  CATEGORIES: 'juntos_agro_categories',
  CONTENTS: 'juntos_agro_contents',
  METRICS: 'juntos_agro_metrics'
};

const MASTER_CLOUD_DB_URL = 'https://api.restful-api.dev/objects/ff808181a067127101a09b0e0df309f4';

// Imagens originais de alta qualidade para categorias
const CATEGORY_IMAGES = {
  'IrrigaÃ§Ã£o': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/5f35dbdb2_generated_image.png',
  'Solos': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/bebd8a33d_generated_image.png',
  'ProteÃ§Ã£o de Plantas': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/a2af95ecd_generated_image.png',
  'PecuÃ¡ria': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/cf6dc398c_generated_image.png',
  'MecanizaÃ§Ã£o': 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/ed67ea14f_generated_image.png'
};

const INITIAL_SETTINGS = {
  projectName: 'Juntos no Agro',
  slogan: 'CapacitaÃ§Ã£o AgropecuÃ¡ria',
  description: 'Plataforma lÃ­der em capacitaÃ§Ã£o, conteÃºdo tÃ©cnico qualificado e suporte direto ao produtor rural brasileiro.',
  heroTitle: 'Conectando Produtores em Todo o Brasil',
  heroSubtitle: 'CapacitaÃ§Ã£o, conteÃºdo tÃ©cnico e suporte para o setor agropecuÃ¡rio brasileiro.',
  phone: '(88) 98117-1939',
  email: 'contato@juntosnoagro.com.br',
  instagram: '@juntosnoagro',
  bannerImage: 'https://media.base44.com/images/public/6aa5dda7dffe8d7aff83f886/73f734e12_generated_image.png',
  sede: {
    name: 'Sede â€” Instrutor Principal',
    coords: [-14.235, -51.9253]
  },
  mapPoints: []
};

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'IrrigaÃ§Ã£o', description: 'TÃ©cnicas eficientes de manejo de Ã¡gua e gotejamento', icon: 'ðŸ’§', image_url: CATEGORY_IMAGES['IrrigaÃ§Ã£o'] },
  { id: 'cat-2', name: 'Solos', description: 'CorreÃ§Ã£o de acidez, adubaÃ§Ã£o e conservaÃ§Ã£o do solo', icon: 'ðŸŒ±', image_url: CATEGORY_IMAGES['Solos'] },
  { id: 'cat-3', name: 'ProteÃ§Ã£o de Plantas', description: 'Controle fitossanitÃ¡rio integrado e defensivos', icon: 'ðŸ›¡ï¸', image_url: CATEGORY_IMAGES['ProteÃ§Ã£o de Plantas'] },
  { id: 'cat-4', name: 'PecuÃ¡ria', description: 'Manejo de pastagens, nutriÃ§Ã£o e sanidade animal', icon: 'ðŸ‚', image_url: CATEGORY_IMAGES['PecuÃ¡ria'] },
  { id: 'cat-5', name: 'MecanizaÃ§Ã£o', description: 'OperaÃ§Ã£o, regulagem e manutenÃ§Ã£o de mÃ¡quinas agrÃ­colas', icon: 'ðŸšœ', image_url: CATEGORY_IMAGES['MecanizaÃ§Ã£o'] }
];

const INITIAL_CONTENTS = [
  {
    id: 'cnt-1',
    title: 'Manejo de IrrigaÃ§Ã£o por Gotejamento em Altas Produtividades',
    category: 'IrrigaÃ§Ã£o',
    description: 'Guia passo a passo para calcular a lÃ¢mina de irrigaÃ§Ã£o ideal e evitar desperdÃ­cio de Ã¡gua e energia elÃ©trica no pomar.',
    media_type: 'video',
    reading_time: '18 min',
    media_url: 'https://www.youtube.com',
    image_url: CATEGORY_IMAGES['IrrigaÃ§Ã£o'],
    is_featured: true,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'cnt-2',
    title: 'CorreÃ§Ã£o de Acidez do Solo: Calagem e Gessagem EstratÃ©gica',
    category: 'Solos',
    description: 'Aprenda a interpretar laudos laboratoriais de solo e calcular doses precisas de calcÃ¡rio dolomÃ­tico e gesso agrÃ­cola.',
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
    category: 'ProteÃ§Ã£o de Plantas',
    description: 'Metodologias de amostragem no campo, identificaÃ§Ã£o de lagartas e percevejos e momento correto de aplicaÃ§Ã£o.',
    media_type: 'article',
    reading_time: '10 min de leitura',
    media_url: 'https://www.embrapa.br',
    image_url: CATEGORY_IMAGES['ProteÃ§Ã£o de Plantas'],
    is_featured: true,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 6).toISOString()
  },
  {
    id: 'cnt-4',
    title: 'SuplementaÃ§Ã£o Mineral e Proteica para Bovinos no PerÃ­odo Seco',
    category: 'PecuÃ¡ria',
    description: 'EstratÃ©gias de terminaÃ§Ã£o a pasto e formulaÃ§Ã£o de proteinados de baixo consumo para manter ganho de peso na estiagem.',
    media_type: 'manual',
    reading_time: '15 min de leitura',
    media_url: '',
    image_url: CATEGORY_IMAGES['PecuÃ¡ria'],
    is_featured: false,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: 'cnt-5',
    title: 'CalibraÃ§Ã£o de Pulverizadores de Barra e Bicos Anti-Deriva',
    category: 'MecanizaÃ§Ã£o',
    description: 'Protocolo de aferiÃ§Ã£o de vazÃ£o por ponta, cÃ¡lculo da velocidade de trabalho e reduÃ§Ã£o de perdas por evaporaÃ§Ã£o.',
    media_type: 'video',
    reading_time: '22 min',
    media_url: 'https://www.youtube.com',
    image_url: CATEGORY_IMAGES['MecanizaÃ§Ã£o'],
    is_featured: false,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'cnt-6',
    title: 'FertirrigaÃ§Ã£o: NutriÃ§Ã£o de PrecisÃ£o Via Ãgua de Rega',
    category: 'IrrigaÃ§Ã£o',
    description: 'Compatibilidade de fertilizantes solÃºveis, injeÃ§Ã£o por venturi e cÃ¡lculo de condutividade elÃ©trica em hortaliÃ§as.',
    media_type: 'pdf',
    reading_time: '14 min de leitura',
    media_url: 'https://www.embrapa.br',
    image_url: CATEGORY_IMAGES['IrrigaÃ§Ã£o'],
    is_featured: false,
    views: 0,
    created_date: new Date(Date.now() - 86400000 * 12).toISOString()
  }
];

export const StorageService = {
  // Estado em MemÃ³ria para dados em Nuvem (DÃºvidas e Chat)
  state: {
    doubts: [],
    chat_messages: [],
    chat_conversations: []
  },

  broadcastChannel: null,
  cloudSyncIntervalId: null,
  isCloudSyncing: false,
  cloudStatus: { connected: true, lastSync: null },
  listeners: [],

  init() {
    // 1. Inicializa preferÃªncias locais (configuraÃ§Ãµes, conteÃºdos, categorias)
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTENTS)) {
      localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(INITIAL_CONTENTS));
    }

    const existingMetrics = localStorage.getItem(STORAGE_KEYS.METRICS);
    if (!existingMetrics || parseInt(existingMetrics, 10) >= 1280) {
      localStorage.setItem(STORAGE_KEYS.METRICS, '1');
    }

    // 2. Remove resÃ­duos de localStorage para DÃºvidas e Chat se existirem
    try {
      localStorage.removeItem('juntos_agro_doubts');
      localStorage.removeItem('juntos_agro_chat_messages');
      localStorage.removeItem('juntos_agro_chat_conversations');
    } catch (_) {}

    // 3. Inicializa canal BroadcastChannel para sincronizaÃ§Ã£o instantÃ¢nea entre abas
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('juntos_agro_cloud_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event && event.data) {
            const { resource, payload, action } = event.data;
            if (resource === 'doubts') {
              if (action === 'CREATE' && payload) {
                if (!this.state.doubts.some(d => d.id === payload.id)) {
                  this.state.doubts.unshift(payload);
                  this.emitChange('doubts');
                }
              } else if (action === 'UPDATE' && payload) {
                const item = this.state.doubts.find(d => d.id === payload.id);
                if (item) {
                  Object.assign(item, payload);
                  this.emitChange('doubts');
                }
              } else if (action === 'DELETE' && payload) {
                this.state.doubts = this.state.doubts.filter(d => d.id !== payload.id);
                this.emitChange('doubts');
              }
            } else if (resource === 'chat') {
              if (action === 'NEW_MESSAGE' && payload) {
                if (!this.state.chat_messages.some(m => m.id === payload.id)) {
                  this.state.chat_messages.push(payload);
                  this.emitChange('chat');
                }
              }
            }
          }
        };
      }
    } catch (bcErr) {
      console.warn('[StorageService] BroadcastChannel indisponÃ­vel:', bcErr);
    }

    // 4. Ouve sincronizaÃ§Ã£o de configuraÃ§Ãµes entre abas
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.CONTENTS) {
        this.emitChange('contents');
      } else if (event.key === STORAGE_KEYS.SETTINGS) {
        this.emitChange('settings');
      } else if (event.key === STORAGE_KEYS.CATEGORIES) {
        this.emitChange('categories');
      }
    });

    // 5. Inicia sincronizaÃ§Ã£o com o banco de dados em nuvem
    this.initCloudSync();

    // 6. Incrementa acessos reais
    this.recordSiteVisit();
  },

  /* --- SINCRONIZAÃ‡ÃƒO EM NUVEM (CLOUD DB MASTER) --- */
  initCloudSync() {
    // Busca inicial imediata ao carregar
    this.fetchCloudData();

    // Polling contÃ­nuo a cada 3 segundos para sincronizaÃ§Ã£o entre aparelhos
    if (!this.cloudSyncIntervalId) {
      this.cloudSyncIntervalId = setInterval(() => {
        this.fetchCloudData();
      }, 3000);
    }

    // Sincroniza ao focar na janela/aba
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.fetchCloudData();
        }
      });
      window.addEventListener('focus', () => {
        this.fetchCloudData();
      });
    }
  },

  /**
   * Busca todas as dÃºvidas e mensagens diretamente do banco de dados na nuvem
   */
  async fetchCloudData() {
    if (this.isCloudSyncing) return null;
    this.isCloudSyncing = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(MASTER_CLOUD_DB_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        this.cloudStatus.connected = false;
        return null;
      }

      const payload = await res.json();
      this.cloudStatus.connected = true;
      this.cloudStatus.lastSync = new Date().toISOString();

      const cloudData = payload.data || {};
      const remoteDoubts = Array.isArray(cloudData.doubts) ? cloudData.doubts : [];
      const remoteMessages = Array.isArray(cloudData.chat_messages) ? cloudData.chat_messages : [];
      const remoteConvs = Array.isArray(cloudData.chat_conversations) ? cloudData.chat_conversations : [];

      let doubtsChanged = false;
      if (JSON.stringify(this.state.doubts) !== JSON.stringify(remoteDoubts)) {
        this.state.doubts = remoteDoubts.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
        doubtsChanged = true;
      }

      let chatChanged = false;
      if (JSON.stringify(this.state.chat_messages) !== JSON.stringify(remoteMessages) ||
          JSON.stringify(this.state.chat_conversations) !== JSON.stringify(remoteConvs)) {
        this.state.chat_messages = remoteMessages;
        this.state.chat_conversations = remoteConvs.sort((a, b) => (b.last_activity || 0) - (a.last_activity || 0));
        chatChanged = true;
      }

      if (doubtsChanged) {
        this.emitChange('doubts');
      }
      if (chatChanged) {
        this.emitChange('chat');
      }

      return { doubts: this.state.doubts, chat_messages: this.state.chat_messages, chat_conversations: this.state.chat_conversations };
    } catch (err) {
      this.cloudStatus.connected = false;
      return null;
    } finally {
      this.isCloudSyncing = false;
    }
  },

  /**
   * Envia o estado de dÃºvidas e chat para a nuvem
   */
  async pushStateToCloud() {
    try {
      const body = {
        data: {
          version: Date.now(),
          last_updated: new Date().toISOString(),
          doubts: this.state.doubts,
          chat_messages: this.state.chat_messages,
          chat_conversations: this.state.chat_conversations
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(MASTER_CLOUD_DB_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.cloudStatus.connected = true;
        this.cloudStatus.lastSync = new Date().toISOString();
        return true;
      }
    } catch (err) {
      console.warn('[StorageService] Falha ao enviar para o banco de dados em nuvem:', err);
    }
    return false;
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

  /* --- DÃšVIDAS (MURAL) - BANCO DE DADOS EM NUVEM --- */
  getDoubts() {
    return this.state.doubts || [];
  },

  async addDoubt({ title, description, author_name, category, attachments = [] }) {
    const newDoubt = {
      id: 'dbt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: SecurityService.sanitizeText(title),
      description: SecurityService.sanitizeText(description),
      author_name: SecurityService.sanitizeText(author_name || 'Produtor AnÃ´nimo'),
      category: SecurityService.sanitizeText(category || 'Geral'),
      status: 'pending',
      attachments: (attachments || []).map(att => ({
        name: SecurityService.sanitizeText(att.name || 'anexo'),
        url: att.url,
        type: att.type || 'image'
      })),
      created_date: new Date().toISOString()
    };

    // 1. Atualiza memÃ³ria e emite alteraÃ§Ã£o imediatamente (otimista)
    this.state.doubts.unshift(newDoubt);
    this.emitChange('doubts');
    this.broadcastSync('doubts', 'CREATE', newDoubt);

    // 2. Persiste diretamente no banco de dados na nuvem
    await this.pushStateToCloud();

    return newDoubt;
  },

  async updateDoubtStatus(id, newStatus) {
    const item = this.state.doubts.find(d => d.id === id);
    if (item) {
      item.status = newStatus;
      this.emitChange('doubts');
      this.broadcastSync('doubts', 'UPDATE', { id, status: newStatus });
      await this.pushStateToCloud();
    }
    return item;
  },

  async deleteDoubt(id) {
    this.state.doubts = this.state.doubts.filter(d => d.id !== id);
    this.emitChange('doubts');
    this.broadcastSync('doubts', 'DELETE', { id });
    await this.pushStateToCloud();
    return true;
  },

  /* --- CHAT PRIVADO - BANCO DE DADOS EM NUVEM --- */
  getChatConversations() {
    return this.state.chat_conversations || [];
  },

  getAllMessages() {
    return this.state.chat_messages || [];
  },

  getMessages(conversationId) {
    return (this.state.chat_messages || []).filter(m => m.conversation_id === conversationId);
  },

  async getOrCreateVisitorConversation(visitorId) {
    let conv = (this.state.chat_conversations || []).find(c => c.id === visitorId);
    if (!conv) {
      conv = {
        id: visitorId || 'conv-' + Date.now(),
        visitor_name: 'Produtor ' + Math.floor(1000 + Math.random() * 9000),
        last_message: '',
        last_activity: Date.now(),
        unread_count_admin: 0,
        answered: false
      };
      this.state.chat_conversations.unshift(conv);
      this.emitChange('chat');
      await this.pushStateToCloud();
    }
    return conv;
  },

  async addMessage({ conversation_id, sender, text, attachments = [], audio_url = null }) {
    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      conversation_id,
      sender: sender === 'admin' ? 'admin' : 'visitor',
      text: SecurityService.sanitizeText(text || ''),
      attachments: attachments || [],
      audio_url: audio_url || null,
      created_date: new Date().toISOString()
    };

    this.state.chat_messages.push(newMsg);

    // Atualiza conversa correspondente
    let conv = (this.state.chat_conversations || []).find(c => c.id === conversation_id);
    if (conv) {
      conv.last_message = text ? SecurityService.sanitizeText(text) : (audio_url ? 'Mensagem de Ã¡udio' : 'Anexo enviado');
      conv.last_activity = Date.now();
      if (sender === 'visitor') {
        conv.unread_count_admin = (conv.unread_count_admin || 0) + 1;
        conv.answered = false;
      } else {
        conv.unread_count_admin = 0;
        conv.answered = true;
      }
    }

    this.emitChange('chat');
    this.broadcastSync('chat', 'NEW_MESSAGE', newMsg);
    await this.pushStateToCloud();

    return newMsg;
  },

  /* --- CONFIGURAÃ‡Ã•ES INSTITUCIONAIS --- */
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

  /* --- CATEGORIAS --- */
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
      icon: SecurityService.sanitizeText(icon || 'ðŸŒ±'),
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

  /* --- CONTEÃšDOS --- */
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

  /* --- MÃ‰TRICAS / KPIS --- */
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

    const totalViews = contents.reduce((acc, c) => acc + (c.views || 0), 0);
    const totalAccesses = realVisits + totalViews;
    const publishedCount = contents.length;
    const pendingDoubts = doubts.filter(d => d.status === 'pending').length;

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
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  emitChange(resource) {
    this.listeners.forEach(cb => {
      try {
        cb(resource);
      } catch (err) {
        console.error('[StorageService] Erro em listener de mudanÃ§a:', err);
      }
    });
  }
};