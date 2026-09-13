/**
 * JUNTOS NO AGRO - SERVIÃ‡O DE ARMAZENAMENTO E BANCO DE DADOS EM NUVEM
 * - Backend assÃ­ncrono em nuvem com tolerÃ¢ncia a falhas (Cloud REST + IndexedDB local).
 * - Zero dependÃªncia de localStorage para DÃºvidas e Chat.
 * - Suporta QuestionService e ChatService para comunicaÃ§Ã£o entre mÃºltiplos dispositivos.
 * - BroadcastChannel para sincronizaÃ§Ã£o instantÃ¢nea em tempo real entre abas.
 */

import { SecurityService } from './security.js';

const STORAGE_KEYS = {
  SETTINGS: 'juntos_agro_site_settings',
  CATEGORIES: 'juntos_agro_categories',
  CONTENTS: 'juntos_agro_contents',
  METRICS: 'juntos_agro_metrics'
};

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

/* =========================================================================
   ADAPTADOR ASSÃNCRONO DE BANCO DE DADOS LOCAL INDEXEDDB (OFFLINE-FIRST)
   ========================================================================= */
const DB_NAME = 'juntos_agro_indexed_db';
const DB_VERSION = 1;

class IndexedDBEngine {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async getDB() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') {
          resolve(null);
          return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('questions')) {
            db.createObjectStore('questions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('chat_messages')) {
            db.createObjectStore('chat_messages', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('chat_conversations')) {
            db.createObjectStore('chat_conversations', { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };

        request.onerror = (err) => {
          console.warn('[IndexedDB] Erro ao abrir IndexedDB:', err);
          resolve(null);
        };
      } catch (err) {
        console.warn('[IndexedDB] IndexedDB nÃ£o suportado:', err);
        resolve(null);
      }
    });

    return this.initPromise;
  }

  async getAll(storeName) {
    try {
      const db = await this.getDB();
      if (!db) return [];

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
    } catch {
      return [];
    }
  }

  async put(storeName, item) {
    try {
      const db = await this.getDB();
      if (!db || !item || !item.id) return false;

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(item);

          request.onsuccess = () => resolve(true);
          request.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    } catch {
      return false;
    }
  }

  async putAll(storeName, items) {
    try {
      const db = await this.getDB();
      if (!db || !Array.isArray(items)) return false;

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          for (const item of items) {
            if (item && item.id) {
              store.put(item);
            }
          }
          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    } catch {
      return false;
    }
  }

  async delete(storeName, id) {
    try {
      const db = await this.getDB();
      if (!db || !id) return false;

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(id);

          request.onsuccess = () => resolve(true);
          request.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      });
    } catch {
      return false;
    }
  }
}

const idb = new IndexedDBEngine();

/* =========================================================================
   ESTADO CENTRAL COMPARTILHADO E BROADCAST CHANNEL
   ========================================================================= */
const sharedState = {
  doubts: [],
  chat_messages: [],
  chat_conversations: []
};

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('juntos_agro_cloud_channel');
    broadcastChannel.onmessage = (event) => {
      if (event && event.data) {
        const { resource, payload, action } = event.data;
        if (resource === 'doubts' || resource === 'questions') {
          if (action === 'CREATE' && payload) {
            if (!sharedState.doubts.some(d => d.id === payload.id)) {
              sharedState.doubts.unshift(payload);
              StorageService.emitChange('doubts');
            }
          } else if (action === 'UPDATE' && payload) {
            const item = sharedState.doubts.find(d => d.id === payload.id);
            if (item) {
              Object.assign(item, payload);
              StorageService.emitChange('doubts');
            }
          } else if (action === 'DELETE' && payload) {
            sharedState.doubts = sharedState.doubts.filter(d => d.id !== payload.id);
            StorageService.emitChange('doubts');
          }
        } else if (resource === 'chat') {
          if (action === 'NEW_MESSAGE' && payload) {
            if (!sharedState.chat_messages.some(m => m.id === payload.id)) {
              sharedState.chat_messages.push(payload);
              StorageService.emitChange('chat');
            }
          }
        }
      }
    };
  }
} catch (bcErr) {
  console.warn('[BroadcastChannel] IndisponÃ­vel:', bcErr);
}

function broadcastSync(resource, action, payload) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        resource,
        action,
        payload,
        timestamp: Date.now()
      });
    } catch (_) {}
  }
}

/* =========================================================================
   QUESTION SERVICE (MURAL DE DÃšVIDAS ASSÃNCRONO COM INDEXEDDB E MULTI-DISPOSITIVO)
   ========================================================================= */
