# ContaFlow AI

Aplicação web para manter **tarefas sincronizadas entre utilizadores** de uma equipa, organizadas num quadro Kanban por swimlanes (uma linha por responsável, colunas por estado), com suporte para tarefas com **precedências** (bloqueiam automaticamente outras tarefas) e tarefas **cíclicas/recorrentes** (ex.: SAFT mensal).

Construído em **React 18 + Vite** com **Firebase** (Authentication com conta Google + Firestore) como backend, seguindo a mesma estrutura e convenções do projeto [VizinhAI](../VizinhAI).

---

## Funcionalidades

- **Login com Google** — cada utilizador entra com a sua conta Google; a fotografia de perfil é obtida automaticamente da conta. Se não existir fotografia, é usado um avatar com as iniciais do primeiro + último nome.
- **Perfil editável** — o utilizador pode definir/alterar o primeiro e último nome (a fotografia mantém-se sempre sincronizada com a Google).
- **Quadro de tarefas (swimlanes)** — uma linha por responsável, colunas: **Bloqueado**, **Pronto para Começar**, **Em Progresso**, **Terminado**. Arrastar um cartão entre colunas atualiza o estado; arrastar entre linhas reatribui o responsável.
- **Precedências** — uma tarefa pode depender de outra; enquanto a tarefa da qual depende não estiver "Terminada", entra automaticamente em estado **Bloqueado** (calculado, não é possível avançar tarefas bloqueadas).
- **Um único responsável de cada vez** — cada tarefa tem sempre um e um só utilizador atribuído (`assignedTo`), que pode ser alterado a qualquer momento.
- **Modelos de tarefa (templates)** — ex.: modelo "SAFT" com cor verde e recorrência mensal no dia 1. Ao criar uma tarefa, pode escolher-se um modelo que pré-preenche cor e recorrência.
- **Tarefas cíclicas** — tarefas recorrentes voltam automaticamente ao estado Pronto/Bloqueado no dia definido de cada mês, com o prazo (`dueDate`) atualizado automaticamente.
- **Clientes como entidade do domínio** — geridos numa página própria (`Clientes`); nas tarefas, o cliente é escolhido num `<select>` (não texto livre), o que dá navegação nativa por primeira letra (premir "A" salta para o primeiro cliente cujo nome começa por "A", repetir cicla pelos seguintes). É possível criar um cliente novo sem sair do formulário da tarefa.
- **Filtros no quadro** — filtrar por responsável, por cliente, e ordenar por prioridade (data de entrega mais próxima ou mais distante primeiro).
- **CRUD completo** — qualquer utilizador autenticado pode criar, editar e remover tarefas, modelos e clientes.
- **Destaque de cor personalizável** — cada tarefa tem uma cor de destaque configurável (independente ou herdada do modelo).
- **Tarefa expandida ao estilo Jira** — ao abrir uma tarefa, o título aparece em destaque no topo, a descrição (novo campo, com editor Markdown e barra de ferramentas — títulos, negrito, itálico, listas, citação, código, com modo de pré-visualização) ocupa 3/4 do espaço à esquerda, e todos os restantes campos (cliente, responsável, data de entrega, precedência, modelo, cor, recorrência) ficam numa coluna lateral (1/4) à direita.
- **Imagens na descrição e nos comentários** — o editor de Markdown permite inserir imagens (botão na barra de ferramentas, colar do clipboard ou arrastar e largar), que ficam guardadas no Firebase Storage e embebidas como `![alt](url)`.
- **Comentários por tarefa** — a secção de comentários ocupa também os primeiros 3/4 da tarefa expandida (por baixo da descrição), com a mesma formatação Markdown e suporte a imagens; cada utilizador só pode remover os seus próprios comentários.
- **Ausência / Out of Office** — no perfil, cada utilizador pode definir uma data de início e fim de férias. Enquanto o período estiver ativo, a linha desse responsável no quadro fica assinalada com uma badge 🌴 "Férias" e destaque âmbar, para a equipa perceber que as tarefas precisam de ser reatribuídas a outro responsável.
- **Sidebar colapsável** — a barra lateral pode ser reduzida a apenas ícones (botão "Colapsar" no fundo), mantendo tooltips com o nome de cada secção; a preferência fica guardada no browser.
- **Acesso ao perfil pelo bloco de utilizador** — não existe uma linha de navegação separada para "O Meu Perfil"; basta clicar no bloco com a fotografia/nome/email no fundo da sidebar (funciona também colapsada, mostrando só o avatar).
- **Tema claro/escuro** — no perfil, em "Aparência", é possível escolher entre estilo Claro (predefinição) e Escuro; a preferência sincroniza com a conta (`users/{uid}.theme`) e aplica-se em toda a aplicação.
- **Múltiplos projetos** — a aplicação suporta vários projetos/espaços de trabalho isolados entre si. Existe um papel **ADMIN** (o primeiro utilizador a entrar na aplicação é promovido automaticamente) com permissão para criar projetos. Um projeto tem apenas um nome; quem o cria (ou um admin) pode adicionar utilizadores já existentes na plataforma ou convidá-los por email (o convite fica pendente e é aceite automaticamente da próxima vez que essa pessoa iniciar sessão). Um utilizador pode pertencer a vários projetos — se pertencer a mais do que um, é apresentado um seletor antes de poder continuar; tarefas, modelos e clientes ficam isolados por projeto.
- **Notificações de prazos** — ícone de sino no canto superior direito (visível em todas as páginas), com contador de notificações. Mostra **todas** as tarefas do projeto que se aproximam do prazo — não só as do utilizador com sessão iniciada. Ao clicar, expande um painel com a lista ("Responsável — Título da Tarefa"), limitado em altura a mostrar poucas de cada vez, com scroll para as restantes. Tarefas a **5 dias ou menos** do prazo aparecem a amarelo; a **menos de 2 dias** (incluindo atrasadas), a vermelho — a mesma cor destaca também o cartão da tarefa no quadro. Não existe "marcar como lida": uma notificação só desaparece quando a tarefa correspondente é terminada.

