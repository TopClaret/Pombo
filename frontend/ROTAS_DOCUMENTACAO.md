# Documentação de Rotas do Frontend

## Rotas Públicas

### `/login`
- **Componente**: `Login`
- **Descrição**: Página de autenticação do usuário
- **Recursos**:
  - Formulário de login com validação
  - Exibição de status dos servidores em tempo real
  - Link para registro

### `/register`
- **Componente**: `Register`
- **Descrição**: Página de registro de novos usuários
- **Recursos**:
  - Formulário de registro com validação
  - Link para login

## Rotas Protegidas

Todas as rotas abaixo requerem autenticação e são renderizadas dentro do componente `Layout`.

### `/dashboard` (Rota padrão `/`)
- **Componente**: `Dashboard`
- **Descrição**: Página principal com visão geral do sistema
- **Recursos**:
  - Estatísticas gerais
  - Atividades recentes
  - Gráficos e métricas

### `/upload`
- **Componente**: `Upload`
- **Descrição**: Página para upload de arquivos (imagens/vídeos)
- **Recursos**:
  - Upload múltiplo de arquivos
  - Preview de arquivos
  - Processamento automático

### `/analysis`
- **Componente**: `Analysis`
- **Descrição**: Lista de todas as análises realizadas
- **Recursos**:
  - Filtros por status, tipo de arquivo e busca
  - Cards com resultados resumidos
  - Exportação de dados
  - Navegação para detalhes

### `/analysis/:id`
- **Componente**: `AnalysisDetails`
- **Descrição**: Detalhes completos de uma análise específica
- **Recursos**:
  - Informações completas do arquivo
  - Resultados detalhados da análise
  - Exportação em JSON
  - Navegação de volta para lista

### `/realtime`
- **Componente**: `Realtime`
- **Descrição**: Detecção em tempo real usando câmera
- **Recursos**:
  - Captura de vídeo da câmera
  - Detecção em tempo real com YOLO
  - Configuração de parâmetros de detecção
  - Estatísticas de FPS e objetos detectados

### `/profile`
- **Componente**: `Profile`
- **Descrição**: Perfil do usuário logado
- **Recursos**:
  - Edição de informações pessoais
  - Alteração de senha
  - Estatísticas do usuário

### `/settings`
- **Componente**: `Settings`
- **Descrição**: Configurações do sistema
- **Recursos**:
  - Configurações de notificações
  - Configurações de API e conexão
  - Configurações de processamento
  - Configurações gerais (idioma, tema)

## Navegação

### Sidebar
A sidebar contém os seguintes itens de navegação:

**Principais:**
- Dashboard (`/dashboard`)
- Upload (`/upload`)
- Análises (`/analysis`)
- Tempo Real (`/realtime`)

**Usuário:**
- Perfil (`/profile`)
- Configurações (`/settings`)

## Componentes de Navegação

### `Layout`
Componente wrapper que fornece:
- Sidebar com navegação
- Header com informações do usuário
- Área de conteúdo principal (`<Outlet />`)

### `ProtectedRoute`
Componente que protege rotas, redirecionando para `/login` se o usuário não estiver autenticado.

## Status dos Servidores

O componente `ServerStatus` é exibido na página de login e monitora:

1. **Backend API** (`http://localhost:5000`)
   - Tipo: API
   - Verifica endpoint `/health`

2. **AI Processor** (`http://localhost:8001`)
   - Tipo: AI Processor
   - Verifica endpoint `/health`

3. **Banco de Dados** (via Backend)
   - Tipo: Database
   - Verifica conexão através do backend

### Funcionalidades do Monitoramento
- Verificação automática a cada 30 segundos
- Indicadores visuais (verde para online, vermelho para offline)
- Tooltips com informações técnicas (URL, tempo de resposta, erros)
- Exibição do horário da última verificação

## Estrutura de Arquivos

```
frontend/src/
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Upload.tsx
│   ├── Analysis.tsx
│   ├── AnalysisDetails.tsx
│   ├── Realtime.tsx
│   ├── Profile.tsx
│   └── Settings.tsx
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx
│   │   ├── Sidebar/
│   │   │   └── Sidebar.tsx
│   │   └── Header/
│   │       └── Header.tsx
│   ├── ProtectedRoute/
│   │   └── ProtectedRoute.tsx
│   └── ServerStatus/
│       └── ServerStatus.tsx
└── App.tsx
```

## Notas de Implementação

1. Todas as rotas protegidas são verificadas pelo `ProtectedRoute`
2. O status dos servidores é atualizado automaticamente na página de login
3. A navegação é responsiva e funciona em dispositivos móveis
4. Todas as páginas seguem o design system consistente
5. Tratamento de erros está implementado em todas as rotas

