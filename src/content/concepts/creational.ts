import type { Concept, Question } from '../schema';

export const creational: Concept[] = [
  {
    id: "singleton",
    name: "Singleton",
    category: "creational",
    grade: "junior",
    tagline: {
      ru: "Один экземпляр класса и глобальная точка доступа к нему",
      en: "A single instance of a class and a global point of access to it",
    },
    definition: {
      ru: "Гарантирует, что у класса есть только один экземпляр, и предоставляет глобальную точку доступа к нему. Класс сам управляет собственным жизненным циклом: приватный конструктор запрещает создание через new снаружи, а статический метод-аксессор либо лениво создаёт единственный экземпляр при первом обращении, либо возвращает уже существующий. Важная оговорка: многие инженеры сегодня считают классический Singleton скорее анти-паттерном по сравнению с DI-скоуп-синглтоном — сервисом, который создаётся один раз в контейнере зависимостей и явно передаётся туда, где нужен, вместо скрытого глобального доступа.",
      en: "Ensures that a class has only one instance and provides a global point of access to it. The class manages its own lifecycle: a private constructor forbids instantiation via new from the outside, and a static accessor method either lazily creates the single instance on first access or returns the one that already exists. An important caveat: many engineers today consider the classic Singleton more of an anti-pattern compared to a DI-scoped singleton — a service created once inside a dependency-injection container and passed explicitly to wherever it's needed, instead of relying on hidden global access.",
    },
    problem: {
      ru: "Некоторые объекты должны существовать в системе ровно в одном экземпляре — конфигурация, логгер, пул соединений с базой данных. Обычный класс никак не мешает создать несколько его экземпляров через new: ничто не запрещает второй, третий и так далее вызов конструктора, и в системе появляются рассинхронизированные копии состояния. Наивная альтернатива — хранить единственный экземпляр в глобальной переменной модуля — тоже не решает проблему: ничто не мешает создать ещё один экземпляр и присвоить его той же переменной, глобальное пространство имён засоряется, а порядок инициализации между модулями не гарантирован. Нужен способ, при котором сам класс контролирует своё создание и гарантирует единственность независимо от того, как и когда к нему обращается клиентский код.",
      en: "Some objects should exist in the system in exactly one instance — configuration, a logger, a database connection pool. An ordinary class does nothing to stop several instances from being created via new: nothing forbids a second, third, or further call to the constructor, and the system ends up with out-of-sync copies of state. A naive alternative — keeping the single instance in a module-level global variable — doesn't solve the problem either: nothing prevents creating another instance and reassigning it to that same variable, the global namespace gets cluttered, and initialization order across modules isn't guaranteed. What's needed is a way for the class itself to control its own creation and guarantee uniqueness no matter how or when client code reaches for it.",
    },
    solution: {
      ru: "Класс сам контролирует своё создание: конструктор объявляется приватным, чтобы запретить new извне, а статический метод getInstance() лениво создаёт экземпляр при первом обращении и при всех последующих вызовах возвращает один и тот же объект, хранящийся в приватном статическом поле. Такая ленивая инициализация экономит ресурсы, если экземпляр может и не понадобиться. В многопоточной среде наивная реализация уязвима к состоянию гонки: два потока могут одновременно пройти проверку instance === null и создать два разных экземпляра, поэтому промышленные реализации используют блокировку, double-checked locking или заранее созданный (eager) статический экземпляр, инициализируемый до старта потоков. В JavaScript/TypeScript в браузере и Node.js однопоточная модель выполнения снимает эту проблему для синхронного кода, но она возвращается при работе с воркерами или несколькими процессами. Современная альтернатива — не делать класс ответственным за собственную единственность, а создать один экземпляр в композиционном корне приложения и передавать его через конструктор (dependency injection); DI-контейнер тогда играет роль явного, тестируемого «синглтона в рамках scope», а не скрытого глобального состояния.",
      en: "The class controls its own creation: the constructor is made private to forbid new from the outside, and a static getInstance() method lazily creates the instance on first access, returning that same object — held in a private static field — on every subsequent call. This lazy initialization saves resources when the instance might never be needed. In a multithreaded environment, a naive implementation is vulnerable to a race condition: two threads can simultaneously pass the instance === null check and create two different instances, so production implementations use locking, double-checked locking, or an eager static instance created before any threads start. In JavaScript/TypeScript, the single-threaded execution model in the browser and Node.js removes this problem for synchronous code, but it reappears when working with workers or multiple processes. A more modern alternative is to stop making the class responsible for its own uniqueness at all: create one instance in the application's composition root and pass it in via the constructor (dependency injection); a DI container then plays the role of an explicit, testable \"scoped singleton\" instead of hidden global state.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "class AppConfig {",
          "  private static instance: AppConfig | null = null;",
          "  private readonly settings = new Map<string, string>();",
          "",
          "  private constructor() {} // прямое создание через new запрещено",
          "",
          "  static getInstance(): AppConfig {",
          "    if (AppConfig.instance === null) {",
          "      AppConfig.instance = new AppConfig(); // ленивая инициализация",
          "    }",
          "    return AppConfig.instance;",
          "  }",
          "",
          "  set(key: string, value: string) { this.settings.set(key, value); }",
          "  get(key: string) { return this.settings.get(key); }",
          "}",
          "",
          "const a = AppConfig.getInstance();",
          "const b = AppConfig.getInstance();",
          "console.log(a === b); // true — экземпляр один на всю программу",
        ].join('\n'),
        en: [
          "class AppConfig {",
          "  private static instance: AppConfig | null = null;",
          "  private readonly settings = new Map<string, string>();",
          "",
          "  private constructor() {} // direct instantiation via new is forbidden",
          "",
          "  static getInstance(): AppConfig {",
          "    if (AppConfig.instance === null) {",
          "      AppConfig.instance = new AppConfig(); // lazy initialization",
          "    }",
          "    return AppConfig.instance;",
          "  }",
          "",
          "  set(key: string, value: string) { this.settings.set(key, value); }",
          "  get(key: string) { return this.settings.get(key); }",
          "}",
          "",
          "const a = AppConfig.getInstance();",
          "const b = AppConfig.getInstance();",
          "console.log(a === b); // true — a single instance for the entire program",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Гарантированно один экземпляр класса",
        "Единая точка доступа вместо разбросанных глобальных переменных",
        "Ленивая инициализация: экземпляр создаётся только при первом обращении",
        "Экономит ресурсы по сравнению с eager-созданием на старте приложения, если тяжёлый экземпляр может вообще не понадобиться",
      ],
      en: [
        "Guarantees a single instance of the class",
        "A single point of access instead of scattered global variables",
        "Lazy initialization: the instance is created only on first access",
        "Saves resources compared to eager creation at application startup, when an expensive instance might never be needed at all",
      ],
    },
    cons: {
      ru: [
        "Скрытая глобальная зависимость: обращение к Singleton не видно в сигнатурах",
        "Затрудняет модульное тестирование — экземпляр сложно подменить моком",
        "Нарушает SRP: класс отвечает и за свою логику, и за контроль своего жизненного цикла",
        "Разделяемое изменяемое состояние требует осторожности в конкурентной среде",
      ],
      en: [
        "A hidden global dependency: use of the singleton is invisible in method signatures",
        "Makes unit testing harder — the instance is difficult to replace with a mock",
        "Violates the Single Responsibility Principle: the class is responsible both for its own logic and for controlling its own lifecycle",
        "Shared mutable state requires care in a concurrent environment",
      ],
    },
    tradeoffs: {
      ru: [
        "Удобство глобального доступа против скрытых зависимостей и роста связанности",
        "Гарантия единственности против тестируемости: подменить экземпляр в тестах трудно",
        "Ленивая инициализация экономит ресурсы, но в многопоточной среде требует дополнительной синхронизации (блокировок), которая усложняет код и может стать узким местом",
      ],
      en: [
        "The convenience of global access versus hidden dependencies and growing coupling",
        "Guaranteed uniqueness versus testability: replacing the instance in tests is hard",
        "Lazy initialization saves resources, but in a multithreaded environment it requires extra synchronization (locking), which complicates the code and can become a bottleneck",
      ],
    },
    whenToUse: {
      ru: [
        "В системе должен быть ровно один экземпляр объекта, доступный из разных мест (конфигурация, логгер, пул соединений)",
        "Нужен контролируемый ленивый доступ к разделяемому ресурсу",
        "Создание экземпляра дорого, а само наличие экземпляра нужно не всегда — выгодна ленивая инициализация вместо создания на старте приложения",
      ],
      en: [
        "The system must have exactly one instance of an object, accessible from many places (configuration, a logger, a connection pool)",
        "You need controlled, lazy access to a shared resource",
        "Creating the instance is expensive and it isn't always needed — lazy initialization pays off compared to creating it eagerly at startup",
      ],
    },
    whenNotToUse: {
      ru: [
        "Единственность не является реальным требованием — достаточно создать один экземпляр и передать его через конструктор (внедрение зависимостей)",
        "Код должен легко тестироваться с подменой зависимости моками",
        "Приложение многопоточное или многопроцессное, а наивный ленивый Singleton без синхронизации создаёт риск состояния гонки — надёжнее eager-инициализация или DI-контейнер со своим управлением жизненным циклом",
      ],
      en: [
        "Uniqueness is not a genuine requirement — it is enough to create one instance and pass it in through the constructor (dependency injection)",
        "The code needs to be easily testable by substituting the dependency with mocks",
        "The application is multithreaded or multi-process, and a naive lazy Singleton without synchronization risks a race condition — eager initialization or a DI container with its own lifecycle management is safer",
      ],
    },
    related: [
      "factory-method",
      "abstract-factory",
      "flyweight",
      "dip",
    ],
    tags: [
      "паттерны",
      "порождающие",
    ],
    diagram: `classDiagram
  class Singleton {
    -static instance: Singleton
    -Singleton()
    +static getInstance() Singleton
    +operation()
  }
  Singleton --> Singleton : getInstance() returns the same instance`,
  },
  {
    id: "builder",
    name: "Builder",
    category: "creational",
    grade: "middle",
    tagline: {
      ru: "Пошаговая сборка сложного объекта, отделённая от его представления",
      en: "Step-by-step construction of a complex object, decoupled from its representation",
    },
    definition: {
      ru: "Отделяет конструирование сложного объекта от его представления, так что один и тот же процесс пошаговой сборки может создавать разные представления. Вместо того чтобы передавать все параметры сразу в конструктор, клиент запрашивает у отдельного объекта-строителя выполнение шагов конфигурирования в удобном порядке, а готовый продукт получает только вызовом финального метода build(). Часто процесс сборки дополнительно инкапсулируют в объекте Director, который знает конкретные последовательности шагов для типовых конфигураций продукта.",
      en: "Separates the construction of a complex object from its representation, so that the same step-by-step construction process can create different representations. Instead of passing every parameter into a constructor at once, the client asks a separate builder object to perform configuration steps in whatever order is convenient, and only obtains the finished product by calling a final build() method. The construction process is often further encapsulated in a Director object, which knows the specific sequences of steps for common product configurations.",
    },
    problem: {
      ru: "Конструктор сложного объекта разрастается: множество параметров, часть из них необязательна, и появляются «телескопические» перегрузки конструктора — одна с двумя аргументами, другая с пятью, третья с десятью, отличающиеся только тем, какие необязательные части заданы. Клиентский код вынужден передавать длинные списки аргументов, часть из которых — заглушки вроде null или undefined, и помнить точный порядок всех частей объекта. Кроме того, один и тот же набор шагов сборки нельзя переиспользовать для получения разных представлений продукта (например, HTML- и PDF-версии одного документа) — под каждое представление пришлось бы писать отдельный конструктор или фабричный метод.",
      en: "A complex object's constructor grows out of control: many parameters, some of them optional, and \"telescoping\" constructor overloads start to appear — one with two arguments, another with five, a third with ten, differing only in which optional parts are supplied. Client code is forced to pass long argument lists, some of them placeholder nulls or undefined values, and to remember the exact order of every part of the object. Moreover, the same sequence of construction steps can't be reused to produce different representations of the product (say, an HTML and a PDF version of the same document) — each representation would need its own constructor or factory method.",
    },
    solution: {
      ru: "Выносим процесс сборки в отдельный объект Builder: он предоставляет методы для пошаговой настройки частей продукта и метод build(), возвращающий готовый объект. Клиент вызывает только нужные шаги в удобном порядке; один и тот же процесс сборки может давать разные представления, а продукт можно сделать неизменяемым — он появляется только целиком в момент build(). Для типовых конфигураций поверх строителя можно завести отдельный класс Director, который знает готовые последовательности шагов (например, buildMinimalRequest() или buildFullRequest()) и избавляет клиента от необходимости помнить порядок вызовов самостоятельно; сам строитель при этом остаётся переиспользуемым для нестандартных сценариев, где Director не подходит. В отличие от Factory Method, который одним вызовом решает, какой класс продукта создать, Builder решает другую задачу — пошагово собрать части одного сложного продукта, и оба паттерна нередко комбинируют: фабрика может возвращать нужный строитель.",
      en: "Move the construction process into a separate Builder object: it exposes methods for configuring the product's parts step by step, plus a build() method that returns the finished object. The client calls only the steps it needs, in whatever order is convenient; the same construction process can yield different representations, and the product can be made immutable — it comes into existence only as a whole, at the moment build() is called. For common configurations, a separate Director class can sit on top of the builder, knowing ready-made sequences of steps (e.g. buildMinimalRequest() or buildFullRequest()) so the client doesn't have to remember the call order itself; the builder remains reusable on its own for non-standard scenarios where the Director doesn't fit. Unlike Factory Method, which decides in a single call which product class to create, Builder solves a different problem — assembling the parts of one complex product step by step — and the two patterns are often combined: a factory can return the right builder.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface HttpRequest {",
          "  readonly method: string;",
          "  readonly url: string;",
          "  readonly headers: Record<string, string>;",
          "  readonly body?: string;",
          "}",
          "",
          "class HttpRequestBuilder {",
          "  private headers: Record<string, string> = {};",
          "  private body?: string;",
          "  constructor(private method: string, private url: string) {}",
          "  setHeader(name: string, value: string): this { this.headers[name] = value; return this; }",
          "  setBody(body: string): this { this.body = body; return this; }",
          "  build(): HttpRequest { // продукт появляется только целиком, в конце сборки",
          "    return { method: this.method, url: this.url, headers: { ...this.headers }, body: this.body };",
          "  }",
          "}",
          "",
          "const request = new HttpRequestBuilder('POST', '/api/users')",
          "  .setHeader('Content-Type', 'application/json')",
          "  .setBody(JSON.stringify({ name: 'Ann' }))",
          "  .build(); // сложный объект собран пошагово, без телескопического конструктора",
        ].join('\n'),
        en: [
          "interface HttpRequest {",
          "  readonly method: string;",
          "  readonly url: string;",
          "  readonly headers: Record<string, string>;",
          "  readonly body?: string;",
          "}",
          "",
          "class HttpRequestBuilder {",
          "  private headers: Record<string, string> = {};",
          "  private body?: string;",
          "  constructor(private method: string, private url: string) {}",
          "  setHeader(name: string, value: string): this { this.headers[name] = value; return this; }",
          "  setBody(body: string): this { this.body = body; return this; }",
          "  build(): HttpRequest { // the product appears only as a whole, at the end of construction",
          "    return { method: this.method, url: this.url, headers: { ...this.headers }, body: this.body };",
          "  }",
          "}",
          "",
          "const request = new HttpRequestBuilder('POST', '/api/users')",
          "  .setHeader('Content-Type', 'application/json')",
          "  .setBody(JSON.stringify({ name: 'Ann' }))",
          "  .build(); // the complex object is assembled step by step, without a telescoping constructor",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Избавляет от телескопических конструкторов с длинными списками параметров",
        "Пошаговая сборка: необязательные части задаются только при необходимости",
        "Один процесс конструирования может создавать разные представления продукта",
        "Продукт можно сделать неизменяемым — он возникает целиком в момент build()",
      ],
      en: [
        "Eliminates telescoping constructors with long parameter lists",
        "Step-by-step construction: optional parts are set only when needed",
        "A single construction process can create different representations of the product",
        "The product can be made immutable — it comes into existence as a whole at the moment build() is called",
      ],
    },
    cons: {
      ru: [
        "Дополнительный класс-строитель на каждый сложный продукт",
        "Больше кода для простых объектов по сравнению с обычным конструктором",
        "До вызова build() строитель находится в промежуточном, потенциально неполном состоянии",
      ],
      en: [
        "An extra builder class for every complex product",
        "More code for simple objects compared to a plain constructor",
        "Until build() is called, the builder is in an intermediate, potentially incomplete state",
      ],
    },
    tradeoffs: {
      ru: [
        "Читаемость и гибкость сборки против дополнительного класса и объёма кода",
        "Контроль над этапами конструирования против риска забыть обязательный шаг до build()",
        "Fluent-интерфейс с возвратом this улучшает читаемость цепочки вызовов, но в языках со строгой типизацией усложняет типы при наследовании строителей (self-returning type в подклассах)",
      ],
      en: [
        "Readability and flexibility of construction versus an extra class and more code",
        "Control over the construction steps versus the risk of forgetting a required step before build()",
        "A fluent interface that returns this improves the readability of chained calls, but in strictly typed languages it complicates the types when builders are subclassed (the self-returning-type problem)",
      ],
    },
    whenToUse: {
      ru: [
        "У объекта много параметров, значительная часть которых необязательна",
        "Объект нужно собирать пошагово, а не задавать всё сразу в конструкторе",
        "Один процесс сборки должен порождать разные представления продукта",
      ],
      en: [
        "The object has many parameters, a significant portion of which are optional",
        "The object needs to be assembled step by step rather than specified all at once in a constructor",
        "A single construction process must produce different representations of the product",
      ],
    },
    whenNotToUse: {
      ru: [
        "Объект простой, параметров мало — достаточно конструктора или объектного литерала",
        "В TypeScript хватает объектного литерала с опциональными полями и значениями по умолчанию",
        "Нужно лишь выбрать один из готовых вариантов продукта по типу, без пошаговой настройки его частей — тогда достаточно Factory Method или Abstract Factory",
      ],
      en: [
        "The object is simple with few parameters — a constructor or object literal is enough",
        "In TypeScript, an object literal with optional fields and default values is sufficient",
        "You only need to pick one of the ready-made product variants by type, without step-by-step configuration of its parts — Factory Method or Abstract Factory is enough",
      ],
    },
    related: [
      "abstract-factory",
      "factory-method",
      "prototype",
      "composite",
    ],
    tags: [
      "паттерны",
      "порождающие",
    ],
    diagram: `classDiagram
  class Director {
    +construct(builder)
  }
  class HttpRequestBuilder {
    +setHeader(name, value) this
    +setBody(body) this
    +build() HttpRequest
  }
  class HttpRequest {
    +method
    +url
    +headers
    +body
  }
  Director --> HttpRequestBuilder : directs
  HttpRequestBuilder ..> HttpRequest : creates`,
  },
  {
    id: "prototype",
    name: "Prototype",
    aka: [
      "Clone",
    ],
    category: "creational",
    grade: "middle",
    tagline: {
      ru: "Новые объекты создаются копированием прототипического экземпляра",
      en: "New objects are created by copying a prototypical instance",
    },
    definition: {
      ru: "Задаёт виды создаваемых объектов с помощью прототипического экземпляра и создаёт новые объекты путём копирования этого прототипа, а не повторного прохождения инициализации через конструктор. Копирование может быть поверхностным (shallow) — когда вложенные объекты остаются общими для оригинала и копии — или глубоким (deep), когда рекурсивно клонируется весь граф вложенных объектов; выбор глубины копирования — ключевое архитектурное решение паттерна. Набор преднастроенных прототипов часто хранят в реестре (prototype registry), из которого клиент запрашивает нужный образец по ключу.",
      en: "Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype rather than re-running initialization through a constructor. The copy can be shallow — where nested objects remain shared between the original and the copy — or deep, where the entire graph of nested objects is recursively cloned; choosing the copy depth is the pattern's key architectural decision. A set of pre-configured prototypes is often kept in a prototype registry, from which the client requests the needed sample by key.",
    },
    problem: {
      ru: "Нужно создавать копии объектов, но клиент не должен зависеть от их конкретных классов. Собрать точную копию снаружи невозможно или дорого: часть состояния скрыта в приватных полях, а инициализация (запросы к БД, сети, тяжёлые вычисления) слишком затратна, чтобы повторять её для каждого экземпляра. В отличие от Factory, которая создаёт объект «с нуля» по описанию класса, здесь нужен именно готовый образец с уже накопленным состоянием — сама постановка задачи предполагает, что где-то в системе есть подходящий экземпляр, который дешевле скопировать, чем воссоздать заново с той же конфигурацией.",
      en: "You need to produce copies of objects, but the client shouldn't depend on their concrete classes. Reconstructing an exact copy from the outside is impossible or expensive: some of the state is hidden in private fields, and initialization (database or network requests, heavy computation) is too costly to repeat for every instance. Unlike a Factory, which builds an object \"from scratch\" from a class description, here what's needed is precisely a ready-made sample with already-accumulated state — the problem itself presumes that somewhere in the system there's a suitable instance that's cheaper to copy than to recreate with the same configuration.",
    },
    solution: {
      ru: "Делегируем копирование самому объекту: объявляем общий интерфейс с методом clone(), и каждый класс сам создаёт свою копию — у него есть доступ к собственным приватным полям. Клиент работает только с интерфейсом и получает копию, не зная конкретного класса; преднастроенные экземпляры-прототипы служат образцами для тиражирования. Набор именованных прототипов удобно хранить в реестре (например, Map<string, Shape>), откуда клиент получает нужный образец по ключу и клонирует его — это заменяет разрастание фабричных методов под каждую конфигурацию продукта. В отличие от Factory Method, где новый объект строится с нуля по классу, здесь новый объект получается из уже существующего состояния, что оправдано, когда инициализация (сетевые запросы, чтение файлов, тяжёлые вычисления) дороже самого копирования.",
      en: "Delegate the copying to the object itself: declare a common interface with a clone() method, and let each class create its own copy — it has access to its own private fields. The client works only with the interface and gets a copy without knowing the concrete class; pre-configured prototype instances serve as templates for mass-producing new objects. A set of named prototypes is conveniently kept in a registry (e.g. Map<string, Shape>), from which the client fetches the needed sample by key and clones it — this replaces a proliferation of factory methods for every product configuration. Unlike Factory Method, where a new object is built from scratch from a class, here a new object is obtained from already-existing state, which pays off when initialization (network requests, file reads, heavy computation) is more expensive than the copy itself.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface Shape {",
          "  clone(): Shape; // объект сам умеет создавать свою копию",
          "}",
          "",
          "class Circle implements Shape {",
          "  constructor(public x: number, public y: number, public radius: number) {}",
          "  clone(): Circle {",
          "    return new Circle(this.x, this.y, this.radius);",
          "  }",
          "}",
          "",
          "class Rectangle implements Shape {",
          "  constructor(public x: number, public y: number, public width: number, public height: number) {}",
          "  clone(): Rectangle {",
          "    return new Rectangle(this.x, this.y, this.width, this.height);",
          "  }",
          "}",
          "",
          "// клиент копирует объект, не зная его конкретного класса",
          "function duplicate(shape: Shape): Shape {",
          "  return shape.clone();",
          "}",
          "",
          "const original = new Circle(10, 20, 5);",
          "const copy = duplicate(original); // независимая копия с тем же состоянием",
        ].join('\n'),
        en: [
          "interface Shape {",
          "  clone(): Shape; // the object knows how to create its own copy",
          "}",
          "",
          "class Circle implements Shape {",
          "  constructor(public x: number, public y: number, public radius: number) {}",
          "  clone(): Circle {",
          "    return new Circle(this.x, this.y, this.radius);",
          "  }",
          "}",
          "",
          "class Rectangle implements Shape {",
          "  constructor(public x: number, public y: number, public width: number, public height: number) {}",
          "  clone(): Rectangle {",
          "    return new Rectangle(this.x, this.y, this.width, this.height);",
          "  }",
          "}",
          "",
          "// the client copies the object without knowing its concrete class",
          "function duplicate(shape: Shape): Shape {",
          "  return shape.clone();",
          "}",
          "",
          "const original = new Circle(10, 20, 5);",
          "const copy = duplicate(original); // an independent copy with the same state",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Копирование объектов без привязки клиента к их конкретным классам",
        "Экономит дорогую инициализацию: копировать преднастроенный экземпляр дешевле, чем создавать с нуля",
        "Преднастроенные прототипы заменяют разрастание подклассов ради разных конфигураций",
        "Прототипы можно регистрировать и подменять в рантайме",
      ],
      en: [
        "Copies objects without coupling the client to their concrete classes",
        "Saves expensive initialization: copying a pre-configured instance is cheaper than building one from scratch",
        "Pre-configured prototypes replace a proliferation of subclasses created just for different configurations",
        "Prototypes can be registered and swapped at runtime",
      ],
    },
    cons: {
      ru: [
        "Корректно клонировать объекты с циклическими ссылками и сложным графом зависимостей трудно",
        "Каждый класс обязан реализовать clone(), и ошибка в выборе глубины копирования (shallow против deep) даёт разделяемое мутабельное состояние",
        "В TypeScript/JavaScript нет встроенной поддержки клонирования — clone() приходится писать и поддерживать вручную в каждом классе, и легко забыть обновить его при добавлении нового поля",
      ],
      en: [
        "Correctly cloning objects with circular references and a complex dependency graph is hard",
        "Every class is obligated to implement clone(), and getting the copy depth wrong (shallow vs. deep) leaves you with shared mutable state",
        "TypeScript/JavaScript has no built-in cloning support — clone() must be written and maintained by hand in every class, and it's easy to forget to update it when a new field is added",
      ],
    },
    tradeoffs: {
      ru: [
        "Поверхностная копия быстрее, но копии делят вложенные объекты; глубокая — независима, но дороже и сложнее в реализации",
        "Гибкость конфигурирования объектов в рантайме против обязанности поддерживать корректный clone() в каждом классе",
        "Prototype дёшево копирует уже существующее состояние, но требует поддерживать clone() в каждом классе; Factory Method строит объект с нуля по классу — не даёт выигрыша на инициализации, зато не несёт риска случайно расшаренного состояния",
      ],
      en: [
        "A shallow copy is faster, but the copies share their nested objects; a deep copy is independent, but more expensive and harder to implement",
        "Flexibility to configure objects at runtime vs. the obligation to maintain a correct clone() in every class",
        "Prototype cheaply copies already-existing state but requires maintaining clone() in every class; Factory Method builds the object from scratch from a class — no win on initialization cost, but no risk of accidentally shared state either",
      ],
    },
    whenToUse: {
      ru: [
        "Код не должен зависеть от конкретных классов копируемых объектов",
        "Создание объекта с нуля дорого, а копия преднастроенного экземпляра даёт тот же результат дешевле",
        "Нужно много вариантов объекта, различающихся лишь состоянием — реестр прототипов вместо иерархии подклассов",
      ],
      en: [
        "Your code must not depend on the concrete classes of the objects it copies",
        "Creating an object from scratch is expensive, and copying a pre-configured instance yields the same result more cheaply",
        "You need many variants of an object that differ only in state — a registry of prototypes instead of a hierarchy of subclasses",
      ],
    },
    whenNotToUse: {
      ru: [
        "Объектов мало и создание тривиально — достаточно прямого new",
        "Состояние объекта содержит сложные внешние ссылки (соединения, дескрипторы), которые нельзя осмысленно скопировать",
        "Инициализация объекта дешева и не требует внешних ресурсов — тогда обычная фабрика или прямой new проще, чем писать и поддерживать clone()",
      ],
      en: [
        "There are few objects and creating them is trivial — a direct new is enough",
        "The object's state holds complex external references (connections, handles) that can't be meaningfully copied",
        "Initializing the object is cheap and needs no external resources — a plain factory or direct new is simpler than writing and maintaining clone()",
      ],
    },
    related: [
      "factory-method",
      "abstract-factory",
      "memento",
    ],
    tags: [
      "паттерны",
      "порождающие",
    ],
    diagram: `classDiagram
  class Shape {
    <<interface>>
    +clone() Shape
  }
  class Circle {
    +radius
    +clone() Circle
  }
  class Rectangle {
    +width
    +height
    +clone() Rectangle
  }
  class PrototypeRegistry {
    -prototypes: Map~string, Shape~
    +register(key, prototype)
    +create(key) Shape
  }
  Shape <|.. Circle
  Shape <|.. Rectangle
  PrototypeRegistry o--> Shape : stores`,
  },
];