---

## Stack Técnica

| Camada       | Tecnologia                                  |
|--------------|----------------------------------------------|
| Build Tool   | Vite 5.4 (ES Modules)                        |
| UI Framework | React 18.2 (componentes funcionais + hooks)  |
| Estilo       | Tailwind CSS v4 via `@tailwindcss/vite`      |
| Backend      | Firebase 10.8 (Authentication + Firestore + Storage) |
| Ícones       | Lucide React                                 |
| Markdown     | react-markdown (pré-visualização da descrição e dos comentários) |
| Dev Server   | Vite dev server (`npm run dev`)              |

---

## Estrutura do Projeto

```
/
├── index.html                      # HTML shell, carrega /src/main.jsx
├── package.json                    # Dependências & scripts
├── vite.config.js                  # Config Vite com plugins React + Tailwind
├── .env.example                    # Exemplo de variáveis de ambiente necessárias
├── public/
│   └── manifest.json               # Manifesto PWA
└── src/
    ├── main.jsx                    # Entry point (createRoot)
    ├── App.jsx                     # Shell da app: sidebar, routing entre páginas
    ├── index.css                   # Tailwind + estilos utilitários (drag & drop, scrollbars)
    ├── config/
    │   └── firebase.js             # Inicialização do Firebase a partir de VITE_FIREBASE_CONFIG
    ├── contexts/
    │   ├── AuthContext.jsx         # Estado de autenticação, login Google, perfil Firestore, bootstrap admin, convites
    │   ├── ThemeContext.jsx        # Tema claro/escuro (classe `dark` no <html>, persistido no perfil + localStorage)
    │   └── ProjectContext.jsx      # Lista de projetos do utilizador + projeto atual (persistido em localStorage)
    ├── hooks/
    │   ├── useUsers.js             # Subscrição em tempo real à coleção `users` (todos os utilizadores da plataforma)
    │   ├── useProjects.js          # CRUD de projetos + membros + convites
    │   ├── useTaskTemplates.js     # CRUD + subscrição à coleção `taskTemplates` (scoped por projectId)
    │   ├── useClients.js           # CRUD + subscrição à coleção `clients` (scoped por projectId)
    │   ├── useTasks.js             # CRUD + subscrição à coleção `tasks` (scoped por projectId) + reset de recorrência
    │   └── useComments.js          # CRUD + subscrição à subcoleção `tasks/{taskId}/comments`
    ├── utils/
    │   ├── taskLogic.js            # Cálculo de estado (bloqueado/pronto), recorrência, iniciais, datas, OOO, urgência de prazo
    │   └── uploadImage.js          # Upload de imagens para o Firebase Storage (task-uploads/{uid}/...)
    ├── components/
    │   ├── Avatar.jsx               # Foto da Google ou iniciais como fallback
    │   ├── NavItem.jsx              # Item de navegação da sidebar (suporta modo colapsado, só ícone)
    │   ├── LoginScreen.jsx          # Ecrã de login (botão "Entrar com a Google")
    │   ├── ProjectSelectScreen.jsx  # Ecrã a pedir para escolher/criar projeto (0 ou >1 projetos)
    │   ├── ProjectModal.jsx         # Criar novo projeto (apenas nome; admin)
    │   ├── TaskCard.jsx             # Cartão de tarefa no quadro
    │   ├── TaskModal.jsx            # Tarefa expandida (título + descrição/comentários 3/4, metadados 1/4, estilo Jira)
    │   ├── MarkdownEditor.jsx       # Editor de texto Markdown: barra de ferramentas, imagens, pré-visualização
    │   ├── TaskComments.jsx         # Lista de comentários + composer (usado dentro do TaskModal)
    │   ├── NotificationBell.jsx     # Sino de notificações (prazos a aproximar-se), sempre visível no topo
    │   ├── TemplateModal.jsx        # Criar/editar modelo de tarefa
    │   └── ClientModal.jsx          # Criar/editar cliente
    └── pages/
        ├── BoardPage.jsx            # Quadro principal (swimlanes x colunas, filtros, badge OOO, drag & drop)
        ├── TemplatesPage.jsx        # Gestão de modelos de tarefa
        ├── ClientsPage.jsx          # Gestão de clientes
        ├── ProjectsPage.jsx         # Lista de projetos, trocar projeto atual, gerir membros/convites
        └── ProfilePage.jsx          # Nome, Aparência (tema) e Ausência (Out of Office)
```