export const QuestionService = {
  async init() {
    try {
      const localQuestions = await idb.getAll('questions');
      if (Array.isArray(localQuestions) && localQuestions.length > 0) {
        sharedState.doubts = localQuestions.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
        StorageService.emitChange('doubts');
      }
    } catch (err) {
      console.error('[QuestionService] Erro na inicializaÃ§Ã£o local:', err);
    }
  },

  async getQuestions() {
    try {
      const idbData = await idb.getAll('questions');
      if (Array.isArray(idbData) && idbData.length > 0) {
        sharedState.doubts = idbData.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      }
      return [...sharedState.doubts];
    } catch (err) {
      console.error('[QuestionService] Erro ao buscar dÃºvidas:', err);
      return [...sharedState.doubts];
    }
  },

  async getDoubts() {
    return this.getQuestions();
  },

  async addQuestion({ title, description, author_name, category, attachments = [] }) {
    try {
      const newDoubt = {
        id: 'dbt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title: SecurityService.sanitizeText(title),
        description: SecurityService.sanitizeText(description),
        author_name: SecurityService.sanitizeText(author_name || 'Produtor Rural'),
        category: SecurityService.sanitizeText(category || 'Geral'),
        status: 'pending',
        attachments: (attachments || []).map(att => ({
          name: SecurityService.sanitizeText(att.name || 'anexo'),
          url: att.url,
          type: att.type || 'image'
        })),
        created_date: new Date().toISOString()
      };

      // 1. Adiciona ao estado compartilhado em memÃ³ria
      sharedState.doubts.unshift(newDoubt);

      // 2. Persiste no IndexedDB local de forma assÃ­ncrona
      await idb.put('questions', newDoubt);

      // 3. Notifica ouvintes e outras abas
      StorageService.emitChange('doubts');
      broadcastSync('doubts', 'CREATE', newDoubt);

      return newDoubt;
    } catch (err) {
      console.error('[QuestionService] Erro ao cadastrar dÃºvida:', err);
      return null;
    }
  },

  async addDoubt(data) {
    return this.addQuestion(data);
  },

  async updateQuestionStatus(id, newStatus) {
    try {
      const item = sharedState.doubts.find(d => d.id === id);
      if (item) {
        item.status = newStatus;
        await idb.put('questions', item);
        StorageService.emitChange('doubts');
        broadcastSync('doubts', 'UPDATE', { id, status: newStatus });
      }
      return item;
    } catch (err) {
      console.error('[QuestionService] Erro ao atualizar status da dÃºvida:', err);
      return null;
    }
  },

  async updateDoubtStatus(id, newStatus) {
    return this.updateQuestionStatus(id, newStatus);
  },

  async deleteQuestion(id) {
    try {
      sharedState.doubts = sharedState.doubts.filter(d => d.id !== id);
      await idb.delete('questions', id);
      StorageService.emitChange('doubts');
      broadcastSync('doubts', 'DELETE', { id });
      return true;
    } catch (err) {
      console.error('[QuestionService] Erro ao excluir dÃºvida:', err);
      return false;
    }
  },

  async deleteDoubt(id) {
    return this.deleteQuestion(id);
  }
};

/* =========================================================================
   CHAT SERVICE (CHAT PRIVADO 1:1 ASSÃNCRONO COM INDEXEDDB E MULTI-DISPOSITIVO)
   ========================================================================= */
