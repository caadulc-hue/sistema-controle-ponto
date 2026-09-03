# 🕒 Sistema de Ponto Eletrônico e Banco de Horas (PWA)

Sistema corporativo de controle de jornada de trabalho desenvolvido sob a premissa de arquitetura **No-Build**, voltado para operação contínua em dispositivos de acesso coletivo (modo quiosque) e estações de trabalho de gestão, com suporte total a funcionamento **offline-first**.

---

## 🚀 Principais Funcionalidades

* **Modo Quiosque (`index.html`):** Interface otimizada para tablets e autoatendimento, com relógio em tempo real, fluxo sequencial de batidas (*Entrada 1, Saída 1, Entrada 2, Saída 2*) e emissão automática de comprovante físico via `@media print`.
* **Painel Administrativo (`admin.html`):** Gestão centralizada de colaboradores, acompanhamento em tempo real de saldos de banco de horas e visualização de alertas de conformidade.
* **Resiliência Offline-First (PWA):** Capacidade de operar sem conexão com a internet, armazenando localmente os registros e realizando a sincronização automática e segura assim que a rede é restabelecida.
* **Trilha de Auditoria (Audit Trail):** Rastreabilidade imutável de todas as intervenções gerenciais e ajustes retroativos, exigindo justificativa obrigatória e salvando a identificação do gestor executor.

---

## ⚖️ Regras de Negócio e Conformidade (CLT)

* **Margem de Tolerância (15 Minutos):** Variações de até 15 minutos em relação ao horário contratual resultam em desvio zero. Caso a tolerância seja ultrapassada, o sistema aplica o **débito ou crédito integral** do desvio.
* **Ancoragem de Turnos Noturnos:** Jornadas que cruzam a meia-noite são obrigatoriamente vinculadas à data civil de início do turno, evitando quebras de ciclo no cartão de ponto.
* **Limite Crítico de Saldo Negativo:** Monitoramento contínuo do banco de horas (proporção 1:1). Caso o saldo atinja ou ultrapasse o patamar crítico de **-20:00 horas**, o sistema gera um alerta operacional prioritário (`ALERTA_CRITICO`) para análise humana do RH e Compliance.

---

## 🛠️ Stack Tecnológica (Arquitetura No-Build)

* **Front-End Nativo:** HTML5, CSS3 e JavaScript Vanilla estruturado com **ES Modules (ESM)** (sem ferramentas de transpilação ou build no cliente).
* **Design System:** **Pico.css (v1)** para uma interface limpa, leve e responsiva.
* **Iconografia:** **Lucide Icons** (proibido o uso de emojis na interface corporativa).
* **Banco de Dados & API:** **Supabase** (PostgreSQL + PostgREST).
* **Segurança e Privacidade:** Conformidade com a **LGPD** (minimização de dados e proteção de identificadores) e isolamento de operações sensíveis.

---

## 📁 Estrutura do Repositório

```text
/
├── index.html            # Interface de Registro de Ponto (Quiosque PWA)
├── admin.html            # Painel do Gestor e Auditoria
├── manifest.json         # Configuração do Progressive Web App
├── sw.js                 # Service Worker (Cache e Offline-First)
├── README.md             # Documentação principal do projeto
├── css/
│   └── style.css         # Estilizações customizadas e regras de impressão
├── js/
│   ├── api.js            # Camada de comunicação com o Supabase
│   ├── auth.js           # Controle de sessões e autenticação
│   ├── calc.js           # Núcleo de regras de cálculo e tolerância
│   ├── ponto.js          # Orquestração do fluxo de batidas
│   └── sync.js           # Gerenciamento de fila offline e sincronização
└── docs/                 # Documentação oficial de governança
    ├── SPEC.md           # Especificação Técnica e Funcional
    └── backlog.md        # Planejamento, Fases e Progresso