---

## Configuração e Arranque

Há duas formas de correr o projeto: **contra um projeto Firebase real** (produção) ou **contra os emuladores locais** (para testar internamente sem criar nada na Google).

### Opção A — Testar localmente sem projeto Firebase (Emulator Suite)

Não é preciso criar um projeto na consola Google nem configurar `.env`. Basta ter a Firebase CLI disponível (via `npx`, já incluída como dependência de desenvolvimento):

```bash
npm install

# Terminal 1 — arranca os emuladores de Auth + Firestore + Storage (UI em http://localhost:4000)
npm run emulators

# Terminal 2 — arranca a aplicação
npm run dev
```

Em modo de desenvolvimento (`npm run dev`), se não existir nenhum ficheiro `.env`, a app deteta automaticamente a ausência de configuração e liga-se sozinha aos emuladores locais (`src/config/firebase.js`), usando um projeto fictício (`demo-conta-flow-ai`). Aparece um badge **"Modo Emulador Local"** no canto inferior direito a confirmar.

- O **login com Google** neste modo é simulado pelo próprio emulador: ao clicar em "Entrar com a Google" abre-se uma janela do emulador onde se escolhe/cria uma conta de teste (nome, email, foto), sem contactar a Google.
- Os dados ficam apenas em memória do emulador — para os manter entre reinícios, correr `firebase emulators:start --export-on-exit=./emulator-data --import=./emulator-data`.
- Para forçar explicitamente o modo emulador mesmo com um `.env` definido, adicionar `VITE_USE_FIREBASE_EMULATORS=true` ao `.env`.

### Opção B — Ligar a um projeto Firebase real

1. Criar um projeto Firebase (ou reutilizar um existente) e ativar:
   - **Authentication** → método de login **Google**.
   - **Firestore Database** (modo produção, com as regras em `firestore.rules`, publicáveis com `firebase deploy --only firestore:rules`).
   - **Storage** (com as regras em `storage.rules`, publicáveis com `firebase deploy --only storage`), necessário para as imagens da descrição e dos comentários.
2. Copiar `.env.example` para `.env` e preencher `VITE_FIREBASE_CONFIG` com o JSON da configuração do SDK web (Project Settings → General → Your apps).
3. Instalar dependências e arrancar o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

4. Build de produção:

```bash
npm run build
npm run preview
```

---

## Modelo de Dados (Firestore)

### `users/{uid}`

| Campo       | Tipo   | Descrição                                          |
|-------------|--------|-----------------------------------------------------|
| `firstName` | string | Primeiro nome (editável pelo utilizador)             |
| `lastName`  | string | Último nome (editável pelo utilizador)               |
| `email`     | string | E-mail da conta Google                               |
| `photoURL`  | string | Fotografia da conta Google (sincronizada em cada login) |
| `oooStart`  | string\|null | Início da ausência/férias (`YYYY-MM-DD`), ver "Ausência (OOO)" abaixo |
| `oooEnd`    | string\|null | Fim da ausência/férias (`YYYY-MM-DD`)                |
| `role`      | string | `'admin' \| 'member'`. O primeiro utilizador a entrar na aplicação é promovido a `admin` automaticamente (ver "Papel ADMIN" abaixo) |
| `theme`     | string | `'light' \| 'dark'`, opcional — preferência de aparência, ver "Tema claro/escuro" abaixo |

