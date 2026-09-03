# 📋 Backlog — Sistema de Ponto PWA

> Sistema de controle de ponto desenvolvido como uma **Progressive Web App (PWA)**, com gerenciamento de jornadas, registros de ponto, banco de horas, aprovação de exceções e auditoria.

**Data de início:** 27/08/2026  
**Status geral:** 🟡 Planejamento e Estruturação

---

## 📌 Visão Geral

O projeto será dividido em etapas para facilitar o desenvolvimento, testes e evolução do sistema.

### Tecnologias

- HTML5
- CSS3
- JavaScript
- Supabase
- PostgreSQL
- Pico.css
- Lucide Icons
- PWA

---

# 🗂️ Fases do Projeto

## FASE 1 — Infraestrutura e Banco de Dados

### Supabase

- [ ] **1.1 — Criar projeto no Supabase**
  - Criar o projeto.
  - Configurar o banco PostgreSQL.
  - Definir variáveis e configurações necessárias.

- [ ] **1.2 — Modelar tabelas principais**
  - `funcionarios`
    - Dados cadastrais.
    - Cargo.
    - Status.
    - Status de alerta.
  - `jornadas`
    - Tipo de jornada.
    - Regras flexíveis/rígidas.
    - Horários esperados.
  - `registros_ponto`
    - Entrada.
    - Saída.
    - Data/hora.
    - Vínculo com jornada.
    - Vínculo com a data inicial do turno.
  - `aprovacoes_excecao`
    - Registro da exceção.
    - Motivo.
    - Gestor responsável.
    - Data/hora da aprovação.
    - Histórico para auditoria.

- [ ] **1.3 — Configurar relacionamentos**
  - Definir chaves primárias.
  - Definir chaves estrangeiras.
  - Garantir integridade referencial.

- [ ] **1.4 — Configurar RLS (Row Level Security)**
  - Restringir leitura e escrita conforme o perfil.
  - Separar permissões do **Modo Quiosque** e **Admin**.
  - Impedir acesso indevido aos registros.
  - Validar as políticas diretamente no Supabase.

---

## FASE 2 — Estrutura Base e Front-End

### Arquitetura No-Build

- [ ] **2.1 — Criar estrutura de diretórios**

```text
/
├── index.html
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── supabase.js
│   └── calc.js
└── ...
```

- [ ] **2.2 — Configurar dependências via CDN**
  - Pico.css.
  - Lucide Icons.
  - Supabase JavaScript Client.

- [ ] **2.3 — Criar módulo de conexão com o banco**
  - Implementar `js/supabase.js`.
  - Centralizar a configuração do cliente Supabase.
  - Evitar duplicação da configuração entre páginas.

- [ ] **2.4 — Definir organização dos módulos JavaScript**
  - Separar acesso ao banco.
  - Separar cálculos.
  - Separar lógica de interface.
  - Evitar concentrar toda a lógica em um único arquivo.

---

## FASE 3 — Lógica Core e Cálculos

### `js/calc.js`

- [ ] **3.1 — Implementar cálculo de tolerância**
  - Tolerância padrão de **15 minutos**.
  - Caso a tolerância seja ultrapassada, aplicar o débito integral conforme a regra definida.
  - Considerar entrada atrasada.
  - Considerar saída antecipada.

- [ ] **3.2 — Implementar cálculo de banco de horas**
  - Calcular saldo positivo.
  - Calcular saldo negativo.
  - Acumular saldo por funcionário.
  - Manter precisão em horas e minutos.

- [ ] **3.3 — Implementar virada de dia**
  - Identificar jornadas que ultrapassam 00:00.
  - Vincular o registro à **data de início do turno**.
  - Evitar que a saída seja registrada como pertencente a outro dia.

- [ ] **3.4 — Implementar suporte a turnos noturnos**
  - Identificar jornada noturna.
  - Calcular corretamente a duração do turno.
  - Tratar entrada e saída em dias diferentes.

- [ ] **3.5 — Implementar limite crítico**
  - Definir limite de **-20:00 horas**.
  - Ao atingir o limite, alterar o status para:

```text
ALERTA_CRITICO
```

  - Registrar o evento para análise administrativa.
  - A decisão administrativa final deverá depender de análise do responsável.

---

## FASE 4 — Interface de Registro de Ponto

### `index.html`

- [ ] **4.1 — Desenvolver interface principal**
  - Layout simples e responsivo.
  - Relógio em tempo real.
  - Identificação do funcionário.
  - Botões para registro de ponto.
  - Feedback visual após o registro.

- [ ] **4.2 — Implementar registro de ponto**
  - Capturar data e hora.
  - Identificar funcionário.
  - Identificar jornada.
  - Enviar registro ao Supabase.
  - Validar erros antes de confirmar o registro.

- [ ] **4.3 — Implementar confirmação do registro**
  - Exibir horário registrado.
  - Informar o tipo do registro.
  - Exibir confirmação clara ao funcionário.

- [ ] **4.4 — Criar comprovante de ponto**
  - Desenvolver layout específico para impressão.
  - Utilizar `@media print`.
  - Exibir informações essenciais do registro.
  - Preparar comprovante para impressão física.

---

## FASE 5 — Painel do Gestor / Administrador

### `admin.html`

- [ ] **5.1 — Desenvolver autenticação administrativa**
  - Criar tela de login.
  - Implementar autenticação.
  - Controlar sessão.
  - Restringir acesso ao painel administrativo.

