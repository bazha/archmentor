import type { Concept } from '../schema';

export const solid: Concept[] = [
  {
    id: "srp",
    name: "Single Responsibility Principle",
    aka: [
      "SRP",
    ],
    category: "solid",
    grade: "junior",
    tagline: {
      ru: "У модуля должна быть одна причина для изменения",
      en: "A module should have one reason to change",
    },
    definition: {
      ru: "Модуль должен отвечать перед одним и только одним актором. Иначе говоря, у класса должна быть одна и только одна причина для изменения — он инкапсулирует одну ответственность.",
      en: "A module should be responsible to one, and only one, actor. Put another way, a class should have one and only one reason to change — it encapsulates a single responsibility.",
    },
    problem: {
      ru: "Класс, который считает зарплату, форматирует отчёт и сохраняет данные в БД, меняется по трём независимым причинам: бухгалтерия, отдел отчётности и DBA. Правка ради одного актора рискует сломать логику другого, а тестировать такой класс тяжело.",
      en: "A class that calculates pay, formats a report, and persists data to the database changes for three independent reasons: accounting, the reporting department, and the DBA. A change made for one actor risks breaking logic that belongs to another, and a class like this is hard to test.",
    },
    solution: {
      ru: "Разделяем ответственности на отдельные классы: расчёт, хранение и форматирование. Каждый класс меняется независимо и отвечает перед своим актором.",
      en: "Split the responsibilities into separate classes: calculation, persistence, and formatting. Each class changes independently and is responsible to its own actor.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "// Нарушение: три причины для изменения в одном классе",
          "class Employee {",
          "  calculatePay() { /* правила бухгалтерии */ }",
          "  save() { /* схема БД */ }",
          "  describeInReport() { /* формат отчёта */ }",
          "}",
          "",
          "// SRP: каждая ответственность в своём классе",
          "class PayCalculator { calculate(e: Employee): number { /* ... */ return 0; } }",
          "class EmployeeRepository { save(e: Employee): void { /* ... */ } }",
          "class EmployeeReport { render(e: Employee): string { /* ... */ return ''; } }",
        ].join('\n'),
        en: [
          "// Violation: three reasons to change in a single class",
          "class Employee {",
          "  calculatePay() { /* accounting rules */ }",
          "  save() { /* database schema */ }",
          "  describeInReport() { /* report format */ }",
          "}",
          "",
          "// SRP: each responsibility in its own class",
          "class PayCalculator { calculate(e: Employee): number { /* ... */ return 0; } }",
          "class EmployeeRepository { save(e: Employee): void { /* ... */ } }",
          "class EmployeeReport { render(e: Employee): string { /* ... */ return ''; } }",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Проще тестировать и понимать",
        "Ниже связанность",
        "Изменения локальны и безопасны",
      ],
      en: [
        "Easier to test and understand",
        "Lower coupling",
        "Changes stay local and safe",
      ],
    },
    cons: {
      ru: [
        "Больше классов и файлов",
        "Риск преждевременного дробления",
      ],
      en: [
        "More classes and files",
        "Risk of premature splitting",
      ],
    },
    tradeoffs: {
      ru: [
        "Гранулярность против простоты навигации по коду",
      ],
      en: [
        "Granularity versus ease of navigating the code",
      ],
    },
    whenToUse: {
      ru: [
        "Класс меняется по нескольким несвязанным причинам",
        "В одном классе смешаны разные уровни абстракции",
      ],
      en: [
        "The class changes for several unrelated reasons",
        "A single class mixes different levels of abstraction",
      ],
    },
    whenNotToUse: {
      ru: [
        "Крошечная сущность, дробление которой добавит лишь шум",
      ],
      en: [
        "A tiny entity where splitting would add nothing but noise",
      ],
    },
    related: [
      "ocp",
      "dip",
    ],
    tags: [
      "принципы",
      "связанность",
    ],
  },
  {
    id: "ocp",
    name: "Open/Closed Principle",
    aka: [
      "OCP",
    ],
    category: "solid",
    grade: "junior",
    tagline: {
      ru: "Открыт для расширения, закрыт для изменения",
      en: "Open for extension, closed for modification",
    },
    definition: {
      ru: "Программные сущности (классы, модули, функции) должны быть открыты для расширения, но закрыты для изменения: новое поведение добавляется без правки существующего кода.",
      en: "Software entities (classes, modules, functions) should be open for extension but closed for modification: new behavior is added without editing existing code.",
    },
    problem: {
      ru: "Расчёт площади через switch по типу фигуры приходится править при каждой новой фигуре. Один и тот же проверенный код меняется снова и снова, повышая риск регрессий.",
      en: "Computing area with a switch on the shape type has to be edited every time a new shape is introduced. The same proven code is changed again and again, raising the risk of regressions.",
    },
    solution: {
      ru: "Вводим абстракцию Shape с методом area(). Новая фигура — это новый класс, реализующий интерфейс; код-потребитель не меняется вовсе.",
      en: "Introduce a Shape abstraction with an area() method. A new shape is simply a new class that implements the interface; the consuming code doesn't change at all.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "// Нарушение: добавление фигуры требует правки switch",
          "class AreaCalculator {",
          "  area(shape: { type: string; [k: string]: unknown }): number {",
          "    switch (shape.type) {",
          "      case 'circle': return Math.PI * (shape.r as number) ** 2;",
          "      case 'square': return (shape.side as number) ** 2;",
          "      default: return 0;",
          "    }",
          "  }",
          "}",
          "",
          "// OCP: новая фигура — новый класс, потребитель закрыт для правок",
          "interface Shape { area(): number; }",
          "class Circle implements Shape { constructor(private r: number) {} area() { return Math.PI * this.r ** 2; } }",
          "class Square implements Shape { constructor(private side: number) {} area() { return this.side ** 2; } }",
          "class Triangle implements Shape { constructor(private b: number, private h: number) {} area() { return 0.5 * this.b * this.h; } }",
          "",
          "function totalArea(shapes: Shape[]): number {",
          "  return shapes.reduce((sum, s) => sum + s.area(), 0); // не меняется при добавлении фигур",
          "}",
        ].join('\n'),
        en: [
          "// Violation: adding a shape requires editing the switch",
          "class AreaCalculator {",
          "  area(shape: { type: string; [k: string]: unknown }): number {",
          "    switch (shape.type) {",
          "      case 'circle': return Math.PI * (shape.r as number) ** 2;",
          "      case 'square': return (shape.side as number) ** 2;",
          "      default: return 0;",
          "    }",
          "  }",
          "}",
          "",
          "// OCP: a new shape is a new class; the consumer is closed for modification",
          "interface Shape { area(): number; }",
          "class Circle implements Shape { constructor(private r: number) {} area() { return Math.PI * this.r ** 2; } }",
          "class Square implements Shape { constructor(private side: number) {} area() { return this.side ** 2; } }",
          "class Triangle implements Shape { constructor(private b: number, private h: number) {} area() { return 0.5 * this.b * this.h; } }",
          "",
          "function totalArea(shapes: Shape[]): number {",
          "  return shapes.reduce((sum, s) => sum + s.area(), 0); // unchanged when new shapes are added",
          "}",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Новое поведение без правки проверенного кода",
        "Меньше регрессий",
        "Расширяемость через полиморфизм",
      ],
      en: [
        "New behavior without editing proven code",
        "Fewer regressions",
        "Extensibility through polymorphism",
      ],
    },
    cons: {
      ru: [
        "Больше абстракций заранее",
        "Избыточная гибкость там, где изменений не будет",
      ],
      en: [
        "More abstractions up front",
        "Needless flexibility where nothing will change",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость к будущим изменениям против простоты «здесь и сейчас»",
      ],
      en: [
        "Flexibility for future change versus simplicity here and now",
      ],
    },
    whenToUse: {
      ru: [
        "В точке кода регулярно добавляются новые варианты",
        "Требуется подключать поведение плагинами",
      ],
      en: [
        "New variants are regularly added at a given point in the code",
        "Behavior needs to be pluggable via plugins",
      ],
    },
    whenNotToUse: {
      ru: [
        "Набор вариантов стабилен и вряд ли расширится",
      ],
      en: [
        "The set of variants is stable and unlikely to grow",
      ],
    },
    related: [
      "lsp",
      "dip",
    ],
    tags: [
      "принципы",
      "расширяемость",
    ],
  },
  {
    id: "lsp",
    name: "Liskov Substitution Principle",
    aka: [
      "LSP",
    ],
    category: "solid",
    grade: "junior",
    tagline: {
      ru: "Подтип должен подставляться вместо своего базового типа",
      en: "A subtype must be substitutable for its base type",
    },
    definition: {
      ru: "Если S — подтип T, то объекты T можно заменять объектами S без нарушения корректности программы. Подтип обязан соблюдать контракт базового типа: не усиливать предусловия и не ослаблять постусловия.",
      en: "If S is a subtype of T, then objects of type T can be replaced with objects of type S without breaking the correctness of the program. A subtype must honor the base type's contract: it must not strengthen preconditions or weaken postconditions.",
    },
    problem: {
      ru: "Square наследует Rectangle и переопределяет setWidth/setHeight так, что ширина и высота меняются вместе. Клиент, работающий с Rectangle и ожидающий независимые стороны, получает неверную площадь при подстановке Square.",
      en: "Square inherits from Rectangle and overrides setWidth/setHeight so that width and height always change together. A client that works with a Rectangle and expects its sides to be independent gets the wrong area when a Square is substituted in.",
    },
    solution: {
      ru: "Не строим ложную иерархию «квадрат — это прямоугольник». Моделируем обе фигуры через общий интерфейс Shape, где каждая честно реализует свой контракт.",
      en: "Don't build a false \"a square is a rectangle\" hierarchy. Model both shapes through a common Shape interface, where each one honestly implements its own contract.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "// Нарушение LSP: Square ломает контракт Rectangle",
          "class Rectangle {",
          "  constructor(protected w: number, protected h: number) {}",
          "  setWidth(w: number) { this.w = w; }",
          "  setHeight(h: number) { this.h = h; }",
          "  area() { return this.w * this.h; }",
          "}",
          "class Square extends Rectangle {",
          "  setWidth(w: number) { this.w = w; this.h = w; }  // ломает ожидания клиента",
          "  setHeight(h: number) { this.w = h; this.h = h; }",
          "}",
          "// setWidth(5); setHeight(4); area() ждём 20, а Square вернёт 16",
          "",
          "// LSP: общий интерфейс без ложной иерархии",
          "interface Shape { area(): number; }",
          "class Rect implements Shape { constructor(private w: number, private h: number) {} area() { return this.w * this.h; } }",
          "class Sq implements Shape { constructor(private side: number) {} area() { return this.side ** 2; } }",
        ].join('\n'),
        en: [
          "// LSP violation: Square breaks Rectangle's contract",
          "class Rectangle {",
          "  constructor(protected w: number, protected h: number) {}",
          "  setWidth(w: number) { this.w = w; }",
          "  setHeight(h: number) { this.h = h; }",
          "  area() { return this.w * this.h; }",
          "}",
          "class Square extends Rectangle {",
          "  setWidth(w: number) { this.w = w; this.h = w; }  // breaks the client's expectations",
          "  setHeight(h: number) { this.w = h; this.h = h; }",
          "}",
          "// setWidth(5); setHeight(4); area() we expect 20, but Square returns 16",
          "",
          "// LSP: a shared interface with no false hierarchy",
          "interface Shape { area(): number; }",
          "class Rect implements Shape { constructor(private w: number, private h: number) {} area() { return this.w * this.h; } }",
          "class Sq implements Shape { constructor(private side: number) {} area() { return this.side ** 2; } }",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Полиморфизм безопасен",
        "Клиент не знает о подтипах",
        "Меньше проверок instanceof",
      ],
      en: [
        "Polymorphism is safe",
        "The client doesn't need to know about the subtypes",
        "Fewer instanceof checks",
      ],
    },
    cons: {
      ru: [
        "Требует дисциплины в проектировании иерархий",
        "Иногда вынуждает отказаться от «удобного» наследования",
      ],
      en: [
        "Requires discipline when designing hierarchies",
        "Sometimes forces you to give up \"convenient\" inheritance",
      ],
    },
    tradeoffs: {
      ru: [
        "Строгость контрактов против соблазна переиспользовать код наследованием",
      ],
      en: [
        "Strict contracts versus the temptation to reuse code through inheritance",
      ],
    },
    whenToUse: {
      ru: [
        "Проектируется иерархия наследования",
        "Код полагается на полиморфную подстановку",
      ],
      en: [
        "You are designing an inheritance hierarchy",
        "The code relies on polymorphic substitution",
      ],
    },
    whenNotToUse: {
      ru: [
        "Наследование не используется — принцип неактуален",
      ],
      en: [
        "Inheritance isn't used — the principle doesn't apply",
      ],
    },
    related: [
      "ocp",
    ],
    tags: [
      "принципы",
      "наследование",
    ],
  },
  {
    id: "isp",
    name: "Interface Segregation Principle",
    aka: [
      "ISP",
    ],
    category: "solid",
    grade: "junior",
    tagline: {
      ru: "Не заставляйте клиента зависеть от методов, которые он не использует",
      en: "Don't force a client to depend on methods it doesn't use",
    },
    definition: {
      ru: "Клиентов не следует принуждать зависеть от интерфейсов, которые они не используют. Много специализированных интерфейсов, заточенных под клиента, лучше одного «толстого».",
      en: "Clients should not be forced to depend on interfaces they don't use. Many specialized, client-specific interfaces are better than a single fat one.",
    },
    problem: {
      ru: "«Толстый» интерфейс Worker с методами work() и eat() вынуждает класс Robot реализовывать eat() заглушкой-исключением. Клиент зависит от метода, который ему не нужен, а любое изменение eat() задевает Robot.",
      en: "A fat Worker interface with work() and eat() methods forces the Robot class to implement eat() with a stub that just throws. The client depends on a method it doesn't need, and any change to eat() ripples into Robot.",
    },
    solution: {
      ru: "Дробим интерфейс на узкие роли Workable и Eatable. Класс реализует только то, что действительно умеет.",
      en: "Break the interface into narrow roles, Workable and Eatable. Each class implements only what it can actually do.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "// Нарушение: «толстый» интерфейс навязывает лишнее",
          "interface Worker {",
          "  work(): void;",
          "  eat(): void;",
          "}",
          "class Robot implements Worker {",
          "  work() { /* ... */ }",
          "  eat() { throw new Error('робот не ест'); } // вынужденная заглушка",
          "}",
          "",
          "// ISP: узкие интерфейсы под нужды клиента",
          "interface Workable { work(): void; }",
          "interface Eatable { eat(): void; }",
          "class Human implements Workable, Eatable { work() {} eat() {} }",
          "class Machine implements Workable { work() {} }",
        ].join('\n'),
        en: [
          "// Violation: a \"fat\" interface imposes unneeded methods",
          "interface Worker {",
          "  work(): void;",
          "  eat(): void;",
          "}",
          "class Robot implements Worker {",
          "  work() { /* ... */ }",
          "  eat() { throw new Error('a robot does not eat'); } // forced stub",
          "}",
          "",
          "// ISP: narrow interfaces tailored to the client's needs",
          "interface Workable { work(): void; }",
          "interface Eatable { eat(): void; }",
          "class Human implements Workable, Eatable { work() {} eat() {} }",
          "class Machine implements Workable { work() {} }",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Клиент зависит только от нужного",
        "Меньше эффекта ряби при изменениях",
        "Реализации проще",
      ],
      en: [
        "The client depends only on what it needs",
        "Fewer ripple effects when things change",
        "Simpler implementations",
      ],
    },
    cons: {
      ru: [
        "Больше интерфейсов",
        "Возможна фрагментация на слишком мелкие роли",
      ],
      en: [
        "More interfaces",
        "Risk of over-fragmenting into too many tiny roles",
      ],
    },
    tradeoffs: {
      ru: [
        "Точность зависимостей против числа абстракций",
      ],
      en: [
        "Precise dependencies vs. the number of abstractions",
      ],
    },
    whenToUse: {
      ru: [
        "Интерфейс разросся и реализации имеют пустые методы",
        "Разные клиенты используют разные части API",
      ],
      en: [
        "An interface has grown and implementations are stuck with empty methods",
        "Different clients use different parts of the API",
      ],
    },
    whenNotToUse: {
      ru: [
        "Интерфейс мал и все методы нужны всем клиентам",
      ],
      en: [
        "The interface is small and every client needs all of its methods",
      ],
    },
    related: [
      "srp",
      "dip",
    ],
    tags: [
      "принципы",
      "интерфейсы",
    ],
  },
  {
    id: "dip",
    name: "Dependency Inversion Principle",
    aka: [
      "DIP",
    ],
    category: "solid",
    grade: "middle",
    tagline: {
      ru: "Зависимости направлены на абстракции, а не на детали",
      en: "Depend on abstractions, not on details",
    },
    definition: {
      ru: "Модули верхнего уровня не должны зависеть от модулей нижнего уровня — оба зависят от абстракций. Абстракции не зависят от деталей; детали зависят от абстракций.",
      en: "High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions.",
    },
    problem: {
      ru: "Класс UserService напрямую создаёт MySqlDatabase. Высокоуровневая бизнес-логика жёстко привязана к конкретной СУБД: её нельзя подменить в тестах и трудно заменить на другое хранилище.",
      en: "UserService creates MySqlDatabase directly. The high-level business logic is hard-wired to a specific database engine: it can't be substituted in tests and is hard to swap for a different store.",
    },
    solution: {
      ru: "Вводим абстракцию Database, от которой зависит и UserService, и конкретная реализация. Реализацию внедряем извне (через конструктор), инвертируя направление зависимости.",
      en: "Introduce a Database abstraction that both UserService and the concrete implementation depend on. Inject the implementation from the outside (through the constructor), inverting the direction of the dependency.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "// Нарушение: высокоуровневый модуль зависит от конкретной детали",
          "class MySqlDatabase { save(data: string) { /* ... */ } }",
          "class UserServiceBad {",
          "  private db = new MySqlDatabase(); // жёсткая связь с реализацией",
          "  register(user: string) { this.db.save(user); }",
          "}",
          "",
          "// DIP: оба уровня зависят от абстракции, деталь внедряется извне",
          "interface Database { save(data: string): void; }",
          "class MySqlDatabase2 implements Database { save(data: string) { /* ... */ } }",
          "class InMemoryDatabase implements Database { save(data: string) { /* ... */ } }",
          "class UserService {",
          "  constructor(private db: Database) {} // зависимость от интерфейса",
          "  register(user: string) { this.db.save(user); }",
          "}",
        ].join('\n'),
        en: [
          "// Violation: a high-level module depends on a concrete detail",
          "class MySqlDatabase { save(data: string) { /* ... */ } }",
          "class UserServiceBad {",
          "  private db = new MySqlDatabase(); // tight coupling to the implementation",
          "  register(user: string) { this.db.save(user); }",
          "}",
          "",
          "// DIP: both levels depend on an abstraction; the detail is injected from outside",
          "interface Database { save(data: string): void; }",
          "class MySqlDatabase2 implements Database { save(data: string) { /* ... */ } }",
          "class InMemoryDatabase implements Database { save(data: string) { /* ... */ } }",
          "class UserService {",
          "  constructor(private db: Database) {} // depends on the interface",
          "  register(user: string) { this.db.save(user); }",
          "}",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Реализации взаимозаменяемы",
        "Легко подставить mock в тестах",
        "Бизнес-логика не знает о деталях",
      ],
      en: [
        "Implementations are interchangeable",
        "Easy to inject a mock in tests",
        "The business logic knows nothing about the details",
      ],
    },
    cons: {
      ru: [
        "Больше интерфейсов и косвенности",
        "Нужен механизм внедрения зависимостей",
      ],
      en: [
        "More interfaces and indirection",
        "Requires a dependency-injection mechanism",
      ],
    },
    tradeoffs: {
      ru: [
        "Развязка модулей против прямолинейности и числа абстракций",
      ],
      en: [
        "Decoupling of modules versus straightforwardness and the number of abstractions",
      ],
    },
    whenToUse: {
      ru: [
        "Бизнес-логика не должна знать о конкретной инфраструктуре",
        "Нужна подмена реализации в тестах или конфигурации",
      ],
      en: [
        "The business logic must not know about specific infrastructure",
        "You need to swap the implementation in tests or via configuration",
      ],
    },
    whenNotToUse: {
      ru: [
        "Деталь стабильна и никогда не заменится — абстракция будет лишней",
      ],
      en: [
        "The detail is stable and will never be replaced — the abstraction would be superfluous",
      ],
    },
    related: [
      "ocp",
      "isp",
    ],
    tags: [
      "принципы",
      "внедрение зависимостей",
    ],
  },
];