### `projects/{projectId}`

| Campo       | Tipo     | Descrição                                          |
|-------------|----------|-----------------------------------------------------|
| `name`      | string   | Nome do projeto — o único campo que o define        |
| `createdBy` | string   | uid de quem criou o projeto (sempre um admin)        |
| `memberIds` | string[] | uids dos utilizadores com acesso a este projeto      |

### `invites/{email}`

Convites pendentes por email, aceites automaticamente da próxima vez que essa pessoa iniciar sessão (ver "Convites por email" abaixo). Documento com id = email em minúsculas.

| Campo      | Tipo   | Descrição                                                                 |
|------------|--------|-------------------------------------------------------------------------------|
| `email`    | string | O mesmo email, minúsculas (redundante com o id, útil para debugging/queries) |
| `projects` | map    | `{ [projectId]: { projectName, invitedBy, invitedAt } }` — um convite pode acumular vários projetos para o mesmo email |

### `taskTemplates/{templateId}`

| Campo        | Tipo    | Descrição                                                        |
|--------------|---------|--------------------------------------------------------------------|
| `projectId`  | string  | id do projeto a que este modelo pertence                          |
| `name`       | string  | Nome do modelo (ex.: "SAFT")                                       |
| `description`| string  | Descrição opcional                                                 |
| `color`      | string  | Cor de destaque (hex), herdada pelas tarefas criadas a partir dele |
| `recurrence` | object  | `{ enabled: boolean, dayOfMonth: number }`                          |
| `createdBy`  | string  | uid do criador                                                     |

### `clients/{clientId}`

| Campo       | Tipo   | Descrição                                          |
|-------------|--------|-----------------------------------------------------|
| `projectId` | string | id do projeto a que este cliente pertence           |
| `name`      | string | Nome do cliente                                     |
| `notes`     | string | Notas opcionais                                     |
| `createdBy` | string | uid do criador                                      |

Os clientes são uma entidade autónoma do domínio (página `Clientes`), não texto livre na tarefa. Isto permite reutilizar o mesmo cliente em várias tarefas e listar/filtrar por cliente.

### `tasks/{taskId}`

| Campo             | Tipo         | Descrição                                                                 |
|-------------------|--------------|------------------------------------------------------------------------------|
| `projectId`       | string       | id do projeto a que esta tarefa pertence                                    |
| `title`           | string       | Título / o que é preciso fazer                                              |
| `description`     | string       | Descrição em Markdown, pode incluir imagens embebidas (`![alt](url)`); pode estar vazia |
| `clientId`        | string\|null | id do cliente (`clients/{clientId}`) associado à tarefa                      |
| `dueDate`         | string       | Data de entrega (`YYYY-MM-DD`)                                              |
| `assignedTo`      | string\|null | uid do utilizador atualmente responsável (apenas um de cada vez)            |
| `precedingTaskId` | string\|null | id de outra tarefa da qual esta depende (precedência)                        |
| `templateId`      | string\|null | id do modelo de tarefa usado                                                 |
| `color`           | string       | Cor de destaque (hex)                                                        |
| `progress`        | string       | `'todo' \| 'in_progress' \| 'done'` — estado definido manualmente pelo utilizador |
| `recurrence`      | object       | `{ enabled: boolean, dayOfMonth: number }`                                   |
| `lastCycleKey`    | string\|null | Último ciclo (`YYYY-MM`) em que a tarefa foi reiniciada                      |
| `createdBy`       | string       | uid do criador                                                               |

### `tasks/{taskId}/comments/{commentId}`

| Campo              | Tipo   | Descrição                                                        |
|--------------------|--------|---------------------------------------------------------------------|
| `text`             | string | Comentário em Markdown, pode incluir imagens embebidas              |
| `authorId`         | string | uid do autor                                                        |
| `authorFirstName`  | string | Primeiro nome do autor, copiado no momento da criação (não sincroniza se o autor mudar o nome depois) |
| `authorLastName`   | string | Último nome do autor, idem                                          |
| `authorPhotoURL`   | string | Fotografia do autor, idem                                           |
| `createdAt`        | timestamp | Data/hora de criação                                              |

Os dados do autor ficam desnormalizados no comentário (em vez de fazer join com `users/{uid}` em tempo de leitura) para que o histórico de comentários continue legível mesmo que o utilizador altere o nome mais tarde. Um comentário só pode ser removido pelo seu próprio autor (`authorId === request.auth.uid`), reforçado tanto na UI como nas `firestore.rules`.

