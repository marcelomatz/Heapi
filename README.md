# Heapi 🚀

**Heapi** (High-Efficiency API Client) é um cliente de API desktop moderno, open-source e focado em performance, projetado para desenvolvedores que exigem uma ferramenta leve, extensível e totalmente integrada ao seu workflow de terminal.

Construído com **Go** e **React**, o Heapi elimina a sobrecarga de memória de ferramentas baseadas em Electron, oferecendo uma experiência nativa fluida com recursos avançados de automação e gerenciamento de contexto.

---

## ✨ Funcionalidades Principais

### 📡 Engine de Requisições de Alta Performance
- **Execução Instantânea**: Motor HTTP escrito em Go puro com suporte a concorrência real.
- **Auto-Save Inteligente**: Todas as alterações em URLs, Headers, Auth ou Body são persistidas em tempo real, garantindo que você nunca perca seu trabalho.
- **Resposta Rica**: Visualização de JSON formatado, metadados de performance e headers detalhados.

### 🔐 Motor de Interpolação de Variáveis (V.I.E)
- **Sintaxe Flexível**: Suporte nativo para variáveis `{{var}}` e `<<var>>`.
- **Resolução Recursiva**: Variáveis que apontam para outras variáveis são resolvidas em cascata (até 5 níveis).
- **Contexto Global**: Alterne instantaneamente entre ambientes (Dev, Staging, Prod) através da barra superior, atualizando todo o seu workflow em milissegundos.

### 📂 Collections YAML & Git-Friendly
- **Persistência Híbrida**: Configurações de requisição salvas em arquivos YAML (perfeito para versionamento Git) e metadados de execução em SQLite local.
- **Busca e Filtro**: Filtre coleções e requisições em tempo real na barra lateral.
- **Organização Visual**: Categorize coleções por cores e ordem personalizada via Drag & Drop.

### 💻 Terminal Integrado (Multi-tab)
- **Acesso Nativo**: Execute `curl`, scripts de automação ou comandos shell sem sair do app.
- **ConPTY**: Suporte completo a pseudo-terminais (PowerShell, CMD, Git Bash, WSL).

### 📤 Importação e Extensibilidade
- **Migração Fácil**: Importe requisições diretamente de comandos `cURL` ou coleções do Postman (v2.1).

---

## 🛠️ Stack Técnica

- **Backend**: [Go](https://golang.org/) (Performance e Concorrência).
- **Frontend**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS](https://tailwindcss.com/).
- **Desktop Framework**: [Wails v2](https://wails.io/) (Binários nativos e leves).
- **Banco de Dados**: [SQLite](https://sqlite.org/) via GORM (Persistência de estado e metadados).
- **Icons**: [Lucide React](https://lucide.dev/).

---

## 🚀 Como Começar

### Pré-requisitos
- Go 1.21+
- Node.js 18+
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### Instalação e Build
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/heapi.git
cd heapi

# Instale as dependências e inicie em modo desenvolvimento
wails dev
```

Para gerar o executável final:
```bash
wails build
```

---

## 📄 Licença

Este projeto é licenciado sob a **Licença MIT** - consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuição

Heapi é construído pela comunidade. Se você deseja contribuir:
1. Leia o nosso [Guia de Contribuição](CONTRIBUTING.md).
2. Siga o nosso [Código de Conduta](CODE_OF_CONDUCT.md).
3. Abra uma *Issue* para discutir mudanças maiores antes de enviar um *Pull Request*.

---
Developed with ❤️ by the Heapi Team.
