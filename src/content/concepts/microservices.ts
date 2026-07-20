import type { Concept, Question } from '../schema';

/** Microservices patterns — tactical distributed-systems patterns (Richardson, Fowler, DDD, Nygard). */
export const microservices: Concept[] = [
  {
    "id": "database-per-service",
    "name": "Database per Service",
    "category": "microservices",
    "grade": "middle",
    "aka": [
      "Private Database per Service"
    ],
    "tags": [
      "микросервисы",
      "хранение данных",
      "связанность"
    ],
    "tagline": {
      "ru": "Каждый сервис владеет своей приватной базой данных; остальные обращаются к ней только через его API или события",
      "en": "Each service owns its private database; others reach it only through its API or events"
    },
    "definition": {
      "ru": "Паттерн хранения данных в микросервисной архитектуре: каждый сервис хранит свои данные в собственной приватной базе, прямой доступ к которой есть только у него самого. Другие сервисы никогда не читают и не пишут в чужую базу напрямую — они получают нужные данные исключительно через публичный API сервиса-владельца или через публикуемые им события. База данных становится скрытой деталью реализации сервиса за его контрактом.",
      "en": "A data-storage pattern for microservices: each service keeps its data in its own private database that only that service may access directly. Other services never read from or write to someone else's database directly — they obtain the data they need solely through the owning service's public API or the events it publishes. The database becomes a hidden implementation detail of the service, behind its contract."
    },
    "problem": {
      "ru": "Если несколько микросервисов делят одну общую базу данных, они оказываются связаны через её схему: изменение таблицы одним сервисом может сломать другой, а выкатить сервис независимо нельзя — нужна согласованная миграция и совместный релиз всех, кто зависит от этих таблиц. Общая база также навязывает всем единый тип СУБД и превращается в единую точку отказа и узкое место масштабирования, что подрывает саму идею независимых сервисов.",
      "en": "If several microservices share one common database, they become coupled through its schema: one service changing a table can break another, and you can't deploy a service independently — you need a coordinated migration and a joint release of everyone who depends on those tables. A shared database also forces a single kind of DBMS on everyone and becomes a single point of failure and a scaling bottleneck, undermining the very idea of independent services."
    },
    "solution": {
      "ru": "Каждый сервис получает собственную приватную базу данных, и прямой доступ к ней есть только у него. Всё взаимодействие с чужими данными идёт через API сервиса-владельца или через его события. Так схема хранения инкапсулируется внутри сервиса: команда свободно меняет модель данных и даже тип СУБД (polyglot persistence), пока стабилен внешний контракт, а сервисы можно разрабатывать, деплоить и масштабировать независимо. Платой становится отказ от межсервисных ACID-транзакций и JOIN'ов: согласованность между сервисами обеспечивается через Saga и eventual consistency, а сводные запросы — через API composition или CQRS.",
      "en": "Each service is given its own private database that only it can access directly. All interaction with another service's data goes through the owning service's API or its events. This encapsulates the storage schema inside the service: the team is free to change the data model and even the kind of DBMS (polyglot persistence) as long as the external contract stays stable, and services can be developed, deployed, and scaled independently. The price is giving up cross-service ACID transactions and JOINs: consistency between services is achieved through Saga and eventual consistency, and cross-service queries through API composition or CQRS."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Каждый сервис владеет ПРИВАТНОЙ базой — никакой другой сервис не трогает её напрямую.\nclass CustomerDb {\n  private rows = new Map<string, { id: string; name: string; credit: number }>();\n  find(id: string) { return this.rows.get(id) ?? null; }\n}\n\n// Customer Service — единственный код, которому разрешено читать/писать CustomerDb.\nclass CustomerService {\n  constructor(private db: CustomerDb) {}\n  getCredit(id: string): number {\n    const c = this.db.find(id);\n    if (!c) throw new Error('Customer not found'); // данные отдаются через API, а не через общие таблицы\n    return c.credit;\n  }\n}\n\n// У Order Service своя собственная база, отдельная от CustomerDb.\nclass OrderDb {\n  private rows = new Map<string, { id: string; customerId: string; total: number }>();\n  save(row: { id: string; customerId: string; total: number }) { this.rows.set(row.id, row); }\n}\n\n// Нужны данные о клиенте — Order Service ВЫЗЫВАЕТ API Customer Service, а не лезет в его базу.\nclass OrderService {\n  constructor(private db: OrderDb, private customers: CustomerService) {}\n  place(id: string, customerId: string, total: number) {\n    const credit = this.customers.getCredit(customerId); // вызов API, а не JOIN по общей базе\n    if (total > credit) throw new Error('Credit limit exceeded');\n    this.db.save({ id, customerId, total }); // пишет только в свою собственную базу\n  }\n}",
        "en": "// Each service owns a PRIVATE database — no other service touches it directly.\nclass CustomerDb {\n  private rows = new Map<string, { id: string; name: string; credit: number }>();\n  find(id: string) { return this.rows.get(id) ?? null; }\n}\n\n// Customer Service is the ONLY code allowed to read/write CustomerDb.\nclass CustomerService {\n  constructor(private db: CustomerDb) {}\n  getCredit(id: string): number {\n    const c = this.db.find(id);\n    if (!c) throw new Error('Customer not found'); // data is served via the API, not shared tables\n    return c.credit;\n  }\n}\n\n// Order Service has its OWN database, separate from CustomerDb.\nclass OrderDb {\n  private rows = new Map<string, { id: string; customerId: string; total: number }>();\n  save(row: { id: string; customerId: string; total: number }) { this.rows.set(row.id, row); }\n}\n\n// It needs customer data — Order Service CALLS the Customer Service API, not its database.\nclass OrderService {\n  constructor(private db: OrderDb, private customers: CustomerService) {}\n  place(id: string, customerId: string, total: number) {\n    const credit = this.customers.getCredit(customerId); // an API call, not a JOIN on a shared DB\n    if (total > credit) throw new Error('Credit limit exceeded');\n    this.db.save({ id, customerId, total }); // writes only to its own database\n  }\n}"
      }
    },
    "pros": {
      "ru": [
        "Слабая связанность: сервисы не делят схему, поэтому сервис меняет свою модель данных, не ломая остальных",
        "Независимый деплой: не нужно согласовывать миграцию общей базы между командами",
        "Свобода выбора подходящего хранилища под каждый сервис (polyglot persistence) — реляционная база для заказов, поисковый индекс для каталога",
        "Изоляция отказов и нагрузки: проблема с базой одного сервиса не тянет за собой остальные",
        "Чёткое владение данными: каждая команда полностью владеет своими данными за стабильным контрактом"
      ],
      "en": [
        "Loose coupling: services don't share a schema, so a service can change its data model without breaking others",
        "Independent deployment: no shared-database migration to coordinate across teams",
        "Freedom to pick the right store per service (polyglot persistence) — a relational DB for orders, a search index for the catalog",
        "Fault and load isolation: a problem with one service's database doesn't drag the others down",
        "Clear data ownership: each team fully owns its data behind a stable contract"
      ]
    },
    "cons": {
      "ru": [
        "Нет межсервисных ACID-транзакций и JOIN'ов — согласованность между сервисами становится заботой приложения (Saga, eventual consistency)",
        "Запросы, охватывающие несколько сервисов, требуют API composition или CQRS-проекций вместо одного SQL-JOIN",
        "Больше эксплуатационных издержек: множество баз нужно разворачивать, бэкапить, мониторить и защищать",
        "Дублирование данных: сервисы держат локальные копии чужих данных, синхронизируемые через события",
        "Сложнее отладка и отчётность: нет единой базы, к которой можно обратиться за глобальной картиной"
      ],
      "en": [
        "No cross-service ACID transactions or JOINs — consistency across services becomes the application's problem (Saga, eventual consistency)",
        "Queries spanning several services need API composition or CQRS read models instead of a single SQL JOIN",
        "More operational overhead: many databases to provision, back up, monitor, and secure",
        "Data duplication: services keep local copies of data they don't own, kept in sync via events",
        "Harder debugging and reporting: there is no single database to query for a global view"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Слабая связанность и независимый деплой против потери простых межсервисных ACID-транзакций и JOIN'ов",
        "Свобода polyglot persistence против умноженной эксплуатационной стоимости множества хранилищ",
        "Автономия команд и чёткое владение данными против eventual consistency и дублирования данных, которое нужно согласовывать",
        "Изоляция отказов и нагрузки против большего числа подвижных частей и сетевых вызовов для получения связанных данных"
      ],
      "en": [
        "Loose coupling and independent deployment versus losing simple cross-service ACID transactions and JOINs",
        "The freedom of polyglot persistence versus the multiplied operational cost of many stores",
        "Team autonomy and clear data ownership versus eventual consistency and duplicated data that must be reconciled",
        "Isolation of faults and load versus more moving parts and network hops to fetch related data"
      ]
    },
    "whenToUse": {
      "ru": [
        "Вы строите микросервисы и хотите, чтобы команды разрабатывали, деплоили и масштабировали сервисы независимо",
        "У разных сервисов действительно разные требования к хранению — polyglot persistence окупается",
        "Вы готовы принять eventual consistency и использовать Saga для операций, затрагивающих несколько сервисов",
        "Границы владения данными следуют за чёткими bounded contexts (DDD)"
      ],
      "en": [
        "You are building microservices and want teams to develop, deploy, and scale their services independently",
        "Different services genuinely have different storage needs — polyglot persistence pays off",
        "You can accept eventual consistency and are prepared to use Saga for operations that span several services",
        "Data-ownership boundaries follow clear bounded contexts (DDD)"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Небольшое приложение или одна команда, где общая база проще и дешевле — не дробите данные преждевременно",
        "Домену повсюду нужны строгие межсущностные ACID-транзакции, а eventual consistency неприемлема",
        "Отчётность и аналитика постоянно требуют JOIN'ов по всем данным — лучше единая база или отдельное хранилище данных (data warehouse)"
      ],
      "en": [
        "A small application or a single team, where one shared database is simpler and cheaper — don't split the data prematurely",
        "The domain needs strong cross-entity ACID transactions everywhere and eventual consistency is unacceptable",
        "Reporting and analytics constantly need JOINs across all data — better served by one database or a dedicated data warehouse"
      ]
    },
    "related": [
      "microservices",
      "saga",
      "cqrs",
      "api-gateway"
    ],
    "diagram": "flowchart LR\n  OS[Order Service] --> ODB[(Order DB)]\n  CS[Customer Service] --> CDB[(Customer DB)]\n  IS[Inventory Service] --> IDB[(Inventory DB)]\n  OS -->|API / events| CS\n  OS -->|API / events| IS"
  },
  {
    "id": "api-gateway",
    "name": "API Gateway",
    "category": "microservices",
    "grade": "middle",
    "aka": [
      "Gateway",
      "Edge Service"
    ],
    "tags": [
      "микросервисы",
      "gateway",
      "маршрутизация",
      "cross-cutting concerns"
    ],
    "tagline": {
      "ru": "Единая точка входа для клиентов: маршрутизация, аутентификация, rate-limiting и трансляция протоколов на краю системы",
      "en": "A single entry point for clients: routing, authentication, rate-limiting, and protocol translation at the edge of the system"
    },
    "definition": {
      "ru": "Паттерн, при котором все внешние клиенты обращаются к системе микросервисов через один сервис-посредник, расположенный на краю системы. API Gateway принимает запрос, выполняет сквозные задачи (аутентификация, rate-limiting, TLS termination), маршрутизирует запрос к нужному внутреннему сервису, при необходимости транслирует протокол и формирует ответ клиенту. Клиент видит один стабильный API и ничего не знает о числе, адресах и протоколах сервисов за шлюзом.",
      "en": "A pattern in which all external clients access a microservices system through a single intermediary service located at the edge of the system. The API Gateway receives a request, handles cross-cutting concerns (authentication, rate-limiting, TLS termination), routes the request to the appropriate internal service, translates the protocol when needed, and shapes the response for the client. The client sees one stable API and knows nothing about the number, addresses, or protocols of the services behind the gateway."
    },
    "problem": {
      "ru": "Если клиенты вызывают микросервисы напрямую (client-to-service), клиент вынужден знать адреса и протоколы десятков сервисов, а границы сервисов протекают наружу — любой их рефакторинг ломает клиентов. Сквозные задачи (аутентификация, rate-limiting, TLS, логирование) приходится реализовывать в каждом сервисе заново, что порождает дублирование и расхождения. Мобильному клиенту к тому же дорого делать множество запросов по медленной сети, а часть внутренних протоколов (gRPC, AMQP) вообще недоступна из браузера.",
      "en": "If clients call microservices directly (client-to-service), the client must know the addresses and protocols of dozens of services, and service boundaries leak outward — any refactoring of them breaks clients. Cross-cutting concerns (authentication, rate-limiting, TLS, logging) have to be re-implemented in every service, which breeds duplication and drift. A mobile client also pays dearly to make many requests over a slow network, and some internal protocols (gRPC, AMQP) are simply unreachable from a browser."
    },
    "solution": {
      "ru": "Ставим единую точку входа — API Gateway — между клиентами и микросервисами. Шлюз публикует стабильный внешний API и берёт на себя сквозные задачи: терминирует TLS, аутентифицирует запрос, применяет rate-limiting, маршрутизирует к нужному сервису по пути или заголовкам, транслирует внешний протокол во внутренний и приводит ответ к нужной форме. Внутренние сервисы можно добавлять, дробить и переносить, не затрагивая клиентов. Ключевое ограничение: шлюз остаётся тонким — он не содержит бизнес-логики домена, а лишь делегирует её сервисам-владельцам.",
      "en": "Place a single entry point — the API Gateway — between clients and microservices. The gateway publishes a stable external API and takes on the cross-cutting concerns: it terminates TLS, authenticates the request, applies rate-limiting, routes to the right service by path or headers, translates the external protocol into the internal one, and shapes the response. Internal services can be added, split, or relocated without affecting clients. The key constraint: the gateway stays thin — it holds no domain business logic and merely delegates it to the owning services."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Внутренние сервисы — каждый владеет одной способностью и о шлюзе не знает\ninterface Request { path: string; token?: string; }\ninterface Response { status: number; body: unknown; }\n\ninterface Service {\n  handle(req: Request): Response;\n}\n\nclass OrderService implements Service {\n  handle(_req: Request): Response {\n    return { status: 200, body: { orders: [] } }; // бизнес-логика живёт здесь\n  }\n}\nclass UserService implements Service {\n  handle(_req: Request): Response {\n    return { status: 200, body: { name: 'Анна' } };\n  }\n}\n\n// API Gateway: единая точка входа. Только сквозные задачи, без бизнес-логики\nclass ApiGateway {\n  private hits = new Map<string, number>();\n  constructor(private routes: Record<string, Service>) {}\n\n  handle(req: Request): Response {\n    // 1. Аутентификация — сквозная задача, решается один раз на краю\n    if (!req.token) return { status: 401, body: 'Unauthorized' };\n\n    // 2. Rate-limiting по токену\n    const n = (this.hits.get(req.token) ?? 0) + 1;\n    this.hits.set(req.token, n);\n    if (n > 100) return { status: 429, body: 'Too Many Requests' };\n\n    // 3. Маршрутизация к сервису-владельцу по префиксу пути\n    const prefix = '/' + req.path.split('/')[1];\n    const service = this.routes[prefix];\n    if (!service) return { status: 404, body: 'Not Found' };\n\n    // шлюз лишь делегирует; сам ответ он не вычисляет\n    return service.handle(req);\n  }\n}\n\nconst gateway = new ApiGateway({\n  '/orders': new OrderService(),\n  '/users': new UserService(),\n});\ngateway.handle({ path: '/orders/42', token: 'abc' });",
        "en": "// Internal services — each owns one capability and is unaware of the gateway\ninterface Request { path: string; token?: string; }\ninterface Response { status: number; body: unknown; }\n\ninterface Service {\n  handle(req: Request): Response;\n}\n\nclass OrderService implements Service {\n  handle(_req: Request): Response {\n    return { status: 200, body: { orders: [] } }; // business logic lives here\n  }\n}\nclass UserService implements Service {\n  handle(_req: Request): Response {\n    return { status: 200, body: { name: 'Ann' } };\n  }\n}\n\n// API Gateway: the single entry point. Cross-cutting concerns only, no business logic\nclass ApiGateway {\n  private hits = new Map<string, number>();\n  constructor(private routes: Record<string, Service>) {}\n\n  handle(req: Request): Response {\n    // 1. Authentication — a cross-cutting concern, handled once at the edge\n    if (!req.token) return { status: 401, body: 'Unauthorized' };\n\n    // 2. Rate-limiting per token\n    const n = (this.hits.get(req.token) ?? 0) + 1;\n    this.hits.set(req.token, n);\n    if (n > 100) return { status: 429, body: 'Too Many Requests' };\n\n    // 3. Routing to the owning service by path prefix\n    const prefix = '/' + req.path.split('/')[1];\n    const service = this.routes[prefix];\n    if (!service) return { status: 404, body: 'Not Found' };\n\n    // the gateway only delegates; it does not compute the answer itself\n    return service.handle(req);\n  }\n}\n\nconst gateway = new ApiGateway({\n  '/orders': new OrderService(),\n  '/users': new UserService(),\n});\ngateway.handle({ path: '/orders/42', token: 'abc' });"
      }
    },
    "pros": {
      "ru": [
        "Инкапсулирует внутреннюю структуру системы: клиент видит один стабильный API и не знает о числе, адресах и протоколах сервисов",
        "Сквозные задачи (аутентификация, rate-limiting, TLS termination, логирование) решаются в одном месте, а не дублируются в каждом сервисе",
        "Позволяет транслировать протоколы: снаружи удобный REST/GraphQL, внутри — gRPC, AMQP и другие",
        "Свобода рефакторинга: сервисы можно дробить, объединять и переносить, не затрагивая клиентов, пока стабилен внешний контракт"
      ],
      "en": [
        "Encapsulates the system's internal structure: the client sees one stable API and knows nothing about the number, addresses, or protocols of the services",
        "Cross-cutting concerns (authentication, rate-limiting, TLS termination, logging) are handled in one place instead of being duplicated in every service",
        "Enables protocol translation: a convenient REST/GraphQL on the outside, gRPC, AMQP, and others on the inside",
        "Freedom to refactor: services can be split, merged, and relocated without affecting clients as long as the external contract stays stable"
      ]
    },
    "cons": {
      "ru": [
        "Ещё один компонент, который нужно разрабатывать, деплоить и эксплуатировать; при отказе или недоступности он становится единой точкой отказа (SPOF), поэтому требует резервирования",
        "Добавляет лишний сетевой хоп и потенциальное узкое место в задержках и пропускной способности всей системы",
        "Риск разрастания: в шлюз начинает утекать бизнес-логика и агрегация, и он превращается в монолит-посредник, замедляя все команды",
        "Обновление шлюза требует координации между командами: изменение маршрутов и контрактов затрагивает многих владельцев сервисов"
      ],
      "en": [
        "Yet another component to develop, deploy, and operate; on failure or unavailability it becomes a single point of failure (SPOF) and therefore needs redundancy",
        "Adds an extra network hop and a potential bottleneck in the latency and throughput of the whole system",
        "Risk of bloat: business logic and aggregation start leaking into the gateway, and it turns into a monolithic intermediary that slows every team down",
        "Updating the gateway requires coordination across teams: changing routes and contracts affects many service owners"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Развязка клиентов от топологии сервисов и централизация сквозных задач против лишнего хопа, узкого места и единой точки отказа",
        "Один общий шлюз (простая эксплуатация) против нескольких специализированных под каждый тип клиента (вариант BFF) с меньшим риском разрастания",
        "Централизация auth/rate-limiting/TLS в одном месте против связанности команд вокруг общего компонента и координации его изменений",
        "Удобство агрегации ответов на шлюзе против риска затащить в него бизнес-логику домена и превратить в скрытый монолит"
      ],
      "en": [
        "Decoupling clients from service topology and centralizing cross-cutting concerns versus an extra hop, a bottleneck, and a single point of failure",
        "One shared gateway (simpler to operate) versus several specialized ones per client type (the BFF variant) with less risk of bloat",
        "Centralizing auth/rate-limiting/TLS in one place versus coupling teams around a shared component and coordinating its changes",
        "The convenience of aggregating responses at the gateway versus the risk of dragging domain business logic into it and turning it into a hidden monolith"
      ]
    },
    "whenToUse": {
      "ru": [
        "В системе много микросервисов, и клиентам неудобно и небезопасно ходить в каждый напрямую",
        "Сквозные задачи — аутентификация, авторизация, rate-limiting, TLS termination — нужно решать единообразно для всех сервисов",
        "Клиенты (мобильные, браузерные) работают по медленной сети или не умеют внутренние протоколы, и нужна трансляция протоколов",
        "Внутренняя структура сервисов активно меняется, и её нужно скрыть за стабильным внешним контрактом"
      ],
      "en": [
        "The system has many microservices and it is inconvenient and unsafe for clients to call each one directly",
        "Cross-cutting concerns — authentication, authorization, rate-limiting, TLS termination — must be handled uniformly across all services",
        "Clients (mobile, browser) work over a slow network or cannot speak internal protocols, and protocol translation is needed",
        "The internal service structure changes frequently and needs to be hidden behind a stable external contract"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Сервисов мало и клиент один: прямые вызовы client-to-service проще, а шлюз лишь добавит хоп и точку отказа",
        "У разных типов клиентов сильно расходятся потребности к API — тогда вместо одного шлюза чаще берут несколько BFF",
        "Нет ресурсов сделать шлюз отказоустойчивым: единственный экземпляр без резервирования делает всю систему хрупкой"
      ],
      "en": [
        "There are few services and a single client: direct client-to-service calls are simpler, and a gateway would only add a hop and a point of failure",
        "Different client types have sharply diverging API needs — then several BFFs are usually chosen instead of one gateway",
        "There are no resources to make the gateway fault-tolerant: a single instance with no redundancy makes the whole system brittle"
      ]
    },
    "related": [
      "bff",
      "aggregator",
      "circuit-breaker",
      "microservices"
    ],
    "diagram": "flowchart LR\n  C[Client] --> G[API Gateway]\n  G --> A[Order Service]\n  G --> B[User Service]\n  G --> D[Payment Service]"
  },
  {
    "id": "aggregator",
    "name": "Aggregator",
    "category": "microservices",
    "grade": "senior",
    "tags": [
      "микросервисы",
      "композиция",
      "fan-out/fan-in",
      "оркестрация данных"
    ],
    "tagline": {
      "ru": "Сервис, который вызывает несколько downstream-сервисов и объединяет их ответы в единый консолидированный результат для клиента",
      "en": "A service that calls several downstream services and merges their responses into a single consolidated result for the client"
    },
    "definition": {
      "ru": "Паттерн композиции, в котором отдельный сервис (или компонент) принимает запрос, вызывает несколько независимых сервисов — параллельно или цепочкой — и объединяет полученные данные в единый ответ, прежде чем вернуть его клиенту. Aggregator инкапсулирует логику композиции (fan-out/fan-in, объединение результатов, обработку частичных отказов) в одном месте, избавляя клиента от необходимости самому делать несколько вызовов и склеивать разнородные ответы.",
      "en": "A composition pattern in which a dedicated service (or component) accepts a request, calls several independent services — in parallel or as a chain — and merges the retrieved data into a single response before returning it to the client. The Aggregator encapsulates the composition logic (fan-out/fan-in, merging results, handling partial failures) in one place, freeing the client from having to make multiple calls itself and stitch together heterogeneous responses."
    },
    "problem": {
      "ru": "Клиенту (или экрану приложения) часто нужны данные сразу из нескольких сервисов — например, карточка заказа требует данных от Order, User и Payment сервисов. Если клиент делает эти вызовы сам, он вынужден знать топологию сервисов, выполнять несколько round-trip'ов по сети (особенно дорого для мобильных клиентов на медленном соединении), обрабатывать частичные отказы каждого вызова и самостоятельно объединять разнородные ответы. Логика композиции при этом дублируется в каждом клиенте, а любое изменение состава downstream-сервисов требует правки всех клиентов.",
      "en": "A client (or an application screen) often needs data from several services at once — for example, an order card needs data from the Order, User, and Payment services. If the client makes these calls itself, it must know the service topology, perform several network round-trips (especially costly for mobile clients on a slow connection), handle partial failures of each call, and merge heterogeneous responses on its own. The composition logic ends up duplicated across every client, and any change to the set of downstream services requires updating all of them."
    },
    "solution": {
      "ru": "Вводим отдельный сервис-агрегатор между клиентом и downstream-сервисами. Aggregator принимает один запрос от клиента, вызывает нужные сервисы — параллельно, если их данные независимы, или цепочкой, если результат одного вызова нужен как вход для следующего, — объединяет ответы по заранее определённой схеме и возвращает клиенту единый консолидированный результат. Aggregator также решает, что делать при частичном отказе одного из вызовов (вернуть частичные данные, значение по умолчанию или ошибку целиком), обычно применяя timeout и Circuit Breaker к каждому вызову в отдельности.",
      "en": "Introduce a dedicated aggregator service between the client and the downstream services. The Aggregator accepts a single request from the client, calls the needed services — in parallel if their data is independent, or as a chain if one call's result is needed as input to the next — merges the responses according to a predefined schema, and returns a single consolidated result to the client. The Aggregator also decides what to do on a partial failure of one of the calls (return partial data, a default value, or fail the whole request), typically applying a timeout and a Circuit Breaker to each call individually."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Downstream-сервисы — независимы и ничего не знают об агрегаторе\ninterface OrderInfo { orderId: string; userId: string; items: string[]; }\ninterface UserInfo { userId: string; name: string; }\ninterface PaymentInfo { orderId: string; status: string; }\n\ninterface OrderService { getOrder(orderId: string): Promise<OrderInfo>; }\ninterface UserService { getUser(userId: string): Promise<UserInfo>; }\ninterface PaymentService { getPayment(orderId: string): Promise<PaymentInfo>; }\n\nclass OrderServiceImpl implements OrderService {\n  async getOrder(orderId: string): Promise<OrderInfo> {\n    return { orderId, userId: 'u-1', items: ['Book', 'Pen'] }; // бизнес-логика живёт здесь\n  }\n}\nclass UserServiceImpl implements UserService {\n  async getUser(userId: string): Promise<UserInfo> {\n    return { userId, name: 'Анна' };\n  }\n}\nclass PaymentServiceImpl implements PaymentService {\n  async getPayment(orderId: string): Promise<PaymentInfo> {\n    return { orderId, status: 'CAPTURED' };\n  }\n}\n\ninterface OrderSummary {\n  order: OrderInfo;\n  user: UserInfo | null;\n  payment: PaymentInfo | null;\n}\n\n// Aggregator: fan-out к независимым сервисам, fan-in в единый ответ\nclass OrderSummaryAggregator {\n  constructor(\n    private orders: OrderService,\n    private users: UserService,\n    private payments: PaymentService,\n  ) {}\n\n  async getSummary(orderId: string): Promise<OrderSummary> {\n    const order = await this.orders.getOrder(orderId); // цепочка: из заказа узнаём, какого пользователя запросить\n\n    // Параллельный fan-out: User и Payment не зависят друг от друга\n    const [user, payment] = await Promise.allSettled([\n      this.users.getUser(order.userId),\n      this.payments.getPayment(orderId),\n    ]);\n\n    // Слияние в единый консолидированный ответ с допущением частичного отказа\n    return {\n      order,\n      user: user.status === 'fulfilled' ? user.value : null,\n      payment: payment.status === 'fulfilled' ? payment.value : null,\n    };\n  }\n}\n\nconst aggregator = new OrderSummaryAggregator(\n  new OrderServiceImpl(),\n  new UserServiceImpl(),\n  new PaymentServiceImpl(),\n);\naggregator.getSummary('42');",
        "en": "// Downstream services -- independent, unaware of the aggregator\ninterface OrderInfo { orderId: string; userId: string; items: string[]; }\ninterface UserInfo { userId: string; name: string; }\ninterface PaymentInfo { orderId: string; status: string; }\n\ninterface OrderService { getOrder(orderId: string): Promise<OrderInfo>; }\ninterface UserService { getUser(userId: string): Promise<UserInfo>; }\ninterface PaymentService { getPayment(orderId: string): Promise<PaymentInfo>; }\n\nclass OrderServiceImpl implements OrderService {\n  async getOrder(orderId: string): Promise<OrderInfo> {\n    return { orderId, userId: 'u-1', items: ['Book', 'Pen'] }; // business logic lives here\n  }\n}\nclass UserServiceImpl implements UserService {\n  async getUser(userId: string): Promise<UserInfo> {\n    return { userId, name: 'Ann' };\n  }\n}\nclass PaymentServiceImpl implements PaymentService {\n  async getPayment(orderId: string): Promise<PaymentInfo> {\n    return { orderId, status: 'CAPTURED' };\n  }\n}\n\ninterface OrderSummary {\n  order: OrderInfo;\n  user: UserInfo | null;\n  payment: PaymentInfo | null;\n}\n\n// Aggregator: fan-out to independent services, fan-in into one response\nclass OrderSummaryAggregator {\n  constructor(\n    private orders: OrderService,\n    private users: UserService,\n    private payments: PaymentService,\n  ) {}\n\n  async getSummary(orderId: string): Promise<OrderSummary> {\n    const order = await this.orders.getOrder(orderId); // chained: the order tells us which user to fetch\n\n    // Parallel fan-out: User and Payment do not depend on each other\n    const [user, payment] = await Promise.allSettled([\n      this.users.getUser(order.userId),\n      this.payments.getPayment(orderId),\n    ]);\n\n    // Merge into a single consolidated response, tolerating partial failure\n    return {\n      order,\n      user: user.status === 'fulfilled' ? user.value : null,\n      payment: payment.status === 'fulfilled' ? payment.value : null,\n    };\n  }\n}\n\nconst aggregator = new OrderSummaryAggregator(\n  new OrderServiceImpl(),\n  new UserServiceImpl(),\n  new PaymentServiceImpl(),\n);\naggregator.getSummary('42');"
      }
    },
    "pros": {
      "ru": [
        "Инкапсулирует логику композиции в одном месте: клиент делает один запрос вместо нескольких и не знает о топологии downstream-сервисов",
        "Уменьшает число round-trip'ов между клиентом и системой — особенно важно для мобильных и веб-клиентов на медленной сети",
        "Позволяет распараллелить независимые вызовы (fan-out/fan-in), снижая суммарную задержку по сравнению с последовательными вызовами из клиента",
        "Централизует обработку частичных отказов и таймаутов downstream-сервисов, скрывая эту сложность от клиента"
      ],
      "en": [
        "Encapsulates the composition logic in one place: the client makes a single request instead of several and knows nothing about the downstream service topology",
        "Reduces the number of round-trips between the client and the system — especially important for mobile and web clients on a slow network",
        "Allows independent calls to be parallelized (fan-out/fan-in), reducing total latency compared with sequential calls made by the client",
        "Centralizes the handling of partial failures and timeouts of downstream services, hiding that complexity from the client"
      ]
    },
    "cons": {
      "ru": [
        "Aggregator становится дополнительным сетевым хопом и потенциальной точкой отказа между клиентом и downstream-сервисами",
        "Задержка агрегирующего вызова ограничена самым медленным из нужных сервисов, а параллельные вызовы требуют явной обработки таймаутов и частичных ответов",
        "Создаёт связанность агрегатора со схемами ответов всех downstream-сервисов: изменение контракта любого из них требует правки агрегатора",
        "Риск превращения в скрытый оркестратор бизнес-логики, если в агрегатор постепенно перетекают правила предметной области, а не только объединение данных"
      ],
      "en": [
        "The Aggregator becomes an extra network hop and a potential point of failure between the client and the downstream services",
        "The latency of the aggregated call is bounded by the slowest of the required services, and parallel calls require explicit handling of timeouts and partial responses",
        "Couples the aggregator to the response schemas of all downstream services: changing any one of their contracts requires updating the aggregator",
        "Risk of turning into a hidden orchestrator of business logic if domain rules gradually leak into the aggregator instead of it only merging data"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Параллельная композиция (fan-out) минимизирует задержку, но усложняет обработку частичных отказов; цепочка вызовов проще в отказоустойчивости, но задержки в ней складываются",
        "Один переиспользуемый агрегатор для нескольких клиентов проще эксплуатировать, но вынуждает идти на компромиссный формат ответа, тогда как выделенный агрегатор под конкретный экран (в духе BFF) точнее, но плодит копии",
        "Скрытие сложности композиции от клиента против связанности агрегатора со схемами ответов всех вызываемых сервисов",
        "Простота агрегирования ответов прямо на уровне API Gateway против выделения отдельного сервиса-агрегатора ради соблюдения принципа единственной ответственности"
      ],
      "en": [
        "Parallel composition (fan-out) minimizes latency but complicates handling of partial failures; a chain of calls is simpler to make fault-tolerant, but its latencies add up",
        "One reusable aggregator shared by several clients is simpler to operate but forces a compromise response shape, whereas a dedicated aggregator for a specific screen (BFF-style) is more precise but multiplies copies",
        "Hiding composition complexity from the client versus coupling the aggregator to the response schemas of every service it calls",
        "The simplicity of aggregating responses directly at the API Gateway level versus extracting a separate aggregator service to preserve the single-responsibility principle"
      ]
    },
    "whenToUse": {
      "ru": [
        "Клиенту или экрану нужны данные сразу из нескольких независимых сервисов, и неэффективно делать несколько запросов с клиента",
        "Данные от разных сервисов можно получить независимо и объединить по чётко определённой схеме",
        "Нужно защитить клиента от частичных отказов downstream-сервисов, подставляя значения по умолчанию или возвращая частичный ответ",
        "Состав и число вызываемых сервисов может меняться со временем, и клиента не нужно вовлекать в эти изменения"
      ],
      "en": [
        "A client or screen needs data from several independent services at once, and making several requests from the client is inefficient",
        "Data from different services can be fetched independently and merged according to a clearly defined schema",
        "The client needs to be shielded from partial failures of downstream services by falling back to default values or a partial response",
        "The set and number of called services may change over time, and the client should not be involved in those changes"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Клиенту достаточно данных из одного сервиса — агрегатор добавит лишний сетевой хоп без пользы",
        "Объединяемые данные тесно связаны бизнес-правилами, например распределённой транзакцией — тогда нужен оркестратор саги (Saga/Process Manager), а не простое слияние ответов",
        "Разным типам клиентов (веб, мобильный) нужны существенно разные формы агрегированного ответа — тогда стоит рассмотреть BFF вместо одного общего агрегатора"
      ],
      "en": [
        "The client only needs data from a single service — the aggregator would add an extra network hop with no benefit",
        "The merged data is tightly bound by business rules, e.g. a distributed transaction — then a saga orchestrator (Saga/Process Manager) is needed rather than a simple merge of responses",
        "Different client types (web, mobile) need substantially different shapes of the aggregated response — then a BFF should be considered instead of one shared aggregator"
      ]
    },
    "related": [
      "api-gateway",
      "bff"
    ],
    "diagram": "flowchart LR\n  C[Client] --> AG[Aggregator]\n  AG --> S1[Order Service]\n  AG --> S2[User Service]\n  AG --> S3[Payment Service]\n  S1 --> M[Merge responses]\n  S2 --> M\n  S3 --> M\n  M --> C"
  },
  {
    "id": "bff",
    "name": "Backend for Frontend",
    "category": "microservices",
    "grade": "senior",
    "aka": [
      "BFF",
      "Backends for Frontends"
    ],
    "tags": [
      "микросервисы",
      "api",
      "фронтенд",
      "интеграция"
    ],
    "tagline": {
      "ru": "Отдельный backend под каждый тип клиента, заточенный под нужды именно его UI",
      "en": "A dedicated backend per client type, tailored to the needs of that specific UI"
    },
    "definition": {
      "ru": "Паттерн интеграции, при котором для каждого фронтенда (веб, мобильное приложение, партнёрский API) создаётся собственный, узко заточенный под него серверный слой — Backend for Frontend. Каждый BFF агрегирует и адаптирует данные общих downstream-сервисов под конкретные экраны и ограничения своего клиента, а не пытается обслужить всех клиентов одним универсальным API. Термин ввёл Sam Newman, описывая практику SoundCloud, где единый API-слой перестал справляться с расходящимися потребностями веб- и мобильных клиентов.",
      "en": "An integration pattern in which each frontend (web, mobile app, partner API) gets its own narrowly tailored server-side layer — a Backend for Frontend. Each BFF aggregates and adapts data from shared downstream services to fit the concrete screens and constraints of its particular client, rather than trying to serve every client through one general-purpose API. The term was coined by Sam Newman describing SoundCloud's practice, where a single API layer stopped coping with the diverging needs of web and mobile clients."
    },
    "problem": {
      "ru": "Один универсальный API вынужден обслуживать разных клиентов с несовместимыми потребностями. Веб-приложению нужен богатый экран профиля со всей историей заказов, а мобильному — компактный ответ ради экономии трафика и батареи. Общий API либо раздувается «на все случаи», либо заставляет клиента делать по несколько запросов и склеивать/фильтровать данные на своей стороне. Хуже того, ускорение мобильного клиента и веба конкурируют за один и тот же общий код, а изменения ради одного клиента рискуют сломать другого.",
      "en": "A single general-purpose API is forced to serve different clients with incompatible needs. A web app wants a rich profile screen with the full order history, while a mobile app wants a compact response to save bandwidth and battery. The shared API either bloats to cover every case or pushes the client into making several round-trips and stitching/filtering data on its own side. Worse, evolving the mobile and the web experiences compete over the same shared code, and a change made for one client risks breaking another."
    },
    "solution": {
      "ru": "Дать каждому фронтенду свой backend, знающий именно его экраны. BFF вызывает общие downstream-сервисы (user, order, catalog…), агрегирует и переформатирует ответы под конкретный клиент: веб-BFF отдаёт развёрнутый payload, мобильный BFF — урезанный. Downstream-сервисы остаются общими и не знают о клиентах. Ключ по Newman — привязка не «один BFF на каждый микросервис», а «один BFF на один пользовательский опыт»: как правило клиенты одного класса объединяют, а отдельный BFF заводят там, где потребности UI действительно расходятся. Обычно каждый BFF принадлежит той же команде, что и его фронтенд, что убирает межкомандную координацию при изменении экранов.",
      "en": "Give each frontend its own backend that knows exactly its screens. A BFF calls the shared downstream services (user, order, catalog…), then aggregates and reshapes the responses for its specific client: the web BFF returns an expanded payload, the mobile BFF a trimmed one. The downstream services stay shared and remain unaware of clients. The key rule, per Newman, is to scope not \"one BFF per microservice\" but \"one BFF per user experience\": you usually group clients of the same class and spin up a separate BFF only where the UI needs genuinely diverge. Typically each BFF is owned by the same team that owns its frontend, which removes cross-team coordination when screens change."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Общие downstream-сервисы — их используют все фронтенды\ninterface UserService {\n  getUser(id: string): { id: string; name: string; avatarUrl: string; bio: string };\n}\ninterface OrderService {\n  listOrders(userId: string): { id: string; total: number; status: string }[];\n}\n\n// Web-BFF: на экране много места — отдаём развёрнутый профиль и всю историю заказов\nclass WebProfileBff {\n  constructor(private users: UserService, private orders: OrderService) {}\n  getProfileScreen(userId: string) {\n    const u = this.users.getUser(userId);\n    return {\n      name: u.name,\n      bio: u.bio,\n      avatarUrl: u.avatarUrl,\n      orders: this.orders.listOrders(userId), // веб показывает всю историю\n    };\n  }\n}\n\n// Mobile-BFF: экономим трафик — те же сервисы, но урезанный payload под маленький экран\nclass MobileProfileBff {\n  constructor(private users: UserService, private orders: OrderService) {}\n  getProfileScreen(userId: string) {\n    const u = this.users.getUser(userId);\n    return {\n      name: u.name,\n      avatarUrl: u.avatarUrl,\n      orderCount: this.orders.listOrders(userId).length, // мобильному хватит счётчика\n    };\n  }\n}\n\n// Один общий OrderService, но каждый BFF формирует ответ под свой UI\n",
        "en": "// Shared downstream services — used by every frontend\ninterface UserService {\n  getUser(id: string): { id: string; name: string; avatarUrl: string; bio: string };\n}\ninterface OrderService {\n  listOrders(userId: string): { id: string; total: number; status: string }[];\n}\n\n// Web BFF: the screen has room — return an expanded profile and the full order history\nclass WebProfileBff {\n  constructor(private users: UserService, private orders: OrderService) {}\n  getProfileScreen(userId: string) {\n    const u = this.users.getUser(userId);\n    return {\n      name: u.name,\n      bio: u.bio,\n      avatarUrl: u.avatarUrl,\n      orders: this.orders.listOrders(userId), // web shows the whole history\n    };\n  }\n}\n\n// Mobile BFF: save bandwidth — same services, but a trimmed payload for the small screen\nclass MobileProfileBff {\n  constructor(private users: UserService, private orders: OrderService) {}\n  getProfileScreen(userId: string) {\n    const u = this.users.getUser(userId);\n    return {\n      name: u.name,\n      avatarUrl: u.avatarUrl,\n      orderCount: this.orders.listOrders(userId).length, // a count is enough for mobile\n    };\n  }\n}\n\n// One shared OrderService, yet each BFF shapes the response for its own UI\n"
      }
    },
    "pros": {
      "ru": [
        "Каждый клиент получает API под свои экраны: минимум round-trip'ов и никакой лишней логики агрегации на стороне устройства",
        "Изменения ради одного клиента изолированы — новый экран в мобильном приложении не рискует сломать веб",
        "Оптимизация под канал: мобильный BFF режет payload и объём данных, веб-BFF отдаёт богатый ответ",
        "Команда фронтенда владеет своим BFF и меняет контракт без межкомандной координации",
        "Downstream-сервисы остаются общими и не засоряются клиент-специфичными форматами"
      ],
      "en": [
        "Each client gets an API shaped to its screens: minimal round-trips and no aggregation logic pushed onto the device",
        "Changes made for one client are isolated — a new screen in the mobile app can't break the web",
        "Per-channel optimization: the mobile BFF trims payloads and data volume, the web BFF returns a rich response",
        "The frontend team owns its BFF and can evolve the contract without cross-team coordination",
        "Downstream services stay shared and aren't polluted with client-specific formats"
      ]
    },
    "cons": {
      "ru": [
        "Больше кода и деплой-единиц: каждый новый тип клиента добавляет свой сервис, который надо развивать, мониторить и катить",
        "Дублирование логики между BFF — агрегация и вызовы одних и тех же downstream-сервисов повторяются в каждом",
        "Соблазн расплодить BFF на каждый мелкий клиент вместо группировки по классу опыта ведёт к разрастанию инфраструктуры",
        "Ещё один сетевой хоп на пути запроса: дополнительная задержка и точка отказа",
        "Общая межклиентская логика (auth, rate limiting) может размазаться по всем BFF, если её не вынести отдельно"
      ],
      "en": [
        "More code and deployment units: every new client type adds its own service to evolve, monitor, and ship",
        "Duplicated logic across BFFs — aggregation and calls to the same downstream services get repeated in each",
        "The temptation to spawn a BFF per tiny client instead of grouping by experience class leads to infrastructure sprawl",
        "One more network hop on the request path: added latency and a failure point",
        "Cross-client concerns (auth, rate limiting) can smear across every BFF unless factored out separately"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Заточенность API под клиента против дублирования кода агрегации между несколькими BFF",
        "Автономия и скорость команды фронтенда против роста числа сервисов, которые надо эксплуатировать",
        "Меньше логики и трафика на клиенте против дополнительного сетевого хопа и его задержки",
        "Изоляция изменений между клиентами против риска расхождения общей логики (auth, кэширование) по разным BFF",
        "Группировка клиентов «один BFF на опыт» (проще в эксплуатации) против отдельного BFF на каждый клиент (максимальная заточенность)"
      ],
      "en": [
        "Client-tailored APIs versus duplicated aggregation code across several BFFs",
        "Frontend-team autonomy and speed versus a growing number of services to operate",
        "Less logic and traffic on the client versus an extra network hop and its latency",
        "Isolation of changes between clients versus the risk of shared logic (auth, caching) drifting apart across BFFs",
        "Grouping clients as \"one BFF per experience\" (simpler to operate) versus a separate BFF per client (maximum tailoring)"
      ]
    },
    "whenToUse": {
      "ru": [
        "Потребности ваших фронтендов заметно расходятся — например, богатый веб против экономного мобильного клиента",
        "Клиенты вынуждены делать много запросов и склеивать/фильтровать данные у себя из-за неподходящего общего API",
        "Разные команды владеют разными фронтендами и хотят развивать свои контракты независимо",
        "Нужна оптимизация под канал: разный объём данных, форматы или частота обновлений для веба и мобильного"
      ],
      "en": [
        "Your frontends have noticeably diverging needs — e.g. a rich web client versus a frugal mobile one",
        "Clients are forced into many round-trips and client-side stitching/filtering because the shared API doesn't fit",
        "Different teams own different frontends and want to evolve their contracts independently",
        "You need per-channel optimization: different data volume, formats, or update cadence for web and mobile"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Один-единственный клиент или несколько клиентов с практически одинаковыми потребностями — общий API проще",
        "Команда мала и не потянет эксплуатацию нескольких дополнительных сервисов",
        "Различия между клиентами сводятся к сквозным заботам (auth, маршрутизация, rate limiting) — здесь достаточно API Gateway"
      ],
      "en": [
        "A single client, or a few clients with near-identical needs — a shared API is simpler",
        "The team is small and can't afford to operate several extra services",
        "The differences between clients boil down to cross-cutting concerns (auth, routing, rate limiting) — an API Gateway suffices here"
      ]
    },
    "related": [
      "api-gateway",
      "aggregator"
    ],
    "diagram": "flowchart LR\n  Web[Web App] --> WebBFF[Web BFF]\n  Mobile[Mobile App] --> MobileBFF[Mobile BFF]\n  WebBFF --> UserSvc[User Service]\n  WebBFF --> OrderSvc[Order Service]\n  WebBFF --> CatalogSvc[Catalog Service]\n  MobileBFF --> UserSvc\n  MobileBFF --> OrderSvc\n  MobileBFF --> CatalogSvc"
  },
  {
    "id": "circuit-breaker",
    "name": "Circuit Breaker",
    "category": "microservices",
    "grade": "middle",
    "aka": [
      "Fail-fast breaker"
    ],
    "tagline": {
      "ru": "Перестаём звать сбоящую зависимость, когда ошибок слишком много, и периодически проверяем её восстановление",
      "en": "Stop calling a failing dependency once errors cross a threshold, then periodically probe for its recovery"
    },
    "definition": {
      "ru": "Паттерн устойчивости, который оборачивает вызовы к внешней зависимости и следит за ошибками. Когда число (или доля) сбоев превышает порог, «автомат» размыкается (Open) и последующие вызовы немедленно завершаются ошибкой, не доходя до зависимости. Через заданную паузу (cooldown) он переходит в Half-open и пропускает ограниченное число пробных вызовов: если они успешны — цепь замыкается обратно (Closed), если нет — снова размыкается. Три состояния: Closed → Open → Half-open → Closed.",
      "en": "A resilience pattern that wraps calls to a remote dependency and tracks their failures. When the number (or rate) of failures crosses a threshold, the breaker trips Open and subsequent calls fail immediately without reaching the dependency. After a configured cooldown it moves to Half-open and lets a limited number of trial calls through: if they succeed, the circuit closes again (Closed); if they fail, it trips Open once more. Three states: Closed → Open → Half-open → Closed."
    },
    "problem": {
      "ru": "Когда удалённая зависимость деградирует или зависает, вызывающий продолжает слать к ней запросы и ждать таймаутов. Потоки, соединения и память копятся на ожидании, отказ одного сервиса каскадом распространяется на его вызывающих, и вся цепочка выходит из строя. Слепые повторы (retry) в этой ситуации только ухудшают дело: они добавляют нагрузку уже перегруженному сервису и мешают ему восстановиться.",
      "en": "When a remote dependency degrades or hangs, the caller keeps sending requests and waiting on timeouts. Threads, connections, and memory pile up on the wait, one service's failure cascades to its callers, and the whole chain goes down. Blind retries make this worse: they pile extra load onto an already-overwhelmed service and keep it from recovering."
    },
    "solution": {
      "ru": "Оборачиваем вызовы в Circuit Breaker, который считает сбои. Как только их становится слишком много, breaker размыкается (Open) и начинает отвечать ошибкой мгновенно (fail-fast): вызывающий не виснет на таймаутах, а перегруженная зависимость получает передышку. Спустя cooldown breaker осторожно пробует зависимость ограниченным числом вызовов (Half-open); успех замыкает цепь обратно (Closed), провал снова размыкает её. Так система быстро изолирует отказ и сама, без ручного вмешательства, обнаруживает восстановление. Обычно в Open предусматривают fallback или деградацию вместо простого проброса ошибки.",
      "en": "Wrap the calls in a Circuit Breaker that counts failures. Once there are too many, the breaker trips Open and starts returning an error immediately (fail-fast): the caller no longer hangs on timeouts, and the overloaded dependency gets a break. After a cooldown the breaker cautiously probes the dependency with a limited number of calls (Half-open); success closes the circuit again (Closed), failure trips it back to Open. This lets the system isolate a fault quickly and detect recovery on its own, with no manual intervention. Typically an Open state has a fallback or degraded response instead of just propagating the error."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "type BreakerState = \"closed\" | \"open\" | \"half-open\";\n\nclass CircuitBreaker {\n  private state: BreakerState = \"closed\";\n  private failureCount = 0;\n  private openedAt = 0;\n\n  constructor(\n    private readonly failureThreshold = 5, // ошибок подряд до размыкания\n    private readonly cooldownMs = 30_000,  // пауза перед пробным вызовом\n  ) {}\n\n  async call<T>(action: () => Promise<T>): Promise<T> {\n    if (this.state === \"open\") {\n      if (Date.now() - this.openedAt < this.cooldownMs) {\n        // цепь разомкнута — не трогаем зависимость, отвечаем сразу (fail-fast)\n        throw new Error(\"Circuit is open: failing fast\");\n      }\n      this.state = \"half-open\"; // пауза прошла — пропускаем один пробный вызов\n    }\n    try {\n      const result = await action();\n      this.onSuccess(); // успех (в т.ч. пробный) — зависимость жива\n      return result;\n    } catch (err) {\n      this.onFailure();\n      throw err;\n    }\n  }\n\n  private onSuccess(): void {\n    this.failureCount = 0;\n    this.state = \"closed\"; // возвращаемся к нормальной работе\n  }\n\n  private onFailure(): void {\n    this.failureCount++;\n    // провал пробного вызова или превышен порог ошибок — размыкаем цепь\n    if (this.state === \"half-open\" || this.failureCount >= this.failureThreshold) {\n      this.state = \"open\";\n      this.openedAt = Date.now();\n    }\n  }\n}",
        "en": "type BreakerState = \"closed\" | \"open\" | \"half-open\";\n\nclass CircuitBreaker {\n  private state: BreakerState = \"closed\";\n  private failureCount = 0;\n  private openedAt = 0;\n\n  constructor(\n    private readonly failureThreshold = 5, // consecutive errors before tripping\n    private readonly cooldownMs = 30_000,  // pause before the trial call\n  ) {}\n\n  async call<T>(action: () => Promise<T>): Promise<T> {\n    if (this.state === \"open\") {\n      if (Date.now() - this.openedAt < this.cooldownMs) {\n        // circuit is open — don't touch the dependency, respond at once (fail-fast)\n        throw new Error(\"Circuit is open: failing fast\");\n      }\n      this.state = \"half-open\"; // cooldown elapsed — let one trial call through\n    }\n    try {\n      const result = await action();\n      this.onSuccess(); // success (including the probe) — the dependency is alive\n      return result;\n    } catch (err) {\n      this.onFailure();\n      throw err;\n    }\n  }\n\n  private onSuccess(): void {\n    this.failureCount = 0;\n    this.state = \"closed\"; // back to normal operation\n  }\n\n  private onFailure(): void {\n    this.failureCount++;\n    // a failed probe, or the error threshold exceeded — trip the circuit open\n    if (this.state === \"half-open\" || this.failureCount >= this.failureThreshold) {\n      this.state = \"open\";\n      this.openedAt = Date.now();\n    }\n  }\n}"
      }
    },
    "pros": {
      "ru": [
        "Fail-fast: вызывающий не виснет на таймаутах отказавшей зависимости, освобождая потоки и соединения",
        "Предотвращает каскадные отказы — локальный сбой не растекается по всей системе",
        "Снимает нагрузку с перегруженной зависимости, давая ей шанс восстановиться",
        "Автоматически обнаруживает восстановление через пробные вызовы в Half-open, без ручного вмешательства"
      ],
      "en": [
        "Fail-fast: the caller doesn't hang on a failed dependency's timeouts, freeing threads and connections",
        "Prevents cascading failures — a local fault doesn't spread across the whole system",
        "Takes load off an overloaded dependency, giving it a chance to recover",
        "Detects recovery automatically via the probe calls in Half-open, with no manual intervention"
      ]
    },
    "cons": {
      "ru": [
        "Пока цепь разомкнута, отклоняются и запросы, которые могли бы пройти успешно (ложные срабатывания)",
        "Требует продуманной настройки порога и cooldown: слишком чувствительный breaker размыкается зря, слишком инертный — поздно",
        "Нужен осмысленный fallback или деградация на случай Open, иначе ошибка просто прокидывается наверх",
        "Добавляет состояние и сложность; в многоинстансной среде состояние обычно локально для каждого экземпляра"
      ],
      "en": [
        "While the circuit is open, it also rejects requests that could have succeeded (false positives)",
        "Requires careful tuning of the threshold and cooldown: too sensitive a breaker trips needlessly, too sluggish a one trips too late",
        "Needs a meaningful fallback or degradation for the Open state, otherwise the error is simply propagated upward",
        "Adds state and complexity; in a multi-instance setup the state is usually local to each instance"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Быстрый отказ и защита системы против временного отклонения запросов, которые зависимость уже могла бы обслужить",
        "Чувствительность порога: раннее размыкание бережёт ресурсы, но чаще ошибается; позднее — точнее, но пропускает больше вреда",
        "Простой fail-fast против более сложной, но отзывчивой стратегии с fallback или кэшем на время Open"
      ],
      "en": [
        "Fast failure and system protection versus temporarily rejecting requests the dependency might already be able to serve",
        "Threshold sensitivity: tripping early conserves resources but errs more often; tripping late is more accurate but lets through more harm",
        "A simple fail-fast versus a more complex but responsive strategy with a fallback or cache during the Open state"
      ]
    },
    "whenToUse": {
      "ru": [
        "Синхронные вызовы по сети к внешним сервисам или ресурсам, которые могут деградировать или зависать",
        "Отказ зависимости грозит исчерпать потоки/соединения вызывающего и вызвать каскад",
        "Есть разумная реакция на Open: fallback, кэш, деградация или быстрая понятная ошибка",
        "В связке с таймаутами, retry и Bulkhead как часть общей стратегии устойчивости"
      ],
      "en": [
        "Synchronous network calls to external services or resources that can degrade or hang",
        "A dependency's failure threatens to exhaust the caller's threads/connections and trigger a cascade",
        "There is a sensible response to Open: a fallback, cache, degradation, or a fast, clear error",
        "Alongside timeouts, retries, and the Bulkhead pattern as part of an overall resilience strategy"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Локальные, быстрые и детерминированные вызовы внутри процесса — защищать по сути нечего",
        "Единичные транзиентные сбои лучше лечит простой retry с backoff, а не размыкание всей цепи",
        "Пакетная или асинхронная обработка, где вызывающий может подождать и повтор не держит дефицитные ресурсы"
      ],
      "en": [
        "Local, fast, deterministic in-process calls — there is essentially nothing to protect",
        "One-off transient failures are better handled by a simple retry with backoff than by tripping the whole circuit",
        "Batch or asynchronous processing where the caller can wait and a retry doesn't tie up scarce resources"
      ]
    },
    "related": [
      "bulkhead",
      "microservices",
      "api-gateway"
    ],
    "tags": [
      "микросервисы",
      "устойчивость",
      "resilience",
      "fault tolerance"
    ],
    "diagram": "stateDiagram-v2\n    [*] --> Closed\n    Closed --> Open: failures reach threshold\n    Open --> HalfOpen: cooldown elapsed\n    HalfOpen --> Closed: probe succeeds\n    HalfOpen --> Open: probe fails\n    Closed --> Closed: call succeeds"
  },
  {
    "id": "bulkhead",
    "name": "Bulkhead",
    "category": "microservices",
    "grade": "senior",
    "aka": [
      "Bulkhead Isolation",
      "Resource Isolation"
    ],
    "tags": [
      "устойчивость",
      "resilience",
      "изоляция ресурсов",
      "отказоустойчивость"
    ],
    "tagline": {
      "ru": "Изолируй ресурсы в отдельные пулы, чтобы отказ одной части не потопил всю систему",
      "en": "Isolate resources into separate pools so a failure in one part can't sink the whole system"
    },
    "definition": {
      "ru": "Паттерн отказоустойчивости, при котором ресурсы (пулы соединений, потоки, память, инстансы) делятся на изолированные пулы — по одному на зависимость или класс нагрузки. Перегрузка или отказ в одном пуле не может исчерпать ресурсы остальных, поэтому сбой локализуется, а не топит весь сервис. Название и идея взяты из книги Michael Nygard «Release It!» по аналогии с водонепроницаемыми переборками (bulkheads) корпуса корабля.",
      "en": "A fault-tolerance pattern in which resources (connection pools, threads, memory, instances) are split into isolated pools — one per dependency or per class of load. An overload or failure in one pool cannot exhaust the resources of the others, so a fault stays localized instead of sinking the whole service. The name and idea come from Michael Nygard's «Release It!», by analogy with the watertight bulkheads of a ship's hull."
    },
    "problem": {
      "ru": "Когда все вызовы делят один общий пул ресурсов (например, единый пул потоков или соединений), одна медленная или отказавшая зависимость постепенно занимает все слоты: потоки блокируются в ожидании ответа, пул исчерпывается, и запросы даже к полностью здоровым зависимостям начинают падать. Локальная деградация превращается в каскадный отказ всего сервиса (resource exhaustion).",
      "en": "When every call shares one common resource pool (for example, a single thread or connection pool), one slow or failed dependency gradually takes up all the slots: threads block waiting for a response, the pool runs dry, and requests even to perfectly healthy dependencies start to fail. A local degradation turns into a cascading failure of the entire service (resource exhaustion)."
    },
    "solution": {
      "ru": "Разделяем ресурсы на отдельные пулы и назначаем каждой зависимости (или классу нагрузки) собственную квоту. Вызовы к одной зависимости берут слоты только из её пула, поэтому её насыщение не затрагивает остальные. Когда пул заполнен, лишние вызовы быстро отклоняются (fail fast), а не копятся в бесконечной очереди. Так сбой остаётся запертым в своём «отсеке», а сервис сохраняет частичную работоспособность.",
      "en": "Split resources into separate pools and give each dependency (or class of load) its own quota. Calls to one dependency draw slots only from its pool, so its saturation does not touch the others. When a pool is full, extra calls are rejected fast (fail fast) instead of piling up in an unbounded queue. That way the fault stays locked inside its own «compartment», and the service keeps functioning partially."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Bulkhead ограничивает число одновременных вызовов к одной зависимости её квотой.\n// Насыщение одной зависимости не может занять слоты, зарезервированные под другие.\nclass Bulkhead {\n  private inFlight = 0;\n  constructor(\n    private readonly name: string,\n    private readonly maxConcurrent: number,\n  ) {}\n\n  async run<T>(task: () => Promise<T>): Promise<T> {\n    if (this.inFlight >= this.maxConcurrent) {\n      throw new Error(`Bulkhead \"${this.name}\" переполнен`); // fail fast, а не бесконечная очередь\n    }\n    this.inFlight++;\n    try {\n      return await task();\n    } finally {\n      this.inFlight--; // слот всегда освобождается\n    }\n  }\n}\n\n// Каждая зависимость получает СВОЙ пул — отдельный отсек.\nconst paymentsPool = new Bulkhead('payments', 10);\nconst reportsPool = new Bulkhead('reports', 3); // медленно, низкий приоритет — малая квота\n\nasync function chargeUser(charge: () => Promise<string>) {\n  // Наплыв медленных вызовов отчётов насыщает только reportsPool;\n  // payments сохраняет свои 10 слотов и остаётся отзывчивым.\n  return paymentsPool.run(charge);\n}",
        "en": "// A Bulkhead caps the number of concurrent calls to one dependency at its quota.\n// Saturating one dependency cannot consume the slots reserved for the others.\nclass Bulkhead {\n  private inFlight = 0;\n  constructor(\n    private readonly name: string,\n    private readonly maxConcurrent: number,\n  ) {}\n\n  async run<T>(task: () => Promise<T>): Promise<T> {\n    if (this.inFlight >= this.maxConcurrent) {\n      throw new Error(`Bulkhead \"${this.name}\" is full`); // fail fast, not an unbounded queue\n    }\n    this.inFlight++;\n    try {\n      return await task();\n    } finally {\n      this.inFlight--; // the slot is always released\n    }\n  }\n}\n\n// Each dependency gets its OWN pool — a separate compartment.\nconst paymentsPool = new Bulkhead('payments', 10);\nconst reportsPool = new Bulkhead('reports', 3); // slow, low priority — a small quota\n\nasync function chargeUser(charge: () => Promise<string>) {\n  // A flood of slow report calls saturates reportsPool only;\n  // payments keeps its 10 slots and stays responsive.\n  return paymentsPool.run(charge);\n}"
      }
    },
    "pros": {
      "ru": [
        "Локализует сбой: перегруженная или отказавшая зависимость не исчерпывает ресурсы остальных",
        "Предотвращает каскадные отказы из-за resource exhaustion — сервис остаётся частично работоспособным",
        "Позволяет приоритизировать нагрузку: критичным зависимостям — больший пул, второстепенным — меньший",
        "Ограничивает радиус поражения (blast radius) и даёт предсказуемое поведение под нагрузкой"
      ],
      "en": [
        "Localizes a fault: an overloaded or failed dependency does not exhaust the resources of the others",
        "Prevents cascading failures from resource exhaustion — the service stays partially operational",
        "Lets you prioritize load: a larger pool for critical dependencies, a smaller one for secondary ones",
        "Limits the blast radius and gives predictable behavior under load"
      ]
    },
    "cons": {
      "ru": [
        "Ресурсы делятся заранее и жёстко: суммарная утилизация ниже, чем у одного общего пула — простаивающие слоты одного пула не помогают другому",
        "Нужно подобрать и сопровождать размеры пулов: заниженные душат пропускную способность, завышенные не изолируют",
        "Больше пулов — больше накладных расходов на потоки/соединения и сложнее конфигурация и мониторинг",
        "Изоляция отдельными потоками добавляет издержки на переключение контекста и передачу задач между потоками"
      ],
      "en": [
        "Resources are partitioned up front and rigidly: overall utilization is lower than with one shared pool — idle slots in one pool don't help another",
        "You must tune and maintain the pool sizes: too small throttles throughput, too large fails to isolate",
        "More pools means more thread/connection overhead and more complex configuration and monitoring",
        "Isolation via dedicated threads adds context-switching cost and the overhead of handing tasks between threads"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Изоляция и устойчивость против общей утилизации: выделенные квоты защищают, но простаивают, когда зависимость молчит",
        "Тонкая настройка размеров пулов против простоты единого общего пула",
        "Строгая изоляция отдельными потоками против дешёвой изоляции семафором — та не создаёт лишних потоков, но не защищает от блокирующих вызовов"
      ],
      "en": [
        "Isolation and resilience versus overall utilization: dedicated quotas protect you but sit idle when a dependency is quiet",
        "Careful tuning of pool sizes versus the simplicity of a single shared pool",
        "Strict isolation with dedicated threads versus cheap semaphore isolation — the latter spawns no extra threads but does not protect against blocking calls"
      ]
    },
    "whenToUse": {
      "ru": [
        "Сервис зависит от нескольких внешних систем с разными характеристиками надёжности и латентности",
        "Есть медленные или ненадёжные зависимости, способные занять все потоки/соединения общего пула",
        "Нужно гарантировать ресурсы критичным операциям независимо от нагрузки на второстепенные",
        "Многопользовательская система, где нагрузка одного клиента (tenant) не должна влиять на остальных"
      ],
      "en": [
        "A service depends on several external systems with different reliability and latency characteristics",
        "There are slow or unreliable dependencies that could grab all threads/connections of a shared pool",
        "You need to guarantee resources for critical operations regardless of the load on secondary ones",
        "A multi-tenant system where one tenant's load must not affect the others"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Одна-единственная зависимость и однородная нагрузка — делить нечего, общий пул проще",
        "Ресурсы крайне ограничены: дробление на мелкие пулы снижает и без того низкую пропускную способность",
        "Издержки изоляции (потоки, латентность) критичнее, чем риск каскадного отказа"
      ],
      "en": [
        "A single dependency and homogeneous load — there is nothing to partition, a shared pool is simpler",
        "Resources are extremely scarce: splitting into small pools lowers already-low throughput further",
        "The overhead of isolation (threads, latency) matters more than the risk of a cascading failure"
      ]
    },
    "related": [
      "circuit-breaker",
      "microservices"
    ],
    "diagram": "flowchart TD\n  C[Client requests] --> R{Router}\n  R --> PA[Pool A: 10 slots]\n  R --> PB[Pool B: 3 slots]\n  R --> PC[Pool C: 5 slots]\n  PA --> SA[Service A]\n  PB --> SB[Service B - slow]\n  PC --> SC[Service C]"
  },
  {
    "id": "sidecar",
    "name": "Sidecar",
    "category": "microservices",
    "grade": "senior",
    "aka": [
      "Sidecar Pattern",
      "Sidekick Pattern"
    ],
    "tagline": {
      "ru": "Вспомогательный процесс разворачивается рядом с основным сервисом и берёт на себя сквозные задачи",
      "en": "A helper process deployed alongside the main service that takes over cross-cutting concerns"
    },
    "definition": {
      "ru": "Паттерн, при котором сквозные задачи (проксирование трафика, TLS/mTLS, повторные попытки, телеметрия, конфигурация) выносятся в отдельный процесс — sidecar, — который разворачивается в одной единице с основным сервисом (в том же поде/хосте) и делит с ним жизненный цикл и сетевое пространство. Приложение общается с sidecar через localhost и ничего не знает о деталях этих задач. Sidecar — это общий паттерн (любой co-located помощник); его каноническая разновидность — sidecar proxy, из которого складывается service mesh.",
      "en": "A pattern in which cross-cutting concerns (traffic proxying, TLS/mTLS, retries, telemetry, configuration) are moved into a separate process — the sidecar — that is deployed in the same unit as the main service (the same pod/host) and shares its lifecycle and network namespace. The application talks to the sidecar over localhost and knows nothing about the details of those concerns. Sidecar is the general pattern (any co-located helper); its canonical instance is the sidecar proxy, which composes into a service mesh."
    },
    "problem": {
      "ru": "Сквозная функциональность — mTLS, повторные попытки, circuit breaking, трассировка, сбор метрик — нужна каждому сервису одинаково. Если встраивать её библиотекой в код приложения, она размазывается по всему парку сервисов: в полиглотной системе её приходится переписывать под каждый язык, версии расходятся, а исправление уязвимости в TLS требует пересборки и передеплоя десятков сервисов. Основной код при этом смешивает бизнес-логику с инфраструктурными заботами.",
      "en": "Cross-cutting functionality — mTLS, retries, circuit breaking, tracing, metrics collection — is needed by every service in the same way. Embedding it as a library in the application code spreads it across the whole fleet: in a polyglot system it has to be rewritten per language, versions drift, and patching a TLS vulnerability means rebuilding and redeploying dozens of services. Meanwhile the core code mixes business logic with infrastructure concerns."
    },
    "solution": {
      "ru": "Сквозные задачи выносятся в отдельный процесс — sidecar, — который разворачивается вместе с основным сервисом в одной единице деплоя и делит с ним сеть и жизненный цикл. В варианте sidecar-прокси весь входящий и исходящий трафик приложения идёт через sidecar по localhost; sidecar добавляет TLS, повторы, метрики и трассировку прозрачно для приложения. Так инфраструктурная логика становится независимой от языка сервиса, обновляется отдельно от него, а централизованное управление парком sidecar-прокси образует service mesh (например, Istio: data plane из прокси Envoy + control plane istiod).",
      "en": "Cross-cutting concerns are moved into a separate process — the sidecar — deployed together with the main service in a single deployment unit, sharing its network and lifecycle. In the sidecar-proxy variant, all of the application's inbound and outbound traffic goes through the sidecar over localhost; the sidecar adds TLS, retries, metrics, and tracing transparently to the application. This makes the infrastructure logic independent of the service's language, upgradable separately from it, and centrally managing the fleet of sidecar proxies forms a service mesh (e.g., Istio: a data plane of Envoy proxies + the istiod control plane)."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Сквозные задачи живут в sidecar, а НЕ в приложении.\ninterface HttpRequest { url: string; body: string; }\ninterface HttpResponse { status: number; body: string; }\n\n// Sidecar: отдельный процесс, развёрнутый в том же поде.\n// Перехватывает исходящий трафик и добавляет TLS, повторы, телеметрию.\nclass SidecarProxy {\n  private calls = 0; // счётчик телеметрии\n  constructor(private transport: (r: HttpRequest) => HttpResponse) {}\n\n  forward(req: HttpRequest): HttpResponse {\n    this.calls++;                                            // телеметрия\n    const secure = { ...req, url: req.url.replace('http://', 'https://') }; // исходящий TLS к upstream\n    for (let attempt = 1; attempt <= 3; attempt++) {          // политика повторов\n      const res = this.transport(secure);\n      if (res.status < 500) return res;\n    }\n    return { status: 503, body: 'upstream unavailable' };\n  }\n\n  metrics() { return { outboundCalls: this.calls }; }\n}\n\n// Приложение: только бизнес-логика, общается лишь с localhost.\n// О TLS, повторах и метриках ничего не знает.\nclass OrderService {\n  constructor(private sidecar: SidecarProxy) {}\n  placeOrder(id: string): HttpResponse {\n    // отправляем соседнему сервису через локальный sidecar\n    return this.sidecar.forward({ url: 'http://payments/charge', body: id });\n  }\n}\n\nconst sidecar = new SidecarProxy((r) => ({ status: 200, body: `ok:${r.url}` }));\nconst app = new OrderService(sidecar);\napp.placeOrder('order-42');",
        "en": "// Cross-cutting concerns live in the sidecar, NOT in the application.\ninterface HttpRequest { url: string; body: string; }\ninterface HttpResponse { status: number; body: string; }\n\n// Sidecar: a separate process deployed in the same pod.\n// It intercepts outbound traffic and adds TLS, retries, telemetry.\nclass SidecarProxy {\n  private calls = 0; // telemetry counter\n  constructor(private transport: (r: HttpRequest) => HttpResponse) {}\n\n  forward(req: HttpRequest): HttpResponse {\n    this.calls++;                                            // telemetry\n    const secure = { ...req, url: req.url.replace('http://', 'https://') }; // TLS origination to upstream\n    for (let attempt = 1; attempt <= 3; attempt++) {          // retry policy\n      const res = this.transport(secure);\n      if (res.status < 500) return res;\n    }\n    return { status: 503, body: 'upstream unavailable' };\n  }\n\n  metrics() { return { outboundCalls: this.calls }; }\n}\n\n// Application: business logic only, talks solely to localhost.\n// It knows nothing about TLS, retries or metrics.\nclass OrderService {\n  constructor(private sidecar: SidecarProxy) {}\n  placeOrder(id: string): HttpResponse {\n    // send to a peer service through the local sidecar\n    return this.sidecar.forward({ url: 'http://payments/charge', body: id });\n  }\n}\n\nconst sidecar = new SidecarProxy((r) => ({ status: 200, body: `ok:${r.url}` }));\nconst app = new OrderService(sidecar);\napp.placeOrder('order-42');"
      }
    },
    "pros": {
      "ru": [
        "Сквозные задачи (TLS, повторы, телеметрия) отделены от кода приложения — сервис занят только бизнес-логикой",
        "Независимость от языка: полиглотные сервисы используют один и тот же sidecar, не нужна библиотека под каждый рантайм",
        "Независимый жизненный цикл: sidecar можно обновить (например, закрыть уязвимость в TLS) без пересборки и передеплоя приложения",
        "Изоляция сбоев и ресурсов: sidecar — отдельный процесс, его падение или потребление памяти не портит адресное пространство приложения",
        "Основа service mesh: единая политика (mTLS, маршрутизация, наблюдаемость) на весь парк через control plane"
      ],
      "en": [
        "Cross-cutting concerns (TLS, retries, telemetry) are separated from the application code — the service focuses only on business logic",
        "Language independence: polyglot services reuse the same sidecar, with no per-runtime library needed",
        "Independent lifecycle: the sidecar can be upgraded (e.g., patching a TLS vulnerability) without rebuilding and redeploying the application",
        "Fault and resource isolation: the sidecar is a separate process, so its crash or memory usage doesn't corrupt the application's address space",
        "Foundation of a service mesh: a uniform policy (mTLS, routing, observability) across the whole fleet via a control plane"
      ]
    },
    "cons": {
      "ru": [
        "Лишний процесс на каждый экземпляр — накладные расходы по памяти и CPU, умноженные на весь парк сервисов",
        "Дополнительный сетевой хоп (приложение → sidecar → сеть) увеличивает задержку",
        "Операционная сложность: больше контейнеров для деплоя, версионирования и мониторинга; сложнее отлаживать локально",
        "Связанность жизненных циклов и порядка запуска: приложение может стартовать раньше готовности sidecar (гонки), возникают проблемы при завершении"
      ],
      "en": [
        "An extra process per instance — memory and CPU overhead multiplied across the whole fleet",
        "An added network hop (application → sidecar → network) increases latency",
        "Operational complexity: more containers to deploy, version, and monitor; harder to debug locally",
        "Coupling of lifecycles and startup order: the application may start before the sidecar is ready (races), and shutdown ordering becomes tricky"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Отделение сквозной логики и переиспользование в полиглоте против расхода ресурсов на экземпляр и лишнего локального хопа",
        "Единая, централизованно управляемая политика (service mesh) против возросшей операционной и деплойной сложности",
        "Независимое обновление sidecar против более тесной связанности по жизненному циклу и порядку запуска двух co-located процессов",
        "Отдельный процесс (изоляция, независимость от языка) против встроенной библиотеки (меньше накладных расходов и без хопа, но привязка к языку и жизненному циклу приложения)"
      ],
      "en": [
        "Separating cross-cutting logic and reusing it across polyglot services versus per-instance resource cost and an extra local hop",
        "A uniform, centrally managed policy (service mesh) versus increased operational and deployment complexity",
        "Independent sidecar upgrades versus tighter lifecycle and startup-order coupling between two co-located processes",
        "A separate process (isolation, language independence) versus an in-process library (less overhead and no hop, but tied to the language and lifecycle of the application)"
      ]
    },
    "whenToUse": {
      "ru": [
        "Нужна единообразная сквозная функциональность (mTLS, повторы, circuit breaking, трассировка) в полиглотном парке сервисов",
        "Внедряется service mesh (Istio, Linkerd) с control plane, управляющим трафиком и политиками",
        "Требуется добавить возможности к легаси- или стороннему сервису, код которого нельзя менять",
        "Сквозную логику нужно обновлять независимо от множества использующих её сервисов"
      ],
      "en": [
        "You need consistent cross-cutting functionality (mTLS, retries, circuit breaking, tracing) across a polyglot fleet of services",
        "You are adopting a service mesh (Istio, Linkerd) with a control plane governing traffic and policy",
        "You need to add capabilities to a legacy or third-party service whose code you can't change",
        "Cross-cutting logic must be upgraded independently of the many services that use it"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Один сервис или небольшая однородная система, где встроенная библиотека проще и дешевле",
        "Нагрузки, критичные к задержке или ресурсам, где лишний хоп и расход на каждый под не окупаются",
        "Операционная сложность mesh перевешивает потребность в сквозных задачах"
      ],
      "en": [
        "A single service or a small homogeneous system where an in-process library is simpler and cheaper",
        "Latency- or resource-critical workloads where the extra hop and per-pod overhead don't pay off",
        "The operational complexity of a mesh outweighs the need for cross-cutting concerns"
      ]
    },
    "related": [
      "microservices",
      "proxy",
      "circuit-breaker"
    ],
    "tags": [
      "микросервисы",
      "service mesh",
      "sidecar",
      "istio"
    ],
    "diagram": "flowchart LR\n  subgraph Pod\n    direction LR\n    App[Application Container]\n    Sidecar[Sidecar Proxy Container]\n    App <-->|localhost| Sidecar\n  end\n  Sidecar <-->|mTLS| Mesh[Other Services]"
  },
  {
    "id": "saga",
    "name": "Saga",
    "category": "microservices",
    "grade": "senior",
    "aka": [
      "Saga Pattern"
    ],
    "tagline": {
      "ru": "Распределённая транзакция как цепочка локальных транзакций, каждая с компенсирующим действием на случай отказа",
      "en": "A distributed transaction as a chain of local transactions, each with a compensating action for failure"
    },
    "definition": {
      "ru": "Паттерн управления данными, при котором распределённая бизнес-транзакция моделируется как последовательность локальных транзакций: каждый сервис выполняет свою локальную транзакцию в собственной БД и публикует событие или сообщение, запускающее следующий шаг. Если какой-то шаг завершается неудачей, Saga выполняет компенсирующие транзакции, семантически отменяющие уже зафиксированные шаги в обратном порядке (Garcia-Molina & Salem; Chris Richardson).",
      "en": "A data-management pattern in which a distributed business transaction is modeled as a sequence of local transactions: each service performs its own local transaction in its own database and publishes an event or message that triggers the next step. If a step fails, the Saga runs compensating transactions that semantically undo the already-committed steps in reverse order (Garcia-Molina & Salem; Chris Richardson)."
    },
    "problem": {
      "ru": "В микросервисах бизнес-операция часто затрагивает несколько сервисов, у каждого — своя база данных (database-per-service). Классическая ACID-транзакция здесь невозможна: единого менеджера транзакций нет, а распределённый two-phase commit (2PC) держит блокировки на всех участниках до конца операции, что убивает доступность и масштабируемость и плохо переживает частичные отказы. Как сохранить согласованность данных между сервисами без глобальной транзакции?",
      "en": "In microservices a business operation often spans several services, each with its own database (database-per-service). A classic ACID transaction is impossible here: there is no single transaction manager, and distributed two-phase commit (2PC) holds locks on every participant until the operation completes, which kills availability and scalability and copes poorly with partial failures. How do you keep data consistent across services without a global transaction?"
    },
    "solution": {
      "ru": "Разбить операцию на цепочку локальных транзакций. Каждый сервис фиксирует свою локальную транзакцию и триггерит следующий шаг. Для каждого шага заранее определяется компенсирующая транзакция — отдельная локальная транзакция, семантически отменяющая его эффект (не откат БД, а обратное действие: возврат платежа, отмена брони). При отказе на шаге N уже выполненные шаги компенсируются в обратном порядке. Координация возможна двумя способами: orchestration (центральный оркестратор командует шагами и хранит состояние саги) и choreography (сервисы реагируют на события друг друга без центрального координатора). Цена — eventual consistency и отсутствие изоляции вместо ACID.",
      "en": "Break the operation into a chain of local transactions. Each service commits its own local transaction and triggers the next step. For each step you predefine a compensating transaction — a separate local transaction that semantically undoes its effect (not a database rollback, but a reverse action: refund a payment, cancel a reservation). If step N fails, the already-completed steps are compensated in reverse order. Coordination comes in two flavors: orchestration (a central orchestrator commands the steps and holds the saga's state) and choreography (services react to one another's events with no central coordinator). The price is eventual consistency and a loss of isolation instead of ACID."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Saga: распределённая транзакция как цепочка локальных транзакций,\n// у каждой — компенсирующее действие, отменяющее её при сбое.\n\ninterface SagaStep {\n  name: string;\n  action: () => Promise<void>;      // локальная транзакция в каком-то сервисе\n  compensate: () => Promise<void>; // семантически отменяет эту локальную транзакцию\n}\n\n// Orchestration: центральный координатор ведёт шаги по порядку.\nclass SagaOrchestrator {\n  constructor(private readonly steps: SagaStep[]) {}\n\n  async run(): Promise<void> {\n    const done: SagaStep[] = [];\n    try {\n      for (const step of this.steps) {\n        await step.action(); // локальная транзакция зафиксирована и уже видна\n        done.push(step);\n      }\n    } catch (err) {\n      // Глобального отката между сервисами нет (нет 2PC),\n      // поэтому отменяем зафиксированные шаги в обратном порядке.\n      for (const step of done.reverse()) {\n        await step.compensate();\n      }\n      throw err;\n    }\n  }\n}\n\n// Каждый шаг живёт в своём сервисе и фиксирует свою локальную транзакцию.\nconst checkout = new SagaOrchestrator([\n  { name: 'reserve-stock', action: async () => {}, compensate: async () => {} }, // Inventory\n  { name: 'charge-card',   action: async () => {}, compensate: async () => {} }, // Payment\n  { name: 'ship-order',    action: async () => {}, compensate: async () => {} }, // Shipping\n]);",
        "en": "// Saga: a distributed transaction as a chain of local transactions,\n// each paired with a compensating action that undoes it on failure.\n\ninterface SagaStep {\n  name: string;\n  action: () => Promise<void>;      // one local transaction in some service\n  compensate: () => Promise<void>; // semantically undoes that local transaction\n}\n\n// Orchestration: a central coordinator drives the steps in order.\nclass SagaOrchestrator {\n  constructor(private readonly steps: SagaStep[]) {}\n\n  async run(): Promise<void> {\n    const done: SagaStep[] = [];\n    try {\n      for (const step of this.steps) {\n        await step.action(); // local tx committed and already visible\n        done.push(step);\n      }\n    } catch (err) {\n      // There is no global rollback across services (no 2PC),\n      // so undo the committed steps in reverse order.\n      for (const step of done.reverse()) {\n        await step.compensate();\n      }\n      throw err;\n    }\n  }\n}\n\n// Each step lives in a different service and commits its own local transaction.\nconst checkout = new SagaOrchestrator([\n  { name: 'reserve-stock', action: async () => {}, compensate: async () => {} }, // Inventory\n  { name: 'charge-card',   action: async () => {}, compensate: async () => {} }, // Payment\n  { name: 'ship-order',    action: async () => {}, compensate: async () => {} }, // Shipping\n]);"
      }
    },
    "pros": {
      "ru": [
        "Сохраняет автономию сервисов: каждый шаг — локальная ACID-транзакция в своей БД, без распределённых блокировок",
        "Выше доступность и масштабируемость, чем у 2PC: нет координатора, удерживающего блокировки на всех участниках",
        "Путь отказа явный: компенсирующие действия делают откат первоклассной, тестируемой частью дизайна",
        "Хорошо ложится на асинхронный обмен сообщениями и переживает частичные отказы и временную недоступность участников"
      ],
      "en": [
        "Preserves service autonomy: each step is a local ACID transaction in its own database, with no distributed locks",
        "Higher availability and scalability than 2PC: no coordinator holding locks across all participants",
        "The failure path is explicit: compensating actions make rollback a first-class, testable part of the design",
        "Fits asynchronous messaging well and survives partial failures and temporary unavailability of participants"
      ]
    },
    "cons": {
      "ru": [
        "Нет изоляции: промежуточные состояния видны другим (Saga даёт ACD, а не ACID) — нужны контрмеры вроде semantic lock",
        "Компенсации трудно проектировать: они должны быть идемпотентными и практически всегда успешными, а некоторые эффекты необратимы",
        "Растёт сложность: приходится продумывать каждую точку отказа и её откат, плюс жить с eventual consistency",
        "Choreography размазывает общий сценарий по многим сервисам — сагу тяжело понять и отлаживать целиком"
      ],
      "en": [
        "No isolation: intermediate states are visible to others (Saga gives ACD, not ACID) — needs countermeasures such as semantic locks",
        "Compensations are hard to design: they must be idempotent and virtually always succeed, and some effects are irreversible",
        "Complexity grows: you must reason about every failure point and its rollback, and live with eventual consistency",
        "Choreography scatters the overall flow across many services, making the saga hard to understand and debug end to end"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Доступность и автономия (локальные транзакции) против потери изоляции и ACID-гарантий",
        "Orchestration (ясный центральный поток, но точка связности и потенциальное узкое место) против choreography (слабая связанность, но поток размазан по сервисам)",
        "Простота одной ACID-транзакции против явной логики компенсации для каждого шага",
        "Немедленная согласованность против eventual consistency с видимыми промежуточными состояниями"
      ],
      "en": [
        "Availability and autonomy (local transactions) versus the loss of isolation and ACID guarantees",
        "Orchestration (a clear central flow, but a coupling point and potential bottleneck) versus choreography (loose coupling, but a flow scattered across services)",
        "The simplicity of a single ACID transaction versus explicit compensation logic for every step",
        "Immediate consistency versus eventual consistency with visible intermediate states"
      ]
    },
    "whenToUse": {
      "ru": [
        "Бизнес-транзакция охватывает несколько сервисов, у каждого своя база (database-per-service)",
        "Нужно сохранить согласованность данных без распределённого 2PC и без потери доступности",
        "Долгоживущие процессы, где удерживать блокировки на всё время операции недопустимо",
        "У каждого шага есть осмысленное компенсирующее действие (возврат средств, отмена, освобождение брони)"
      ],
      "en": [
        "A business transaction spans several services, each with its own database (database-per-service)",
        "You need to keep data consistent without distributed 2PC and without sacrificing availability",
        "Long-lived processes where holding locks for the whole duration is unacceptable",
        "Every step has a meaningful compensating action (a refund, a cancellation, releasing a reservation)"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Все данные лежат в одной БД — обычная локальная ACID-транзакция проще и надёжнее",
        "У шагов есть эффекты, которые невозможно компенсировать (необратимые внешние действия), и контрмеры неприемлемы",
        "Команда не может допустить видимых промежуточных/несогласованных состояний и не готова добавлять semantic lock"
      ],
      "en": [
        "All the data lives in a single database — a plain local ACID transaction is simpler and stronger",
        "Steps have effects that cannot be compensated (irreversible external actions) and no countermeasure is acceptable",
        "The team cannot tolerate visible intermediate/inconsistent states and is not willing to add semantic locks"
      ]
    },
    "related": [
      "microservices",
      "event-driven",
      "database-per-service",
      "cqrs"
    ],
    "tags": [
      "распределённые транзакции",
      "eventual consistency",
      "согласованность данных"
    ],
    "diagram": "sequenceDiagram\n    participant O as Orchestrator\n    participant Order as Order Service\n    participant Payment as Payment Service\n    participant Inventory as Inventory Service\n    O->>Order: Create order (local tx)\n    Order-->>O: Order created\n    O->>Payment: Charge payment (local tx)\n    Payment-->>O: Payment captured\n    O->>Inventory: Reserve stock (local tx)\n    Inventory-->>O: Out of stock (failure)\n    Note over O,Inventory: Failure triggers compensation\n    O->>Payment: Refund payment (compensating tx)\n    Payment-->>O: Payment refunded\n    O->>Order: Cancel order (compensating tx)\n    Order-->>O: Order cancelled"
  },
  {
    "id": "cqrs",
    "name": "CQRS",
    "aka": [
      "Command Query Responsibility Segregation"
    ],
    "category": "microservices",
    "grade": "senior",
    "tagline": {
      "ru": "Разделение модели записи и модели чтения, чтобы оптимизировать каждую независимо",
      "en": "Separating the write model from the read model so each is optimised independently"
    },
    "definition": {
      "ru": "Command Query Responsibility Segregation — паттерн, разделяющий операции изменения состояния (commands) и операции чтения (queries) на две независимые модели. Модель записи обеспечивает инварианты домена (часто в нормализованном виде, хотя CQRS этого не требует), а модель чтения содержит денормализованные представления (projections), заточенные под конкретные запросы. Обе модели могут использовать разные схемы и даже разные хранилища и синхронизируются, чаще всего асинхронно. Термин ввёл Greg Young, развивая принцип Command-Query Separation Бертрана Мейера; паттерн подробно описан у Martin Fowler.",
      "en": "Command Query Responsibility Segregation is a pattern that splits state-changing operations (commands) and read operations (queries) into two independent models. The write model enforces domain invariants (often over normalised state, though CQRS does not require it), while the read model holds denormalised projections tailored to specific queries. The two models may use different schemas and even different data stores, and they are kept in sync, usually asynchronously. The term was coined by Greg Young, extending Bertrand Meyer's Command-Query Separation principle; the pattern is documented in detail by Martin Fowler."
    },
    "problem": {
      "ru": "Единая модель, обслуживающая и запись, и чтение, вынуждена идти на компромиссы. Нормализованная схема с инвариантами удобна для записи, но требует дорогих JOIN-ов и агрегаций на чтении; денормализация ради быстрых запросов усложняет согласованные изменения. Нагрузки на чтение и запись обычно различаются на порядки и растут по-разному, но их нельзя масштабировать по отдельности. В сложном домене одна и та же модель обрастает и командной логикой, и десятками сценариев чтения, становясь узким местом и по производительности, и по сопровождению.",
      "en": "A single model serving both writes and reads is forced into compromises. A normalised schema with invariants is convenient for writing but demands expensive JOINs and aggregations for reading; denormalising for fast queries makes consistent changes harder. Read and write loads usually differ by orders of magnitude and grow differently, yet cannot be scaled separately. In a complex domain the same model accumulates both command logic and dozens of read scenarios, becoming a bottleneck for both performance and maintainability."
    },
    "solution": {
      "ru": "Разводим ответственность на две модели. Командная сторона принимает commands, проверяет инварианты и меняет состояние, ничего не возвращая, кроме подтверждения. Читающая сторона обслуживает queries из отдельных projections, оптимизированных под запросы (плоские представления, материализованные view, специализированные хранилища). Изменения из модели записи распространяются в модель чтения — синхронно в простом случае или асинхронно через события, что даёт eventual consistency между сторонами. Каждую сторону можно проектировать, разворачивать и масштабировать независимо.",
      "en": "Split the responsibility into two models. The command side accepts commands, checks invariants, and changes state, returning nothing but an acknowledgement. The read side serves queries from separate projections optimised for reads (flat views, materialised views, purpose-built stores). Changes from the write model propagate to the read model — synchronously in the simple case, or asynchronously via events, which yields eventual consistency between the sides. Each side can be designed, deployed, and scaled independently."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Command: выражает намерение изменить состояние, данных не возвращает\ninterface PlaceOrder { orderId: string; total: number }\n\n// Модель чтения: денормализована, заточена под запросы\ninterface OrderSummary { orderId: string; total: number; status: string }\n\n// Сторона записи: проверяет инварианты, меняет состояние, затем проецирует в модель чтения\nclass OrderCommandHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  place(cmd: PlaceOrder): void {\n    // ...проверить инварианты, сохранить в хранилище записи...\n    this.readModel.set(cmd.orderId, {\n      orderId: cmd.orderId,\n      total: cmd.total,\n      status: 'placed',\n    });\n  }\n}\n\n// Сторона чтения: возвращает данные и никогда не меняет состояние\nclass OrderQueryHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  byId(orderId: string): OrderSummary | undefined {\n    return this.readModel.get(orderId);\n  }\n}\n\n// Одни данные, две модели — оптимизируются и масштабируются независимо\nconst readModel = new Map<string, OrderSummary>();\nconst commands = new OrderCommandHandler(readModel);\nconst queries = new OrderQueryHandler(readModel);\ncommands.place({ orderId: 'o-1', total: 100 });\nqueries.byId('o-1'); // { orderId: 'o-1', total: 100, status: 'placed' }",
        "en": "// Command: expresses intent to change state, returns no data\ninterface PlaceOrder { orderId: string; total: number }\n\n// Read model: denormalised, shaped for queries\ninterface OrderSummary { orderId: string; total: number; status: string }\n\n// Write side: enforces invariants, mutates state, then projects into the read model\nclass OrderCommandHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  place(cmd: PlaceOrder): void {\n    // ...enforce invariants, persist to the write store...\n    this.readModel.set(cmd.orderId, {\n      orderId: cmd.orderId,\n      total: cmd.total,\n      status: 'placed',\n    });\n  }\n}\n\n// Read side: returns data and never mutates state\nclass OrderQueryHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  byId(orderId: string): OrderSummary | undefined {\n    return this.readModel.get(orderId);\n  }\n}\n\n// One dataset, two models — optimised and scaled independently\nconst readModel = new Map<string, OrderSummary>();\nconst commands = new OrderCommandHandler(readModel);\nconst queries = new OrderQueryHandler(readModel);\ncommands.place({ orderId: 'o-1', total: 100 });\nqueries.byId('o-1'); // { orderId: 'o-1', total: 100, status: 'placed' }"
      }
    },
    "pros": {
      "ru": [
        "Модель чтения и модель записи оптимизируются независимо: инварианты и модель под запись, денормализованные projections на чтении",
        "Независимое масштабирование сторон — читающие реплики можно наращивать отдельно от записи, под их реальную нагрузку",
        "Модель записи фокусируется на командах домена и инвариантах, не обрастая логикой десятков сценариев чтения",
        "Под каждую сторону можно взять подходящее хранилище (например, реляционное на запись, поисковый индекс на чтение)"
      ],
      "en": [
        "The read and write models are optimised independently: invariants and a write-oriented model on the write side, denormalised projections on the read side",
        "Independent scaling of the sides — read replicas can grow separately from writes, matching their real load",
        "The write model stays focused on domain commands and invariants instead of accumulating the logic of dozens of read scenarios",
        "Each side can use the storage that suits it (e.g., relational for writes, a search index for reads)"
      ]
    },
    "cons": {
      "ru": [
        "Существенный рост сложности: две модели, их синхронизация и код проекций вместо одной схемы",
        "При асинхронной синхронизации между сторонами возникает eventual consistency — чтение может вернуть устаревшие данные",
        "Дублирование данных в projections и риск рассинхронизации при ошибках построения проекций",
        "Выше эксплуатационные издержки: мониторинг лага проекций, идемпотентность, пересборка read-моделей"
      ],
      "en": [
        "A significant rise in complexity: two models, their synchronisation, and projection code instead of one schema",
        "With asynchronous synchronisation between the sides you get eventual consistency — a read may return stale data",
        "Data is duplicated across projections, with a risk of drift when projection building fails",
        "Higher operational cost: monitoring projection lag, idempotency, and rebuilding read models"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Независимая оптимизация и масштабирование чтения/записи против роста сложности и объёма кода",
        "Быстрые, заточенные под запросы projections против eventual consistency и возможности прочитать устаревшие данные",
        "Гибкость выбора отдельных хранилищ под каждую сторону против затрат на синхронизацию и дублирование данных",
        "Чистая модель записи, сфокусированная на домене, против дополнительной инфраструктуры проекций и её эксплуатации"
      ],
      "en": [
        "Independent optimisation and scaling of reads/writes versus increased complexity and code volume",
        "Fast, query-tailored projections versus eventual consistency and the possibility of reading stale data",
        "Flexibility to pick separate stores per side versus the cost of synchronisation and data duplication",
        "A clean, domain-focused write model versus extra projection infrastructure and its operation"
      ]
    },
    "whenToUse": {
      "ru": [
        "Нагрузки на чтение и запись сильно различаются и должны масштабироваться по отдельности",
        "Сложный домен, где командная модель с инвариантами плохо совмещается с многочисленными сценариями чтения",
        "Нужны разнообразные, специализированные представления одних и тех же данных (отчёты, поиск, дашборды)",
        "CQRS применяют вместе с Event Sourcing, где события естественно проецируются в read-модели"
      ],
      "en": [
        "Read and write loads differ greatly and must be scaled separately",
        "A complex domain where a command model with invariants fits poorly with numerous read scenarios",
        "You need diverse, specialised views of the same data (reports, search, dashboards)",
        "It is applied alongside Event Sourcing, where events project naturally into read models"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Простые CRUD-домены, где чтение и запись работают с одной и той же формой данных — CQRS даст лишь лишнюю сложность",
        "Команда не готова к эксплуатации eventual consistency и мониторингу лага проекций",
        "Строго требуется read-after-write согласованность на всех операциях без исключений"
      ],
      "en": [
        "Simple CRUD domains where reads and writes work with the same shape of data — CQRS only adds needless complexity",
        "The team is not ready to operate eventual consistency and monitor projection lag",
        "Strict read-after-write consistency is required on every operation without exception"
      ]
    },
    "related": [
      "event-sourcing",
      "microservices",
      "database-per-service"
    ],
    "tags": [
      "микросервисы",
      "CQRS",
      "чтение и запись",
      "eventual consistency"
    ],
    "diagram": "flowchart LR\n  Client[Client]\n  Client -->|Command| CH[Command Handler]\n  CH --> WM[(Write Model)]\n  WM -->|Events / Sync| PROJ[Projections]\n  PROJ --> RM[(Read Model)]\n  Client -->|Query| QH[Query Handler]\n  QH --> RM"
  },
  {
    "id": "event-sourcing",
    "name": "Event Sourcing",
    "category": "microservices",
    "grade": "lead",
    "tags": [
      "микросервисы",
      "данные",
      "аудит"
    ],
    "tagline": {
      "ru": "Состояние хранится как append-only лог событий; текущее значение выводится их воспроизведением",
      "en": "State is stored as an append-only log of events; the current value is derived by replaying them"
    },
    "definition": {
      "ru": "Паттерн хранения данных, при котором единственным источником истины (source of truth) является append-only последовательность событий — неизменяемых фактов о том, что произошло с системой. Текущее состояние нигде не хранится напрямую, а выводится (derived) воспроизведением событий по порядку. В отличие от классического подхода, где в таблице держится лишь актуальный снимок, event store фиксирует каждое изменение как отдельное событие (Fowler, Greg Young).",
      "en": "A data-storage pattern in which the single source of truth is an append-only sequence of events—immutable facts about what has happened to the system. The current state is not stored directly anywhere but is derived by replaying the events in order. Unlike the classic approach, where a table holds only the latest snapshot, the event store records every change as a separate event (Fowler, Greg Young)."
    },
    "problem": {
      "ru": "Когда в БД хранится только текущее состояние, каждое обновление затирает предыдущее значение и история безвозвратно теряется: невозможно узнать, как система пришла в текущее состояние, восстановить её вид на любой момент прошлого (temporal query), провести аудит или отладить, откуда взялось неверное значение. Добавлять аудит-логи вручную ненадёжно — они рано или поздно расходятся с реальными данными.",
      "en": "When the database stores only the current state, every update overwrites the previous value and history is lost irrevocably: you cannot tell how the system arrived at its current state, reconstruct its view at any past moment (a temporal query), perform an audit, or debug where a wrong value came from. Adding audit logs by hand is unreliable—sooner or later they drift out of sync with the real data."
    },
    "solution": {
      "ru": "Вместо перезаписи состояния система сохраняет каждое изменение как событие в append-only хранилище (event store) — события неизменяемы и никогда не удаляются и не обновляются. Текущее состояние получают, сворачивая (fold/reduce) поток событий агрегата в проекцию (projection). Сам лог событий становится полным журналом аудита; из него можно восстановить состояние на любой момент, построить новые проекции задним числом и переиграть историю. Для производительности периодически сохраняют снимки (snapshots), чтобы не воспроизводить лог с самого начала.",
      "en": "Instead of overwriting state, the system persists every change as an event in an append-only event store—events are immutable and are never deleted or updated. The current state is obtained by folding (reducing) an aggregate's stream of events into a projection. The event log itself becomes a complete audit journal; from it you can reconstruct the state at any point in time, build new projections retroactively, and replay history. For performance, snapshots are stored periodically so the log doesn't have to be replayed from the very beginning."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Состояние не хранится напрямую — оно выводится воспроизведением событий.\ntype AccountEvent =\n  | { type: 'Opened'; balance: number }\n  | { type: 'Deposited'; amount: number }\n  | { type: 'Withdrawn'; amount: number };\n\n// Event store только дописывает: события — неизменяемые факты, их не правят.\nclass EventStore {\n  private events: AccountEvent[] = [];\n  append(event: AccountEvent): void { this.events.push(event); }\n  load(): readonly AccountEvent[] { return this.events; }\n}\n\ninterface AccountState { balance: number; }\n\n// Проекция сворачивает лог событий в текущее состояние.\nfunction project(events: readonly AccountEvent[]): AccountState {\n  return events.reduce<AccountState>((state, e) => {\n    switch (e.type) {\n      case 'Opened': return { balance: e.balance };\n      case 'Deposited': return { balance: state.balance + e.amount };\n      case 'Withdrawn': return { balance: state.balance - e.amount };\n    }\n  }, { balance: 0 });\n}\n\nconst store = new EventStore();\nstore.append({ type: 'Opened', balance: 0 });\nstore.append({ type: 'Deposited', amount: 100 });\nstore.append({ type: 'Withdrawn', amount: 30 });\n\n// Текущее состояние = воспроизведение всего лога; история не теряется.\nconsole.log(project(store.load())); // { balance: 70 }",
        "en": "// State is not stored directly — it is derived by replaying the events.\ntype AccountEvent =\n  | { type: 'Opened'; balance: number }\n  | { type: 'Deposited'; amount: number }\n  | { type: 'Withdrawn'; amount: number };\n\n// The event store only appends: events are immutable facts, never edited.\nclass EventStore {\n  private events: AccountEvent[] = [];\n  append(event: AccountEvent): void { this.events.push(event); }\n  load(): readonly AccountEvent[] { return this.events; }\n}\n\ninterface AccountState { balance: number; }\n\n// A projection folds the event log into the current state.\nfunction project(events: readonly AccountEvent[]): AccountState {\n  return events.reduce<AccountState>((state, e) => {\n    switch (e.type) {\n      case 'Opened': return { balance: e.balance };\n      case 'Deposited': return { balance: state.balance + e.amount };\n      case 'Withdrawn': return { balance: state.balance - e.amount };\n    }\n  }, { balance: 0 });\n}\n\nconst store = new EventStore();\nstore.append({ type: 'Opened', balance: 0 });\nstore.append({ type: 'Deposited', amount: 100 });\nstore.append({ type: 'Withdrawn', amount: 30 });\n\n// Current state = replay of the whole log; history is never lost.\nconsole.log(project(store.load())); // { balance: 70 }"
      }
    },
    "pros": {
      "ru": [
        "Полный журнал аудита из коробки: каждое изменение — неизменяемый факт, история никогда не теряется",
        "Temporal queries: состояние системы можно восстановить на любой момент прошлого, переиграв лог",
        "Отладка и анализ: воспроизведение событий показывает, как именно система пришла в текущее состояние",
        "Новые проекции строятся задним числом — тот же лог событий переигрывается в новую модель чтения",
        "Естественно сочетается с CQRS и event-driven интеграцией: события уже есть и их можно публиковать другим сервисам"
      ],
      "en": [
        "A complete audit trail out of the box: every change is an immutable fact, history is never lost",
        "Temporal queries: the system's state can be reconstructed at any past moment by replaying the log",
        "Debugging and analysis: replaying the events shows exactly how the system reached its current state",
        "New projections can be built retroactively—the same event log is replayed into a new read model",
        "Pairs naturally with CQRS and event-driven integration: the events already exist and can be published to other services"
      ]
    },
    "cons": {
      "ru": [
        "Высокая сложность: непривычная модель, где состояние выводится, а не читается напрямую",
        "Запрос текущего состояния требует воспроизведения лога или отдельной проекции — для производительности нужны snapshots",
        "Эволюция схемы событий (versioning) сложна: старые события неизменяемы, но их структура меняется со временем",
        "Eventual consistency: проекции обновляются асинхронно и отстают от записи событий",
        "Удаление данных противоречит append-only модели — соблюдение GDPR (право на забвение) требует особых приёмов (crypto-shredding)"
      ],
      "en": [
        "High complexity: the unfamiliar model where state is derived rather than read directly",
        "Querying current state requires replaying the log or a separate projection—snapshots are needed for performance",
        "Event-schema evolution (versioning) is hard: old events are immutable, yet their structure changes over time",
        "Eventual consistency: projections update asynchronously and lag behind the appended events",
        "Deleting data conflicts with the append-only model—GDPR compliance (right to erasure) requires special techniques (crypto-shredding)"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Полная история и аудит против простоты: хранить и переигрывать события дороже, чем обновлять одну строку с текущим состоянием",
        "Гибкость проекций против стоимости чтения: любое состояние выводимо из лога, но прямое чтение снимка быстрее воспроизведения",
        "Неизменяемость событий против эволюции модели: append-only даёт надёжный аудит, но усложняет версионирование и удаление данных",
        "Богатство темпоральных запросов против сложности эксплуатации: event store и проекции — дополнительная инфраструктура со своей согласованностью"
      ],
      "en": [
        "Full history and audit vs. simplicity: storing and replaying events costs more than updating a single row of current state",
        "Projection flexibility vs. read cost: any state is derivable from the log, but reading a stored snapshot is faster than replaying",
        "Event immutability vs. model evolution: append-only gives a reliable audit trail but complicates versioning and data deletion",
        "Rich temporal queries vs. operational complexity: the event store and projections are extra infrastructure with their own consistency"
      ]
    },
    "whenToUse": {
      "ru": [
        "Нужен достоверный, неизменяемый журнал аудита — домены с регуляторными требованиями (финансы, учёт, медицина)",
        "Важны temporal queries и анализ истории: как менялось состояние и почему",
        "Требуется несколько разных моделей чтения одних данных — их удобно строить как отдельные проекции (часто вместе с CQRS)",
        "Домен естественно описывается событиями (order placed, payment received) — event-driven интеграция уже в его основе"
      ],
      "en": [
        "You need a trustworthy, immutable audit trail—domains with regulatory requirements (finance, accounting, healthcare)",
        "Temporal queries and history analysis matter: how the state changed over time and why",
        "Several different read models over the same data are required—they are conveniently built as separate projections (often together with CQRS)",
        "The domain is naturally described by events (order placed, payment received)—event-driven integration is already at its core"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Простой CRUD-домен без потребности в истории или аудите: хранить только текущее состояние проще и дешевле",
        "Команда не готова к дополнительной сложности — проекциям, версионированию событий и eventual consistency",
        "Домен требует лёгкого физического удаления данных, а обходные приёмы (crypto-shredding) неприемлемы"
      ],
      "en": [
        "A simple CRUD domain with no need for history or audit: storing only the current state is simpler and cheaper",
        "The team is not ready for the extra complexity—projections, event versioning, and eventual consistency",
        "The domain requires easy physical deletion of data and workarounds (crypto-shredding) are unacceptable"
      ]
    },
    "related": [
      "cqrs",
      "event-driven",
      "saga"
    ],
    "diagram": "flowchart LR\n    C[Command] --> A[Aggregate]\n    A -->|append new event| E[(Event Store)]\n    E -->|replay events| P[Projection]\n    P --> S[Current State]\n    S --> Q[Queries]\n    E -. rebuild anytime .-> P"
  },
  {
    "id": "anti-corruption-layer",
    "name": "Anti-Corruption Layer",
    "category": "microservices",
    "grade": "senior",
    "aka": [
      "ACL"
    ],
    "tagline": {
      "ru": "Слой-переводчик, не дающий чужой модели просочиться в ваш домен",
      "en": "A translation layer that keeps a foreign model from leaking into your domain"
    },
    "definition": {
      "ru": "Стратегический паттерн Domain-Driven Design (Eric Evans, часть Context Mapping): изолирующий слой между двумя bounded contexts, который транслирует запросы и данные из чужой (легаси или внешней) модели в термины вашей собственной модели и обратно. ACL не пропускает понятия, структуры и допущения внешней системы внутрь домена, защищая его целостность.",
      "en": "A strategic design pattern from Domain-Driven Design (Eric Evans, part of Context Mapping): an isolating layer between two bounded contexts that translates requests and data from a foreign (legacy or external) model into the terms of your own model and back. The ACL prevents the external system's concepts, structures, and assumptions from entering your domain, protecting its integrity."
    },
    "problem": {
      "ru": "Ваш сервис вынужден интегрироваться с легаси-системой или внешним API, у которых своя, часто неудачная или чуждая, модель данных: кривые имена полей, коды-энумы, денормализация, иные бизнес-правила. Если обращаться к ним напрямую, их понятия расползаются по доменному коду: доменные объекты обрастают полями CUST_ID и TIER_CODE, логика начинает зависеть от причуд чужого контракта. Домен постепенно «портится» — любое изменение внешней системы бьёт по всему приложению, а собственная модель теряет ясность.",
      "en": "Your service must integrate with a legacy system or external API that has its own — often awkward or alien — data model: cryptic field names, enum codes, denormalization, different business rules. If you call them directly, their concepts spread through the domain code: domain objects grow CUST_ID and TIER_CODE fields, and logic starts depending on the quirks of a foreign contract. The domain gradually gets 'corrupted' — any change in the external system ripples across the whole application, and your own model loses clarity."
    },
    "solution": {
      "ru": "Вводим Anti-Corruption Layer — явную границу, за которой живёт всё знание о чужой модели. ACL предоставляет домену интерфейс (порт) в терминах домена, а внутри транслирует его вызовы в протокол и модель внешней системы и переводит ответы обратно в доменные объекты. Внутренне ACL может состоять из адаптеров, фасадов и собственных объектов-переводчиков (translators). Домен зависит только от этого интерфейса и никогда не видит чужих типов; при смене внешнего контракта меняется только ACL.",
      "en": "Introduce an Anti-Corruption Layer — an explicit boundary behind which all knowledge of the foreign model lives. The ACL exposes an interface (a port) to the domain in domain terms, and internally translates its calls into the external system's protocol and model, converting responses back into domain objects. Internally the ACL may consist of adapters, facades, and its own translator objects. The domain depends only on this interface and never sees foreign types; when the external contract changes, only the ACL changes."
    },
    "codeExample": {
      "lang": "typescript",
      "code": {
        "ru": "// Наша чистая доменная модель\ninterface Customer { id: string; fullName: string; isPremium: boolean; }\n\n// Модель внешней/легаси-системы: чужие имена полей и код-энум\ninterface LegacyCrmRecord {\n  CUST_ID: string;\n  FNAME: string;\n  LNAME: string;\n  TIER_CODE: number; // 1 = standard, 2 = premium\n}\ninterface LegacyCrmClient { fetch(id: string): LegacyCrmRecord; }\n\n// Порт в терминах домена — единственное, от чего зависит домен\ninterface CustomerProvider { getCustomer(id: string): Customer; }\n\n// Anti-Corruption Layer: переводит чужую модель в доменную.\n// Минимальный ACL — один переводчик; в реальности он разрастается\n// в несколько адаптеров/фасадов/translators за этой границей.\nclass CrmAntiCorruptionLayer implements CustomerProvider {\n  constructor(private readonly crm: LegacyCrmClient) {}\n  getCustomer(id: string): Customer {\n    const r = this.crm.fetch(id); // чужая модель не покидает границу\n    return {\n      id: r.CUST_ID,\n      fullName: `${r.FNAME} ${r.LNAME}`.trim(),\n      isPremium: r.TIER_CODE === 2,\n    };\n  }\n}\n\n// Домен знает только про CustomerProvider, а не про LegacyCrmRecord\nfunction greet(provider: CustomerProvider, id: string): string {\n  const c = provider.getCustomer(id);\n  return c.isPremium ? `С возвращением, ${c.fullName}` : `Здравствуйте, ${c.fullName}`;\n}",
        "en": "// Our clean domain model\ninterface Customer { id: string; fullName: string; isPremium: boolean; }\n\n// The external/legacy system's model: foreign field names and an enum code\ninterface LegacyCrmRecord {\n  CUST_ID: string;\n  FNAME: string;\n  LNAME: string;\n  TIER_CODE: number; // 1 = standard, 2 = premium\n}\ninterface LegacyCrmClient { fetch(id: string): LegacyCrmRecord; }\n\n// Port expressed in domain terms — the only thing the domain depends on\ninterface CustomerProvider { getCustomer(id: string): Customer; }\n\n// Anti-Corruption Layer: translates the foreign model into the domain model.\n// A minimal ACL is a single translator; at scale it fans out into\n// several adapters/facades/translators behind this boundary.\nclass CrmAntiCorruptionLayer implements CustomerProvider {\n  constructor(private readonly crm: LegacyCrmClient) {}\n  getCustomer(id: string): Customer {\n    const r = this.crm.fetch(id); // the foreign model never leaves the boundary\n    return {\n      id: r.CUST_ID,\n      fullName: `${r.FNAME} ${r.LNAME}`.trim(),\n      isPremium: r.TIER_CODE === 2,\n    };\n  }\n}\n\n// The domain knows only CustomerProvider, never LegacyCrmRecord\nfunction greet(provider: CustomerProvider, id: string): string {\n  const c = provider.getCustomer(id);\n  return c.isPremium ? `Welcome back, ${c.fullName}` : `Hello, ${c.fullName}`;\n}"
      }
    },
    "pros": {
      "ru": [
        "Домен защищён: чужая модель и её причуды не просачиваются в бизнес-логику",
        "Изменения внешнего или легаси-контракта локализованы в одном слое",
        "Собственная модель остаётся чистой и выразительной, свободной от компромиссов интеграции",
        "Упрощает тестирование домена: ACL легко подменить тестовой реализацией порта",
        "Даёт точку для устойчивости интеграции — сюда естественно добавить ретраи, маппинг ошибок, кэш"
      ],
      "en": [
        "The domain is protected: the foreign model and its quirks don't seep into business logic",
        "Changes to the external or legacy contract are localized to one layer",
        "Your own model stays clean and expressive, free of integration compromises",
        "Simplifies testing the domain: the ACL is easily replaced by a test implementation of the port",
        "Provides a place for integration resilience — retries, error mapping, and caching naturally live here"
      ]
    },
    "cons": {
      "ru": [
        "Дополнительный слой кода, моделей и маппинга, который нужно писать и поддерживать",
        "Двойная трансляция добавляет накладные расходы и ещё один прыжок для отладки",
        "Логика перевода может разрастись и сама стать сложной, особенно при богатых моделях",
        "Риск дублирования: часть внешней модели невольно повторяется в доменной"
      ],
      "en": [
        "An extra layer of code, models, and mapping that must be written and maintained",
        "The double translation adds overhead and one more hop to debug",
        "The translation logic can grow and become complex itself, especially with rich models",
        "Risk of duplication: part of the external model gets unintentionally mirrored in the domain"
      ]
    },
    "tradeoffs": {
      "ru": [
        "Чистота и независимость домена против стоимости написания и поддержки слоя трансляции",
        "Локализация изменений внешнего контракта против накладных расходов на двойной маппинг",
        "Изоляция от чужой модели против риска задублировать её понятия по обе стороны границы",
        "Полноценный ACL (несколько translators/адаптеров) против лёгкого прямого маппинга там, где модели почти совпадают"
      ],
      "en": [
        "Domain purity and independence versus the cost of writing and maintaining a translation layer",
        "Localizing external-contract changes versus the overhead of double mapping",
        "Isolation from the foreign model versus the risk of duplicating its concepts on both sides of the boundary",
        "A full ACL (several translators/adapters) versus lightweight direct mapping where the models nearly coincide"
      ]
    },
    "whenToUse": {
      "ru": [
        "Интеграция с легаси-системой или внешним API, чью модель вы не контролируете",
        "Модель внешней системы чужда или неудачна и грозит исказить ваш домен",
        "Ожидается, что внешний контракт будет меняться, и вы хотите изолировать эти изменения",
        "Взаимодействие двух bounded contexts, где важно сохранить целостность вашей модели"
      ],
      "en": [
        "Integrating with a legacy system or external API whose model you don't control",
        "The external system's model is alien or poor and threatens to distort your domain",
        "You expect the external contract to change and want to isolate those changes",
        "Two bounded contexts interact and it matters to preserve the integrity of your model"
      ]
    },
    "whenNotToUse": {
      "ru": [
        "Внешняя модель почти совпадает с вашей — хватит тонкого маппинга без отдельного слоя",
        "Одноразовая интеграция или прототип, где издержки слоя не окупаются",
        "Вы полностью контролируете обе стороны и можете согласовать общую модель напрямую"
      ],
      "en": [
        "The external model nearly matches yours — a thin mapping suffices without a separate layer",
        "A one-off integration or prototype where the layer's cost isn't justified",
        "You fully control both sides and can agree on a shared model directly"
      ]
    },
    "related": [
      "adapter",
      "microservices",
      "hexagonal"
    ],
    "tags": [
      "ddd",
      "integration",
      "legacy",
      "bounded-context",
      "translation"
    ],
    "diagram": "flowchart LR\n  A[\"Domain Model (your bounded context)\"] <--> B[\"Anti-Corruption Layer (translator)\"]\n  B <--> C[\"Legacy / External System\"]"
  }
];

