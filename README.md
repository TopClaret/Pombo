# Pombo — Análise de Placas Veiculares

Sistema completo para upload e análise de imagens/vídeos com detecção de placa e extração de cor do veículo. Arquitetura em três serviços: Backend (Node/Express), Frontend (React) e Processador de IA (Python/FastAPI).

## Visão Geral
- Backend (`backend`): API REST que autentica usuários, recebe uploads e orquestra a análise via IA.
- Frontend (`frontend`): Interface React para login, upload e visualização de resultados.
- AI Processor (`ai-processor`): Serviço FastAPI que executa detecção e OCR da placa e inferência de cor.

## Arquitetura
- Comunicação principal: Backend → AI Processor via `AI_PROCESSOR_URL`.
- Banco de dados: Sequelize com fallback para SQLite (`pombo_db.sqlite`) quando `DATABASE_URL` não está definido.
- Segurança: JWT, Helmet, CORS controlado, sanitização de payloads e rate limiting configurável.

### Fluxo de Dados
1. Usuário faz login no Frontend (JWT gerado pelo Backend).
2. Upload de imagem/vídeo é enviado para o Backend.
3. Backend encaminha para o AI Processor e recebe: número da placa, cor e metadados.
4. Resultados persistidos e exibidos no Frontend.

## Requisitos
- Node.js 18+
- Python 3.10+
- Pip
- Git

## Configuração de Ambiente
1. Copie o arquivo de exemplo e ajuste variáveis:
   - `backend/.env.example` → crie `backend/.env` e preencha:
     - `PORT=5000`
     - `JWT_SECRET` e `JWT_EXPIRE`
     - `AI_PROCESSOR_URL=http://localhost:8000`
     - Caso use Postgres/Supabase: defina `DATABASE_URL` (senão usa SQLite).
   - Mantenha segredos apenas em `.env` (não commitados).

## Instalação
```
# na raiz do projeto
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Dependências do AI Processor
```
cd ai-processor
pip install -r requirements.txt
# se necessário (Windows): instale Visual C++ Build Tools para opencv
```

## Execução
### Tudo junto (concurrently)
```
npm run dev
```
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- AI Processor: `http://localhost:8000`

### Servidores individualmente
```
# backend
cd backend && npm run dev
# frontend
cd frontend && npm start
# ai-processor
cd ai-processor && python app.py
```

## Autenticação e Usuário de Teste
- Seed de usuário local (SQLite):
```
node backend/scripts/seedUser.js
```
- Login padrão para validar fluxo de autenticação:
  - Email: defina no seed
  - Senha: defina no seed

## Endpoints Principais
- Raiz: `GET /` — informações do serviço (backend/server.js:79)
- Health: `GET /health` — status do servidor (backend/server.js:94)
- Auth: `POST /api/auth/login`, `POST /api/auth/register`
- Upload: `POST /api/upload` — upload de imagem/vídeo
- Analysis: `GET /api/analysis/:id` — resultado de análise

## Variáveis de Ambiente (Backend)
- `PORT`, `NODE_ENV`
- `JWT_SECRET`, `JWT_EXPIRE`
- `DATABASE_URL` (Postgres/Supabase) ou `DB_STORAGE` (SQLite)
- `AI_PROCESSOR_URL`
- Limites e segurança: `BCRYPT_SALT_ROUNDS`, `RATE_LIMIT_*`, etc.

## Banco de Dados
- Automático:
  - Se `DATABASE_URL` estiver presente → Postgres.
  - Caso contrário → SQLite em `backend/pombo_db.sqlite`.
- Sincronização de modelos realizada no boot do servidor.

## Testes
- Backend (Jest):
```
cd backend
npm run test
```
- Frontend (React Scripts):
```
cd frontend
npm test
```

## Troubleshooting
- AI Processor não inicia por falta de deps:
  - Instale: `fastapi`, `uvicorn`, `numpy`, `opencv-python`.
  - Alternativa: `pip install -r requirements.txt`.
- Erros de CORS: revise `origin` no backend (server.js:35).
- Conexão com Postgres/Supabase falha: use SQLite (remova `DATABASE_URL`).

## Boas Práticas de Segurança
- Nunca commitar `.env` ou arquivos de banco (`*.sqlite`).
- Rotacione chaves JWT em produção.
- Use `HTTPS`, WAF e monitore logs.

## Contribuição
- Issues e PRs são bem-vindos.
- Padrão de commit: `type(scope): mensagem` (ex.: `feat(analysis): suporte a cor do veículo`).

## Licença
- Este projeto foi criado com IA
- Este projeto é para fins educacionais e prototipagem. Ajuste termos de uso conforme necessidade.
## Tesseract OCR (Windows)
- Instalação oficial: use o instalador do Tesseract OCR para Windows (UB Mannheim) via Microsoft Winget.
- Verificar instalação: `tesseract --version` (ex.: `v5.5.0.20241111`).
- Configurar caminho no AI Processor: crie/edite `ai-processor/.env` e defina `TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe`.
- Recomendação: mantenha a versão atualizada e valide compatibilidade com Leptonica.

## Modelos de Detecção (YOLO, Ultralytics, Roboflow)
- Variáveis no `ai-processor/.env`:
  - `PLATE_DETECTOR_ONNX_PATH` (YOLO ONNX)
  - `ULTRALYTICS_MODEL_PATH` (weights Ultralytics)
  - `ROBOFLOW_API_URL`, `ROBOFLOW_API_KEY`, `ROBOFLOW_MODEL_ID`
- Carregamento via API:
  - `POST /yolo/load` body: `onnx_path` opcional
  - `POST /ultra/load` body: `weights_path` opcional
  - `POST /roboflow/load` body: `api_url`, `api_key`, `model_id` opcional
- Ensemble e fallback:
  - O AI combina previsões dos três detectores, mescla caixas por IoU e pondera por pesos.
  - Se nenhum detector encontrar placas, ativa contornos/MSER e aplica OCR robusto.
  - Ajuste de pesos: `POST /config/ensemble` com `yolo`, `ultra`, `roboflow` (padrão 0.33/0.34/0.33) ou `.env ENSEMBLE_WEIGHTS`.

## Cenários Desafiadores e Configurações
- Ângulo incomum: aumentar pesos de Ultralytics, reduzir limiar de conf (`ULTRA_CONF_THRESH`).
- Iluminação adversa: habilitar pré-processamento mais agressivo (já embutido) e aumentar resolução.
- Baixo contraste: garantir 1080p, aplicar CLAHE; usar Roboflow treinado para condições específicas.
- Ruído visual: elevar `YOLO_NMS_THRESH` moderadamente e usar ensemble para consenso entre modelos.

## Métricas e Avaliação
- Resposta dos endpoints de processamento inclui `metrics` com contagem e tempo por modelo e score médio do ensemble.
- Use as métricas para ajustar pesos via `/config/ensemble` e comparar desempenho por cenário.

## Atualização de Modelos
- YOLO/Ultralytics: substitua os arquivos de pesos e recarregue via `/yolo/load` ou `/ultra/load`.
- Roboflow: atualize `MODEL_ID` e recarregue via `/roboflow/load`.
- Valide com imagens de teste conhecidas antes de produção.

## Solução de Problemas
- AI inativo: confirme `python app.py` e `http://localhost:8000/health`.
- Tesseract não encontrado: verifique `TESSERACT_CMD` no `.env` do AI e PATH do sistema.
- Dependências OpenCV: instale Microsoft Visual C++ Build Tools caso haja erros de compilação.
- Detecção inconsistente: ajuste pesos via `/config/ensemble`, revise thresholds de YOLO/Ultralytics.
