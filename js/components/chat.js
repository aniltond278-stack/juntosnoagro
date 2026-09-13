/**
 * JUNTOS NO AGRO - CHAT PRIVADO 1:1 SEGURO
 * Apenas o Administrador autenticado pode responder aos produtores e ver a lista geral de conversas.
 * Visitantes possuem sua própria conversa individual protegida contra impersonação.
 * Suporte a envio de fotos, arquivos PDF/MP4 e gravação de áudio.
 */

import { StorageService } from '../storage.js';
import { AuthService } from '../auth.js';
import { SecurityService } from '../security.js';

const VISITOR_CONV_STORAGE = 'juntos_agro_visitor_conv_id';

export const ChatComponent = {
  currentConversationId: null,
  activeRole: 'visitor',
  mediaRecorder: null,
  audioChunks: [],
  isRecordingAudio: false,
  mobileShowMessages: false,   // Mobile admin: false = exibe sidebar, true = exibe mensagens

  init() {
    this.activeRole = AuthService.isAdmin() ? 'admin' : 'visitor';
    this.setupConversation();
    this.bindEvents();
    this.render();
  },

  setupConversation() {
    this.activeRole = AuthService.isAdmin() ? 'admin' : 'visitor';

    if (this.activeRole === 'visitor') {
      let convId = localStorage.getItem(VISITOR_CONV_STORAGE);
      if (!convId) {
        convId = 'conv-visitor-' + Date.now();
        localStorage.setItem(VISITOR_CONV_STORAGE, convId);
      }
      const conv = StorageService.getOrCreateVisitorConversation(convId);
      this.currentConversationId = conv.id;
    } else {
      // Modo Administrador: seleciona a primeira conversa da lista ou a mais recente
      const convs = StorageService.getChatConversations();
      if (convs.length > 0) {
        if (!this.currentConversationId || !convs.find(c => c.id === this.currentConversationId)) {
          this.currentConversationId = convs[0].id;
        }
      } else {
        this.currentConversationId = null;
      }
    }
  },

  bindEvents() {
    const fileInput = document.getElementById('chat-file-input');
    const sendBtn = document.getElementById('btn-send-chat-msg');
    const msgInput = document.getElementById('chat-msg-input');
    const recordBtn = document.getElementById('btn-record-audio');

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file || !this.currentConversationId) return;

        const validation = SecurityService.validateFile(file, 'media');
        if (!validation.valid) {
          alert(validation.error);
          return;
        }

        const dataUrl = await SecurityService.readFileAsDataURL(file);
        StorageService.addMessage({
          conversation_id: this.currentConversationId,
          sender: this.activeRole,
          text: '',
          attachments: [{ name: file.name, url: dataUrl, type: file.type.startsWith('video') ? 'video' : (file.type === 'application/pdf' ? 'pdf' : 'image') }]
        });

        fileInput.value = '';
        this.renderMessages();
      });
    }

    if (sendBtn && msgInput) {
      const handleSend = () => {
        const text = msgInput.value.trim();
        if (!text || !this.currentConversationId) return;

        StorageService.addMessage({
          conversation_id: this.currentConversationId,
          sender: this.activeRole,
          text: text
        });

        msgInput.value = '';
        this.renderMessages();
      };

      sendBtn.addEventListener('click', handleSend);
      msgInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }

    if (recordBtn) {
      recordBtn.addEventListener('click', () => this.toggleAudioRecording());
    }
  },

  async toggleAudioRecording() {
    const recordBtn = document.getElementById('btn-record-audio');

    if (this.isRecordingAudio) {
      // Parar gravação
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isRecordingAudio = false;
      if (recordBtn) {
        recordBtn.classList.remove('bg-red-500', 'text-white', 'animate-pulse');
        recordBtn.classList.add('text-muted-foreground', 'hover:bg-muted');
      }
    } else {
      // Iniciar gravação
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        this.mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result;
            StorageService.addMessage({
              conversation_id: this.currentConversationId,
              sender: this.activeRole,
              text: '',
              audio_url: base64Audio
            });
            this.renderMessages();
          };
          stream.getTracks().forEach(track => track.stop());
        };

        this.mediaRecorder.start();
        this.isRecordingAudio = true;
        if (recordBtn) {
          recordBtn.classList.remove('text-muted-foreground', 'hover:bg-muted');
          recordBtn.classList.add('bg-red-500', 'text-white', 'animate-pulse');
        }
      } catch (err) {
        alert('Permissão de microfone não concedida ou dispositivo indisponível.');
      }
    }
  },

  render() {
    this.activeRole = AuthService.isAdmin() ? 'admin' : 'visitor';
    this.setupConversation();

    const roleBadge = document.getElementById('chat-role-indicator');
    const sidebar = document.getElementById('chat-admin-sidebar');
    const notice = document.getElementById('chat-visitor-notice');
    const messagesPanel = document.getElementById('chat-messages-panel');

    if (roleBadge) {
      roleBadge.innerHTML = this.activeRole === 'admin'
        ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
             <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Modo Administrador
           </span>`
        : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
             <i data-lucide="user" class="w-3.5 h-3.5"></i> Modo Visitante (Suporte 1:1)
           </span>`;
    }

    if (sidebar) {
      if (this.activeRole === 'admin') {
        sidebar.classList.remove('hidden');

        // Mobile: alterna entre sidebar e painel de mensagens
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          if (this.mobileShowMessages) {
            sidebar.classList.add('hidden');
            if (messagesPanel) messagesPanel.classList.remove('hidden');
          } else {
            sidebar.classList.remove('hidden');
            if (messagesPanel) messagesPanel.classList.add('hidden');
          }
        } else {
          // Desktop: exibe ambos lado a lado
          sidebar.classList.remove('hidden');
          if (messagesPanel) messagesPanel.classList.remove('hidden');
        }

        this.renderSidebarConversations();
      } else {
        sidebar.classList.add('hidden');
        if (messagesPanel) messagesPanel.classList.remove('hidden');
      }
    }

    if (notice) {
      notice.innerHTML = this.activeRole === 'visitor'
        ? `Sua conversa é privada com o corpo técnico do Juntos no Agro. Suas dúvidas serão respondidas diretamente aqui.`
        : `Painel de atendimento: selecione um produtor à esquerda para responder em tempo real.`;
    }

    // Botão "← Voltar às conversas" (mobile admin)
    let backBtn = document.getElementById('chat-mobile-back-btn');
    if (!backBtn && messagesPanel) {
      backBtn = document.createElement('button');
      backBtn.id = 'chat-mobile-back-btn';
      backBtn.className = 'md:hidden flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-2 rounded-lg hover:bg-primary/10 transition mb-2 -ml-1';
      backBtn.innerHTML = '<i data-lucide="arrow-left" class="w-4 h-4"></i> Voltar às conversas';
      backBtn.addEventListener('click', () => {
        this.mobileShowMessages = false;
        this.render();
      });
      messagesPanel.insertBefore(backBtn, messagesPanel.firstChild);
    }

    if (backBtn) {
      const showBack = this.activeRole === 'admin' && this.mobileShowMessages;
      backBtn.style.display = showBack ? 'flex' : 'none';
    }

    this.renderMessages();
    if (window.lucide) window.lucide.createIcons();
  },

  renderSidebarConversations() {
    const container = document.getElementById('chat-conversations-list');
    if (!container) return;

    const convs = StorageService.getChatConversations();

    if (convs.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-xs text-muted-foreground">
          Nenhuma conversa de visitante iniciada até o momento.
        </div>
      `;
      return;
    }

    container.innerHTML = convs.map(c => {
      const isSelected = c.id === this.currentConversationId;
      const unread = c.unread_count_admin || 0;

      return `
        <button 
          class="btn-select-conv w-full text-left p-3 border-b border-border hover:bg-muted/60 transition flex items-start justify-between gap-2 ${
            isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
          }"
          data-id="${c.id}"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-xs text-foreground truncate">${c.visitor_name}</span>
              ${unread > 0 ? `
                <span class="bg-primary text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  ${unread}
                </span>
              ` : (c.answered ? `
                <span class="text-emerald-600 text-[10px] flex items-center gap-0.5">
                  <i data-lucide="check" class="w-3 h-3"></i>
                </span>
              ` : '')}
            </div>
            <p class="text-[11px] text-muted-foreground truncate mt-0.5">
              ${c.last_message || 'Nova conversa iniciada'}
            </p>
          </div>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.btn-select-conv').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentConversationId = btn.dataset.id;
        // Mobile admin: navega para painel de mensagens ao selecionar conversa
        if (window.innerWidth < 768) {
          this.mobileShowMessages = true;
        }
        this.render();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  },

  renderMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    if (!this.currentConversationId) {
      container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-6 text-sm text-muted-foreground">
          <i data-lucide="message-square" class="w-10 h-10 mb-2 opacity-30"></i>
          Selecione uma conversa para visualizar o histórico de mensagens.
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const messages = StorageService.getMessages(this.currentConversationId);

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-6 text-sm text-muted-foreground">
          <i data-lucide="messages-square" class="w-10 h-10 mb-2 text-primary opacity-40"></i>
          <p class="font-medium text-foreground">Inicie sua conversa com o Especialista</p>
          <p class="text-xs text-muted-foreground mt-1 max-w-sm">
            Envie sua dúvida técnica, anexe fotos ou grave um áudio para receber orientação personalizada.
          </p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = messages.map(msg => {
      const isMine = msg.sender === this.activeRole;
      const formattedTime = new Date(msg.created_date).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit'
      });

      return `
        <div class="flex ${isMine ? 'justify-end' : 'justify-start'} animate-in-fade">
          <div class="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
            isMine 
              ? 'bg-primary text-white rounded-br-none' 
              : 'bg-muted text-foreground rounded-bl-none border border-border'
          }">
            <div class="text-[10px] font-bold opacity-75 mb-1">
              ${msg.sender === 'admin' ? 'Especialista Agronômico' : 'Produtor'} · ${formattedTime}
            </div>

            ${msg.text ? `<p class="leading-relaxed break-words">${msg.text}</p>` : ''}

            <!-- Anexo de Áudio -->
            ${msg.audio_url ? `
              <div class="mt-2 pt-1">
                <audio controls src="${msg.audio_url}" class="max-w-full h-8"></audio>
              </div>
            ` : ''}

            <!-- Anexos de Arquivos / Imagens -->
            ${msg.attachments && msg.attachments.length > 0 ? `
              <div class="mt-2 space-y-1.5">
                ${msg.attachments.map(att => {
                  if (att.type === 'image') {
                    return `
                      <a href="${att.url}" target="_blank" rel="noopener" class="block rounded-lg overflow-hidden border border-black/10 max-w-[220px]">
                        <img src="${att.url}" alt="${att.name}" class="w-full h-auto object-cover max-h-48" />
                      </a>
                    `;
                  }
                  return `
                    <a href="${att.url}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-xs transition">
                      <i data-lucide="${att.type === 'video' ? 'video' : 'file-text'}" class="w-4 h-4"></i>
                      <span class="truncate max-w-[160px]">${att.name}</span>
                    </a>
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Rola para a última mensagem
    container.scrollTop = container.scrollHeight;
    if (window.lucide) window.lucide.createIcons();
  }
};