- [ ] **5.2 — Desenvolver painel de funcionários**
  - Listar funcionários.
  - Exibir cargo.
  - Exibir status.
  - Exibir saldo de banco de horas.
  - Exibir alertas.

- [ ] **5.3 — Desenvolver tela de registros**
  - Consultar registros de ponto.
  - Filtrar por funcionário.
  - Filtrar por período.
  - Visualizar entradas e saídas.
  - Identificar inconsistências.

- [ ] **5.4 — Desenvolver aprovação de exceções**
  - Exibir funcionário.
  - Exibir nome.
  - Exibir cargo.
  - Exibir ID.
  - Exibir motivo da exceção.
  - Permitir aprovação ou rejeição.
  - Registrar responsável e data da decisão.

- [ ] **5.5 — Implementar sistema de auditoria**
  - Registrar alterações relevantes.
  - Registrar responsável pela alteração.
  - Manter histórico das aprovações.
  - Impedir alterações silenciosas nos registros.

- [ ] **5.6 — Implementar sistema de alertas**
  - Identificar violações das regras.
  - Exibir alerta para o responsável.
  - Implementar alerta duplo para **RH + Compliance**, quando aplicável.

---

## FASE 6 — PWA

### Funcionamento como aplicativo

- [ ] **6.1 — Criar `manifest.json`**
  - Nome do aplicativo.
  - Ícones.
  - Cor/tema.
  - Configuração de instalação.

- [ ] **6.2 — Criar Service Worker**
  - Implementar `service-worker.js`.
  - Definir recursos que serão armazenados em cache.

- [ ] **6.3 — Implementar funcionamento offline**
  - Permitir carregamento da interface sem conexão.
  - Identificar quando o dispositivo estiver offline.

- [ ] **6.4 — Implementar sincronização**
  - Armazenar registros pendentes.
  - Sincronizar quando a conexão retornar.
  - Evitar registros duplicados.

- [ ] **6.5 — Testar instalação do PWA**
  - Desktop.
  - Android.
  - Diferentes navegadores compatíveis.

---

## FASE 7 — Segurança

- [ ] **7.1 — Revisar políticas RLS**
- [ ] **7.2 — Validar permissões de cada perfil**
- [ ] **7.3 — Impedir acesso direto a dados administrativos**
- [ ] **7.4 — Validar dados recebidos pelo sistema**
- [ ] **7.5 — Revisar exposição de chaves e configurações**
- [ ] **7.6 — Testar tentativas de acesso não autorizado**

---

## FASE 8 — Testes e Validação

### Testes funcionais

- [ ] **8.1 — Testar registros de entrada**
- [ ] **8.2 — Testar registros de saída**
- [ ] **8.3 — Testar tolerância de 15 minutos**
- [ ] **8.4 — Testar atraso acima da tolerância**
- [ ] **8.5 — Testar saída antecipada**
- [ ] **8.6 — Testar banco de horas positivo**
- [ ] **8.7 — Testar banco de horas negativo**
- [ ] **8.8 — Testar limite de -20:00 horas**
- [ ] **8.9 — Testar jornadas que atravessam a meia-noite**
- [ ] **8.10 — Testar aprovação de exceções**
- [ ] **8.11 — Testar permissões administrativas**
- [ ] **8.12 — Testar funcionamento offline**
- [ ] **8.13 — Testar sincronização após reconexão**
- [ ] **8.14 — Testar impressão do comprovante**

---

## FASE 9 — Finalização e Deploy

- [ ] **9.1 — Revisar código**
- [ ] **9.2 — Remover código desnecessário**
- [ ] **9.3 — Revisar estrutura de arquivos**
- [ ] **9.4 — Revisar segurança**
- [ ] **9.5 — Documentar configuração do projeto**
- [ ] **9.6 — Criar README completo**
- [ ] **9.7 — Configurar deploy**
- [ ] **9.8 — Realizar testes em produção**
- [ ] **9.9 — Criar versão `v1.0.0`**

---

# 📊 Progresso

| Fase | Status |
|---|---|
| Fase 1 — Banco de Dados | ⬜ Não iniciada |
| Fase 2 — Estrutura Base | ⬜ Não iniciada |
| Fase 3 — Lógica Core | ⬜ Não iniciada |
| Fase 4 — Interface de Ponto | ⬜ Não iniciada |
| Fase 5 — Painel Admin | ⬜ Não iniciada |
| Fase 6 — PWA | ⬜ Não iniciada |
| Fase 7 — Segurança | ⬜ Não iniciada |
| Fase 8 — Testes | ⬜ Não iniciada |
| Fase 9 — Deploy | ⬜ Não iniciada |

---

## 📝 Observações

- As regras de cálculo devem ser centralizadas no módulo `calc.js`.
- O acesso ao Supabase deve ser centralizado no módulo `supabase.js`.
- Regras de segurança não devem depender exclusivamente do JavaScript do cliente; devem ser aplicadas também no banco por meio de **RLS**.
- Registros de ponto e alterações administrativas devem possuir rastreabilidade.
- O sistema deve tratar jornadas noturnas utilizando a **data de início do turno** como referência.
- O limite de `-20:00` deve gerar um **alerta para análise**, não uma decisão automática sobre medidas trabalhistas.