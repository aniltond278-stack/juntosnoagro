# 🌾 Juntos no Agro — Portal Colaborativo do Agronegócio

Portal web seguro, responsivo e editável pelo Administrador para conectar produtores rurais brasileiros.

---

## 🚀 Deploy em Produção (HTTPS Gratuito)

### Opção 1 — Netlify Drop (Mais Fácil, sem conta necessária)

1. Abra: **https://app.netlify.com/drop**
2. Comprima a pasta `juntosnoagro/` em um arquivo **ZIP**
3. Arraste o ZIP direto para a área indicada na página
4. Em segundos você recebe uma URL pública HTTPS como:
   `https://juntos-no-agro-abc123.netlify.app`

> Os arquivos `netlify.toml` já configuram automaticamente todos os headers de segurança e suporte a GPS.

---

### Opção 2 — Vercel (Conta GitHub recomendada)

1. Crie uma conta gratuita em **https://vercel.com**
2. Instale a CLI: `npm i -g vercel`
3. Na pasta do projeto, execute: `vercel --prod`
4. Siga as instruções e receba sua URL HTTPS pública

> O arquivo `vercel.json` já configura headers de segurança, GPS e roteamento limpo.

---

### Opção 3 — GitHub + Netlify (Automático / CI/CD)

1. Crie um repositório no GitHub: **https://github.com/new**
2. Faça upload dos arquivos (botão "uploading an existing file")
3. No Netlify, clique em "Add new site" → "Import an existing project"
4. Conecte ao repositório GitHub — deploy automático em cada push!

---

## 🔑 Acesso Administrativo

| Campo | Valor |
|-------|-------|
| E-mail | `admin@juntosnoagro.com.br` |
| Senha | *(consulte o administrador do sistema)* |

> A senha é validada por hash SHA-256 — nunca armazenada em texto claro.

---

## 📱 Requisitos de Segurança para GPS

O recurso de **geolocalização real** (GPS) exige que a aplicação seja servida via **HTTPS**.
- ✅ `https://seu-site.netlify.app` — GPS funciona
- ✅ `https://seu-site.vercel.app` — GPS funciona
- ✅ `http://localhost:8080` — GPS funciona (desenvolvimento local)
- ❌ `file://...` — GPS bloqueado pelo navegador

---

## 🧑‍💻 Desenvolvimento Local

```bash
# Inicie o servidor local (requer PowerShell)
powershell -ExecutionPolicy Bypass -File server.ps1
# Acesse: http://localhost:8080
```

---

## 🗂️ Estrutura do Projeto

```
juntosnoagro/
├── index.html          # Interface principal
├── css/
│   └── style.css       # Estilos + animações
├── js/
│   ├── app.js          # Controlador central
│   ├── auth.js         # Autenticação SHA-256
│   ├── security.js     # Sanitização de inputs
│   ├── storage.js      # Persistência localStorage
│   └── components/
│       ├── map.js      # Mapa Leaflet + GPS real
│       ├── cards.js    # Cards de conteúdo
│       ├── doubts.js   # Kanban de dúvidas
│       ├── chat.js     # Chat privado 1:1
│       ├── admin.js    # Painel administrativo
│       └── modals.js   # Todos os modais
├── package.json        # Configuração npm
├── vercel.json         # Config de deploy Vercel
├── netlify.toml        # Config de deploy Netlify
└── .gitignore          # Arquivos ignorados pelo Git
```

---

## 🛡️ Recursos de Segurança

- ✅ Autenticação via hash SHA-256 (sem senha em texto claro)
- ✅ Sessão admin com expiração de 8 horas de inatividade
- ✅ Sanitização de todos os inputs (XSS prevention)
- ✅ Validação de uploads (tipo, tamanho, MIME)
- ✅ Headers HTTP de segurança (HSTS, CSP, X-Frame-Options...)
- ✅ RBAC: Admin vs Visitante (somente leitura)
- ✅ Geolocalização apenas com consentimento explícito do usuário
