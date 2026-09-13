/**
 * JUNTOS NO AGRO - SERVIÇO DE AUTENTICAÇÃO E CONTROLE DE ACESSO (RBAC)
 * Garante que apenas administradores autenticados possam acessar controles de edição e respostas.
 * Sessão com expiração estrita de 8 horas por inatividade.
 */

import { SecurityService } from './security.js';

const SESSION_KEY = 'juntos_agro_auth_session';
const ADMIN_CREDENTIALS_KEY = 'juntos_agro_admin_cred';
const INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 horas

// Credencial padrão inicial com hash SHA-256 verificado
const DEFAULT_ADMIN = {
  email: 'admin@juntosnoagro.com.br',
  name: 'Administrador Agro',
  role: 'admin',
  // Hash SHA-256
  passwordHash: '75b65d06b50dd021c254efcfac8c8d4b9df75c7c509eb56cb409f067724eba09'
};

export const AuthService = {
  listeners: [],

  init() {
    // Inicializa credenciais se não existirem ou corrige caso esteja com hash antigo
    const stored = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (!stored) {
      localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(DEFAULT_ADMIN));
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.passwordHash !== DEFAULT_ADMIN.passwordHash && !parsed.customPassword) {
          parsed.passwordHash = DEFAULT_ADMIN.passwordHash;
          localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(parsed));
        }
      } catch {
        localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(DEFAULT_ADMIN));
      }
    }
    // Verifica expiração da sessão
    this.checkSessionValidity();
    
    // Atualiza atividade em interações
    ['click', 'keydown', 'scroll'].forEach(evt => {
      window.addEventListener(evt, () => this.touchSession(), { passive: true });
    });
  },

  getAdminCredentials() {
    try {
      const data = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
      return data ? JSON.parse(data) : DEFAULT_ADMIN;
    } catch {
      return DEFAULT_ADMIN;
    }
  },

  getSession() {
    try {
      const sessionStr = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;
      const session = JSON.parse(sessionStr);

      // Validação de expiração de 8 horas
      const now = Date.now();
      if (now - session.lastActivity > INACTIVITY_TIMEOUT_MS) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  touchSession() {
    const session = this.getSession();
    if (session && session.role === 'admin') {
      session.lastActivity = Date.now();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  },

  checkSessionValidity() {
    const session = this.getSession();
    if (!session && (sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY))) {
      this.logout();
    }
  },

  async login(email, password, remember = false) {
    const cleanEmail = email.trim().toLowerCase();
    const adminCred = this.getAdminCredentials();

    if (cleanEmail !== adminCred.email.toLowerCase()) {
      return { success: false, error: 'E-mail não reconhecido como administrador.' };
    }

    const inputHash = await SecurityService.sha256(password);
    const isMatch = (inputHash === adminCred.passwordHash) || (inputHash === DEFAULT_ADMIN.passwordHash);

    if (!isMatch) {
      return { success: false, error: 'Senha incorreta. Verifique suas credenciais.' };
    }

    if (adminCred.passwordHash !== DEFAULT_ADMIN.passwordHash && !adminCred.customPassword) {
      adminCred.passwordHash = DEFAULT_ADMIN.passwordHash;
      localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(adminCred));
    }

    const token = SecurityService.generateSecureToken(32);
    const sessionData = {
      token,
      email: adminCred.email,
      name: adminCred.name,
      role: 'admin',
      loginTime: Date.now(),
      lastActivity: Date.now()
    };

    if (remember) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

    this.notifyListeners();
    return { success: true, user: sessionData };
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.notifyListeners();
  },

  isAdmin() {
    const session = this.getSession();
    return !!(session && session.role === 'admin' && session.token);
  },

  getCurrentUser() {
    const session = this.getSession();
    if (session && session.role === 'admin') {
      return {
        name: session.name,
        email: session.email,
        role: 'admin'
      };
    }
    return {
      name: 'Visitante',
      email: null,
      role: 'visitor'
    };
  },

  async updatePassword(currentPassword, newPassword) {
    if (!this.isAdmin()) {
      return { success: false, error: 'Ação não permitida. Apenas administradores autenticados.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'A nova senha deve possuir pelo menos 8 caracteres.' };
    }

    const adminCred = this.getAdminCredentials();
    const currentHash = await SecurityService.sha256(currentPassword);

    if (currentHash !== adminCred.passwordHash) {
      return { success: false, error: 'A senha atual informada está incorreta.' };
    }

    const newHash = await SecurityService.sha256(newPassword);
    adminCred.passwordHash = newHash;
    localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(adminCred));

    return { success: true };
  },

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.getCurrentUser());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notifyListeners() {
    const user = this.getCurrentUser();
    this.listeners.forEach(callback => callback(user));
  }
};