### Estado visível no quadro (`stage`) — calculado, não persistido

O campo `progress` só regista se o utilizador já iniciou/terminou a tarefa. O estado mostrado no quadro (`Bloqueado`, `Pronto para Começar`, `Em Progresso`, `Terminado`) é **derivado em tempo real** (ver `src/utils/taskLogic.js#computeStage`):

- Se `progress === 'in_progress'` → **Em Progresso**
- Se `progress === 'done'` → **Terminado**
- Caso contrário, se existir `precedingTaskId` e essa tarefa não estiver `'done'` → **Bloqueado**
- Caso contrário → **Pronto para Começar**

Isto garante que, assim que uma tarefa bloqueadora é terminada, todas as tarefas que dependiam dela ficam imediatamente "Prontas" sem necessidade de nenhuma escrita adicional.

### Recorrência (tarefas cíclicas)

Quando `recurrence.enabled` é verdadeiro, ao carregar a aplicação (`useTasks`) cada tarefa é verificada: se a data atual já passou o `dayOfMonth` definido e o ciclo (`lastCycleKey`) ainda não foi processado para o mês corrente, a tarefa é automaticamente:
- reposta a `progress: 'todo'` (volta a Pronto/Bloqueado conforme precedências),
- com `dueDate` recalculada para o novo ciclo,
- e `lastCycleKey` atualizado.

> **Nota**: como não existem Cloud Functions/backend agendado neste projeto, este reset só ocorre de forma oportunista quando **algum** cliente com sessão iniciada tem a aplicação aberta (ao carregar o quadro). Para um reset garantido mesmo sem clientes ativos, seria necessário adicionar uma Cloud Function agendada (`functions.pubsub.schedule`) — fora do âmbito atual.

### Filtros e ordenação no quadro

A barra de filtros em `BoardPage.jsx`, por cima do quadro, permite:
- **Responsável**: mostra só a linha (swimlane) desse utilizador, ou "Sem responsável" para tarefas sem `assignedTo`.
- **Cliente**: mostra só tarefas associadas a esse `clientId`.
- **Prioridade (prazo)**: alterna a ordenação dentro de cada coluna entre "mais urgente primeiro" (`dueDate` ascendente) e "mais distante primeiro" (`dueDate` descendente). Tarefas sem `dueDate` ficam sempre no fim.

Estes filtros são aplicados inteiramente no cliente (sobre os dados já sincronizados via `onSnapshot`), sem queries Firestore adicionais.

### Linhas (swimlanes) do quadro: ordem e expansão

- As linhas de responsáveis aparecem **ordenadas alfabeticamente** pelo nome; a linha "Sem responsável" fica sempre no fim. Um botão junto ao cabeçalho "Responsável" (ícone A→Z / Z→A) inverte a ordem.
- Por omissão, **apenas a linha do utilizador com sessão iniciada aparece expandida** (mostra os cartões de tarefa completos); as restantes linhas aparecem compactas, mostrando só o nome, avatar e um contador de tarefas por coluna.
- Qualquer linha pode ser expandida/colapsada manualmente clicando nela (chevron à esquerda do nome) — a escolha manual sobrepõe-se ao comportamento por omissão enquanto a página estiver aberta (não é persistida).

### Seleção de cliente na tarefa

O campo "Cliente" no formulário de tarefa (`TaskModal.jsx`) é um `<select>` nativo, não um campo de texto livre — os clientes vêm da coleção `clients` (geridos na página `Clientes` / `ClientsPage.jsx`). Como é um `<select>` nativo do browser, herda de graça a navegação por teclado: premir a primeira letra salta para a primeira opção cujo nome começa por essa letra, e repetir a tecla cicla pelas seguintes. Existe também um botão "+ Novo" junto ao campo que abre o `ClientModal` sem sair do formulário da tarefa, para criar um cliente na hora.

### Tarefa expandida (`TaskModal.jsx`) — layout ao estilo Jira

Ao clicar num cartão do quadro (ou em "Nova Tarefa"), o modal que abre segue o mesmo esquema visual de um issue expandido do Jira:

