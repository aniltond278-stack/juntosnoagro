// Conexao direta com a nuvem Supabase
const SUPABASE_URL = 'https://queddkfmrgcinngovxbk.supabase.co/rest/v1';
const API_KEY = 'sb_publishable_qDyXO7183qhEySNZePGchQ_qOzQ7cSk';

const HEADERS = {
  'apikey': API_KEY,
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

export const StorageService = {
  async getQuestions() {
    try {
      const res = await fetch(`${SUPABASE_URL}/duvidas?select=*&order=created_at.desc`, { headers: HEADERS });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('Erro getQuestions:', e);
      return [];
    }
  },

  async addQuestion(questionData) {
    try {
      const payload = typeof questionData === 'string' 
        ? { autor: 'Agricultor / Usuário', pergunta: questionData, status: 'pendente' }
        : { 
            autor: questionData.autor || 'Agricultor / Usuário', 
            pergunta: questionData.pergunta || questionData.text || questionData.question || '', 
            status: 'pendente' 
          };

      const res = await fetch(`${SUPABASE_URL}/duvidas`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.error('Erro addQuestion:', e);
      throw e;
    }
  },

  async answerQuestion(id, resposta) {
    try {
      const res = await fetch(`\({SUPABASE_URL}/duvidas?id=eq.\){id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({ resposta: resposta, status: 'respondida' })
      });
      return await res.json();
    } catch (e) {
      console.error('Erro answerQuestion:', e);
    }
  },

  async getMessages(conversaId = 'geral') {
    try {
      const res = await fetch(`\({SUPABASE_URL}/mensagens?conversa_id=eq.\){conversaId}&select=*&order=created_at.asc`, { headers: HEADERS });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async addMessage(conversaId = 'geral', remetente = 'Usuário', texto = '') {
    try {
      const res = await fetch(`${SUPABASE_URL}/mensagens`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ conversa_id: conversaId, remetente: remetente, texto: texto })
      });
      return await res.json();
    } catch (e) {
      console.error('Erro addMessage:', e);
    }
  }
};

export const QuestionService = StorageService;
export const ChatService = StorageService;

if (typeof window !== 'undefined') {
  window.StorageService = StorageService;
  window.QuestionService = StorageService;
  window.ChatService = StorageService;
}
