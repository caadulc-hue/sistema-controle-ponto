# Especificação Técnica e Funcional — Sistema de Ponto Eletrônico e Banco de Horas (PWA)

## 1. Visão Geral do Sistema

O **Sistema de Ponto Eletrônico e Banco de Horas** é uma aplicação web progressiva (PWA) destinada ao registro, acompanhamento e gestão da jornada de trabalho.

A solução foi projetada para utilização em **tablets em modo quiosque** e em estações de trabalho destinadas à gestão administrativa, com suporte a funcionamento **offline-first** e posterior sincronização dos registros.

A arquitetura utiliza uma abordagem **No-Build**, reduzindo a complexidade do ambiente de desenvolvimento e facilitando a manutenção e implantação da aplicação.

As regras de negócio deverão ser configuráveis de acordo com as políticas da empresa e os requisitos legais aplicáveis.

> **Nota:** a aplicação deverá ser desenvolvida considerando os requisitos legais aplicáveis, mas sua implementação não constitui, por si só, garantia de conformidade jurídica. Regras trabalhistas específicas deverão ser validadas conforme a legislação vigente e as normas aplicáveis à empresa.

---

# 2. Stack Tecnológica e Arquitetura

## 2.1. Front-End

- HTML5
- CSS3
- JavaScript Vanilla
- ES Modules (ESM)
- Arquitetura No-Build

## 2.2. Interface

- **Pico.css** como Design System principal;
- **Lucide Icons** para iconografia;
- Interface responsiva;
- Otimização para tablets e computadores;
- Interface corporativa sem utilização de emojis como elementos funcionais ou de navegação.

## 2.3. Backend

A aplicação deverá utilizar uma camada de **API/Backend intermediária** entre o Front-End e o banco de dados.

Arquitetura:

```text
PWA
 │
 ▼
API / Backend
 │
 ▼
Supabase
 │
 ▼
PostgreSQL
```

O Front-End não deverá possuir acesso direto às tabelas do banco de dados.

A API será responsável por:

- Autenticação;
- Autorização;
- Validação de dados;
- Aplicação das regras de negócio;
- Comunicação com o Supabase;
- Controle de operações administrativas;
- Registro de eventos de auditoria.

## 2.4. Banco de Dados

- **Supabase**
- **PostgreSQL**
- API administrativa através da camada de backend.

### RLS

O projeto **não utilizará Row Level Security (RLS)**.

O controle de acesso será realizado pela camada de backend, que deverá validar a identidade, o perfil e as permissões do usuário antes de executar operações no banco.

## 2.5. Distribuição

A aplicação Front-End será distribuída como **Progressive Web App (PWA)**.

O Front-End poderá ser hospedado no **GitHub Pages**, enquanto a API deverá ser hospedada em um ambiente compatível com a execução do backend.

---

# 3. Regras de Negócio

## 3.1. Registro da Jornada

O sistema deverá permitir o registro sequencial das batidas:

1. Entrada 1
2. Saída 1
3. Entrada 2
4. Saída 2

A estrutura deverá permitir futura expansão para jornadas com quantidade diferente de intervalos.

Cada registro deverá possuir, no mínimo:

- Identificador único;
- Identificador do funcionário;
- Data e horário;
- Tipo da batida;
- Data de referência da jornada;
- Origem do registro;
- Data de criação;
- Informações necessárias para auditoria.

---

# 4. Margem de Tolerância

A aplicação deverá utilizar uma **tolerância configurável de 15 minutos**, conforme a regra de negócio definida para o sistema.

Quando a variação estiver dentro da tolerância configurada, o desvio será considerado **zero para fins de cálculo do saldo**.

Quando a tolerância for ultrapassada, o sistema deverá considerar o **desvio integral**.

### Exemplo

Horário previsto:

```text
08:00
```

Registros:

```text
08:10 → 0 minutos de desvio
08:15 → 0 minutos de desvio
08:16 → 16 minutos de desvio
```