- **Título**: campo grande, sem moldura visível, no topo, ocupando toda a largura.
- **Descrição** (campo novo, `description`): ocupa 3/4 da largura à esquerda — é deliberadamente o maior campo do formulário. Usa o `MarkdownEditor.jsx`, com barra de ferramentas (Título 1/2, Negrito, Itálico, Lista, Lista numerada, Citação, Código) que insere/envolve a sintaxe Markdown correspondente no texto selecionado, e alterna entre modo "Escrever" (textarea) e "Pré-visualizar" (renderizado via `react-markdown`, estilizado pelas classes `.markdown-preview` em `index.css`). Pode ficar vazia.
- **Coluna lateral** (1/4 da largura, à direita): agrupa todos os restantes campos — Cliente, Responsável, Data de Entrega, Depende de (precedência), Modelo de Tarefa, Cor de destaque e Tarefa cíclica (recorrência) — cada um com um rótulo curto em maiúsculas, ao estilo do painel de detalhes do Jira.
- **Comentários**: por baixo da descrição, ainda dentro dos mesmos 3/4 de largura, fica a secção de comentários (`TaskComments.jsx`) — lista de comentários existentes seguida de um composer com o mesmo `MarkdownEditor` (formatação e imagens incluídas). Só disponível depois de a tarefa ser guardada pela primeira vez (uma tarefa nova mostra uma mensagem a pedir para guardar primeiro), tal como no Jira.
- Em ecrãs estreitos (`lg:` breakpoint do Tailwind), a grelha `lg:grid-cols-4` colapsa para uma única coluna: descrição e comentários em cima, campos da coluna lateral por baixo, com scroll vertical no corpo do modal.

### Imagens no Markdown (Storage)

O `MarkdownEditor.jsx` aceita um `onUploadImage(file) => Promise<url>` opcional (fornecido em `App.jsx` via `src/utils/uploadImage.js#uploadTaskImage`, usado tanto pela descrição da tarefa como pelos comentários). Uma imagem pode ser inserida de três formas, todas a convergir para o mesmo fluxo de upload:
- botão "Inserir imagem" na barra de ferramentas (abre um seletor de ficheiro);
- colar (`Ctrl/Cmd+V`) uma imagem copiada para o clipboard;
- arrastar e largar um ficheiro de imagem sobre a área de texto.

O ficheiro é validado (tipo `image/*`, máximo 8MB) e enviado para `task-uploads/{uid}/{timestamp}-{nome}` no Firebase Storage; a URL de download resultante é inserida automaticamente como `![nome](url)` na posição do cursor. Ver `storage.rules` para as regras de segurança (leitura para qualquer utilizador autenticado, escrita apenas na própria pasta `task-uploads/{uid}/`).

### Ausência / Out of Office (OOO)

Em `ProfilePage.jsx`, qualquer utilizador pode definir um período de ausência (`oooStart` / `oooEnd`, datas `YYYY-MM-DD`). `src/utils/taskLogic.js#isUserOOO(user, now)` calcula se a ausência está ativa hoje (comparação de strings `YYYY-MM-DD`, inclusive em ambas as pontas — mesma convenção usada para `dueDate`).

Quando ativa, `BoardPage.jsx` assinala a swimlane desse responsável com uma badge 🌴 "Férias" (ícone `Palmtree` do Lucide) e um destaque âmbar na linha inteira, com tooltip a mostrar a data de fim. É apenas um indicador visual — não bloqueia a atribuição de novas tarefas nem move as existentes automaticamente; a decisão de reatribuir fica com a equipa.

### Notificações de prazo

`src/utils/taskLogic.js#getTaskUrgency(task, now)` calcula, para qualquer tarefa não terminada com `dueDate` definida, quantos dias faltam para o prazo e devolve:
- `'urgent'` se faltar **menos de 2 dias** (inclui tarefas já atrasadas);
- `'warning'` se faltarem **5 dias ou menos**;
- `null` caso contrário (não gera notificação).

Isto não é um campo persistido — é recalculado a cada render a partir de `dueDate`/`progress`, tal como o `stage` do quadro. Como resultado direto, **uma notificação não pode ser "marcada como lida"**: a única forma de a fazer desaparecer é terminar a tarefa (o que faz `getTaskUrgency` devolver `null`, já que tarefas com `progress: 'done'` nunca geram notificação).

`NotificationBell.jsx`, montado no cabeçalho persistente de `App.jsx` (canto superior direito, visível em todas as páginas, tanto em mobile como em desktop), recebe **todas** as tarefas do projeto atual (não só as do utilizador com sessão iniciada — o pedido era explícito quanto a isto) e:
- mostra um badge vermelho com o número total de notificações sobre o ícone do sino;
- ao clicar, abre um painel com a lista ordenada (urgentes primeiro, depois por data de entrega ascendente), cada linha no formato **"Responsável — Título da Tarefa"**, com um ponto colorido e a data a amarelo/vermelho consoante a urgência;
- o painel tem altura máxima fixa (`max-h-[22rem]`, a mostrar cerca de 5 notificações de cada vez) com scroll interno para as restantes — mantém o painel compacto independentemente de quantas notificações existam;
- clicar numa notificação fecha o painel e abre diretamente essa tarefa no `TaskModal`.