export const microservicesQuestions: Question[] = [
  {
    "id": "ms-database-per-service-shared-db",
    "type": "concept",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "database-per-service",
    "prompt": {
      "ru": "Почему Database per Service запрещает одному сервису обращаться к базе данных другого сервиса напрямую?",
      "en": "Why does Database per Service forbid one service from accessing another service's database directly?"
    },
    "options": {
      "ru": [
        "Потому что реляционные базы не выдерживают одновременных подключений от нескольких сервисов",
        "Потому что общая база всегда работает медленнее, чем несколько маленьких баз",
        "Потому что общая база связывает сервисы через свою схему и мешает независимому деплою и выбору технологий",
        "Потому что микросервисам запрещено использовать SQL — только NoSQL-хранилища"
      ],
      "en": [
        "Because relational databases can't handle concurrent connections from several services at once",
        "Because a shared database is always slower than several smaller databases",
        "Because a shared database couples services through its schema and blocks independent deployment and technology choice",
        "Because microservices are forbidden from using SQL and may only use NoSQL stores"
      ]
    },
    "correctIndex": 2,
    "explanation": {
      "ru": "Суть паттерна — устранить связанность через данные: если сервисы делят одну базу, изменение таблицы одним ломает других, а независимый деплой становится невозможен без согласованной миграции. Приватная база прячет схему за API, поэтому команда свободно меняет модель данных и тип СУБД. Первый вариант — техническое заблуждение: базы прекрасно держат много подключений, дело не в этом. Второй неверен: производительность зависит от нагрузки и схемы, а не от числа баз; мотив паттерна — связанность и автономия, а не скорость. Четвёртый — миф: паттерн не диктует тип СУБД, наоборот, он даёт свободу polyglot persistence, в том числе и SQL.",
      "en": "The point of the pattern is to remove coupling through data: if services share one database, one changing a table breaks the others, and independent deployment becomes impossible without a coordinated migration. A private database hides the schema behind the API, so the team can freely change the data model and the DBMS. The first option is a technical misconception: databases handle many connections fine — that's not the issue. The second is wrong: performance depends on load and schema, not the number of databases; the pattern's motive is coupling and autonomy, not speed. The fourth is a myth: the pattern dictates no DBMS type; on the contrary, it enables polyglot persistence, SQL included."
    }
  },
  {
    "id": "ms-database-per-service-no-acid",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "database-per-service",
    "prompt": {
      "ru": "Бизнес-операция должна обновить данные, принадлежащие двум разным сервисам. Как при Database per Service обеспечивается согласованность?",
      "en": "A business operation must update data owned by two different services. Under Database per Service, how is consistency achieved?"
    },
    "options": {
      "ru": [
        "Межсервисной ACID-транзакции нет; шаги координируют через Saga и принимают eventual consistency",
        "Стандартом по умолчанию является распределённый two-phase commit (2PC) по обеим базам",
        "Одна ACID-транзакция автоматически охватывает обе базы данных",
        "Обе базы сливают обратно в одну, чтобы обычная транзакция снова работала"
      ],
      "en": [
        "There is no cross-service ACID transaction; the steps are coordinated with a Saga and you accept eventual consistency",
        "A distributed two-phase commit (2PC) across both databases is the recommended default",
        "A single ACID transaction automatically spans both databases",
        "You merge the two databases back into one so a normal transaction works again"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Приватные базы означают, что транзакция одного сервиса не может атомарно затронуть данные другого. Канонический ответ (Richardson) — Saga: последовательность локальных транзакций с компенсациями, дающая eventual consistency. Второй вариант — распространённое заблуждение: 2PC создаёт жёсткую связанность и снижает доступность, поэтому в микросервисах его избегают, а не рекомендуют. Третий технически невозможен: единой транзакции поверх двух независимых баз просто нет. Четвёртый разрушает сам паттерн — возврат к общей базе возвращает связанность, ради устранения которой всё и затевалось.",
      "en": "Private databases mean one service's transaction can't atomically touch another's data. The canonical answer (Richardson) is a Saga: a sequence of local transactions with compensations, giving eventual consistency. The second option is a common misconception: 2PC creates tight coupling and reduces availability, so microservices avoid it rather than recommend it. The third is technically impossible: there is simply no single transaction spanning two independent databases. The fourth destroys the pattern itself — going back to a shared database restores the very coupling the pattern was meant to remove."
    }
  },
  {
    "id": "ms-database-per-service-identify",
    "type": "concept",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "database-per-service",
    "prompt": {
      "ru": "Какой паттерн микросервисов иллюстрирует этот код?",
      "en": "Which microservices pattern does this code illustrate?"
    },
    "code": {
      "lang": "typescript",
      "code": {
        "ru": "// У Order Service своя база (OrderDb). Данные о клиенте он берёт у другого сервиса.\nclass OrderService {\n  constructor(private db: OrderDb, private customers: CustomerService) {}\n  place(id: string, customerId: string, total: number) {\n    const credit = this.customers.getCredit(customerId); // вызов API соседнего сервиса, а не запрос к его таблице\n    if (total > credit) throw new Error('Credit limit exceeded');\n    this.db.save({ id, customerId, total }); // пишет только в свою собственную базу\n  }\n}",
        "en": "// Order Service has its own database (OrderDb). It gets customer data from another service.\nclass OrderService {\n  constructor(private db: OrderDb, private customers: CustomerService) {}\n  place(id: string, customerId: string, total: number) {\n    const credit = this.customers.getCredit(customerId); // an API call to a neighbouring service, not a query against its table\n    if (total > credit) throw new Error('Credit limit exceeded');\n    this.db.save({ id, customerId, total }); // writes only to its own database\n  }\n}"
      }
    },
    "options": {
      "ru": [
        "Shared Database — сервисы читают и пишут таблицы друг друга напрямую",
        "Database per Service — у каждого сервиса приватная база, а данные наружу отдаются только через его API",
        "CQRS — разделение модели записи и отдельной модели чтения",
        "API Gateway — единая точка входа, маршрутизирующая внешние запросы клиентов к сервисам"
      ],
      "en": [
        "Shared Database — services read and write each other's tables directly",
        "Database per Service — each service has a private database and exposes its data only through its API",
        "CQRS — splitting the write model from a separate read model",
        "API Gateway — a single entry point that routes external client requests to services"
      ]
    },
    "correctIndex": 1,
    "explanation": {
      "ru": "Order Service пишет только в свою OrderDb, а данные о клиенте получает вызовом customers.getCredit(...) — то есть через API сервиса-владельца, а не запросом к его таблице. Это и есть Database per Service. Первый вариант — прямая противоположность: здесь как раз нет прямого доступа к чужой базе. Третий (CQRS) про разделение чтения и записи внутри модели — тут его нет. Четвёртый (API Gateway) — про единую точку входа для внешних клиентов; в примере же речь о вызове одного внутреннего сервиса другим, а не о шлюзе.",
      "en": "Order Service writes only to its own OrderDb and obtains customer data via customers.getCredit(...) — that is, through the owning service's API rather than a query against its table. That is Database per Service. The first option is the direct opposite: here there is precisely no direct access to another's database. The third (CQRS) is about separating reads from writes within the model — none of that here. The fourth (API Gateway) is about a single entry point for external clients; the example is one internal service calling another, not a gateway."
    }
  },
  {
    "id": "ms-api-gateway-responsibilities",
    "type": "concept",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "api-gateway",
    "prompt": {
      "ru": "Что из перечисленного относится к обязанностям API Gateway?",
      "en": "Which of the following belongs to the responsibilities of an API Gateway?"
    },
    "options": {
      "ru": [
        "Маршрутизация запросов, аутентификация, rate-limiting и TLS termination на краю системы",
        "Хранение и изменение бизнес-данных домена — например, расчёт итоговой цены заказа",
        "Оркестрация распределённых транзакций и хранение состояния саги между сервисами",
        "Персистентное хранилище, из которого сервисы читают и пишут свои данные"
      ],
      "en": [
        "Request routing, authentication, rate-limiting, and TLS termination at the edge of the system",
        "Storing and modifying domain business data — for example, computing the final order total",
        "Orchestrating distributed transactions and holding saga state across services",
        "The persistent storage that services read from and write their data to"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "API Gateway — тонкий посредник на краю системы, отвечающий за сквозные задачи: маршрутизацию, аутентификацию, rate-limiting, TLS termination, трансляцию протоколов и формирование ответа. Второй вариант неверен: бизнес-логику домена (например, расчёт цены) держат сервисы-владельцы, а утечка её в шлюз превращает его в скрытый монолит. Третий вариант — это роль оркестратора саги (Saga/Process Manager), а не шлюза. Четвёртый описывает базу данных: шлюз ничего не хранит и не является источником данных, он лишь проксирует запросы к сервисам.",
      "en": "The API Gateway is a thin intermediary at the edge of the system, responsible for cross-cutting concerns: routing, authentication, rate-limiting, TLS termination, protocol translation, and response shaping. The second option is wrong: domain business logic (e.g., computing a price) is kept by the owning services, and leaking it into the gateway turns it into a hidden monolith. The third option is the role of a saga orchestrator (Saga/Process Manager), not the gateway. The fourth describes a database: the gateway stores nothing and is not a source of data — it only proxies requests to the services."
    }
  },
  {
    "id": "ms-api-gateway-vs-direct",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "api-gateway",
    "prompt": {
      "ru": "В чём главный компромисс API Gateway по сравнению с прямыми вызовами client-to-service?",
      "en": "What is the main trade-off of an API Gateway compared with direct client-to-service calls?"
    },
    "options": {
      "ru": [
        "Он развязывает клиентов от топологии сервисов и централизует сквозные задачи ценой лишнего хопа и потенциальной единой точки отказа",
        "Он полностью устраняет сетевые задержки, потому что клиент делает только один запрос",
        "Он избавляет от необходимости в отказоустойчивости сервисов, так как сам гарантирует их доступность",
        "Он делает микросервисы ненужными, объединяя их логику в одном месте"
      ],
      "en": [
        "It decouples clients from service topology and centralizes cross-cutting concerns at the cost of an extra hop and a potential single point of failure",
        "It eliminates network latency entirely, because the client makes only a single request",
        "It removes the need for service fault tolerance, since it guarantees their availability itself",
        "It makes microservices unnecessary by merging their logic into one place"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Прямые вызовы проще и без лишнего хопа, но заставляют клиента знать все сервисы и дублировать сквозные задачи. Шлюз скрывает топологию и централизует auth/rate-limiting/TLS, но добавляет сетевой хоп, узкое место и точку отказа, которую нужно резервировать — это и есть компромисс. Второй вариант неверен: шлюз добавляет хоп, а не устраняет задержку; выигрыш возможен лишь при агрегации нескольких вызовов, но не «полное устранение». Третий неверен: шлюз сам требует отказоустойчивости, а сервисы всё равно должны защищаться, например через Circuit Breaker. Четвёртый неверен: шлюз не заменяет сервисы, а стоит перед ними, и втягивание их логики в него — как раз антипаттерн.",
      "en": "Direct calls are simpler and avoid an extra hop, but force the client to know every service and duplicate cross-cutting concerns. The gateway hides the topology and centralizes auth/rate-limiting/TLS, but adds a network hop, a bottleneck, and a point of failure that must be made redundant — that is the trade-off. The second option is wrong: the gateway adds a hop rather than eliminating latency; a gain is possible only when it aggregates several calls, not a 'full elimination'. The third is wrong: the gateway itself needs fault tolerance, and services must still protect themselves, e.g. via a Circuit Breaker. The fourth is wrong: the gateway does not replace services but sits in front of them, and pulling their logic into it is precisely the anti-pattern."
    }
  },
  {
    "id": "ms-api-gateway-identify",
    "type": "concept",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "api-gateway",
    "prompt": {
      "ru": "Какой паттерн реализует класс Edge в этом фрагменте?",
      "en": "Which pattern does the Edge class implement in this snippet?"
    },
    "code": {
      "lang": "typescript",
      "code": {
        "ru": "interface Req { path: string; token?: string; }\ninterface Svc { handle(r: Req): unknown; }\n\nclass Edge {\n  constructor(private routes: Record<string, Svc>) {}\n  handle(r: Req) {\n    if (!r.token) return { status: 401 };            // аутентификация\n    const svc = this.routes['/' + r.path.split('/')[1]]; // маршрутизация\n    if (!svc) return { status: 404 };\n    return svc.handle(r);                              // делегирование сервису\n  }\n}",
        "en": "interface Req { path: string; token?: string; }\ninterface Svc { handle(r: Req): unknown; }\n\nclass Edge {\n  constructor(private routes: Record<string, Svc>) {}\n  handle(r: Req) {\n    if (!r.token) return { status: 401 };            // authentication\n    const svc = this.routes['/' + r.path.split('/')[1]]; // routing\n    if (!svc) return { status: 404 };\n    return svc.handle(r);                              // delegate to the service\n  }\n}"
      }
    },
    "options": {
      "ru": [
        "API Gateway",
        "Aggregator — он собирает и объединяет ответы нескольких сервисов в один",
        "Circuit Breaker — он размыкает цепь при отказах вызываемого сервиса",
        "Repository — он инкапсулирует доступ к хранилищу данных"
      ],
      "en": [
        "API Gateway",
        "Aggregator — it collects and merges responses from several services into one",
        "Circuit Breaker — it opens the circuit when a called service fails",
        "Repository — it encapsulates access to a data store"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Класс Edge — единая точка входа, которая аутентифицирует запрос, маршрутизирует его по пути к нужному сервису и делегирует обработку, не вычисляя ответ сам: это API Gateway. Aggregator неверен — здесь запрос уходит ровно в один сервис, а не собирается из нескольких. Circuit Breaker неверен — нет отслеживания отказов, порога и размыкания цепи. Repository неверен — нет ни хранилища, ни операций чтения/записи данных; класс лишь проксирует запрос к сервису.",
      "en": "The Edge class is a single entry point that authenticates the request, routes it by path to the right service, and delegates the handling without computing the answer itself: this is an API Gateway. Aggregator is wrong — here the request goes to exactly one service rather than being assembled from several. Circuit Breaker is wrong — there is no failure tracking, threshold, or opening of the circuit. Repository is wrong — there is no store and no data read/write operations; the class merely proxies the request to a service."
    }
  },
  {
    "id": "ms-aggregator-core-responsibility",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "aggregator",
    "prompt": {
      "ru": "В чём основная задача паттерна Aggregator?",
      "en": "What is the core responsibility of the Aggregator pattern?"
    },
    "options": {
      "ru": [
        "Вызвать несколько downstream-сервисов и объединить их ответы в единый консолидированный результат для клиента",
        "Служить единой точкой входа для всех клиентов и решать сквозные задачи — аутентификацию, rate-limiting, TLS termination",
        "Транслировать внешний протокол клиента (REST) во внутренний протокол сервисов (gRPC, AMQP)",
        "Хранить состояние распределённой транзакции и управлять компенсирующими действиями между сервисами"
      ],
      "en": [
        "Call several downstream services and merge their responses into a single consolidated result for the client",
        "Serve as the single entry point for all clients and handle cross-cutting concerns — authentication, rate-limiting, TLS termination",
        "Translate the client's external protocol (REST) into the services' internal protocol (gRPC, AMQP)",
        "Hold the state of a distributed transaction and coordinate compensating actions across services"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Aggregator определяется именно композицией данных: он вызывает несколько сервисов и склеивает их ответы в один. Второй вариант — обязанности API Gateway: шлюз может включать агрегирование как одну из своих функций, но его определяющая роль — сквозные задачи на краю системы, а не объединение данных. Третий вариант — тоже задача шлюза (или протокольного адаптера), а не агрегатора: сам по себе Aggregator не обязан менять протокол. Четвёртый описывает Saga/Process Manager — управление распределённой транзакцией и компенсациями, а не простое объединение результатов независимых вызовов.",
      "en": "The Aggregator is defined precisely by data composition: it calls several services and stitches their responses into one. The second option is the responsibility of an API Gateway: a gateway may include aggregation as one of its features, but its defining role is cross-cutting concerns at the edge, not merging data. The third option is also a gateway (or protocol-adapter) concern, not the aggregator's: an Aggregator by itself is not required to change protocols. The fourth describes a Saga/Process Manager — coordinating a distributed transaction and compensations — rather than simply merging the results of independent calls."
    }
  },
  {
    "id": "ms-aggregator-parallel-vs-chained",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "aggregator",
    "prompt": {
      "ru": "В чём разница между параллельной и цепочечной (chained) композицией вызовов в Aggregator и какой у неё компромисс?",
      "en": "What is the difference between parallel and chained composition of calls in an Aggregator, and what is the trade-off?"
    },
    "options": {
      "ru": [
        "Параллельная композиция вызывает независимые сервисы одновременно и минимизирует суммарную задержку, но усложняет обработку частичных отказов; цепочечная композиция вызывает сервисы последовательно, когда результат одного нужен как вход для следующего, и задержки в ней складываются",
        "Параллельная композиция возможна только при синхронных вызовах, а цепочечная — только при асинхронных",
        "Цепочечная композиция всегда быстрее параллельной, потому что исключает сетевые задержки между вызовами",
        "Разницы нет: агрегатор всегда вызывает сервисы одинаково, независимо от зависимостей между данными"
      ],
      "en": [
        "Parallel composition calls independent services at the same time and minimizes total latency, but complicates handling of partial failures; chained composition calls services sequentially, when one call's result is needed as input to the next, and its latencies add up",
        "Parallel composition is only possible with synchronous calls, and chained composition only with asynchronous ones",
        "Chained composition is always faster than parallel composition, because it eliminates network latency between calls",
        "There is no difference: the aggregator always calls services the same way regardless of dependencies between the data"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Выбор между fan-out (параллельно) и цепочкой определяется зависимостью данных: независимые вызовы стоит распараллелить ради задержки, но тогда нужно явно решать, что делать при отказе одного из них; зависимые вызовы неизбежно идут цепочкой, и их задержки суммируются. Второй вариант неверен: и параллельная, и цепочечная композиция реализуются как синхронными, так и асинхронными вызовами — это ортогональный выбор. Третий вариант неверен и противоречит сути: цепочка не устраняет сетевые задержки, а складывает их одну за другой, что обычно медленнее. Четвёртый неверен: выбор способа композиции как раз зависит от того, зависят ли данные одного вызова от результата другого.",
      "en": "The choice between fan-out (parallel) and a chain is driven by data dependency: independent calls should be parallelized for latency, but then a decision must be made explicitly about what happens if one of them fails; dependent calls inevitably form a chain, and their latencies add up. The second option is wrong: both parallel and chained composition can be implemented with either synchronous or asynchronous calls — that is an orthogonal choice. The third option is wrong and contradicts the point: a chain does not eliminate network latency but stacks it call after call, which is usually slower. The fourth is wrong: the choice of composition style depends precisely on whether one call's data depends on another call's result."
    }
  },
  {
    "id": "ms-aggregator-identify-pattern",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "aggregator",
    "prompt": {
      "ru": "Какой паттерн реализует класс Composer в этом фрагменте?",
      "en": "Which pattern does the Composer class implement in this snippet?"
    },
    "code": {
      "lang": "typescript",
      "code": {
        "ru": "interface Req { userId: string; }\ninterface Svc { call(r: Req): Promise<Record<string, unknown>>; }\n\nclass Composer {\n  constructor(private profile: Svc, private orders: Svc, private recs: Svc) {}\n\n  async handle(r: Req) {\n    const [profile, orders, recs] = await Promise.all([\n      this.profile.call(r),\n      this.orders.call(r),\n      this.recs.call(r),\n    ]);\n    return { ...profile, orders, recommendations: recs }; // объединение в один ответ\n  }\n}",
        "en": "interface Req { userId: string; }\ninterface Svc { call(r: Req): Promise<Record<string, unknown>>; }\n\nclass Composer {\n  constructor(private profile: Svc, private orders: Svc, private recs: Svc) {}\n\n  async handle(r: Req) {\n    const [profile, orders, recs] = await Promise.all([\n      this.profile.call(r),\n      this.orders.call(r),\n      this.recs.call(r),\n    ]);\n    return { ...profile, orders, recommendations: recs }; // merged into one response\n  }\n}"
      }
    },
    "options": {
      "ru": [
        "Aggregator — он вызывает несколько независимых сервисов параллельно и объединяет их ответы в один",
        "API Gateway — единая точка входа, решающая маршрутизацию, аутентификацию и rate-limiting",
        "Circuit Breaker — он размыкает цепь вызовов при отказах вызываемого сервиса",
        "BFF (Backend for Frontend) — выделенный агрегатор, спроектированный под потребности одного конкретного клиента"
      ],
      "en": [
        "Aggregator — it calls several independent services in parallel and merges their responses into one",
        "API Gateway — a single entry point handling routing, authentication, and rate-limiting",
        "Circuit Breaker — it opens the call chain when the called service fails",
        "BFF (Backend for Frontend) — a dedicated aggregator designed for the needs of one specific client"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Composer делает ровно то, что определяет Aggregator: вызывает три независимых сервиса параллельно (Promise.all) и склеивает их ответы в один объект — это fan-out/fan-in без какой-либо привязки к конкретному типу клиента. API Gateway неверен: в коде нет ни маршрутизации по пути, ни аутентификации, ни rate-limiting — только вызов сервисов и слияние данных. Circuit Breaker неверен: нет отслеживания отказов, порога срабатывания и размыкания цепи. BFF неверен по построению задачи — в коде нет ничего, что указывало бы на привязку к конкретному клиентскому приложению (мобильному или веб); это обобщённый агрегатор, а BFF — его специализированный частный случай.",
      "en": "The Composer does exactly what defines an Aggregator: it calls three independent services in parallel (Promise.all) and stitches their responses into one object — this is fan-out/fan-in with no tie to any specific client type. API Gateway is wrong: the code has no path-based routing, authentication, or rate-limiting — only service calls and data merging. Circuit Breaker is wrong: there is no failure tracking, threshold, or opening of the call chain. BFF is wrong by construction of the example — nothing in the code ties it to a specific client application (mobile or web); this is a generic aggregator, and a BFF is its specialized special case."
    }
  },
  {
    "id": "ms-bff-vs-gateway",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "bff",
    "prompt": {
      "ru": "Чем Backend for Frontend отличается от одного универсального API Gateway?",
      "en": "How does a Backend for Frontend differ from a single general-purpose API Gateway?"
    },
    "options": {
      "ru": [
        "BFF — это отдельный backend под конкретный тип клиента, чей API заточен под нужды именно его UI, тогда как универсальный gateway отдаёт один общий API всем клиентам",
        "BFF и универсальный gateway — синонимы: оба просто проксируют запросы к downstream-сервисам",
        "BFF работает на клиенте (в браузере или приложении), а gateway — на сервере",
        "BFF заменяет downstream-микросервисы, объединяя их в один монолитный сервис"
      ],
      "en": [
        "A BFF is a separate backend for a specific client type whose API is tailored to that UI's needs, whereas a general-purpose gateway exposes one shared API to all clients",
        "A BFF and a general-purpose gateway are synonyms: both just proxy requests to downstream services",
        "A BFF runs on the client (in the browser or app), while a gateway runs on the server",
        "A BFF replaces the downstream microservices by merging them into one monolithic service"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Суть BFF — по одному серверному слою на тип клиента, где API подогнан под экраны и ограничения именно этого фронтенда; универсальный API Gateway, наоборот, предоставляет единый API сразу всем клиентам. Второй вариант неверен: gateway обычно один и общий, а BFF намеренно много и они разные — это не синонимы. Третий неверен: BFF — серверный компонент, а не клиентский код; название означает «backend, принадлежащий фронтенду», а не «выполняемый во фронтенде». Четвёртый неверен: BFF не заменяет downstream-сервисы, а вызывает и агрегирует их, оставляя их общими и независимыми.",
      "en": "The essence of a BFF is one server-side layer per client type, with the API fitted to that frontend's screens and constraints; a general-purpose API Gateway instead exposes a single API to all clients at once. The second option is wrong: a gateway is usually single and shared, whereas BFFs are deliberately multiple and distinct — they are not synonyms. The third is wrong: a BFF is a server-side component, not client code; the name means \"a backend owned by the frontend,\" not \"running inside the frontend.\" The fourth is wrong: a BFF does not replace the downstream services — it calls and aggregates them, leaving them shared and independent."
    }
  },
  {
    "id": "ms-bff-multiple",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "bff",
    "prompt": {
      "ru": "По какому принципу стоит решать, сколько заводить отдельных BFF?",
      "en": "By what principle should you decide how many separate BFFs to create?"
    },
    "options": {
      "ru": [
        "Заводить отдельный BFF там, где потребности пользовательского опыта действительно расходятся (например, веб против мобильного), группируя схожих клиентов",
        "Заводить по одному BFF на каждый downstream-микросервис, чтобы у каждого сервиса был свой фасад",
        "Всегда держать ровно один BFF на всё приложение, иначе теряется смысл паттерна",
        "Заводить новый BFF на каждый экземпляр клиента при масштабировании, чтобы распределить нагрузку"
      ],
      "en": [
        "Create a separate BFF where the user-experience needs genuinely diverge (e.g. web versus mobile), grouping similar clients together",
        "Create one BFF per downstream microservice, so every service has its own facade",
        "Always keep exactly one BFF for the whole application, otherwise the pattern loses its point",
        "Create a new BFF per client instance when scaling, to spread the load"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "По Newman граница BFF проводится по пользовательскому опыту: отдельный BFF нужен там, где нужды UI расходятся, а клиентов одного класса объединяют — так избегают и раздутого общего API, и бесконтрольного размножения сервисов. Второй вариант — классическое заблуждение: «один BFF на микросервис» превращает BFF в тонкие фасады сервисов и теряет саму идею заточки под клиента. Третий неверен: единственный BFF на всё возвращает к проблеме универсального API, который пытается угодить всем. Четвёртый путает логическую нарезку BFF по типам клиентов с горизонтальным масштабированием: рост нагрузки решается репликами одного BFF, а не новыми его разновидностями.",
      "en": "Per Newman, the BFF boundary is drawn along the user experience: you introduce a separate BFF where UI needs diverge and group clients of the same class together — this avoids both a bloated shared API and uncontrolled service proliferation. The second option is the classic misconception: \"one BFF per microservice\" turns BFFs into thin service facades and loses the whole idea of client tailoring. The third is wrong: a single BFF for everything brings back the general-purpose-API problem of trying to please everyone. The fourth confuses logically slicing BFFs by client type with horizontal scaling: load growth is handled by replicas of one BFF, not by new kinds of it."
    }
  },
  {
    "id": "ms-bff-ownership",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "bff",
    "prompt": {
      "ru": "Почему в подходе BFF команду-владельца обычно совмещают с командой соответствующего фронтенда?",
      "en": "Why does the BFF approach usually put the owning team together with the team of the corresponding frontend?"
    },
    "options": {
      "ru": [
        "Потому что фронтенд и его BFF меняются вместе под одни и те же экраны — общее владение убирает межкомандную координацию и ускоряет изменения",
        "Потому что фронтенд-разработчики дешевле бэкенд-разработчиков и так экономят бюджет",
        "Потому что BFF технически можно писать только на том же языке, что и фронтенд",
        "Потому что так downstream-сервисы автоматически становятся частью фронтенд-команды"
      ],
      "en": [
        "Because the frontend and its BFF change together for the same screens — shared ownership removes cross-team coordination and speeds up changes",
        "Because frontend developers are cheaper than backend developers, saving budget",
        "Because a BFF can technically only be written in the same language as the frontend",
        "Because it automatically makes the downstream services part of the frontend team"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "BFF существует, чтобы обслуживать конкретные экраны, поэтому его контракт меняется в ритме этого фронтенда; когда BFF владеет та же команда, изменение экрана и его backend'а делается без согласований с чужой командой — это прямое следствие закона Conway. Второй вариант неверен: мотив в скорости и автономии, а не в стоимости специалистов. Третий неверен: BFF — обычный серверный сервис и может быть написан на любом стеке, совпадение языков не требуется. Четвёртый неверен: downstream-сервисы остаются общими и принадлежат своим командам — BFF лишь вызывает их, но не поглощает.",
      "en": "A BFF exists to serve specific screens, so its contract changes at that frontend's cadence; when the same team owns the BFF, changing a screen and its backend happens without negotiating with another team — a direct consequence of Conway's Law. The second option is wrong: the motive is speed and autonomy, not the cost of specialists. The third is wrong: a BFF is an ordinary server-side service and can be written in any stack — matching languages is not required. The fourth is wrong: the downstream services stay shared and owned by their own teams — a BFF merely calls them, it doesn't absorb them."
    }
  },
  {
    "id": "ms-circuit-breaker-states",
    "type": "concept",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "circuit-breaker",
    "prompt": {
      "ru": "Circuit Breaker находится в состоянии Open после серии ошибок. Что произойдёт дальше по канонической схеме?",
      "en": "A Circuit Breaker is in the Open state after a run of errors. What happens next per the canonical scheme?"
    },
    "options": {
      "ru": [
        "Он остаётся в Open навсегда, пока сервис не перезапустят вручную",
        "Он сразу возвращается в Closed и снова пропускает весь трафик",
        "По истечении cooldown он переходит в Half-open и пропускает пробный вызов",
        "Он чередует Open и Closed, пропуская каждый второй запрос к зависимости"
      ],
      "en": [
        "It stays Open forever until the service is restarted by hand",
        "It returns straight to Closed and lets all traffic through again",
        "After the cooldown it moves to Half-open and lets a trial call through",
        "It alternates Open and Closed, letting every second request reach the dependency"
      ]
    },
    "correctIndex": 2,
    "explanation": {
      "ru": "Каноническая схема Nygard/Fowler: из Open по истечении cooldown breaker переходит в Half-open и пропускает ограниченное число пробных вызовов — успех замыкает цепь (Closed), провал снова размыкает (Open). Вариант «навсегда до ручного рестарта» неверен: смысл breaker в самовосстановлении без вмешательства. «Сразу в Closed» игнорирует Half-open — breaker не возвращает весь трафик, не убедившись, что зависимость жива. «Чередует Open/Closed на каждый запрос» — выдуманное поведение; переходами управляют порог ошибок и таймер cooldown, а не чётность запросов.",
      "en": "The canonical Nygard/Fowler scheme: from Open, once the cooldown elapses, the breaker moves to Half-open and lets a limited number of trial calls through — success closes the circuit (Closed), failure trips it Open again. \"Forever until a manual restart\" is wrong: the point of a breaker is self-recovery without intervention. \"Straight to Closed\" skips Half-open — the breaker won't restore all traffic before confirming the dependency is alive. \"Alternates Open/Closed per request\" is invented behavior; transitions are driven by the failure threshold and the cooldown timer, not by request parity."
    }
  },
  {
    "id": "ms-circuit-breaker-fail-fast-vs-retry",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "circuit-breaker",
    "prompt": {
      "ru": "Почему в состоянии Open Circuit Breaker сразу отклоняет вызовы (fail-fast) вместо повтора запроса к зависимости?",
      "en": "Why does a Circuit Breaker in the Open state reject calls immediately (fail-fast) instead of retrying the request to the dependency?"
    },
    "options": {
      "ru": [
        "Потому что повторные запросы к сервису всегда нарушают идемпотентность операции",
        "Fail-fast мгновенно освобождает вызывающего и не нагружает уже перегруженную зависимость лишними попытками",
        "Потому что fail-fast просто возвращает клиенту закэшированный последний успешный ответ",
        "Потому что повтор запроса допустим только на уровне API Gateway, но не в самом клиенте"
      ],
      "en": [
        "Because retries to the service always break the operation's idempotence",
        "Fail-fast frees the caller instantly and spares the already-overloaded dependency extra attempts",
        "Because fail-fast simply returns the last cached successful response to the client",
        "Because a retry is only allowed at the API Gateway level, never in the client itself"
      ]
    },
    "correctIndex": 1,
    "explanation": {
      "ru": "Смысл fail-fast: вызывающий получает ответ мгновенно, не вися на таймаутах и не удерживая потоки и соединения, а деградировавшая зависимость не получает новых запросов и может восстановиться. Слепой retry делает ровно обратное — добавляет нагрузку уже перегруженному сервису и держит ресурсы вызывающего занятыми, продлевая и усиливая отказ. Идемпотентность — отдельная забота retry-логики, а не причина размыкания цепи; повторы не «всегда» её нарушают. Кэширование последнего ответа — это fallback-стратегия, а не то, что делает сам breaker в Open. Уровень выполнения повтора (клиент или Gateway) к решению fail-fast отношения не имеет.",
      "en": "The point of fail-fast: the caller gets an answer instantly, without hanging on timeouts or holding threads and connections, while the degraded dependency receives no new requests and can recover. A blind retry does the exact opposite — it piles load onto an already-overloaded service and keeps the caller's resources tied up, prolonging and deepening the outage. Idempotence is a concern of retry logic, not the reason for tripping the circuit, and retries don't \"always\" break it. Caching the last response is a fallback strategy, not what the breaker itself does in Open. The level at which a retry runs (client or Gateway) is irrelevant to the fail-fast decision."
    }
  },
  {
    "id": "ms-circuit-breaker-identify",
    "type": "concept",
    "category": "microservices",
    "grade": "middle",
    "conceptId": "circuit-breaker",
    "prompt": {
      "ru": "Какой паттерн устойчивости реализует этот класс?",
      "en": "Which resilience pattern does this class implement?"
    },
    "code": {
      "lang": "typescript",
      "code": {
        "ru": "type State = \"closed\" | \"open\" | \"half-open\";\n\nclass Guard {\n  private state: State = \"closed\";\n  private failures = 0;\n  private openedAt = 0;\n  constructor(private threshold = 5, private cooldownMs = 30_000) {}\n\n  async run<T>(action: () => Promise<T>): Promise<T> {\n    if (this.state === \"open\") {\n      if (Date.now() - this.openedAt < this.cooldownMs)\n        throw new Error(\"rejected: failing fast\"); // не трогаем зависимость\n      this.state = \"half-open\"; // пробуем один вызов\n    }\n    try {\n      const r = await action();\n      this.failures = 0;\n      this.state = \"closed\"; // восстановилась\n      return r;\n    } catch (e) {\n      if (++this.failures >= this.threshold || this.state === \"half-open\") {\n        this.state = \"open\";\n        this.openedAt = Date.now();\n      }\n      throw e;\n    }\n  }\n}",
        "en": "type State = \"closed\" | \"open\" | \"half-open\";\n\nclass Guard {\n  private state: State = \"closed\";\n  private failures = 0;\n  private openedAt = 0;\n  constructor(private threshold = 5, private cooldownMs = 30_000) {}\n\n  async run<T>(action: () => Promise<T>): Promise<T> {\n    if (this.state === \"open\") {\n      if (Date.now() - this.openedAt < this.cooldownMs)\n        throw new Error(\"rejected: failing fast\"); // don't touch the dependency\n      this.state = \"half-open\"; // try a single call\n    }\n    try {\n      const r = await action();\n      this.failures = 0;\n      this.state = \"closed\"; // recovered\n      return r;\n    } catch (e) {\n      if (++this.failures >= this.threshold || this.state === \"half-open\") {\n        this.state = \"open\";\n        this.openedAt = Date.now();\n      }\n      throw e;\n    }\n  }\n}"
      }
    },
    "options": {
      "ru": [
        "Circuit Breaker",
        "Retry with exponential backoff",
        "Bulkhead",
        "Rate Limiter"
      ],
      "en": [
        "Circuit Breaker",
        "Retry with exponential backoff",
        "Bulkhead",
        "Rate Limiter"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Три состояния closed/open/half-open, счётчик ошибок с порогом, размыкание после превышения, cooldown и один пробный вызов с обратным замыканием при успехе — это в точности Circuit Breaker. Retry with backoff, наоборот, повторял бы неудавшийся вызов с растущими паузами, а не блокировал бы обращения к зависимости. Bulkhead изолировал бы ресурсы (пулы потоков/соединений) по разным зависимостям, ограничивая параллелизм, а не считал бы ошибки. Rate Limiter ограничивал бы частоту запросов независимо от того, сбоят они или нет, тогда как здесь переходы управляются именно результатами вызовов.",
      "en": "Three states closed/open/half-open, a failure counter with a threshold, tripping after it's exceeded, a cooldown, and a single trial call that closes the circuit on success — this is exactly a Circuit Breaker. Retry with backoff would instead re-attempt the failed call with growing pauses, not block access to the dependency. Bulkhead would isolate resources (thread/connection pools) per dependency to cap concurrency, not count errors. A Rate Limiter would cap request frequency regardless of whether calls fail, whereas here the transitions are driven precisely by call outcomes."
    }
  },
  {
    "id": "ms-bulkhead-purpose",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "bulkhead",
    "prompt": {
      "ru": "Какую основную задачу решает паттерн Bulkhead?",
      "en": "What is the primary purpose of the Bulkhead pattern?"
    },
    "options": {
      "ru": [
        "Изолирует ресурсы в отдельные пулы, чтобы перегрузка или отказ одной зависимости не исчерпали ресурсы и не обрушили весь сервис",
        "Обнаруживает отказавшую зависимость и временно прекращает вызовы к ней, давая ей восстановиться",
        "Повторяет неудавшийся вызов несколько раз с нарастающей задержкой, пока он не завершится успешно",
        "Кэширует ответы зависимости, чтобы снизить число обращений к ней"
      ],
      "en": [
        "It isolates resources into separate pools so that an overload or failure of one dependency cannot exhaust resources and bring down the whole service",
        "It detects a failed dependency and temporarily stops calling it, giving it time to recover",
        "It retries a failed call several times with increasing delay until it succeeds",
        "It caches a dependency's responses to reduce the number of calls to it"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Bulkhead делит ресурсы на изолированные пулы, чтобы насыщение или отказ одной зависимости оставались заперты в её «отсеке» и не приводили к resource exhaustion всего сервиса. Вариант 2 описывает Circuit Breaker (размыкание цепи при ошибках), вариант 3 — Retry with backoff, вариант 4 — кэширование; все три решают другие задачи и не дают ресурсной изоляции между зависимостями.",
      "en": "Bulkhead partitions resources into isolated pools so that the saturation or failure of one dependency stays locked in its «compartment» and does not cause resource exhaustion across the whole service. Option 2 describes a Circuit Breaker (tripping on errors), option 3 is Retry with backoff, and option 4 is caching; all three solve different problems and provide no resource isolation between dependencies."
    }
  },
  {
    "id": "ms-bulkhead-vs-circuit-breaker",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "bulkhead",
    "prompt": {
      "ru": "Чем Bulkhead отличается от Circuit Breaker?",
      "en": "How does Bulkhead differ from Circuit Breaker?"
    },
    "options": {
      "ru": [
        "Bulkhead разделяет ресурсы на изолированные пулы, ограничивая радиус поражения; Circuit Breaker отслеживает частоту ошибок и размыкает цепь, прекращая вызовы к нездоровой зависимости",
        "Это одно и то же: оба размыкают цепь при превышении порога ошибок",
        "Bulkhead повторяет вызовы при сбое, а Circuit Breaker ограничивает число одновременных вызовов",
        "Bulkhead применяется только на стороне клиента, а Circuit Breaker — только на стороне сервера"
      ],
      "en": [
        "Bulkhead partitions resources into isolated pools to limit the blast radius; Circuit Breaker tracks the error rate and trips the circuit, stopping calls to an unhealthy dependency",
        "They are the same thing: both trip the circuit once an error threshold is crossed",
        "Bulkhead retries calls on failure, while Circuit Breaker limits the number of concurrent calls",
        "Bulkhead applies only on the client side, while Circuit Breaker applies only on the server side"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Это разные, взаимодополняющие паттерны. Bulkhead работает по осям ресурсов: изолирует пулы, чтобы сбой одной зависимости не забрал ресурсы других. Circuit Breaker работает по оси здоровья зависимости: считает ошибки и, превысив порог, размыкает цепь и быстро отклоняет вызовы, пока зависимость не восстановится. Вариант 2 их путает — Bulkhead ничего не «размыкает». Вариант 3 приписывает Bulkhead логику Retry, а ограничение одновременных вызовов — как раз функция Bulkhead, то есть роли перепутаны. Вариант 4 выдумывает привязку к клиенту/серверу: оба паттерна обычно применяются на вызывающей стороне и не привязаны так жёстко.",
      "en": "These are distinct, complementary patterns. Bulkhead works along the resource axis: it isolates pools so one dependency's failure cannot take resources from the others. Circuit Breaker works along the dependency-health axis: it counts errors and, once a threshold is crossed, trips the circuit and fails calls fast until the dependency recovers. Option 2 conflates them — Bulkhead «trips» nothing. Option 3 gives Bulkhead the Retry logic, while limiting concurrent calls is in fact Bulkhead's job, so the roles are swapped. Option 4 invents a client/server split: both patterns typically live on the calling side and are not bound that rigidly."
    }
  },
  {
    "id": "ms-bulkhead-ship-hull-analogy",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "bulkhead",
    "prompt": {
      "ru": "На какую аналогию опирается название паттерна Bulkhead (Michael Nygard, «Release It!»)?",
      "en": "What analogy does the name of the Bulkhead pattern draw on (Michael Nygard, «Release It!»)?"
    },
    "options": {
      "ru": [
        "Водонепроницаемые переборки корпуса корабля: пробоина затапливает лишь один отсек, а не всё судно",
        "Автоматический предохранитель в электрощите, размыкающий цепь при перегрузке",
        "Дамба, сдерживающая напор воды до критической отметки",
        "Многоуровневая система шлюзов, пропускающая суда по очереди"
      ],
      "en": [
        "The watertight bulkheads of a ship's hull: a breach floods only one compartment rather than the whole vessel",
        "An automatic fuse in an electrical panel that breaks the circuit on overload",
        "A dam that holds back the pressure of water up to a critical level",
        "A multi-stage system of locks that lets vessels through one at a time"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Название прямо отсылает к судостроению: корпус корабля делят водонепроницаемыми переборками (bulkheads), поэтому пробоина затапливает только повреждённый отсек, а не топит всё судно — так же изолированные пулы удерживают сбой в одной части системы. Вариант 2 — это аналогия Circuit Breaker (электрический предохранитель), а не Bulkhead. Варианты 3 и 4 (дамба, шлюзы) — правдоподобные «водные» образы, но к происхождению термина отношения не имеют.",
      "en": "The name is a direct reference to shipbuilding: a ship's hull is divided by watertight bulkheads, so a breach floods only the damaged compartment instead of sinking the whole vessel — just as isolated pools keep a fault contained to one part of the system. Option 2 is the analogy for Circuit Breaker (an electrical fuse), not Bulkhead. Options 3 and 4 (a dam, locks) are plausible «water» images but have nothing to do with the term's origin."
    }
  },
  {
    "id": "ms-sidecar-purpose",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "prompt": {
      "ru": "Какова основная цель паттерна Sidecar?",
      "en": "What is the primary purpose of the Sidecar pattern?"
    },
    "options": {
      "ru": [
        "Разбить приложение на независимо развёртываемые бизнес-сервисы",
        "Развернуть вспомогательный процесс рядом с основным сервисом, чтобы он взял на себя сквозные задачи (проксирование, TLS, телеметрию) без изменения кода приложения",
        "Маршрутизировать внешние запросы клиентов к внутренним сервисам через единую точку входа",
        "Кэшировать ответы ближе к клиенту, чтобы снизить задержку"
      ],
      "en": [
        "Split the application into independently deployable business services",
        "Deploy a helper process alongside the main service so it takes over cross-cutting concerns (proxying, TLS, telemetry) without changing the application code",
        "Route external client requests to internal services through a single entry point",
        "Cache responses closer to the client to reduce latency"
      ]
    },
    "correctIndex": 1,
    "explanation": {
      "ru": "Sidecar — это co-located вспомогательный процесс, который снимает с приложения сквозные заботы (прокси, TLS/mTLS, повторы, телеметрию), деля с ним под и сеть; приложение остаётся при чистой бизнес-логике. Первый вариант описывает декомпозицию на microservices — это про границы сервисов, а не про вынесение инфраструктуры в помощника. Третий вариант — это API Gateway: единая точка входа для внешних клиентов, тогда как sidecar сопровождает каждый экземпляр сервиса и работает с его собственным трафиком. Четвёртый — это кэш/CDN: снижение задержки за счёт близости данных, что не является сутью sidecar.",
      "en": "A sidecar is a co-located helper process that offloads cross-cutting concerns (proxy, TLS/mTLS, retries, telemetry) from the application, sharing its pod and network; the application is left with pure business logic. The first option describes microservices decomposition — that's about service boundaries, not about moving infrastructure into a helper. The third option is an API Gateway: a single entry point for external clients, whereas a sidecar accompanies each service instance and handles its own traffic. The fourth is a cache/CDN: reducing latency through data proximity, which is not the essence of a sidecar."
    },
    "conceptId": "sidecar"
  },
  {
    "id": "ms-sidecar-process-vs-library",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "senior",
    "prompt": {
      "ru": "Почему сквозную функциональность реализуют отдельным процессом-sidecar, а не встроенной в приложение библиотекой?",
      "en": "Why implement cross-cutting functionality as a separate sidecar process rather than as a library embedded in the application?"
    },
    "options": {
      "ru": [
        "Отдельный процесс устраняет сетевую задержку, потому что всё работает в одном поде",
        "Библиотека и sidecar функционально идентичны, и выбор между ними чисто стилистический",
        "Отдельный процесс не зависит от языка и обновляется/деплоится независимо от приложения — ценой лишнего локального хопа и накладных расходов на каждый экземпляр",
        "Sidecar избавляет service mesh от необходимости в control plane"
      ],
      "en": [
        "A separate process eliminates network latency because everything runs in the same pod",
        "A library and a sidecar are functionally identical, and the choice between them is purely stylistic",
        "A separate process is language-independent and is upgraded/deployed independently of the application — at the cost of an extra local hop and per-instance overhead",
        "A sidecar frees a service mesh from needing a control plane"
      ]
    },
    "correctIndex": 2,
    "explanation": {
      "ru": "Главный выигрыш отдельного процесса — независимость от языка (один sidecar для полиглотного парка) и независимый жизненный цикл (обновить прокси, не пересобирая приложение), а плата за это — дополнительный локальный хоп и расход ресурсов на каждый экземпляр; библиотека, наоборот, дешевле и без хопа, но привязана к языку и жизненному циклу сервиса. Первый вариант неверен: sidecar как раз добавляет локальный хоп (приложение → sidecar), а не устраняет задержку. Второй неверен: различия существенны — именно они и составляют компромисс. Четвёртый неверен: sidecar-прокси образуют data plane, но централизованная политика по-прежнему требует control plane (в Istio — istiod).",
      "en": "The main gain of a separate process is language independence (one sidecar for a polyglot fleet) and an independent lifecycle (upgrade the proxy without rebuilding the application), and the price is an extra local hop and per-instance resource cost; a library, conversely, is cheaper and hop-free but tied to the language and lifecycle of the service. The first option is wrong: a sidecar actually adds a local hop (application → sidecar) rather than eliminating latency. The second is wrong: the differences are substantial — they are precisely what forms the trade-off. The fourth is wrong: sidecar proxies form the data plane, but a centralized policy still requires a control plane (in Istio, istiod)."
    },
    "conceptId": "sidecar"
  },
  {
    "id": "ms-sidecar-service-mesh",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "prompt": {
      "ru": "Как паттерн Sidecar связан с service mesh?",
      "en": "How does the Sidecar pattern relate to a service mesh?"
    },
    "options": {
      "ru": [
        "Service mesh разворачивает sidecar-прокси рядом с каждым сервисом; парк этих прокси образует data plane, которым управляет центральный control plane",
        "Service mesh заменяет sidecar-и единым общим шлюзом на весь кластер",
        "Service mesh — это библиотека, слинкованная в каждый сервис, без отдельных процессов",
        "Sidecar и service mesh не связаны; mesh работает только на уровне базы данных"
      ],
      "en": [
        "A service mesh deploys a sidecar proxy next to every service; the fleet of those proxies forms the data plane, governed by a central control plane",
        "A service mesh replaces sidecars with a single shared gateway for the whole cluster",
        "A service mesh is a library linked into each service, with no separate processes",
        "Sidecars and a service mesh are unrelated; a mesh operates only at the database layer"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Service mesh — это прямое применение паттерна Sidecar в масштабе: рядом с каждым сервисом ставится sidecar-прокси (например, Envoy), все прокси вместе образуют data plane, а централизованный control plane (в Istio — istiod) раздаёт им политику mTLS, маршрутизации и наблюдаемости. Второй вариант описывает скорее модель единого gateway, а не mesh, где помощник сопровождает каждый экземпляр. Третий неверен: суть mesh именно в отдельных процессах-прокси, а не в библиотеке в коде. Четвёртый неверен: mesh управляет сетевым взаимодействием между сервисами, а не работой с базой данных.",
      "en": "A service mesh is a direct application of the Sidecar pattern at scale: a sidecar proxy (e.g., Envoy) is placed next to every service, all the proxies together form the data plane, and a centralized control plane (in Istio, istiod) hands them the policy for mTLS, routing, and observability. The second option describes more of a single-gateway model rather than a mesh, where a helper accompanies each instance. The third is wrong: the essence of a mesh is precisely the separate proxy processes, not an in-code library. The fourth is wrong: a mesh governs network interaction between services, not work with the database."
    },
    "conceptId": "sidecar"
  },
  {
    "id": "ms-saga-why-not-2pc",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "saga",
    "prompt": {
      "ru": "Почему в микросервисах предпочитают Saga, а не распределённую ACID-транзакцию через two-phase commit (2PC)?",
      "en": "Why do microservices prefer a Saga over a distributed ACID transaction via two-phase commit (2PC)?"
    },
    "options": {
      "ru": [
        "Каждый сервис владеет своей БД, а 2PC держит блокировки на всех участниках до конца операции, подрывая доступность и масштабируемость; Saga использует независимые локальные транзакции",
        "Saga даёт ту же изоляцию и ACID-гарантии, что и 2PC, только работает быстрее",
        "2PC в принципе невозможно реализовать в современных базах данных",
        "Saga вообще избавляет от необходимости согласованности данных между сервисами"
      ],
      "en": [
        "Each service owns its own database, and 2PC holds locks on all participants until the operation completes, undermining availability and scalability; a Saga uses independent local transactions instead",
        "A Saga provides the same isolation and ACID guarantees as 2PC, just faster",
        "2PC is fundamentally impossible to implement in modern databases",
        "A Saga removes the need for any data consistency between services altogether"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Главная причина — цена блокировок и связности: 2PC требует общего координатора и удержания блокировок на всех участниках до фиксации, что убивает доступность и масштабируемость распределённой системы, где у каждого сервиса своя БД. Saga заменяет это цепочкой локальных транзакций. Вариант про 'ту же изоляцию' неверен: Saga как раз жертвует изоляцией (ACD, а не ACID) и даёт eventual consistency. 2PC вполне реализуем (XA и др.) — дело не в невозможности, а в неприемлемой цене. 'Избавляет от согласованности' — тоже ошибка: Saga именно обеспечивает согласованность, но конечную (eventual), через компенсации.",
      "en": "The core reason is the cost of locking and coupling: 2PC needs a shared coordinator and holds locks on all participants until commit, which kills availability and scalability in a distributed system where each service owns its database. A Saga replaces this with a chain of local transactions. The 'same isolation' option is wrong: a Saga deliberately sacrifices isolation (ACD, not ACID) and yields eventual consistency. 2PC is quite implementable (XA and others) — the issue is unacceptable cost, not impossibility. 'Removes the need for consistency' is also wrong: a Saga still enforces consistency, but eventual consistency, via compensations."
    }
  },
  {
    "id": "ms-saga-compensating-action",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "saga",
    "prompt": {
      "ru": "Что такое компенсирующее действие (compensating transaction) в Saga?",
      "en": "What is a compensating action (compensating transaction) in a Saga?"
    },
    "options": {
      "ru": [
        "Отдельная локальная транзакция, семантически отменяющая эффект уже зафиксированного шага (например, возврат платежа), так как автоматического отката зафиксированных шагов нет",
        "Повторный запуск упавшего шага (retry) до тех пор, пока он не завершится успешно",
        "Команда ROLLBACK в БД, которая атомарно откатывает все шаги саги сразу",
        "Блокировка, не дающая другим транзакциям видеть промежуточное состояние саги"
      ],
      "en": [
        "A separate local transaction that semantically undoes the effect of an already-committed step (e.g. refund a charge), because committed steps cannot be rolled back automatically",
        "A retry of the failed step until it eventually succeeds",
        "A database ROLLBACK command that atomically reverts all steps of the saga at once",
        "A lock that prevents other transactions from seeing the saga's intermediate state"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Компенсация — это отдельная транзакция обратного действия, а не откат БД: платёж уже зафиксирован, поэтому его нельзя 'откатить', его можно только вернуть. Retry — это восстановление вперёд (forward recovery) для повторяемых шагов, а не отмена уже сделанного. Единого ROLLBACK на несколько сервисов не существует — именно поэтому и нужны компенсации. Блокировка от чужих чтений — это semantic lock, контрмера против отсутствия изоляции, а не определение компенсации.",
      "en": "A compensation is a separate reverse-action transaction, not a database rollback: the payment is already committed, so it cannot be 'rolled back' — it can only be refunded. A retry is forward recovery for retriable steps, not the undoing of something already done. There is no single ROLLBACK spanning several services — which is exactly why compensations are needed. A lock against others' reads is a semantic lock, a countermeasure for the lack of isolation, not the definition of a compensation."
    }
  },
  {
    "id": "ms-saga-orchestration-vs-choreography",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "saga",
    "prompt": {
      "ru": "Чем orchestration отличается от choreography как способ координации Saga?",
      "en": "What distinguishes orchestration from choreography as ways to coordinate a Saga?"
    },
    "options": {
      "ru": [
        "При orchestration центральный координатор командует шагами и хранит состояние саги; при choreography центрального координатора нет — каждый сервис реагирует на события и публикует свои, логика распределена между участниками",
        "Orchestration работает через события, а choreography — через синхронные RPC-вызовы",
        "Orchestration даёт ACID-гарантии, а choreography — только eventual consistency",
        "Choreography требует центрального координатора, а orchestration позволяет сервисам общаться напрямую peer-to-peer"
      ],
      "en": [
        "In orchestration a central coordinator commands the steps and holds the saga's state; in choreography there is no central coordinator — each service reacts to events and publishes its own, with logic distributed across participants",
        "Orchestration works through events, whereas choreography works through synchronous RPC calls",
        "Orchestration provides ACID guarantees while choreography provides only eventual consistency",
        "Choreography requires a central coordinator, while orchestration lets services talk directly peer-to-peer"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Ключевое различие — где живёт логика координации: в orchestration это центральный оркестратор, знающий весь сценарий и состояние саги; в choreography координатора нет, сервисы обмениваются событиями и каждый решает сам. Второй вариант путает механизм связи с моделью координации — обе модели обычно работают через асинхронные события. Третий неверен: оба подхода дают eventual consistency, ACID не появляется ни в одном. Четвёртый — инверсия: это как раз orchestration опирается на центральный компонент, а choreography — децентрализованная, event-driven.",
      "en": "The key difference is where the coordination logic lives: in orchestration it is a central orchestrator that knows the whole flow and the saga's state; in choreography there is no coordinator, services exchange events and each decides for itself. The second option confuses the communication mechanism with the coordination model — both typically run over asynchronous events. The third is wrong: both approaches yield eventual consistency, and ACID appears in neither. The fourth is inverted: it is orchestration that relies on a central component, while choreography is the decentralized, event-driven one."
    }
  },
  {
    "id": "ms-cqrs-vs-crud",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "prompt": {
      "ru": "Что фундаментально отличает CQRS от обычного CRUD-подхода с единой моделью?",
      "en": "What fundamentally distinguishes CQRS from a plain CRUD approach with a single model?"
    },
    "options": {
      "ru": [
        "Отдельные модели для записи и для чтения, каждую из которых можно оптимизировать и масштабировать независимо",
        "Наличие слоя сервисов между контроллерами и репозиторием",
        "Обязательное использование брокера сообщений для всех операций",
        "Хранение состояния в виде последовательности событий вместо строк таблицы"
      ],
      "en": [
        "Separate models for writing and for reading, each of which can be optimised and scaled independently",
        "The presence of a service layer between controllers and the repository",
        "Mandatory use of a message broker for all operations",
        "Storing state as a sequence of events instead of table rows"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Суть CQRS — разделение ответственности: командная сторона меняет состояние и держит инварианты, читающая сторона обслуживает запросы из отдельных projections, и каждую можно развивать и масштабировать независимо. В CRUD обе задачи решает одна модель. Вариант про слой сервисов описывает обычную многослойную архитектуру, а не CQRS. Брокер сообщений — лишь одна из возможных реализаций синхронизации, а не признак паттерна: CQRS работает и на одной общей БД синхронно. Хранение состояния как событий — это Event Sourcing, отдельный паттерн, который часто применяют вместе с CQRS, но он к нему не сводится.",
      "en": "The essence of CQRS is a split of responsibility: the command side changes state and holds invariants, the read side serves queries from separate projections, and each can evolve and scale independently. In CRUD a single model does both. The service-layer option describes ordinary layered architecture, not CQRS. A message broker is just one possible way to synchronise, not a hallmark of the pattern: CQRS works over a single shared database synchronously too. Storing state as events is Event Sourcing — a separate pattern often used together with CQRS but not equivalent to it."
    },
    "conceptId": "cqrs"
  },
  {
    "id": "ms-cqrs-not-event-sourcing",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "senior",
    "prompt": {
      "ru": "Как соотносятся CQRS и Event Sourcing?",
      "en": "How are CQRS and Event Sourcing related?"
    },
    "options": {
      "ru": [
        "Это независимые паттерны: CQRS разделяет модели чтения и записи и не требует хранить состояние как события; Event Sourcing — опциональное дополнение",
        "Это два названия одного и того же паттерна",
        "CQRS невозможно применить без хранилища событий (event store)",
        "Event Sourcing автоматически включает CQRS, поэтому отдельно CQRS не существует"
      ],
      "en": [
        "They are independent patterns: CQRS separates read and write models and does not require storing state as events; Event Sourcing is an optional complement",
        "They are two names for one and the same pattern",
        "CQRS cannot be applied without an event store",
        "Event Sourcing automatically includes CQRS, so CQRS does not exist on its own"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "CQRS и Event Sourcing — разные паттерны, которые хорошо сочетаются, но применимы порознь. CQRS лишь разделяет модели чтения и записи и может работать поверх обычной СУБД, без каких-либо событий. Event Sourcing хранит состояние как последовательность событий и часто использует CQRS для построения read-моделей, но обратной зависимости нет. Поэтому неверно называть их одним паттерном, требовать event store для CQRS или утверждать, что CQRS не существует отдельно: их часто путают именно потому, что Greg Young описывал их вместе.",
      "en": "CQRS and Event Sourcing are different patterns that pair well but apply separately. CQRS merely separates the read and write models and can run over an ordinary database, with no events at all. Event Sourcing stores state as a sequence of events and often uses CQRS to build read models, but there is no reverse dependency. So it is wrong to call them one pattern, to require an event store for CQRS, or to claim CQRS does not exist on its own: they are commonly conflated precisely because Greg Young described them together."
    },
    "conceptId": "cqrs"
  },
  {
    "id": "ms-cqrs-identify-scaling",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "prompt": {
      "ru": "Код разводит обработку на командную и читающую стороны над одними данными. Какой это паттерн и в чём его главный выигрыш?",
      "en": "The code splits handling into a command side and a query side over the same data. Which pattern is this, and what is its main payoff?"
    },
    "code": {
      "lang": "typescript",
      "code": {
        "ru": "class OrderCommandHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  place(cmd: PlaceOrder): void { /* меняет состояние, проецирует в read-модель */ }\n}\n\nclass OrderQueryHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  byId(id: string): OrderSummary | undefined { return this.readModel.get(id); }\n}",
        "en": "class OrderCommandHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  place(cmd: PlaceOrder): void { /* mutates state, projects into the read model */ }\n}\n\nclass OrderQueryHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  byId(id: string): OrderSummary | undefined { return this.readModel.get(id); }\n}"
      }
    },
    "options": {
      "ru": [
        "CQRS — модель записи и модель чтения можно оптимизировать и масштабировать независимо",
        "Repository — скрывает источник данных за коллекциеподобным интерфейсом",
        "Event Sourcing — состояние восстанавливается воспроизведением сохранённых событий",
        "Saga — координация длительной распределённой транзакции между сервисами"
      ],
      "en": [
        "CQRS — the write model and the read model can be optimised and scaled independently",
        "Repository — hides the data source behind a collection-like interface",
        "Event Sourcing — state is reconstructed by replaying stored events",
        "Saga — coordination of a long-running distributed transaction across services"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Разделение на OrderCommandHandler (меняет состояние) и OrderQueryHandler (только читает) над отдельной read-моделью — это CQRS, и его ключевой выигрыш в том, что стороны чтения и записи оптимизируются и масштабируются независимо. Repository — это единый интерфейс доступа к данным, он не разделяет чтение и запись на разные модели. Event Sourcing описывал бы хранение и воспроизведение событий, чего в коде нет — здесь read-модель обновляется проекцией, а не replay-ем. Saga решает совсем другую задачу — согласованность длительной транзакции между сервисами.",
      "en": "Splitting into OrderCommandHandler (mutates state) and OrderQueryHandler (reads only) over a separate read model is CQRS, and its key payoff is that the read and write sides are optimised and scaled independently. Repository is a single data-access interface; it does not split reads and writes into separate models. Event Sourcing would involve storing and replaying events, which is absent here — the read model is updated by projection, not by replay. Saga addresses a different problem entirely — consistency of a long-running transaction across services."
    },
    "conceptId": "cqrs"
  },
  {
    "id": "ms-event-sourcing-1",
    "type": "concept",
    "category": "microservices",
    "grade": "lead",
    "conceptId": "event-sourcing",
    "prompt": {
      "ru": "Чем Event Sourcing принципиально отличается от классического хранения только текущего состояния?",
      "en": "How does Event Sourcing fundamentally differ from the classic approach of storing only the current state?"
    },
    "options": {
      "ru": [
        "Текущее состояние по-прежнему хранится в таблице, а рядом дополнительно ведётся отдельный лог изменений для аудита",
        "Единственный источник истины — append-only последовательность неизменяемых событий, а текущее состояние выводится их воспроизведением",
        "Это способ кэширования: события держат в памяти, чтобы ускорить чтение текущего состояния из таблицы",
        "События полностью заменяют базу данных, поэтому восстановить из них текущее состояние уже невозможно"
      ],
      "en": [
        "The current state is still kept in a table, with a separate change log maintained alongside it for auditing",
        "The single source of truth is an append-only sequence of immutable events, and the current state is derived by replaying them",
        "It is a caching technique: events are held in memory to speed up reading the current state from a table",
        "Events fully replace the database, so the current state can no longer be reconstructed from them"
      ]
    },
    "correctIndex": 1,
    "explanation": {
      "ru": "Верен второй вариант: в Event Sourcing источник истины — сам append-only лог неизменяемых событий, а текущее состояние не хранится, а выводится сворачиванием лога в проекцию. Первый вариант — самая частая подмена: там источником истины остаётся таблица с текущим состоянием, а лог изменений лишь пристёгнут сбоку и может незаметно разойтись с данными; в Event Sourcing же состояние вторично и всегда согласовано с событиями, потому что выводится из них. Третий неверен: события — это долговременный источник истины, а не кэш для ускорения чтения (наоборот, чтение обычно требует воспроизведения или проекции). Четвёртый противоречит сути паттерна: именно из событий текущее состояние и восстанавливается.",
      "en": "The second option is correct: in Event Sourcing the source of truth is the append-only log of immutable events itself, and the current state is not stored but derived by folding the log into a projection. The first option is the most common substitution: there the source of truth remains the current-state table, while the change log is merely bolted on and can silently drift out of sync with the data; in Event Sourcing the state is secondary and always consistent with the events because it is derived from them. The third is wrong: events are a durable source of truth, not a cache for faster reads (on the contrary, reading usually requires replay or a projection). The fourth contradicts the essence of the pattern: the current state is precisely what gets reconstructed from the events."
    }
  },
  {
    "id": "ms-event-sourcing-2",
    "type": "concept",
    "category": "microservices",
    "grade": "lead",
    "conceptId": "event-sourcing",
    "prompt": {
      "ru": "Какое свойство даёт именно Event Sourcing и которого нельзя получить, храня только текущее состояние?",
      "en": "Which capability does Event Sourcing specifically provide that you cannot get by storing only the current state?"
    },
    "options": {
      "ru": [
        "Мгновенное чтение текущего состояния вообще без каких-либо вычислений",
        "Возможность восстановить состояние системы на любой момент прошлого и получить полный неизменяемый журнал аудита, переиграв лог событий",
        "Автоматическую строгую согласованность (strong consistency) всех моделей чтения без задержки",
        "Гарантию, что любые данные можно физически удалить в любой момент по требованию"
      ],
      "en": [
        "Instant reading of the current state with no computation whatsoever",
        "The ability to reconstruct the system's state at any past moment and obtain a complete, immutable audit trail by replaying the event log",
        "Automatic strong consistency of all read models with no delay",
        "A guarantee that any data can be physically deleted at any moment on demand"
      ]
    },
    "correctIndex": 1,
    "explanation": {
      "ru": "Верен второй вариант: поскольку сохранён каждый факт-изменение, лог можно переиграть до любой точки и получить состояние на тот момент (temporal query), а сам append-only лог является достоверным журналом аудита. Первый вариант описывает преимущество хранения снимка, а не Event Sourcing: как раз в Event Sourcing чтение обычно требует воспроизведения лога или отдельной проекции (для ускорения нужны snapshots). Третий неверен: проекции обновляются асинхронно, поэтому характерна eventual consistency, а не строгая согласованность. Четвёртый противоречит паттерну: append-only модель принципиально не удаляет события, и право на забвение приходится реализовывать обходными приёмами вроде crypto-shredding.",
      "en": "The second option is correct: because every change-fact is stored, the log can be replayed up to any point to obtain the state as of that moment (a temporal query), and the append-only log itself is a trustworthy audit trail. The first option describes an advantage of storing a snapshot, not of Event Sourcing: in Event Sourcing reading typically requires replaying the log or a separate projection (snapshots are needed to speed it up). The third is wrong: projections update asynchronously, so eventual consistency—not strong consistency—is characteristic. The fourth contradicts the pattern: the append-only model fundamentally does not delete events, and the right to erasure has to be implemented with workarounds such as crypto-shredding."
    }
  },
  {
    "id": "ms-event-sourcing-3",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "lead",
    "conceptId": "event-sourcing",
    "prompt": {
      "ru": "Почему Event Sourcing так часто применяют в паре с CQRS?",
      "en": "Why is Event Sourcing so often applied together with CQRS?"
    },
    "options": {
      "ru": [
        "CQRS обязателен: без него события в принципе невозможно сохранить в event store",
        "Лог событий неудобен для произвольных запросов, поэтому CQRS строит из него отдельные оптимизированные модели чтения (проекции), разделяя запись событий и чтение",
        "CQRS устраняет eventual consistency, делая проекции строго согласованными с логом событий",
        "CQRS позволяет обновлять уже записанные события на месте, что упрощает их версионирование"
      ],
      "en": [
        "CQRS is mandatory: without it events cannot be persisted to an event store at all",
        "The event log is awkward for arbitrary queries, so CQRS builds separate optimized read models (projections) from it, separating the writing of events from reading",
        "CQRS eliminates eventual consistency by making projections strongly consistent with the event log",
        "CQRS lets you update already-written events in place, which simplifies their versioning"
      ]
    },
    "correctIndex": 1,
    "explanation": {
      "ru": "Верен второй вариант: по append-only логу неудобно выполнять произвольные запросы, а CQRS как раз разделяет команду (запись событий) и запрос (чтение), позволяя строить под чтение отдельные оптимизированные проекции — они естественно наполняются из потока событий. Первый вариант неверен: Event Sourcing работает и без CQRS, это самостоятельный паттерн хранения; они лишь хорошо дополняют друг друга. Третий неверен: разделение чтения и записи не убирает eventual consistency — наоборот, проекции читают асинхронно и отстают от лога. Четвёртый противоречит основе Event Sourcing: события неизменяемы и на месте не обновляются, а версионирование решают через upcasting и версии схемы, а не через правку событий.",
      "en": "The second option is correct: an append-only log is awkward for arbitrary queries, and CQRS is precisely what separates the command (writing events) from the query (reading), letting you build separate read-optimized projections that are naturally populated from the event stream. The first option is wrong: Event Sourcing works without CQRS—it is a standalone storage pattern; the two simply complement each other well. The third is wrong: separating reads from writes does not remove eventual consistency—on the contrary, projections are read asynchronously and lag behind the log. The fourth contradicts the foundation of Event Sourcing: events are immutable and are not updated in place, and versioning is handled through upcasting and schema versions, not by editing events."
    }
  },
  {
    "id": "ms-anti-corruption-layer-purpose",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "anti-corruption-layer",
    "prompt": {
      "ru": "Какова главная цель Anti-Corruption Layer в терминах Domain-Driven Design?",
      "en": "What is the primary purpose of an Anti-Corruption Layer in Domain-Driven Design terms?"
    },
    "options": {
      "ru": [
        "Прекращать вызовы к внешней системе, когда она начинает слишком часто падать, чтобы избежать каскадных отказов",
        "Кэшировать ответы медленного внешнего сервиса, чтобы снизить задержку домена",
        "Не дать модели легаси- или внешней системы просочиться в ваш домен, транслируя её в термины вашей модели на границе",
        "Собрать несколько бэкенд-сервисов за единой точкой входа, чтобы клиент делал один запрос"
      ],
      "en": [
        "Stop calls to the external system when it starts failing too often, to avoid cascading failures",
        "Cache responses from a slow external service to reduce domain latency",
        "Keep a legacy or external system's model from leaking into your domain by translating it into your model's terms at the boundary",
        "Aggregate several backend services behind a single entry point so the client makes one request"
      ]
    },
    "correctIndex": 2,
    "explanation": {
      "ru": "Суть ACL по Эвансу — изолирующий слой-переводчик, который защищает целостность вашей модели, не пропуская чужие понятия внутрь домена. Первый вариант описывает Circuit Breaker (отказоустойчивость), а не защиту модели. Второй — кэширование: тоже возможная функция границы, но не назначение ACL. Четвёртый — API Gateway/Facade: агрегация вызовов, а не трансляция модели между bounded contexts.",
      "en": "The essence of an ACL per Evans is an isolating translation layer that protects your model's integrity by keeping foreign concepts out of the domain. The first option describes a Circuit Breaker (fault tolerance), not model protection. The second is caching — a possible boundary responsibility, but not the ACL's purpose. The fourth is an API Gateway/Facade: call aggregation, not translation of the model between bounded contexts."
    }
  },
  {
    "id": "ms-anti-corruption-layer-vs-direct",
    "type": "tradeoff",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "anti-corruption-layer",
    "prompt": {
      "ru": "Почему стоит ввести ACL вместо того, чтобы обращаться к модели внешней системы напрямую и маппить её поля прямо в доменном коде?",
      "en": "Why introduce an ACL instead of calling the external system's model directly and mapping its fields inline throughout the domain code?"
    },
    "options": {
      "ru": [
        "Потому что всё знание о чужой модели и её причудах запирается на одной границе: домен эволюционирует независимо, а изменения внешнего контракта затрагивают только ACL",
        "Потому что прямая интеграция невозможна, если внешняя система использует другой транспортный протокол",
        "Потому что ACL убирает сетевой вызов, поэтому прямая интеграция всегда медленнее",
        "Потому что прямая интеграция нарушает инкапсуляцию только тогда, когда внешняя система написана на другом языке"
      ],
      "en": [
        "Because all knowledge of the foreign model and its quirks is confined to one boundary: the domain evolves independently, and changes to the external contract touch only the ACL",
        "Because direct integration is impossible when the external system uses a different transport protocol",
        "Because the ACL removes the network call, so direct integration is always slower",
        "Because direct integration violates encapsulation only when the external system is written in another language"
      ]
    },
    "correctIndex": 0,
    "explanation": {
      "ru": "Ценность ACL — локализация: чужая модель не расползается по домену, а точка изменения при смене внешнего контракта одна. Второй вариант ложен: прямая интеграция технически возможна при любом транспорте — проблема не в протоколе, а в протекании модели. Третий неверен: ACL не устраняет сетевой вызов (он всё равно идёт к внешней системе) и добавляет маппинг, а не убирает задержку. Четвёртый выдумывает несуществующее условие: порча домена не зависит от языка внешней системы.",
      "en": "The ACL's value is localization: the foreign model doesn't spread across the domain, and there is a single point of change when the external contract shifts. The second option is false: direct integration is technically possible over any transport — the problem is model leakage, not the protocol. The third is wrong: the ACL doesn't remove the network call (it still reaches the external system) and adds mapping rather than cutting latency. The fourth invents a condition that doesn't exist: domain corruption is independent of the external system's language."
    }
  },
  {
    "id": "ms-anti-corruption-layer-adapter",
    "type": "concept",
    "category": "microservices",
    "grade": "senior",
    "conceptId": "anti-corruption-layer",
    "prompt": {
      "ru": "Как Anti-Corruption Layer соотносится с паттерном Adapter?",
      "en": "How does the Anti-Corruption Layer relate to the Adapter pattern?"
    },
    "options": {
      "ru": [
        "ACL и Adapter никак не связаны: Adapter меняет поведение, а ACL — только формат данных",
        "ACL — частный случай Adapter, который обязан быть реализован одним классом",
        "Adapter работает между bounded contexts, тогда как ACL действует только внутри одного класса",
        "ACL — это масштабирование идеи Adapter до уровня архитектуры: как и Adapter, он транслирует на границе, но защищает модель целого bounded context, часто объединяя адаптеры, фасады и собственные translators, а не преобразует интерфейс одного класса"
      ],
      "en": [
        "ACL and Adapter are unrelated: Adapter changes behavior, while an ACL only changes data formats",
        "An ACL is a special case of Adapter that must always be implemented as a single class",
        "Adapter works between bounded contexts, whereas an ACL operates only within a single class",
        "An ACL scales the Adapter idea up to the architectural level: like Adapter it translates at a boundary, but it protects a whole bounded context's model — often combining adapters, facades, and its own translators — rather than converting one class's interface"
      ]
    },
    "correctIndex": 3,
    "explanation": {
      "ru": "Adapter (GoF) преобразует интерфейс одного класса к ожидаемому; ACL берёт ту же идею трансляции на границе и поднимает её до уровня bounded context, защищая целую модель и обычно состоя из нескольких адаптеров, фасадов и объектов-переводчиков. Первый вариант неверен: оба про трансляцию на границе, и Adapter не «меняет поведение» (это Decorator/Proxy). Второй ошибочен: ACL не обязан быть одним классом — обычно это целый слой. Третий переворачивает роли: это ACL живёт между bounded contexts, а Adapter — точечный, на уровне класса.",
      "en": "Adapter (GoF) converts one class's interface to the expected one; the ACL takes that same boundary-translation idea and raises it to the bounded-context level, protecting a whole model and typically comprising several adapters, facades, and translator objects. The first option is wrong: both are about boundary translation, and Adapter doesn't 'change behavior' (that's Decorator/Proxy). The second is mistaken: an ACL need not be a single class — it's usually a whole layer. The third reverses the roles: it's the ACL that lives between bounded contexts, while Adapter is a localized, class-level device."
    }
  }
];