A regra deverá ser implementada no módulo responsável pelos cálculos e deverá possuir testes automatizados.

---

# 5. Banco de Horas

## 5.1. Compensação

O banco de horas deverá utilizar inicialmente uma relação de compensação **1:1**.

Exemplo:

```text
+01:00 → 1 hora de crédito
-01:00 → 1 hora de débito
```

Os valores deverão ser armazenados preferencialmente em **minutos inteiros**, evitando problemas de precisão associados ao armazenamento de horas como números decimais.

A apresentação poderá utilizar:

```text
+08:30
-03:45
```

---

# 6. Turnos Noturnos

Para jornadas que ultrapassem a meia-noite, todas as batidas deverão utilizar a **data de início do turno como data de referência**.

### Exemplo

```text
Início:
22/09/2026 22:00

Fim:
23/09/2026 06:00
```

Data de referência:

```text
22/09/2026
```

Essa regra deverá ser utilizada pelos registros, cálculos e relatórios.

---

# 7. Limite Crítico

O sistema deverá possuir um **limite crítico configurável** para saldo negativo.

Configuração inicial:

```text
-20:00
```

Quando o saldo atingir ou ultrapassar esse limite, o funcionário deverá receber:

```text
ALERTA_CRITICO
```

O sistema deverá gerar uma ocorrência para análise administrativa.

### Importante

O sistema **não deverá determinar automaticamente qualquer consequência trabalhista**, incluindo demissão ou justa causa.

O alerta representa somente uma condição que necessita de análise humana.

---

# 8. Fechamento do Banco de Horas

O período de apuração deverá ser configurável.

Exemplos:

- Mensal;
- Semestral;
- Anual;
- Outro período definido pela empresa.

Cada fechamento deverá possuir:

- Período de referência;
- Data do fechamento;
- Responsável;
- Saldo final;
- Status;
- Histórico da operação.

Os fechamentos realizados não deverão ser alterados silenciosamente.

---

# 9. Perfis de Acesso

## 9.1. Colaborador / Quiosque

O colaborador poderá:

- Registrar ponto;
- Consultar seus registros;
- Consultar seu saldo, quando permitido;
- Visualizar comprovantes.

Não poderá:

- Alterar registros;
- Excluir registros;
- Alterar configurações;
- Acessar dados administrativos;
- Consultar dados de outros funcionários.

---

## 9.2. Gestor / Administrador

O administrador poderá:

- Consultar funcionários;
- Consultar registros;
- Consultar banco de horas;
- Visualizar alertas;
- Realizar ajustes autorizados;
- Registrar justificativas;
- Aprovar exceções;
- Consultar auditoria;
- Gerar relatórios;
- Gerenciar configurações permitidas.

Todas as operações administrativas relevantes deverão ser registradas na auditoria.

---

# 10. Autenticação e Autorização

A autenticação será realizada através da camada de backend.

O servidor deverá identificar o usuário e determinar suas permissões antes de executar operações protegidas.

O Front-End não deverá ser considerado uma camada confiável de segurança.

Exemplo:

```text
Usuário
   ↓
Login
   ↓
Backend
   ↓
Validação de identidade
   ↓
Validação de permissão
   ↓
Operação autorizada
   ↓
Supabase
```

Tentativas de acesso sem autorização deverão ser rejeitadas pelo backend.

---

# 11. Segurança do Backend

O backend deverá seguir o princípio do **menor privilégio**.

Credenciais utilizadas para comunicação privilegiada com o Supabase:

- Não poderão ser expostas no JavaScript do navegador;
- Não poderão ser incluídas no repositório público;
- Deverão ser armazenadas como variáveis de ambiente;
- Deverão ser utilizadas exclusivamente pelo backend.

A API deverá validar os dados recebidos antes de realizar operações no banco.

---

# 12. Auditoria

## 12.1. Trilha de Auditoria