A mesma cor de urgência (`amber`/`red`) destaca também o cartão da tarefa no quadro (`TaskCard.jsx`, `ring-2` + fundo tingido), para que uma tarefa em risco seja visível quer no quadro quer nas notificações com a mesma linguagem visual.

### Sidebar colapsável e acesso ao perfil

A barra lateral (`App.jsx`) pode ser reduzida a apenas ícones através do botão "Colapsar" no fundo (`w-72` ↔ `w-20`), com tooltips nativos (`title`) a mostrar o nome de cada secção quando colapsada; a preferência fica em `localStorage` (`contaflow:sidebarCollapsed`), independente por browser.

Não existe uma entrada de navegação "O Meu Perfil": o bloco com a fotografia, nome e email no fundo da sidebar é, em si, um botão que navega para o perfil — tanto expandido como colapsado (nesse caso mostra só o avatar). Isto segue o padrão comum de apps tipo Slack/Linear, em vez de duplicar o acesso numa linha de navegação extra.

### Tema claro/escuro

Implementado com a variante `dark` do Tailwind v4 baseada em classe (`@custom-variant dark (&:where(.dark, .dark *));` em `index.css`), ativada colocando/removendo a classe `dark` em `<html>` — não a `prefers-color-scheme` do sistema. `ThemeContext.jsx`:
- inicializa a partir de `localStorage` (`contaflow:theme`) para aplicar instantaneamente, sem esperar pela autenticação (há também um pequeno script inline em `index.html` que aplica a classe antes do React montar, para evitar "flash" de tema errado);
- sincroniza com `users/{uid}.theme` assim que o perfil carrega (para a preferência viajar entre dispositivos);
- ao mudar o tema (`ProfilePage.jsx` → "Aparência"), atualiza o estado local, o `localStorage` e o perfil no Firestore.

Os estilos `dark:` foram aplicados de forma consistente em toda a aplicação (shell, quadro, modais, editor de Markdown, páginas de gestão), incluindo as regras manuscritas `.markdown-preview` (que não usam o plugin de tipografia do Tailwind).

### Múltiplos projetos

A aplicação deixou de ser single-tenant: existe agora o conceito de **projeto** (espaço de trabalho isolado), com tarefas, modelos e clientes sempre associados a um `projectId`.

**Papel ADMIN**: `users/{uid}.role` é `'admin'` ou `'member'`. Como não há nenhum backend/CLI para promover manualmente o primeiro utilizador, `AuthContext.jsx` usa `getCountFromServer` sobre a coleção `users` no momento da criação do perfil — se for o primeiro utilizador de sempre, fica `admin`; todos os seguintes ficam `member`. Só administradores podem criar projetos (`ProjectModal.jsx`, a partir de `ProjectsPage.jsx` ou do `ProjectSelectScreen.jsx` quando ainda não pertencem a nenhum).

**Membros**: quem cria um projeto (ou qualquer admin) pode, na página `Projetos`, adicionar utilizadores já existentes na plataforma (dropdown sobre `users`) ou convidar por email.

**Convites por email**: se a pessoa convidada ainda não tem conta, o convite fica em `invites/{email}` (documento único por email, com um mapa de todos os projetos pendentes para esse email — permite convidar a mesma pessoa para vários projetos antes do primeiro login). Ao iniciar sessão, `AuthContext.jsx#acceptPendingInvites` lê esse documento e, **num único `writeBatch`**, adiciona o novo uid a `memberIds` em todos os projetos pendentes e apaga o convite. O batch é importante: aceitar os convites com `updateDoc` separados faria com que o `ProjectContext` visse, por instantes, apenas um dos projetos (a primeira escrita a chegar), podendo escolher esse automaticamente antes do segundo convite ser processado — o batch garante que todos os projetos aparecem numa única atualização consistente.

**Seletor de projeto**: `ProjectContext.jsx` subscreve `projects` filtrando por `memberIds array-contains uid`. Se o utilizador pertence a exatamente um projeto, é selecionado automaticamente; caso contrário (0 ou mais do que 1, e sem escolha válida guardada), `ProjectSelectScreen.jsx` é mostrado antes de qualquer outro ecrã — com a lista de projetos para escolher, ou, no caso de zero projetos, uma mensagem (com botão para criar o primeiro projeto, se for admin, ou uma indicação para pedir a um admin). A escolha fica em `localStorage` por utilizador (`contaflow:project:{uid}`).