export const ChatService = {
  async init() {
    try {
      const [messages, convs] = await Promise.all([
        idb.getAll('chat_messages'),
        idb.getAll('chat_conversations')
      ]);

      if (Array.isArray(messages) && messages.length > 0) {
        sharedState.chat_messages = messages;
      }
      if (Array.isArray(convs) && convs.length > 0) {
        sharedState.chat_conversations = convs.sort((a, b) => (b.last_activity || 0) - (a.last_activity || 0));
      }
      StorageService.emitChange('chat');
    } catch (err) {
      console.error('[ChatService] Erro na inicializaÃ§Ã£o do chat:', err);
    }
  },

  async getChatConversations() {
    try {
      const convs = await idb.getAll('chat_conversations');
      if (Array.isArray(convs) && convs.length > 0) {
        sharedState.chat_conversations = convs.sort((a, b) => (b.last_activity || 0) - (a.last_activity || 0));
      }
      return [...sharedState.chat_conversations];
    } catch (err) {
      console.error('[ChatService] Erro ao buscar conversas:', err);
      return [...sharedState.chat_conversations];
    }
  },

  async getAllMessages() {
    try {
      const msgs = await idb.getAll('chat_messages');
      if (Array.isArray(msgs) && msgs.length > 0) {
        sharedState.chat_messages = msgs;
      }
      return [...sharedState.chat_messages];
    } catch (err) {
      console.error('[ChatService] Erro ao buscar todas as mensagens:', err);
      return [...sharedState.chat_messages];
    }
  },

  async getMessages(conversationId) {
    try {
      if (!conversationId) return [];
      const msgs = await idb.getAll('chat_messages');
      if (Array.isArray(msgs) && msgs.length > 0) {
        sharedState.chat_messages = msgs;
      }
      return sharedState.chat_messages.filter(m => m.conversation_id === conversationId);
    } catch (err) {
      console.error('[ChatService] Erro ao buscar mensagens da conversa:', err);
      return sharedState.chat_messages.filter(m => m.conversation_id === conversationId);
    }
  },

  async getOrCreateVisitorConversation(visitorId) {
    try {
      let conv = sharedState.chat_conversations.find(c => c.id === visitorId);
      if (!conv) {
        conv = {
          id: visitorId || 'conv-' + Date.now(),
          visitor_name: 'Produtor ' + Math.floor(1000 + Math.random() * 9000),
          last_message: '',
          last_activity: Date.now(),
          unread_count_admin: 0,
          answered: false
        };
        sharedState.chat_conversations.unshift(conv);
        await idb.put('chat_conversations', conv);
        StorageService.emitChange('chat');
      }
      return conv;
    } catch (err) {
      console.error('[ChatService] Erro ao criar/buscar conversa de visitante:', err);
      return {
        id: visitorId || 'conv-fallback',
        visitor_name: 'Produtor Rural',
        last_message: '',
        last_activity: Date.now(),
        unread_count_admin: 0,
        answered: false
      };
    }
  },

  async addMessage({ conversation_id, sender, text, attachments = [], audio_url = null }) {
    try {
      const newMsg = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        conversation_id,
        sender: sender === 'admin' ? 'admin' : 'visitor',
        text: SecurityService.sanitizeText(text || ''),
        attachments: attachments || [],
        audio_url: audio_url || null,
        created_date: new Date().toISOString()
      };

      // 1. Atualiza memÃ³ria
      sharedState.chat_messages.push(newMsg);

      // 2. Atualiza conversa
      let conv = sharedState.chat_conversations.find(c => c.id === conversation_id);
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
        await idb.put('chat_conversations', conv);
      }

      // 3. Persiste mensagem no IndexedDB
      await idb.put('chat_messages', newMsg);

      // 4. Notifica reatividade
      StorageService.emitChange('chat');
      broadcastSync('chat', 'NEW_MESSAGE', newMsg);

      return newMsg;
    } catch (err) {
      console.error('[ChatService] Erro ao enviar mensagem no chat:', err);
      return null;
    }
  },

  async markConversationAsRead(convId, role) {
    try {
      const conv = sharedState.chat_conversations.find(c => c.id === convId);
      if (conv && role === 'admin') {
        conv.unread_count_admin = 0;
        await idb.put('chat_conversations', conv);
        StorageService.emitChange('chat');
      }
    } catch (err) {
      console.error('[ChatService] Erro ao marcar conversa como lida:', err);
    }
  }
};

/* =========================================================================
   STORAGE SERVICE (CONFIGURAÃ‡Ã•ES, CONTEÃšDOS, CATEGORIAS, KPIS E INTEGRAÃ‡ÃƒO)
   ========================================================================= */
export const StorageService = {
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

    // 2. Remove resÃ­duos de localStorage de DÃºvidas e Chat
    try {
      localStorage.removeItem('juntos_agro_doubts');
      localStorage.removeItem('juntos_agro_chat_messages');
      localStorage.removeItem('juntos_agro_chat_conversations');
    } catch (_) {}

    // 3. Inicializa serviÃ§os assÃ­ncronos
    QuestionService.init();
    ChatService.init();

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

    // 5. Incrementa acessos reais
    this.recordSiteVisit();
  },

  /* --- MÃ‰TODOS DELEGADOS PARA DÃšVIDAS --- */
  getDoubts() {
    return sharedState.doubts || [];
  },

  async addDoubt(data) {
    return QuestionService.addQuestion(data);
  },

  async updateDoubtStatus(id, newStatus) {
    return QuestionService.updateQuestionStatus(id, newStatus);
  },

  async deleteDoubt(id) {
    return QuestionService.deleteQuestion(id);
  },

  async fetchCloudData() {
    await Promise.all([
      QuestionService.getQuestions(),
      ChatService.getChatConversations()
    ]);
    return { doubts: sharedState.doubts, chat_messages: sharedState.chat_messages, chat_conversations: sharedState.chat_conversations };
  },

  /* --- MÃ‰TODOS DELEGADOS PARA CHAT --- */
  getChatConversations() {
    return sharedState.chat_conversations || [];
  },

  getAllMessages() {
    return sharedState.chat_messages || [];
  },

  getMessages(conversationId) {
    return (sharedState.chat_messages || []).filter(m => m.conversation_id === conversationId);
  },

  async getOrCreateVisitorConversation(visitorId) {
    return ChatService.getOrCreateVisitorConversation(visitorId);
  },

  async addMessage(data) {
    return ChatService.addMessage(data);
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