O sistema deverá possuir uma **Audit Trail** para registrar operações relevantes.

Os eventos deverão conter, quando aplicável:

- ID do evento;
- Usuário responsável;
- ID do usuário;
- Nome;
- Cargo/perfil;
- Operação;
- Entidade afetada;
- ID do registro afetado;
- Valor anterior;
- Novo valor;
- Motivo;
- Data e hora.

---

# 13. Integridade dos Registros

Registros de ponto não deverão ser excluídos normalmente.

Quando for necessário corrigir um registro, deverá ser utilizado um mecanismo de:

- Ajuste;
- Estorno;
- Correção;
- Inativação lógica;
- Novo registro de correção.

A operação deverá preservar o histórico original sempre que possível.

---

# 14. Ajustes Retroativos

Qualquer alteração retroativa deverá exigir:

1. Usuário autenticado;
2. Permissão administrativa;
3. Justificativa;
4. Valor anterior;
5. Novo valor;
6. Data e hora;
7. Identificação do responsável.

A alteração deverá gerar automaticamente um evento de auditoria.

---

# 15. LGPD e Privacidade

O sistema deverá adotar princípios de:

- Minimização de dados;
- Limitação de finalidade;
- Controle de acesso;
- Segurança;
- Rastreabilidade;
- Retenção adequada.

Somente dados necessários ao funcionamento do sistema deverão ser armazenados.

---

# 16. Dados Biométricos

Caso seja implementada autenticação biométrica, a solução deverá evitar o armazenamento desnecessário de dados biométricos diretamente no banco da aplicação.

A arquitetura deverá priorizar mecanismos que utilizem os recursos de autenticação disponíveis no dispositivo sem exigir o armazenamento direto da característica biométrica do usuário.

A implementação definitiva deverá ser definida na etapa de autenticação.

---

# 17. Funcionamento Offline-First

A aplicação deverá continuar funcionando durante períodos de indisponibilidade temporária da internet.

Quando estiver offline:

1. O usuário poderá realizar o registro permitido;
2. O registro será armazenado localmente;
3. Será marcado como pendente;
4. A aplicação aguardará o restabelecimento da conexão;
5. O registro será enviado ao backend;
6. O backend processará o registro;
7. O sistema confirmará a sincronização.

Em caso de falha, o registro deverá permanecer pendente para nova tentativa.

---

# 18. Sincronização

Os registros criados offline deverão possuir identificadores únicos.

A sincronização deverá ser projetada para garantir:

- Idempotência;
- Prevenção de duplicidade;
- Reenvio após falha;
- Controle de estado;
- Ordem cronológica;
- Tratamento de conflitos.

Um mesmo registro não deverá ser contabilizado duas vezes devido a uma falha de conexão ou reenvio.

---

# 19. Modelo de Dados Inicial

## `funcionarios`

Responsável pelos dados dos funcionários.

Campos previstos:

```text
id
nome
cargo
status
jornada_id
created_at
updated_at
```

## `jornadas`

Responsável pelas configurações de jornada.

Campos previstos:

```text
id
nome
horario_entrada
horario_saida
tolerancia_minutos
tipo
ativo
```

## `registros_ponto`

Responsável pelas batidas.

Campos previstos:

```text
id
funcionario_id
data_referencia
timestamp
tipo
origem
created_at
```

## `aprovacoes_excecao`

Responsável pelas exceções administrativas.

Campos previstos:

```text
id
registro_id
responsavel_id
motivo
status
created_at
```

## `auditoria`

Responsável pelo histórico das operações.

Campos previstos:

```text
id
usuario_id
acao
entidade
entidade_id
valor_anterior
valor_novo
motivo
created_at
```

O modelo definitivo deverá ser refinado durante a implementação do banco.

---

# 20. Arquitetura do Front-End

A aplicação deverá manter separação entre:

- Interface;
- Regras de negócio;
- Autenticação;
- Comunicação com API;
- Sincronização;
- Cálculos.