**Isolamento de dados**: `useTasks`, `useTaskTemplates` e `useClients` recebem agora `projectId` e filtram sempre por `where('projectId', '==', projectId)`; a lista de utilizadores mostrada no quadro e no formulário de tarefa (responsável) é filtrada em `App.jsx` para conter apenas os membros do projeto atual (`users.filter(u => project.memberIds.includes(u.uid))`), embora a coleção `users` continue global (necessária para o admin poder adicionar qualquer utilizador da plataforma a um projeto).

---

## Regras de Segurança Firestore (sugestão)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin() {
      return isSignedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function isProjectMember(projectId) {
      return isSignedIn()
        && request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.memberIds;
    }

    match /users/{uid} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == uid;
    }

    // Criar um projeto requer ser admin. Atualizar é permitido a quem o criou,
    // a um admin, ou — sem backend para mediar convites — a qualquer utilizador
    // que se esteja apenas a adicionar a si próprio a memberIds (aceitar convite).
    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow create: if isAdmin() && request.resource.data.createdBy == request.auth.uid;
      allow update: if isSignedIn() && (
        resource.data.createdBy == request.auth.uid
        || isAdmin()
        || (
          request.resource.data.memberIds.hasAll(resource.data.memberIds)
          && request.resource.data.memberIds.size() == resource.data.memberIds.size() + 1
          && request.auth.uid in request.resource.data.memberIds
        )
      );
      allow delete: if isSignedIn() && (resource.data.createdBy == request.auth.uid || isAdmin());
    }

    match /invites/{email} {
      allow read, write: if isSignedIn();
    }

    match /taskTemplates/{templateId} {
      allow read: if isProjectMember(resource.data.projectId);
      allow create: if isProjectMember(request.resource.data.projectId);
      allow update, delete: if isProjectMember(resource.data.projectId);
    }

    match /clients/{clientId} {
      allow read: if isProjectMember(resource.data.projectId);
      allow create: if isProjectMember(request.resource.data.projectId);
      allow update, delete: if isProjectMember(resource.data.projectId);
    }

    match /tasks/{taskId} {
      allow read: if isProjectMember(resource.data.projectId);
      allow create: if isProjectMember(request.resource.data.projectId);
      allow update, delete: if isProjectMember(resource.data.projectId);

      match /comments/{commentId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn() && request.resource.data.authorId == request.auth.uid;
        allow delete: if isSignedIn() && resource.data.authorId == request.auth.uid;
        allow update: if false;
      }
    }
  }
}
```

Ajustar conforme necessidades de permissões mais granulares (ex.: só o criador pode remover tarefas). O auto-join em `projects` (qualquer utilizador pode adicionar-se a si próprio a um projeto que conheça o id) é uma simplificação deliberada — sem Cloud Functions não há forma de mediar a aceitação de convites com mais rigor; ver `agents.md` para o raciocínio completo.

### Índices compostos necessários

As queries `where('projectId', '==', ...)` combinadas com `orderBy(...)` (em `tasks`, `taskTemplates`, `clients`) e `where('memberIds', 'array-contains', uid)` combinada com `orderBy('name')` (em `projects`) exigem índices compostos — já definidos em `firestore.indexes.json` e aplicados automaticamente pelo emulador. Para um projeto Firebase real, publicar com `firebase deploy --only firestore:indexes`.

## Regras de Segurança Storage (`storage.rules`)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() { return request.auth != null; }
    function isImage() { return request.resource.contentType.matches('image/.*'); }
    function isUnder8MB() { return request.resource.size < 8 * 1024 * 1024; }

    match /task-uploads/{uid}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == uid && isImage() && isUnder8MB();
    }
  }
}
```

Todas as imagens (descrição e comentários) ficam em `task-uploads/{uid}/`, onde `{uid}` é sempre quem fez o upload — qualquer utilizador autenticado pode ler, mas só pode escrever na sua própria pasta, com o tipo de conteúdo restringido a imagens e um limite de 8MB.

---

## Scripts

| Comando           | Descrição                  |
|-------------------|------------------------------|
| `npm run dev`     | Inicia o servidor de desenvolvimento Vite |
| `npm run build`   | Build de produção para `dist/` |
| `npm run preview` | Pré-visualiza o build de produção |
