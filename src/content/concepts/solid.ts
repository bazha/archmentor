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
      ru: "Модуль должен отвечать перед одним и только одним актором — группой людей (или ролей), которые могут потребовать его изменения по общей причине. Иначе говоря, у класса должна быть одна и только одна причина для изменения: он инкапсулирует одну ответственность перед одним стейкхолдером. Это не то же самое, что «класс должен делать только одну вещь»: SRP говорит об источнике изменений (акторе), а не о количестве операций — у класса может быть несколько методов и при этом ровно одна причина меняться.",
      en: "A module should be responsible to one, and only one, actor — a group of people (or a role) who could request changes to it for a shared reason. Put another way, a class should have one and only one reason to change: it encapsulates a single responsibility owed to a single stakeholder. This is not the same claim as \"a class should do only one thing\": SRP is about the source of change (the actor), not the number of operations — a class can have several methods and still have exactly one reason to change.",
    },
    problem: {
      ru: "Класс Employee, который считает зарплату, форматирует отчёт и сохраняет данные в БД, меняется по трём независимым причинам: правила расчёта меняет финансовый департамент, формат отчёта — отдел отчётности, а схему хранения — DBA. Правка ради одного актора рискует случайно сломать логику, важную для другого, а слитые воедино обязанности делают класс трудным для тестирования и чтения. Это классический признак god-class: чем больше несвязанных причин для изменения стекается в одном месте, тем выше связанность кода и тем чаще коммит одного отдела ломает поведение, за которое отвечает другой.",
      en: "A class that calculates pay, formats a report, and persists data to the database changes for three independent reasons: the finance department owns the pay rules, the reporting department owns the report format, and the DBA owns the storage schema. A change made for one actor risks accidentally breaking logic that matters to another, and responsibilities fused together like this make the class hard to test and read. This is the classic god-class symptom: the more unrelated reasons to change pile up in one place, the higher the coupling, and the more often one team's commit breaks behavior another team owns.",
    },
    solution: {
      ru: "Разделяем ответственности на отдельные классы: PayCalculator отвечает перед бухгалтерией, EmployeeRepository — перед DBA, EmployeeReport — перед отделом отчётности. Каждый класс меняется независимо от остальных и собирает вокруг себя связный (высококогезивный) код, который меняется по одной и той же причине. Важно не путать SRP с более общим принципом «разделения ответственностей» (separation of concerns): SoC — это широкая архитектурная идея о разделении задач по слоям или модулям, тогда как SRP — конкретный тест на уровне класса: «сколько акторов могут потребовать изменения этого класса?». Если ответ — «больше одного», класс стоит разделить по границам, совпадающим с границами акторов, а не по произвольным техническим категориям.",
      en: "Split the responsibilities into separate classes: PayCalculator answers to accounting, EmployeeRepository answers to the DBA, EmployeeReport answers to the reporting department. Each class changes independently and gathers cohesive code that changes for the same single reason. It's important not to confuse SRP with the broader idea of \"separation of concerns\": SoC is an architectural notion about splitting tasks across layers or modules, whereas SRP is a concrete class-level test — \"how many actors could request a change to this class?\" If the answer is more than one, split the class along actor boundaries, not along arbitrary technical categories.",
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
        "Ниже связанность, выше связность (когезия) внутри класса",
        "Изменения локальны и безопасны — правки одного актора не задевают код другого",
        "Упрощает код-ревью: диф отражает одну причину изменения",
      ],
      en: [
        "Easier to test and understand",
        "Lower coupling and higher cohesion inside each class",
        "Changes stay local and safe — edits for one actor don't touch another actor's code",
        "Simplifies code review: the diff reflects a single reason for change",
      ],
    },
    cons: {
      ru: [
        "Больше классов и файлов, сложнее ориентироваться в структуре проекта",
        "Риск преждевременного дробления «на всякий случай», когда акторов на самом деле не два, а один",
        "Может потребовать дополнительного связующего кода для координации между несколькими маленькими классами",
      ],
      en: [
        "More classes and files, harder to navigate the project structure",
        "Risk of premature splitting \"just in case\" when there is really only one actor, not two",
        "May require extra glue code to coordinate several small classes",
      ],
    },
    tradeoffs: {
      ru: [
        "Гранулярность против простоты навигации по коду",
        "Строгое разделение по акторам против удобства держать связанную логику рядом",
        "Число абстракций сегодня против гибкости при появлении нового актора завтра",
      ],
      en: [
        "Granularity versus ease of navigating the code",
        "Strict separation by actor versus the convenience of keeping related logic together",
        "The number of abstractions today versus flexibility when a new actor shows up tomorrow",
      ],
    },
    whenToUse: {
      ru: [
        "Класс меняется по нескольким несвязанным причинам",
        "В одном классе смешаны разные уровни абстракции — бизнес-правила и инфраструктура",
        "Разные стейкхолдеры регулярно просят правки одного и того же файла",
      ],
      en: [
        "The class changes for several unrelated reasons",
        "A single class mixes different levels of abstraction — business rules and infrastructure",
        "Different stakeholders regularly request changes to the same file",
      ],
    },
    whenNotToUse: {
      ru: [
        "Крошечная сущность, дробление которой добавит лишь шум",
        "Скрипт или прототип с одним актором и коротким жизненным циклом — дробление не окупится",
      ],
      en: [
        "A tiny entity where splitting would add nothing but noise",
        "A script or prototype with a single actor and a short lifespan — splitting wouldn't pay off",
      ],
    },
    related: [
      "ocp",
      "dip",
      "isp",
      "coupling-cohesion",
    ],
    diagram: `classDiagram
  class Employee {
    <<god class>>
    +calculatePay()
    +save()
    +describeInReport()
  }

  class PayCalculator {
    +calculate(Employee) number
  }
  class EmployeeRepository {
    +save(Employee) void
  }
  class EmployeeReport {
    +render(Employee) string
  }

  PayCalculator ..> Employee : accounting actor
  EmployeeRepository ..> Employee : DBA actor
  EmployeeReport ..> Employee : reporting actor`,
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
      ru: "Программные сущности — классы, модули, функции — должны быть открыты для расширения, но закрыты для изменения: новое поведение добавляется через новый код, а не через правку уже написанного и протестированного кода. Достигается это за счёт абстракции и полиморфизма: клиент работает с интерфейсом, а не с конкретными реализациями, поэтому добавление нового варианта означает добавление нового класса в заранее заложенной точке расширения (extension point), а не изменение существующей.",
      en: "Software entities — classes, modules, functions — should be open for extension but closed for modification: new behavior is added through new code, not by editing code that already works and is already tested. This is achieved through abstraction and polymorphism: the client works against an interface rather than concrete implementations, so adding a new variant means adding a new class at a pre-planned extension point rather than changing an existing one.",
    },
    problem: {
      ru: "Расчёт площади через switch по типу фигуры приходится править при каждой новой фигуре: добавление Triangle требует найти этот switch, дописать case и пересобрать модуль, который уже работал и был протестирован. Один и тот же проверенный код меняется снова и снова, что повышает риск регрессий в уже работающих ветках. Такие switch/if-else по типу обычно разбросаны по кодовой базе в нескольких местах — рендеринг, сериализация, валидация, — и при добавлении новой фигуры легко забыть обновить один из них.",
      en: "Computing area with a switch on the shape type has to be edited every time a new shape is introduced: adding a Triangle means finding that switch, adding a case, and rebuilding a module that already worked and was already tested. The same proven code is changed again and again, raising the risk of regressions in branches that already work. Type-based switches like this are typically scattered across the codebase in several places — rendering, serialization, validation — and it's easy to forget to update one of them when a new shape is added.",
    },
    solution: {
      ru: "Вводим абстракцию Shape с методом area(). Новая фигура — это новый класс, реализующий интерфейс; код-потребитель (totalArea) не меняется вовсе — точка расширения зафиксирована один раз и навсегда. OCP редко достигается напрямую: обычно он опирается на DIP — потребитель зависит от абстракции Shape, а не от конкретных классов, и именно это делает подстановку новых реализаций безопасной. Важно не увлекаться: вводить абстракцию имеет смысл там, где варианты действительно множатся или где точка расширения нужна внешним потребителям (плагины, стратегии). Преждевременная абстракция ради гипотетического будущего изменения — трата сложности впустую (здесь в игру вступает YAGNI), и вводить её стоит только когда появился второй реальный вариант или конкретное требование расширяемости.",
      en: "Introduce a Shape abstraction with an area() method. A new shape is simply a new class that implements the interface; the consuming code (totalArea) doesn't change at all — the extension point is fixed once and for all. OCP is rarely achieved directly: it usually rests on DIP — the consumer depends on the Shape abstraction rather than concrete classes, and that's exactly what makes plugging in new implementations safe. It's important not to overdo it: introducing an abstraction pays off where variants genuinely keep multiplying, or where external consumers need an extension point (plugins, strategies). A premature abstraction for a hypothetical future change is wasted complexity (this is where YAGNI applies), and it's worth introducing one only once a second real variant, or a concrete extensibility requirement, has appeared.",
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
        "Меньше регрессий в уже работающих ветках",
        "Расширяемость через полиморфизм и подключаемые точки расширения",
        "Стабильный публичный контракт для потребителей абстракции",
      ],
      en: [
        "New behavior without editing proven code",
        "Fewer regressions in branches that already work",
        "Extensibility through polymorphism and pluggable extension points",
        "A stable public contract for the abstraction's consumers",
      ],
    },
    cons: {
      ru: [
        "Больше абстракций и косвенности заранее",
        "Избыточная гибкость там, где изменений не будет — попытка предугадать все варианты (over-engineering)",
        "Труднее проследить конкретную реализацию за интерфейсом при отладке",
      ],
      en: [
        "More abstractions and indirection up front",
        "Needless flexibility where nothing will change — over-engineering by guessing at variants",
        "Harder to trace which concrete implementation runs behind the interface while debugging",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость к будущим изменениям против простоты «здесь и сейчас»",
        "YAGNI против готовности к расширению: абстракция окупается только при реальном повторении вариаций",
        "Полиморфизм против производительности — виртуальный вызов обычно чуть дороже прямого",
      ],
      en: [
        "Flexibility for future change versus simplicity here and now",
        "YAGNI versus readiness to extend: an abstraction pays off only once variants genuinely repeat",
        "Polymorphism versus performance — a virtual call is usually a bit costlier than a direct one",
      ],
    },
    whenToUse: {
      ru: [
        "В точке кода регулярно добавляются новые варианты",
        "Требуется подключать поведение плагинами или через конфигурацию",
        "Уже был замечен как минимум один реальный случай появления новой ветки условия",
      ],
      en: [
        "New variants are regularly added at a given point in the code",
        "Behavior needs to be pluggable via plugins or configuration",
        "At least one real instance of a new conditional branch has already appeared",
      ],
    },
    whenNotToUse: {
      ru: [
        "Набор вариантов стабилен и вряд ли расширится",
        "Это первое появление вариативности — абстракция без второго реального случая обычно избыточна (YAGNI)",
      ],
      en: [
        "The set of variants is stable and unlikely to grow",
        "This is the first appearance of variability — an abstraction without a second real case is usually premature (YAGNI)",
      ],
    },
    related: [
      "lsp",
      "dip",
      "srp",
      "strategy",
    ],
    diagram: `classDiagram
  class Shape {
    <<interface>>
    +area() number
  }
  class Circle {
    +area() number
  }
  class Square {
    +area() number
  }
  class Triangle {
    +area() number
  }
  class AreaClient {
    +totalArea(Shape[]) number
  }

  Shape <|.. Circle
  Shape <|.. Square
  Shape <|.. Triangle
  AreaClient --> Shape`,
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
      ru: "Если S — подтип T, то объекты типа T можно свободно заменять объектами типа S без нарушения корректности программы. Формально (по Барбаре Лисков) подтип обязан соблюдать контракт базового типа по трём правилам: не усиливать предусловия сильнее, чем в базовом типе, не ослаблять постусловия слабее, чем в базовом типе, и сохранять инварианты базового типа. LSP — это принцип поведенческого подтипирования: он проверяет не совпадение сигнатур методов, а совпадение ожидаемого поведения с точки зрения клиента, который работает с базовым типом и не должен знать о конкретном подтипе.",
      en: "If S is a subtype of T, then objects of type T can be freely replaced with objects of type S without breaking the correctness of the program. Formally (per Barbara Liskov), a subtype must honor the base type's contract under three rules: it must not strengthen preconditions beyond the base type's, must not weaken postconditions below the base type's, and must preserve the base type's invariants. LSP is a principle of behavioral subtyping: it checks not whether method signatures match, but whether the expected behavior matches, from the point of view of a client that works with the base type and shouldn't need to know about the concrete subtype.",
    },
    problem: {
      ru: "Square наследует Rectangle и переопределяет setWidth/setHeight так, что ширина и высота меняются вместе, а не независимо. Клиент, работающий с Rectangle и ожидающий, что setWidth не затронет высоту (постусловие базового типа), получает неверную площадь при подстановке Square — контракт молча нарушен. Тот же класс проблем возникает в паре Circle–Ellipse: окружность с единственным радиусом не может честно заменить эллипс с независимыми полуосями (хотя по «is-a» Circle кажется частным случаем Ellipse, клиент, независимо меняющий полуоси, ломает инвариант окружности). Типичный симптом такого нарушения в реальном коде — появление instanceof/type-check в клиентском коде («если это Square, обработать иначе»): клиент вынужден вручную обходить нарушенный контракт вместо того, чтобы доверять полиморфизму.",
      en: "Square inherits from Rectangle and overrides setWidth/setHeight so that width and height always change together instead of independently. A client that works with a Rectangle and expects setWidth not to affect the height (the base type's postcondition) gets the wrong area when a Square is substituted in — the contract is silently broken. The same class of problem shows up in the classic Circle–Ellipse pair: a circle with a single radius can't honestly substitute for an ellipse with independent semi-axes (even though \"is-a\" makes Circle look like a special case of Ellipse, a client that mutates the semi-axes independently breaks the circle's invariant). A typical real-world symptom of this violation is an instanceof/type-check creeping into client code (\"if it's a Square, handle it differently\"): the client is forced to manually work around the broken contract instead of trusting polymorphism.",
    },
    solution: {
      ru: "Не строим ложную иерархию «квадрат — это прямоугольник»: наследование в контексте LSP — это не про общие данные (стороны фигуры), а про совместимость контрактов поведения. Моделируем обе фигуры через общий интерфейс Shape, где Rect и Sq независимо и честно реализуют свой контракт area(), не обещая клиенту того, чего не могут сдержать. Общее правило проектирования: прежде чем сделать B подтипом A, нужно проверить, что B не усиливает предусловия методов A (не требует большего от вызывающего кода), не ослабляет постусловия A (даёт не меньше гарантий, чем A) и сохраняет инварианты A на всех публичных операциях. Если хотя бы одно из условий не выполняется, правильный инструмент — не наследование, а композиция или отдельная иерархия через общий интерфейс, как в примере с Shape.",
      en: "Don't build a false \"a square is a rectangle\" hierarchy: in the context of LSP, inheritance isn't about sharing data (a shape's sides) but about compatible behavioral contracts. Model both shapes through a common Shape interface, where Rect and Sq independently and honestly implement their own area() contract, without promising the client anything they can't keep. The general design rule: before making B a subtype of A, check that B doesn't strengthen A's method preconditions (doesn't demand more from calling code), doesn't weaken A's postconditions (delivers no fewer guarantees than A), and preserves A's invariants across every public operation. If even one of those conditions fails, the right tool isn't inheritance — it's composition, or a separate hierarchy behind a shared interface, as in the Shape example.",
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
        "Полиморфизм безопасен: базовый код работает с любым подтипом без сюрпризов",
        "Клиент не знает о подтипах и не должен на них проверять",
        "Меньше проверок instanceof/type-check в клиентском коде",
        "Иерархии типов остаются предсказуемыми и проще для рефакторинга",
      ],
      en: [
        "Polymorphism is safe: base-typed code works with any subtype without surprises",
        "The client doesn't need to know about the subtypes or check for them",
        "Fewer instanceof/type-check branches in client code",
        "Type hierarchies stay predictable and easier to refactor",
      ],
    },
    cons: {
      ru: [
        "Требует дисциплины и времени на проектирование иерархий и контрактов",
        "Иногда вынуждает отказаться от «удобного» наследования ради общих данных",
        "Обнаружить нарушение LSP по одним лишь сигнатурам типов не всегда просто — нужен анализ поведения",
      ],
      en: [
        "Requires discipline and time to design hierarchies and contracts",
        "Sometimes forces you to give up \"convenient\" inheritance built around shared data",
        "Spotting an LSP violation from type signatures alone isn't always easy — it takes behavioral analysis",
      ],
    },
    tradeoffs: {
      ru: [
        "Строгость контрактов против соблазна переиспользовать код наследованием",
        "Более плоские иерархии через композицию против компактности классического наследования",
        "Время на анализ пред-/постусловий против скорости «просто отнаследоваться и переопределить»",
      ],
      en: [
        "Strict contracts versus the temptation to reuse code through inheritance",
        "Flatter hierarchies built with composition versus the compactness of classic inheritance",
        "Time spent analyzing pre-/postconditions versus the speed of just inheriting and overriding",
      ],
    },
    whenToUse: {
      ru: [
        "Проектируется иерархия наследования",
        "Код полагается на полиморфную подстановку без проверок типа",
        "Нужно решить, действительно ли B — это разновидность A с точки зрения поведения, а не только данных",
      ],
      en: [
        "You are designing an inheritance hierarchy",
        "The code relies on polymorphic substitution with no type checks",
        "You need to decide whether B is truly a kind of A in terms of behavior, not just shared data",
      ],
    },
    whenNotToUse: {
      ru: [
        "Наследование не используется — принцип неактуален",
        "Иерархия закрыта, не публична и полностью контролируется одной командой без внешних потребителей — риск нарушения ниже, но не равен нулю",
      ],
      en: [
        "Inheritance isn't used — the principle doesn't apply",
        "The hierarchy is closed, non-public, and fully controlled by one team with no external consumers — the risk of violation is lower, though not zero",
      ],
    },
    related: [
      "ocp",
      "dip",
      "composition-vs-inheritance",
    ],
    diagram: `classDiagram
  class Shape {
    <<interface>>
    +area() number
  }
  class Rect {
    +area() number
  }
  class Sq {
    +area() number
  }

  Shape <|.. Rect
  Shape <|.. Sq
  note for Sq "independent contract, not a Rectangle subclass"`,
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
      ru: "Клиентов не следует принуждать зависеть от интерфейсов, которые они не используют. Много специализированных интерфейсов, заточенных под конкретного клиента (role interfaces), лучше одного «толстого» интерфейса общего назначения. По сути, ISP — это SRP, применённый к интерфейсам, а не к классам: у интерфейса должна быть одна причина для изменения — потребности одной группы клиентов, а не сумма потребностей всех возможных клиентов сразу.",
      en: "Clients should not be forced to depend on interfaces they don't use. Many specialized, client-specific interfaces (role interfaces) are better than a single general-purpose fat interface. In effect, ISP is SRP applied to interfaces rather than classes: an interface should have one reason to change — the needs of a single group of clients, not the sum of the needs of every possible client at once.",
    },
    problem: {
      ru: "«Толстый» интерфейс Worker с методами work() и eat() вынуждает класс Robot реализовывать eat() заглушкой, которая выбрасывает исключение вида NotImplementedError, — метод физически невозможно реализовать осмысленно, но интерфейс требует его наличия. Клиент, которому нужен только work(), всё равно косвенно зависит от eat(): изменение сигнатуры eat() заставит перекомпилироваться и потенциально сломает Robot, хотя Robot этим методом не пользуется. Это классический признак нарушения ISP — методы-заглушки, бросающие исключение «не поддерживается», сигнализируют, что интерфейс объединяет несовместимые роли клиентов.",
      en: "A fat Worker interface with work() and eat() methods forces the Robot class to implement eat() with a stub that throws a NotImplementedError — the method genuinely can't be implemented meaningfully, yet the interface requires it to exist. A client that only needs work() still depends indirectly on eat(): changing eat()'s signature forces Robot to recompile and potentially break, even though Robot never uses that method. This is a classic ISP-violation symptom — stub methods that throw \"not supported\" signal that the interface bundles together incompatible client roles.",
    },
    solution: {
      ru: "Дробим интерфейс на узкие роли — Workable и Eatable, каждая описывает одну грань поведения, нужную конкретной группе клиентов. Класс реализует только те роли, которые действительно умеет выполнять: Human реализует обе, Machine — только Workable, и никаких заглушек с исключениями больше не требуется. Этот же ход тесно связан с SRP: если у интерфейса, как и у класса, есть ровно одна причина для изменения (одна роль клиента), он остаётся маленьким сам по себе, без искусственного дробления постфактум. На практике узкие ролевые интерфейсы также облегчают тестирование (достаточно замокать один-два метода вместо десятка) и делают явными реальные зависимости модуля: конструктор, принимающий Workable, красноречивее, чем конструктор, принимающий целый Worker.",
      en: "Break the interface into narrow roles, Workable and Eatable, each describing one facet of behavior needed by a particular group of clients. A class implements only the roles it can actually fulfill: Human implements both, Machine implements only Workable, and no exception-throwing stubs are needed anymore. This move is closely tied to SRP: if an interface, like a class, has exactly one reason to change (one client role), it stays small on its own, with no need for after-the-fact splitting. In practice, narrow role interfaces also make testing easier (mocking one or two methods instead of a dozen) and make a module's real dependencies explicit: a constructor that takes a Workable says more than one that takes a whole Worker.",
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
        "Клиент зависит только от нужного ему поведения",
        "Меньше эффекта ряби при изменениях в неиспользуемых методах",
        "Реализации проще — не нужны заглушки-исключения",
        "Проще писать моки и тесты для узких ролей",
      ],
      en: [
        "The client depends only on the behavior it needs",
        "Fewer ripple effects from changes to methods it doesn't use",
        "Simpler implementations — no exception-throwing stubs required",
        "Easier to write mocks and tests for narrow roles",
      ],
    },
    cons: {
      ru: [
        "Больше интерфейсов, которые нужно поддерживать и именовать",
        "Возможна фрагментация на слишком мелкие роли без практической пользы",
        "Класс может реализовывать сразу много мелких интерфейсов, что засоряет его публичный контракт",
      ],
      en: [
        "More interfaces to maintain and name",
        "Risk of over-fragmenting into too many tiny roles with no practical benefit",
        "A class may end up implementing many small interfaces at once, cluttering its public contract",
      ],
    },
    tradeoffs: {
      ru: [
        "Точность зависимостей против числа абстракций в кодовой базе",
        "Ролевые интерфейсы под каждого клиента против одного общего интерфейса, который проще найти и запомнить",
        "Гибкость состава ролей против простоты единой точки контракта",
      ],
      en: [
        "Precise dependencies versus the number of abstractions in the codebase",
        "Client-specific role interfaces versus a single general interface that's easier to find and remember",
        "Flexibility in composing roles versus the simplicity of one single contract point",
      ],
    },
    whenToUse: {
      ru: [
        "Интерфейс разросся, и часть реализаций содержит пустые или бросающие исключение методы",
        "Разные клиенты используют разные, непересекающиеся части API",
        "Изменение одного метода интерфейса регулярно задевает классы, которые им не пользуются",
      ],
      en: [
        "An interface has grown and some implementations are stuck with empty or exception-throwing methods",
        "Different clients use different, non-overlapping parts of the API",
        "Changing one interface method regularly ripples into classes that don't use it",
      ],
    },
    whenNotToUse: {
      ru: [
        "Интерфейс мал, и все методы нужны всем клиентам без исключений",
        "Дробление создаст роли, которые всегда реализуются и используются вместе — разделение добавит только косвенность",
      ],
      en: [
        "The interface is small and every client needs all of its methods, no exceptions",
        "Splitting would create roles that are always implemented and used together — the split would add only indirection",
      ],
    },
    related: [
      "srp",
      "dip",
      "ocp",
      "abstraction-cost",
    ],
    diagram: `classDiagram
  class Worker {
    <<interface>>
    +work()
    +eat()
  }
  class Workable {
    <<interface>>
    +work()
  }
  class Eatable {
    <<interface>>
    +eat()
  }
  class Human
  class Machine

  Workable <|.. Human
  Eatable <|.. Human
  Workable <|.. Machine
  note for Worker "before: fat interface forces Robot.eat() to throw"`,
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
      ru: "Модули верхнего уровня не должны зависеть от модулей нижнего уровня — оба должны зависеть от абстракций. Абстракции не должны зависеть от деталей; детали должны зависеть от абстракций. Важно различать сам принцип (DIP) и технику Dependency Injection/IoC: DI — лишь один из механизмов, которым на практике реализуют DIP (передача готовой реализации через конструктор, сеттер или IoC-контейнер), но следовать DIP можно и без контейнера — достаточно, чтобы код верхнего уровня знал только об интерфейсе.",
      en: "High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions. It's important to distinguish the principle itself (DIP) from the Dependency Injection/IoC technique: DI is just one mechanism used in practice to satisfy DIP (passing a ready-made implementation through a constructor, a setter, or an IoC container), but you can follow DIP without a container at all — it's enough for the high-level code to know only about the interface.",
    },
    problem: {
      ru: "Класс UserService напрямую создаёт new MySqlDatabase() внутри себя. Высокоуровневая бизнес-логика регистрации пользователей оказывается жёстко привязана к конкретной СУБД: её нельзя подменить in-memory реализацией в модульных тестах, а переход на другое хранилище потребует правки самого UserService, хотя бизнес-правило регистрации при этом не менялось. Направление зависимости здесь совпадает с направлением вызовов (высокий уровень напрямую создаёт и вызывает низкий), из-за чего изменения в инфраструктурном слое — смена драйвера БД, версии клиента — протекают наверх и задевают бизнес-логику, которая должна быть от них независима.",
      en: "UserService creates new MySqlDatabase() directly inside itself. The high-level user-registration business logic ends up hard-wired to a specific database engine: it can't be substituted with an in-memory implementation in unit tests, and switching to a different store requires editing UserService itself, even though the registration business rule never changed. Here the direction of the dependency matches the direction of the calls (the high-level module directly creates and calls the low-level one), so changes in the infrastructure layer — swapping a database driver, bumping a client version — leak upward and touch business logic that should be independent of them.",
    },
    solution: {
      ru: "Вводим абстракцию Database с методом save(), которую объявляет высокоуровневый модуль (UserService) — именно он владеет контрактом, поскольку именно его нужды определяют форму интерфейса. И UserService, и конкретные реализации (MySqlDatabase2, InMemoryDatabase) зависят от этой абстракции; реализация внедряется извне через конструктор, что инвертирует направление зависимости относительно направления вызовов: раньше высокий уровень зависел от низкого, теперь оба зависят от абстракции, принадлежащей высокому уровню. Именно DIP делает возможным OCP на границах модулей: новую реализацию Database можно подключить, не меняя UserService, — расширение системы происходит добавлением нового класса, а не правкой существующего. DI-контейнер (NestJS, InversifyJS и подобные) — удобный, но необязательный способ связать интерфейс с реализацией во время выполнения; сам принцип DIP можно соблюдать и вручную, простой передачей объекта в конструктор.",
      en: "Introduce a Database abstraction with a save() method, declared by the high-level module (UserService) — it owns the contract, because its needs shape the interface. Both UserService and the concrete implementations (MySqlDatabase2, InMemoryDatabase) depend on this abstraction; the implementation is injected from the outside via the constructor, which inverts the direction of the dependency relative to the direction of the calls: previously the high level depended on the low level, now both depend on an abstraction owned by the high level. DIP is precisely what makes OCP possible at module boundaries: a new Database implementation can be plugged in without changing UserService — the system is extended by adding a new class, not editing an existing one. A DI container (NestJS, InversifyJS, and the like) is a convenient but optional way to wire the interface to an implementation at runtime; the DIP principle itself can be honored manually too, just by passing an object into a constructor.",
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
        "Реализации взаимозаменяемы без правки бизнес-логики",
        "Легко подставить mock или in-memory реализацию в тестах",
        "Бизнес-логика не знает о деталях инфраструктуры",
        "DIP на границах модулей открывает путь к OCP при расширении системы",
      ],
      en: [
        "Implementations are interchangeable without touching the business logic",
        "Easy to inject a mock or an in-memory implementation in tests",
        "The business logic knows nothing about infrastructure details",
        "DIP at module boundaries opens the door to OCP when the system is extended",
      ],
    },
    cons: {
      ru: [
        "Больше интерфейсов и уровней косвенности",
        "Нужен механизм связывания реализации с абстракцией — вручную или через DI-контейнер",
        "Чтение кода требует прыжков между интерфейсом и конкретной реализацией",
      ],
      en: [
        "More interfaces and layers of indirection",
        "Requires a mechanism for wiring the implementation to the abstraction — manually or via a DI container",
        "Reading the code means jumping between the interface and the concrete implementation",
      ],
    },
    tradeoffs: {
      ru: [
        "Развязка модулей против прямолинейности и числа абстракций",
        "Удобство DI-контейнера (автосвязывание, конфигурация) против магии, усложняющей отладку и трассировку вызовов",
        "Абстракция, которой владеет высокий уровень, против соблазна дать низкоуровневому модулю диктовать форму интерфейса",
      ],
      en: [
        "Decoupling of modules versus straightforwardness and the number of abstractions",
        "The convenience of a DI container (auto-wiring, configuration) versus the \"magic\" that makes debugging and call tracing harder",
        "An abstraction owned by the high-level module versus the temptation to let the low-level module dictate the interface's shape",
      ],
    },
    whenToUse: {
      ru: [
        "Бизнес-логика не должна знать о конкретной инфраструктуре",
        "Нужна подмена реализации в тестах или в разных окружениях",
        "Ожидается смена поставщика инфраструктуры (БД, очереди, внешнего API) в обозримом будущем",
      ],
      en: [
        "The business logic must not know about specific infrastructure",
        "You need to swap the implementation in tests or across different environments",
        "A change of infrastructure provider (database, queue, external API) is expected in the foreseeable future",
      ],
    },
    whenNotToUse: {
      ru: [
        "Деталь стабильна и никогда не заменится — абстракция будет лишней косвенностью",
        "Простой скрипт или прототип без тестов и вторых реализаций — DI-контейнер добавит инфраструктуру ради инфраструктуры",
      ],
      en: [
        "The detail is stable and will never be replaced — the abstraction would be needless indirection",
        "A simple script or prototype with no tests and no second implementation — a DI container would add infrastructure for its own sake",
      ],
    },
    related: [
      "ocp",
      "isp",
      "srp",
      "abstraction-cost",
    ],
    diagram: `classDiagram
  class UserService {
    +register(user)
  }
  class Database {
    <<interface>>
    +save(data)
  }
  class MySqlDatabase {
    +save(data)
  }
  class InMemoryDatabase {
    +save(data)
  }

  UserService --> Database
  Database <|.. MySqlDatabase
  Database <|.. InMemoryDatabase`,
    tags: [
      "принципы",
      "внедрение зависимостей",
    ],
  },
];