Estrutura inicial:

```text
/
├── index.html
├── admin.html
├── manifest.json
├── sw.js
│
├── css/
│   └── style.css
│
├── js/
│   ├── api.js
│   ├── auth.js
│   ├── calc.js
│   ├── ponto.js
│   └── sync.js
│
└── assets/
    └── icons/
```

O Front-End não deverá acessar diretamente as tabelas do Supabase.

---

# 21. PWA

A aplicação deverá possuir:

- `manifest.json`;
- Service Worker;
- Cache dos recursos essenciais;
- Estratégia de atualização;
- Funcionamento offline;
- Instalação no dispositivo;
- Interface adaptada para tablets.

O Service Worker deverá evitar o armazenamento desnecessário de informações sensíveis.

---

# 22. API

A API deverá possuir endpoints específicos para as operações da aplicação.

Exemplos conceituais:

```text
POST   /api/auth/login
POST   /api/ponto
GET    /api/ponto
GET    /api/saldo
GET    /api/funcionarios
PATCH  /api/ponto/:id
POST   /api/excecoes
GET    /api/auditoria
```

Os endpoints administrativos deverão exigir autenticação e autorização adequadas.

A API deverá validar:

- Dados recebidos;
- Identidade do usuário;
- Permissões;
- Estado do registro;
- Regras de negócio.

---

# 23. Testes e Validação

## 23.1. Cálculo

Deverão ser testados:

- Entrada no horário;
- Tolerância;
- Atraso superior à tolerância;
- Saída antecipada;
- Hora extra;
- Turno noturno;
- Jornada incompleta;
- Saldo positivo;
- Saldo negativo;
- Limite crítico.

## 23.2. Segurança

Deverão ser testados:

- Acesso administrativo sem autenticação;
- Acesso a dados sem permissão;
- Alteração não autorizada;
- Exclusão não autorizada;
- Manipulação de parâmetros enviados pelo cliente;
- Tentativas de acesso a dados de outros funcionários.

## 23.3. Offline

Deverão ser testados:

- Registro sem internet;
- Reconexão;
- Sincronização;
- Falha durante sincronização;
- Reenvio;
- Duplicidade;
- Conflitos.

---

# 24. Critérios de Aceitação

O sistema será considerado funcional quando:

- O colaborador conseguir registrar sua jornada;
- Os registros forem armazenados corretamente;
- Os cálculos forem realizados corretamente;
- Turnos noturnos forem tratados corretamente;
- O sistema funcionar offline;
- Os registros offline forem sincronizados;
- O administrador conseguir consultar os dados permitidos;
- Ajustes forem auditáveis;
- A API impedir operações não autorizadas;
- Credenciais privilegiadas não forem expostas no Front-End;
- O sistema puder ser instalado como PWA;
- Os principais cenários de erro estiverem cobertos por testes.

---

# 25. Implantação

Antes da publicação deverão ser concluídos:

1. Banco de dados;
2. Backend/API;
3. Autenticação;
4. Autorização;
5. Regras de negócio;
6. Interface;
7. Funcionamento offline;
8. Sincronização;
9. Auditoria;
10. Testes;
11. Configuração do PWA;
12. Revisão das credenciais;
13. Publicação do Front-End;
14. Publicação da API.

---

# 26. Princípios Arquiteturais

O projeto deverá seguir os seguintes princípios:

- **Segurança por padrão**
- **Menor privilégio**
- **Separação de responsabilidades**
- **Auditabilidade**
- **Integridade dos registros**
- **Offline-first**
- **Idempotência**
- **Minimização de dados**
- **Regras de negócio configuráveis**
- **Backend como camada de autorização**
- **Front-End sem acesso direto ao banco**
- **Credenciais privilegiadas exclusivamente no servidor**

A arquitetura deverá priorizar **segurança, confiabilidade, rastreabilidade, manutenção e possibilidade de evolução futura**.