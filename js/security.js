/**
 * JUNTOS NO AGRO - SERVIÇO DE SEGURANÇA E SANITIZAÇÃO
 * Implementa defesas contra XSS, Injection, Uploads Maliciosos e Geração Segura de Tokens
 */

export const SecurityService = {
  // Extensões permitidas com respectivos MIME Types esperados
  ALLOWED_IMAGE_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp'],
  ALLOWED_IMAGE_MIMES: ['image/png', 'image/jpeg', 'image/webp'],

  ALLOWED_MEDIA_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.pdf'],
  ALLOWED_MEDIA_MIMES: ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'application/pdf'],

  MAX_IMAGE_SIZE_BYTES: 6 * 1024 * 1024, // 6 MB
  MAX_MEDIA_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB

  /**
   * Sanitiza strings prevenindo XSS e injeção de HTML malicioso
   */
  sanitizeText(input) {
    if (typeof input !== 'string') return '';
    
    // Substitui caracteres especiais de HTML
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  },

  /**
   * Sanitiza entradas mantendo quebras de linha seguras
   */
  sanitizeMultiline(input) {
    if (typeof input !== 'string') return '';
    return this.sanitizeText(input).replace(/\n/g, '<br>');
  },

  /**
   * Valida URLs para evitar protocolos perigosos como javascript: ou data:text/html
   */
  sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    // Apenas permite http, https, mailto, tel e data:image
    if (/^(https?:\/\/|mailto:|tel:|data:image\/)/i.test(trimmed)) {
      return trimmed;
    }
    // Caso seja caminho relativo seguro
    if (/^\/[a-zA-Z0-9_\-\./]+$/.test(trimmed)) {
      return trimmed;
    }
    return '';
  },

  /**
   * Valida rigorosamente uploads de arquivos (Imagens e Documentos/Vídeos)
   * @param {File} file Arquivo recebido do input
   * @param {'image'|'media'} type Tipo de upload esperado
   * @returns {{ valid: boolean, error?: string }}
   */
  validateFile(file, type = 'image') {
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo fornecido.' };
    }

    const fileName = file.name.toLowerCase();

    // 1. Verificação contra Path Traversal e caracteres nulos
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\') || fileName.includes('\0')) {
      return { valid: false, error: 'Nome de arquivo inválido ou com tentativa de evasão de caminho.' };
    }

    // 2. Verificação de extensão dupla perigosa (ex: script.php.jpg)
    const dangerousSubstrings = ['.php', '.js', '.exe', '.sh', '.bat', '.cmd', '.py', '.phtml', '.html', '.svg'];
    for (const dang of dangerousSubstrings) {
      if (fileName.includes(dang)) {
        return { valid: false, error: `Arquivo rejeitado: extensão não permitida (${dang}).` };
      }
    }

    // 3. Verificação de extensão válida
    const allowedExtensions = type === 'image' ? this.ALLOWED_IMAGE_EXTENSIONS : this.ALLOWED_MEDIA_EXTENSIONS;
    const allowedMimes = type === 'image' ? this.ALLOWED_IMAGE_MIMES : this.ALLOWED_MEDIA_MIMES;
    const maxSizeBytes = type === 'image' ? this.MAX_IMAGE_SIZE_BYTES : this.MAX_MEDIA_SIZE_BYTES;

    const fileExt = '.' + fileName.split('.').pop();
    if (!allowedExtensions.includes(fileExt)) {
      return {
        valid: false,
        error: `Formato de arquivo inválido (${fileExt}). Permitidos: ${allowedExtensions.join(', ')}`
      };
    }

    // 4. Verificação de MIME Type
    if (file.type && !allowedMimes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `Tipo MIME incompatível (${file.type}). Permitidos apenas imagens (.png, .jpg, .webp) ou mídias (.mp4, .pdf).`
      };
    }

    // 5. Verificação de Tamanho
    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `Tamanho excede o limite máximo permitido de ${maxMb}MB.`
      };
    }

    return { valid: true };
  },

  /**
   * Converte arquivo validado em Data URL seguro para armazenamento
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Erro ao processar leitura do arquivo.'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Gera um token de sessão seguro com Web Crypto API
   */
  generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Hash simples SHA-256 para senhas e integridade
   */
  async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
};