export const creationalQuestions: Question[] = [
  {
    id: "c-singleton-1",
    type: "concept",
    category: "creational",
    grade: "junior",
    prompt: {
      ru: "Что гарантирует паттерн Singleton?",
      en: "What does the Singleton pattern guarantee?",
    },
    options: {
      ru: [
        "Класс создаёт семейства связанных объектов, не указывая их конкретных классов",
        "У класса существует только один экземпляр, и к нему предоставляется глобальная точка доступа",
        "Множество мелких объектов экономит память за счёт разделения общего состояния",
        "Создание объекта делегируется подклассам, которые решают, какой тип инстанцировать",
      ],
      en: [
        "A class creates families of related objects without specifying their concrete classes",
        "A class has only one instance, and a global point of access to it is provided",
        "A large number of fine-grained objects save memory by sharing common state",
        "Object creation is delegated to subclasses, which decide which type to instantiate",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "По GoF, Singleton гарантирует единственность экземпляра класса и даёт глобальную точку доступа к нему — обычно через приватный конструктор и статический метод getInstance(). Первый вариант описывает Abstract Factory (семейства связанных продуктов). Третий — Flyweight (разделение внутреннего состояния между множеством объектов ради экономии памяти). Четвёртый — Factory Method (выбор конкретного типа продукта отдан подклассам).",
      en: "Per GoF, Singleton guarantees that a class has a single instance and provides a global point of access to it — typically through a private constructor and a static getInstance() method. The first option describes Abstract Factory (families of related products). The third is Flyweight (sharing intrinsic state across many objects to save memory). The fourth is Factory Method (the choice of the concrete product type is deferred to subclasses).",
    },
    conceptId: "singleton",
  },
  {
    id: "ip-singleton-1",
    type: "identify-pattern",
    category: "creational",
    grade: "junior",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "class Logger {",
          "  private static instance: Logger | null = null;",
          "  private readonly lines: string[] = [];",
          "",
          "  private constructor() {} // конструктор скрыт: new Logger() извне недоступен",
          "",
          "  static getInstance(): Logger {",
          "    if (Logger.instance === null) {",
          "      Logger.instance = new Logger(); // создаётся один раз",
          "    }",
          "    return Logger.instance;",
          "  }",
          "",
          "  log(message: string) { this.lines.push(message); }",
          "  history(): readonly string[] { return this.lines; }",
          "}",
          "",
          "const first = Logger.getInstance();",
          "const second = Logger.getInstance();",
          "console.log(first === second); // true — оба указывают на один объект",
        ].join('\n'),
        en: [
          "class Logger {",
          "  private static instance: Logger | null = null;",
          "  private readonly lines: string[] = [];",
          "",
          "  private constructor() {} // constructor is hidden: new Logger() is inaccessible from the outside",
          "",
          "  static getInstance(): Logger {",
          "    if (Logger.instance === null) {",
          "      Logger.instance = new Logger(); // created only once",
          "    }",
          "    return Logger.instance;",
          "  }",
          "",
          "  log(message: string) { this.lines.push(message); }",
          "  history(): readonly string[] { return this.lines; }",
          "}",
          "",
          "const first = Logger.getInstance();",
          "const second = Logger.getInstance();",
          "console.log(first === second); // true — both point to the same object",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Flyweight",
        "Abstract Factory",
        "Singleton",
        "Facade",
      ],
      en: [
        "Flyweight",
        "Abstract Factory",
        "Singleton",
        "Facade",
      ],
    },
    correctIndex: 2,
    explanation: {
      ru: "Приватный конструктор запрещает создание через new, статическое поле хранит единственный экземпляр, а getInstance() лениво создаёт его один раз и всегда возвращает тот же объект (first === second) — это Singleton. Не Flyweight: там множество мелких объектов экономит память, разделяя общее внутреннее состояние, а здесь объект ровно один и никакое состояние между объектами не разделяется. Не Abstract Factory: нет фабрики, создающей семейство связанных продуктов по интерфейсу, — метод возвращает сам класс, а не набор продуктов. Не Facade: Logger не даёт упрощённый интерфейс к сложной подсистеме — он сам и есть единственный объект, а не обёртка над другими.",
      en: "The private constructor forbids creation via new, the static field holds the single instance, and getInstance() lazily creates it once and always returns the same object (first === second) — this is Singleton. Not Flyweight: there, many fine-grained objects save memory by sharing common intrinsic state, whereas here there is exactly one object and no state is shared between objects. Not Abstract Factory: there is no factory that creates a family of related products behind an interface — the method returns the class itself, not a set of products. Not Facade: Logger does not provide a simplified interface to a complex subsystem — it is itself the single object, not a wrapper over others.",
    },
    conceptId: "singleton",
  },
  {
    id: "c-builder-1",
    type: "concept",
    category: "creational",
    grade: "middle",
    prompt: {
      ru: "Какова основная цель паттерна Builder?",
      en: "What is the main purpose of the Builder pattern?",
    },
    options: {
      ru: [
        "Предоставить интерфейс для создания семейств связанных объектов без указания их конкретных классов",
        "Создавать новые объекты копированием существующего экземпляра-прототипа",
        "Отделить конструирование сложного объекта от его представления, чтобы один процесс сборки мог создавать разные представления",
        "Делегировать выбор конкретного класса создаваемого объекта подклассам через переопределяемый метод",
      ],
      en: [
        "Provide an interface for creating families of related objects without specifying their concrete classes",
        "Create new objects by copying an existing prototype instance",
        "Separate the construction of a complex object from its representation, so that the same construction process can create different representations",
        "Delegate the choice of the concrete class to instantiate to subclasses through an overridable method",
      ],
    },
    correctIndex: 2,
    explanation: {
      ru: "По GoF, Builder отделяет конструирование сложного объекта от его представления: клиент задаёт части пошагово, а один и тот же процесс сборки может давать разные представления. Первый вариант — определение Abstract Factory (семейства связанных продуктов). Второй — Prototype (создание через копирование экземпляра). Четвёртый — Factory Method (подкласс решает, какой класс инстанцировать).",
      en: "Per GoF, Builder separates the construction of a complex object from its representation: the client specifies the parts step by step, and the same construction process can yield different representations. The first option is the definition of Abstract Factory (families of related products). The second is Prototype (creation by copying an instance). The fourth is Factory Method (a subclass decides which class to instantiate).",
    },
    conceptId: "builder",
  },
  {
    id: "ip-builder-1",
    type: "identify-pattern",
    category: "creational",
    grade: "middle",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "interface Query { readonly sql: string; readonly params: unknown[]; }",
          "",
          "class QueryBuilder {",
          "  private table = '';",
          "  private conditions: string[] = [];",
          "  private params: unknown[] = [];",
          "  from(table: string): this { this.table = table; return this; }",
          "  where(cond: string, param: unknown): this { // очередной шаг сборки",
          "    this.conditions.push(cond);",
          "    this.params.push(param);",
          "    return this;",
          "  }",
          "  build(): Query { // готовый объект появляется только в конце",
          "    const where = this.conditions.length ? ` WHERE ${this.conditions.join(' AND ')}` : '';",
          "    return { sql: `SELECT * FROM ${this.table}${where}`, params: [...this.params] };",
          "  }",
          "}",
          "",
          "const query = new QueryBuilder()",
          "  .from('users')",
          "  .where('age > ?', 18)",
          "  .where('active = ?', true)",
          "  .build(); // объект собран пошагово из необязательных частей",
        ].join('\n'),
        en: [
          "interface Query { readonly sql: string; readonly params: unknown[]; }",
          "",
          "class QueryBuilder {",
          "  private table = '';",
          "  private conditions: string[] = [];",
          "  private params: unknown[] = [];",
          "  from(table: string): this { this.table = table; return this; }",
          "  where(cond: string, param: unknown): this { // the next construction step",
          "    this.conditions.push(cond);",
          "    this.params.push(param);",
          "    return this;",
          "  }",
          "  build(): Query { // the finished object appears only at the end",
          "    const where = this.conditions.length ? ` WHERE ${this.conditions.join(' AND ')}` : '';",
          "    return { sql: `SELECT * FROM ${this.table}${where}`, params: [...this.params] };",
          "  }",
          "}",
          "",
          "const query = new QueryBuilder()",
          "  .from('users')",
          "  .where('age > ?', 18)",
          "  .where('active = ?', true)",
          "  .build(); // the object is assembled step by step from optional parts",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Factory Method",
        "Builder",
        "Prototype",
        "Abstract Factory",
      ],
      en: [
        "Factory Method",
        "Builder",
        "Prototype",
        "Abstract Factory",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Объект Query собирается пошагово вызовами from() и where(), число шагов задаёт клиент, а готовый продукт появляется только при вызове build() — это Builder. Не Factory Method: нет иерархии с переопределяемым фабричным методом, где подкласс выбирает конкретный класс продукта. Не Prototype: объект не создаётся копированием существующего экземпляра. Не Abstract Factory: не порождается семейство связанных продуктов через набор фабричных методов — конструируется один сложный объект по частям.",
      en: "The Query object is assembled step by step through calls to from() and where(), the client decides how many steps to take, and the finished product appears only when build() is called — this is Builder. Not Factory Method: there is no hierarchy with an overridable factory method where a subclass chooses the concrete product class. Not Prototype: the object is not created by copying an existing instance. Not Abstract Factory: no family of related products is produced through a set of factory methods — a single complex object is constructed part by part.",
    },
    conceptId: "builder",
  },
  {
    id: "c-prototype-1",
    type: "concept",
    category: "creational",
    grade: "middle",
    prompt: {
      ru: "Как точнее всего описать суть паттерна Prototype?",
      en: "Which statement most accurately captures the essence of the Prototype pattern?",
    },
    options: {
      ru: [
        "Определяет интерфейс создания объекта, но позволяет подклассам решать, какой класс инстанцировать",
        "Задаёт виды создаваемых объектов через прототипический экземпляр и создаёт новые объекты копированием этого прототипа",
        "Гарантирует, что у класса есть только один экземпляр, и предоставляет к нему глобальную точку доступа",
        "Отделяет конструирование сложного объекта от его представления, позволяя строить его пошагово",
      ],
      en: [
        "Defines an interface for creating an object, but lets subclasses decide which class to instantiate",
        "Specifies the kinds of objects to create using a prototypical instance, and creates new objects by copying this prototype",
        "Ensures a class has only one instance and provides a global point of access to it",
        "Separates the construction of a complex object from its representation, allowing it to be built step by step",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Prototype по GoF: виды создаваемых объектов задаются прототипическим экземпляром, а новые объекты получаются его копированием — объект сам клонирует себя через clone(), и клиент не зависит от конкретных классов. Первый вариант — определение Factory Method (создание делегируется подклассам через переопределение метода). Третий — Singleton (единственный экземпляр и глобальный доступ). Четвёртый — Builder (пошаговое конструирование сложного объекта). Только второй вариант описывает создание через копирование существующего экземпляра.",
      en: "Prototype in GoF terms: the kinds of objects to create are specified by a prototypical instance, and new objects are obtained by copying it — the object clones itself through clone(), and the client doesn't depend on concrete classes. The first option is the definition of Factory Method (creation is delegated to subclasses by overriding a method). The third is Singleton (a single instance with global access). The fourth is Builder (step-by-step construction of a complex object). Only the second option describes creation by copying an existing instance.",
    },
    conceptId: "prototype",
  },
  {
    id: "ip-prototype-1",
    type: "identify-pattern",
    category: "creational",
    grade: "middle",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "interface Cloneable { clone(): Cloneable; }",
          "",
          "class Enemy implements Cloneable {",
          "  constructor(",
          "    private health: number,",
          "    private speed: number,",
          "    private loot: string[],",
          "  ) {}",
          "  clone(): Enemy {",
          "    return new Enemy(this.health, this.speed, [...this.loot]); // копия с тем же состоянием",
          "  }",
          "}",
          "",
          "class Spawner {",
          "  constructor(private sample: Enemy) {} // прототипический экземпляр",
          "  spawn(): Enemy {",
          "    return this.sample.clone(); // новые объекты — копированием прототипа",
          "  }",
          "}",
          "",
          "const boss = new Enemy(500, 1.2, ['gold', 'sword']);",
          "const spawner = new Spawner(boss);",
          "const enemy1 = spawner.spawn();",
          "const enemy2 = spawner.spawn(); // независимые копии",
        ].join('\n'),
        en: [
          "interface Cloneable { clone(): Cloneable; }",
          "",
          "class Enemy implements Cloneable {",
          "  constructor(",
          "    private health: number,",
          "    private speed: number,",
          "    private loot: string[],",
          "  ) {}",
          "  clone(): Enemy {",
          "    return new Enemy(this.health, this.speed, [...this.loot]); // a copy with the same state",
          "  }",
          "}",
          "",
          "class Spawner {",
          "  constructor(private sample: Enemy) {} // the prototypical instance",
          "  spawn(): Enemy {",
          "    return this.sample.clone(); // new objects — by copying the prototype",
          "  }",
          "}",
          "",
          "const boss = new Enemy(500, 1.2, ['gold', 'sword']);",
          "const spawner = new Spawner(boss);",
          "const enemy1 = spawner.spawn();",
          "const enemy2 = spawner.spawn(); // independent copies",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Builder",
        "Prototype",
        "Memento",
        "Factory Method",
      ],
      en: [
        "Builder",
        "Prototype",
        "Memento",
        "Factory Method",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Enemy сам создаёт свою копию методом clone() (имея доступ к приватным полям), а Spawner тиражирует новые объекты копированием преднастроенного прототипического экземпляра — это Prototype. Не Builder: нет пошагового конструирования сложного объекта через цепочку шагов и финальный build() — копия создаётся одним вызовом. Не Memento: состояние не сохраняется в снимок для последующего восстановления того же объекта — создаются новые независимые объекты. Не Factory Method: нет базового класса с фабричным методом, который переопределяют подклассы, — объект порождается копированием готового экземпляра, а не через new в подклассе.",
      en: "Enemy creates its own copy via the clone() method (having access to its private fields), and Spawner mass-produces new objects by copying a pre-configured prototypical instance — this is Prototype. Not Builder: there is no step-by-step construction of a complex object through a chain of steps and a final build() — the copy is created in a single call. Not Memento: state isn't saved into a snapshot to later restore the same object — new independent objects are created. Not Factory Method: there is no base class with a factory method that subclasses override — the object is produced by copying a ready-made instance rather than via new in a subclass.",
    },
    conceptId: "prototype",
  },
];
