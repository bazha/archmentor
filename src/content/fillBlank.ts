import type { Question } from './schema';

// Fill-in-the-blank: a concept definition with one key term blanked to `___`;
// options are candidate terms. Generated (one per concept), bilingual, index-aligned.
export const fillBlankQuestions: Question[] = [
  {
    id: "fb-srp-1",
    type: "fill-blank",
    category: "solid",
    grade: "junior",
    prompt: {
      ru: "Модуль должен отвечать перед одним и только одним ___. Иначе говоря, у класса должна быть одна и только одна причина для изменения — он инкапсулирует одну ответственность.",
      en: "A module should be responsible to one, and only one, ___. Put another way, a class should have one and only one reason to change — it encapsulates a single responsibility.",
    },
    options: {
      ru: ["клиентом", "интерфейсом", "актором", "модулем"],
      en: ["client", "interface", "actor", "module"],
    },
    correctIndex: 2,
    explanation: {
      ru: "В современной формулировке Роберта Мартина SRP гласит, что модуль отвечает перед одним актором — группой заинтересованных лиц, желающих однотипных изменений; именно это задаёт единственную причину для изменения. Клиент, интерфейс и модуль обозначают технические или потребляющие сущности, а не источник ответственности, поэтому не подходят.",
      en: "In Robert Martin's modern formulation, SRP says a module is responsible to a single actor — a group of stakeholders who want the same kind of change — and that actor defines the one reason to change. Client, interface, and module denote technical or consuming entities rather than the source of responsibility, so they do not fit.",
    },
    conceptId: "srp",
  },
  {
    id: "fb-ocp-1",
    type: "fill-blank",
    category: "solid",
    grade: "junior",
    prompt: {
      ru: "Программные сущности (классы, модули, функции) должны быть открыты для ___, но закрыты для изменения: новое поведение добавляется без правки существующего кода.",
      en: "Software entities (classes, modules, functions) should be open for ___ but closed for modification: new behavior is added without editing existing code.",
    },
    options: {
      ru: ["наследования", "масштабирования", "расширения", "переопределения"],
      en: ["inheritance", "scaling", "extension", "overriding"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Принцип открытости/закрытости гласит, что сущности должны быть открыты именно для расширения — добавления нового поведения без правки существующего кода. Наследование и переопределение — лишь механизмы, которыми расширяемость достигается, а масштабирование относится к нагрузке, а не к дизайну.",
      en: "The Open/Closed Principle states entities should be open specifically for extension — adding new behavior without editing existing code. Inheritance and overriding are just mechanisms used to achieve extensibility, while scaling concerns load rather than design.",
    },
    conceptId: "ocp",
  },
  {
    id: "fb-lsp-1",
    type: "fill-blank",
    category: "solid",
    grade: "junior",
    prompt: {
      ru: "Если S — подтип T, то объекты T можно заменять объектами S без нарушения корректности программы. Подтип обязан соблюдать контракт базового типа: не усиливать ___ и не ослаблять постусловия.",
      en: "If S is a subtype of T, then objects of type T can be replaced with objects of type S without breaking the correctness of the program. A subtype must honor the base type's contract: it must not strengthen ___ or weaken postconditions.",
    },
    options: {
      ru: ["инварианты", "ограничения", "предусловия", "зависимости"],
      en: ["invariants", "constraints", "preconditions", "dependencies"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Принцип Лисков прямо запрещает подтипу усиливать предусловия: метод подтипа не должен требовать от вызывающего кода больше, чем базовый тип, — иначе замена сломает программу. Инварианты, ограничения и зависимости — реальные понятия ООП, но правило подстановки формулируется именно парой «предусловия/постусловия».",
      en: "Liskov's principle explicitly forbids a subtype from strengthening preconditions: a subtype method must not demand more from callers than the base type, or substitution would break the program. Invariants, constraints, and dependencies are real OOP notions, but the substitution rule is stated precisely by the precondition/postcondition pair.",
    },
    conceptId: "lsp",
  },
  {
    id: "fb-isp-1",
    type: "fill-blank",
    category: "solid",
    grade: "junior",
    prompt: {
      ru: "Клиентов не следует принуждать зависеть от интерфейсов, которые они не используют. Много специализированных интерфейсов, заточенных под клиента, лучше одного «___».",
      en: "Clients should not be forced to depend on interfaces they don't use. Many specialized, client-specific interfaces are better than a single ___ one.",
    },
    options: {
      ru: ["толстого", "абстрактного", "неизменяемого", "публичного"],
      en: ["fat", "abstract", "immutable", "public"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Ключевая метафора ISP — «толстый» интерфейс, перегруженный методами, которые нужны не всем клиентам; принцип предлагает вместо него много мелких, заточенных под клиента интерфейсов. «Абстрактный», «неизменяемый» и «публичный» описывают другие свойства интерфейса (уровень абстракции, изменяемость, видимость) и не являются термином, которому ISP противопоставляет специализированные интерфейсы.",
      en: "ISP's core metaphor is the \"fat\" interface — one overloaded with more members than any single client needs; the principle favors many small, client-specific interfaces instead. \"Abstract\", \"immutable\", and \"public\" describe other interface properties (abstraction level, mutability, visibility) and are not the term ISP contrasts with specialized interfaces.",
    },
    conceptId: "isp",
  },
  {
    id: "fb-dip-1",
    type: "fill-blank",
    category: "solid",
    grade: "middle",
    prompt: {
      ru: "Модули верхнего уровня не должны зависеть от модулей нижнего уровня — оба зависят от ___. Абстракции не зависят от деталей; детали зависят от абстракций.",
      en: "High-level modules should not depend on low-level modules; both should depend on ___. Abstractions should not depend on details; details should depend on abstractions.",
    },
    options: {
      ru: ["абстракций", "реализаций", "деталей", "модулей"],
      en: ["abstractions", "implementations", "details", "modules"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Суть принципа инверсии зависимостей в том, что и высокоуровневые, и низкоуровневые модули должны зависеть от абстракций, а не друг от друга. «Реализаций» и «деталей» — это как раз конкретика, зависеть от которой принцип запрещает, а «модулей» вернуло бы прямую связь между уровнями.",
      en: "The core of the Dependency Inversion Principle is that both high- and low-level modules depend on abstractions rather than on each other. \"Implementations\" and \"details\" are exactly the concretions the principle forbids depending on, and \"modules\" would restore the direct coupling between levels.",
    },
    conceptId: "dip",
  },
  {
    id: "fb-strategy-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Определяет семейство алгоритмов, инкапсулирует каждый из них и делает их ___. Strategy позволяет менять алгоритм независимо от клиента, который им пользуется.",
      en: "Defines a family of algorithms, encapsulates each one, and makes them ___. Strategy lets the algorithm vary independently from the clients that use it.",
    },
    options: {
      ru: ["неизменяемыми", "расширяемыми", "взаимозаменяемыми", "абстрактными"],
      en: ["immutable", "extensible", "interchangeable", "abstract"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Ключевая идея паттерна Strategy — сделать алгоритмы взаимозаменяемыми, чтобы клиент мог свободно переключаться между ними в рантайме. «Неизменяемыми», «расширяемыми» и «абстрактными» описывают другие свойства и не передают суть взаимозаменяемости стратегий.",
      en: "The core idea of the Strategy pattern is to make the algorithms interchangeable so a client can swap one for another at runtime. \"Immutable\", \"extensible\", and \"abstract\" describe unrelated properties and miss the point of swappable strategies.",
    },
    conceptId: "strategy",
  },
  {
    id: "fb-observer-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Определяет зависимость «один ко многим» между объектами так, что при изменении состояния одного объекта все зависящие от него автоматически ___ и обновляются.",
      en: "Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are ___ and updated automatically.",
    },
    options: {
      ru: ["регистрируются", "уведомляются", "уничтожаются", "блокируются"],
      en: ["registered", "notified", "destroyed", "blocked"],
    },
    correctIndex: 1,
    explanation: {
      ru: "В паттерне «Наблюдатель» субъект при изменении своего состояния именно уведомляет всех зависимых наблюдателей, после чего они обновляются — это ядро определения. «Регистрируются» описывает лишь подписку наблюдателя, а «уничтожаются» и «блокируются» противоречат смыслу автоматического оповещения.",
      en: "In the Observer pattern the subject notifies all its dependents whenever its state changes, and only then are they updated — this is the core of the definition. \"Registered\" describes only the subscription step, while \"destroyed\" and \"blocked\" contradict the idea of automatic notification.",
    },
    conceptId: "observer",
  },
  {
    id: "fb-factory-method-1",
    type: "fill-blank",
    category: "creational",
    grade: "middle",
    prompt: {
      ru: "Определяет интерфейс для создания объекта, но позволяет подклассам решать, какой класс ___. Factory Method делегирует создание объекта подклассам.",
      en: "Defines an interface for creating an object, but lets subclasses decide which class to ___. Factory Method lets a class defer instantiation to subclasses.",
    },
    options: {
      ru: ["расширять", "конфигурировать", "инстанцировать", "импортировать"],
      en: ["extend", "configure", "instantiate", "import"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Суть Factory Method в том, что подклассы решают, какой конкретный класс инстанцировать (создать его экземпляр), — именно акт создания объекта здесь ключевой. «Расширять», «конфигурировать» и «импортировать» описывают другие операции над классом и не передают смысл порождающего создания экземпляра.",
      en: "The essence of Factory Method is that subclasses decide which concrete class to instantiate, that is, to create an instance of — the act of object creation is the point. \"Extend\", \"configure\", and \"import\" describe other operations on a class and don't capture the creational act of instance creation.",
    },
    conceptId: "factory-method",
  },
  {
    id: "fb-state-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Позволяет объекту менять ___ при изменении его внутреннего состояния. Со стороны кажется, будто объект сменил класс.",
      en: "Lets an object alter its ___ when its internal state changes; it appears as though the object has changed its class.",
    },
    options: {
      ru: ["структуру", "поведение", "интерфейс", "реализацию"],
      en: ["structure", "behavior", "interface", "implementation"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Паттерн State по своей сути позволяет объекту менять именно поведение в зависимости от внутреннего состояния. Структура, интерфейс и реализация класса при этом остаются неизменными и не отражают суть паттерна.",
      en: "The State pattern is fundamentally about letting an object change its behavior depending on its internal state. The structure, interface, and implementation of the class stay the same and don't capture what the pattern actually does.",
    },
    conceptId: "state",
  },
  {
    id: "fb-abstract-factory-1",
    type: "fill-blank",
    category: "creational",
    grade: "senior",
    prompt: {
      ru: "Предоставляет интерфейс для создания ___ связанных или зависимых объектов, не указывая их конкретных классов.",
      en: "Provides an interface for creating ___ of related or dependent objects without specifying their concrete classes.",
    },
    options: {
      ru: ["иерархий", "семейств", "коллекций", "экземпляров"],
      en: ["hierarchies", "families", "collections", "instances"],
    },
    correctIndex: 1,
    explanation: {
      ru: "«Семейств» — ключевая идея паттерна Abstract Factory: он создаёт целые группы взаимосвязанных продуктов, согласованных между собой. «Иерархии» описывают отношения наследования, «коллекции» — контейнеры однотипных элементов, а «экземпляры» — отдельные объекты, и ни один из этих терминов не передаёт смысл семейства связанных объектов.",
      en: "\"Families\" is the core idea of the Abstract Factory pattern: it produces whole groups of interrelated, mutually consistent products. \"Hierarchies\" refer to inheritance relationships, \"collections\" to containers of same-type elements, and \"instances\" to single objects — none of which captures the notion of a family of related objects.",
    },
    conceptId: "abstract-factory",
  },
  {
    id: "fb-singleton-1",
    type: "fill-blank",
    category: "creational",
    grade: "junior",
    prompt: {
      ru: "Гарантирует, что у класса есть только один ___, и предоставляет глобальную точку доступа к нему.",
      en: "Ensures that a class has only one ___ and provides a global point of access to it.",
    },
    options: {
      ru: ["экземпляр", "метод", "конструктор", "интерфейс"],
      en: ["instance", "method", "constructor", "interface"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Суть паттерна Singleton — гарантировать единственный экземпляр класса и дать к нему глобальный доступ. Распределители «метод», «конструктор» и «интерфейс» — другие члены класса, которых обычно бывает несколько, и они не отражают идею единственности объекта.",
      en: "The essence of the Singleton pattern is guaranteeing a single instance of a class and giving global access to it. The distractors \"method\", \"constructor\", and \"interface\" are other class members that a class can have several of, and none of them captures the idea of a single object.",
    },
    conceptId: "singleton",
  },
  {
    id: "fb-builder-1",
    type: "fill-blank",
    category: "creational",
    grade: "middle",
    prompt: {
      ru: "___ конструирование сложного объекта от его представления, так что один и тот же процесс конструирования может создавать разные представления.",
      en: "___ the construction of a complex object from its representation, so that the same construction process can create different representations.",
    },
    options: {
      ru: ["Скрывает", "Отделяет", "Объединяет", "Копирует"],
      en: ["Hides", "Separates", "Combines", "Copies"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Суть паттерна Строитель в том, что он отделяет процесс конструирования сложного объекта от его представления, благодаря чему один и тот же процесс создаёт разные представления. «Скрывает» относится к инкапсуляции (Фасад), «объединяет» противоречит идее разделения, а «копирует» — это про Прототип.",
      en: "The Builder pattern specifically separates the construction of a complex object from its representation, letting one process produce different representations. \"Hides\" describes encapsulation (Facade), \"combines\" contradicts the idea of separation, and \"copies\" belongs to Prototype.",
    },
    conceptId: "builder",
  },
  {
    id: "fb-prototype-1",
    type: "fill-blank",
    category: "creational",
    grade: "middle",
    prompt: {
      ru: "Задаёт виды создаваемых объектов с помощью прототипического экземпляра и создаёт новые объекты путём ___ этого прототипа.",
      en: "Specify the kinds of objects to create using a prototypical instance, and create new objects by ___ this prototype.",
    },
    options: {
      ru: ["инстанцирования", "наследования", "копирования", "композиции"],
      en: ["instantiating", "inheriting", "copying", "composing"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Паттерн Prototype создаёт новые объекты именно путём копирования (клонирования) существующего прототипа — это его определяющий механизм. Инстанцирование через конструктор, наследование и композиция — другие способы, которые не описывают суть прототипирования.",
      en: "The Prototype pattern creates new objects specifically by copying (cloning) an existing prototype — that is its defining mechanism. Instantiating via a constructor, inheriting, and composing are different approaches that do not capture the essence of prototyping.",
    },
    conceptId: "prototype",
  },
  {
    id: "fb-adapter-1",
    type: "fill-blank",
    category: "structural",
    grade: "junior",
    prompt: {
      ru: "Преобразует интерфейс класса в другой интерфейс, ожидаемый клиентом. Adapter позволяет совместно работать классам, которые иначе не могли бы этого из-за ___ интерфейсов.",
      en: "Converts the interface of a class into another interface that clients expect. Adapter lets classes work together that otherwise couldn't because of ___ interfaces.",
    },
    options: {
      ru: ["устаревших", "несовместимых", "абстрактных", "внутренних"],
      en: ["legacy", "incompatible", "abstract", "internal"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Adapter существует именно для того, чтобы соединять классы с несовместимыми интерфейсами, поэтому «несовместимых» — единственный верный вариант. Устаревшие, абстрактные или внутренние интерфейсы вполне могут быть совместимыми и не отражают суть паттерна.",
      en: "Adapter exists precisely to connect classes whose interfaces are incompatible, so \"incompatible\" is the only fit. Legacy, abstract, or internal interfaces may well be compatible and don't capture the pattern's purpose.",
    },
    conceptId: "adapter",
  },
  {
    id: "fb-bridge-1",
    type: "fill-blank",
    category: "structural",
    grade: "senior",
    prompt: {
      ru: "Отделяет абстракцию от её реализации так, чтобы обе могли изменяться ___. Вместо наследования абстракция держит ссылку на объект-реализацию и делегирует ему работу.",
      en: "Decouples an abstraction from its implementation so that the two can vary ___. Instead of inheritance, the abstraction holds a reference to an implementation object and delegates the work to it.",
    },
    options: {
      ru: ["одновременно", "независимо", "синхронно", "динамически"],
      en: ["simultaneously", "independently", "synchronously", "dynamically"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Смысл паттерна Bridge — отделить абстракцию от реализации, чтобы их иерархии можно было менять по отдельности, то есть независимо. Варианты «одновременно», «синхронно» и «динамически» описывают иное свойство процесса изменения и не передают взаимную несвязанность двух иерархий.",
      en: "The whole point of Bridge is to let the abstraction and the implementation change separately — that is, independently. \"Simultaneously\", \"synchronously\" and \"dynamically\" describe a different property of how change happens and miss the mutual decoupling of the two hierarchies.",
    },
    conceptId: "bridge",
  },
  {
    id: "fb-composite-1",
    type: "fill-blank",
    category: "structural",
    grade: "middle",
    prompt: {
      ru: "Компонует объекты в древовидные структуры для представления иерархий «часть–целое». Composite позволяет клиентам ___ трактовать как отдельные объекты, так и их композиции.",
      en: "Composes objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects ___.",
    },
    options: {
      ru: ["рекурсивно", "единообразно", "полиморфно", "независимо"],
      en: ["recursively", "uniformly", "polymorphically", "independently"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Суть Composite — дать клиенту работать с листом и с контейнером одинаково, через общий интерфейс, поэтому здесь нужно «единообразно». «Рекурсивно», «полиморфно» и «независимо» описывают иные свойства и не передают ключевую идею единого обращения с отдельными объектами и их композициями.",
      en: "The whole point of Composite is that a client handles a leaf and a container the same way through a common interface, so \"uniformly\" fits. \"Recursively\", \"polymorphically\", and \"independently\" name other properties and miss the core idea of treating individual objects and their compositions identically.",
    },
    conceptId: "composite",
  },
  {
    id: "fb-decorator-1",
    type: "fill-blank",
    category: "structural",
    grade: "middle",
    prompt: {
      ru: "Динамически добавляет объекту новые обязанности, ___ его в объект с тем же интерфейсом. Decorator — гибкая альтернатива порождению подклассов для расширения функциональности.",
      en: "Dynamically adds new responsibilities to an object by ___ it in another object with the same interface. Decorator is a flexible alternative to subclassing for extending functionality.",
    },
    options: {
      ru: ["помещая", "оборачивая", "встраивая", "преобразуя"],
      en: ["placing", "wrapping", "embedding", "converting"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Суть паттерна Decorator в том, что он оборачивает исходный объект в объект-обёртку с тем же интерфейсом и делегирует ему вызовы, динамически добавляя поведение. «Преобразуя» неверно — исходный объект не меняется, а «помещая» и «встраивая» не передают идею обёртки, сохраняющей общий интерфейс и прозрачной для клиента.",
      en: "The essence of the Decorator pattern is that it wraps the original object in a wrapper sharing the same interface and delegates calls to it, dynamically adding behavior. \"Converting\" is wrong because the original object is not altered, while \"placing\" and \"embedding\" fail to convey the wrapper that preserves the shared interface and stays transparent to the client.",
    },
    conceptId: "decorator",
  },
  {
    id: "fb-facade-1",
    type: "fill-blank",
    category: "structural",
    grade: "junior",
    prompt: {
      ru: "Предоставляет ___ интерфейс к набору интерфейсов подсистемы. Facade определяет интерфейс более высокого уровня, который упрощает использование подсистемы.",
      en: "Provides a ___ interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.",
    },
    options: {
      ru: ["упрощённый", "унифицированный", "абстрактный", "обобщённый"],
      en: ["simplified", "unified", "abstract", "generic"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Фасад предоставляет именно унифицированный интерфейс, объединяющий разрозненные интерфейсы подсистемы в одну точку доступа. «Упрощённый» описывает следствие, а не определяющее свойство, а «абстрактный» и «обобщённый» не отражают объединяющую роль фасада.",
      en: "Facade provides a unified interface that consolidates the subsystem's separate interfaces into a single access point. \"Simplified\" names a side effect rather than the defining property, while \"abstract\" and \"generic\" fail to capture the unifying role.",
    },
    conceptId: "facade",
  },
  {
    id: "fb-flyweight-1",
    type: "fill-blank",
    category: "structural",
    grade: "senior",
    prompt: {
      ru: "Использует разделение (sharing) для эффективной поддержки большого числа мелких объектов. Состояние объекта делится на внутреннее (intrinsic) — ___ и общее для многих объектов, и внешнее (extrinsic) — зависящее от контекста; разделяемые flyweight-объекты хранят только intrinsic-состояние, а extrinsic передаётся им извне при каждом вызове.",
      en: "Uses sharing to support large numbers of fine-grained objects efficiently. An object's state is split into intrinsic state — ___ and shared across many objects — and extrinsic state, which depends on context; shared flyweight objects store only the intrinsic state, while the extrinsic state is passed in from outside on each call.",
    },
    options: {
      ru: ["изменяемое", "статическое", "неизменяемое", "временное"],
      en: ["mutable", "static", "immutable", "transient"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Внутреннее (intrinsic) состояние должно быть неизменяемым, чтобы один и тот же flyweight можно было безопасно разделять между множеством объектов — изменяемое состояние сломало бы совместное использование. «Изменяемое» — прямая противоположность; «статическое» и «временное» описывают время жизни/область видимости, а не свойство неизменности, дающее возможность разделения.",
      en: "Intrinsic state must be immutable so that a single flyweight can be safely shared across many objects — mutable state would break sharing. \"Mutable\" is the direct opposite, while \"static\" and \"transient\" describe lifetime/scope rather than the immutability property that makes sharing possible.",
    },
    conceptId: "flyweight",
  },
  {
    id: "fb-proxy-1",
    type: "fill-blank",
    category: "structural",
    grade: "middle",
    prompt: {
      ru: "Предоставляет суррогат (заместитель) другого объекта для контроля доступа к нему. Proxy реализует тот же ___, что и реальный объект, поэтому для клиента подмена прозрачна.",
      en: "Provides a surrogate, or placeholder, for another object to control access to it. A proxy implements the same ___ as the real object, so the substitution is transparent to the client.",
    },
    options: {
      ru: ["класс", "интерфейс", "метод", "тип"],
      en: ["class", "interface", "method", "type"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Proxy обязан реализовывать тот же интерфейс, что и реальный объект, — именно совпадение интерфейсов делает подмену прозрачной для клиента. «Класс», «метод» и «тип» не отражают этого требования: заместитель не наследует класс и не повторяет отдельный метод, а воспроизводит весь контракт интерфейса.",
      en: "A proxy must implement the same interface as the real object, and it is this shared interface that makes the substitution transparent to the client. \"Class\", \"method\", and \"type\" miss the point: the surrogate does not inherit a class or mirror a single method, it reproduces the whole interface contract.",
    },
    conceptId: "proxy",
  },
  {
    id: "fb-chain-of-responsibility-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Избавляет ___ запроса от жёсткой привязки к получателю, давая возможность обработать запрос более чем одному объекту. Получатели связываются в цепочку, и запрос передаётся по ней, пока какой-нибудь объект его не обработает.",
      en: "Avoid coupling the ___ of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along the chain until an object handles it.",
    },
    options: {
      ru: ["обработчика", "отправителя", "клиента", "подписчика"],
      en: ["handler", "sender", "client", "subscriber"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Паттерн освобождает именно отправителя запроса от жёсткой привязки к получателю, позволяя запросу идти по цепочке до обработки. «Обработчик» — это принимающая сторона, а «клиент» и «подписчик» (последний из паттерна Наблюдатель) — посторонние роли, а не та сторона, которую отвязывают от получателя.",
      en: "The pattern's intent is to decouple the sender of a request from its receiver, letting the request travel the chain until it is handled. \"Handler\" is the receiving side, while \"client\" and \"subscriber\" (the latter belonging to Observer) are unrelated roles, not the party being freed from coupling to the receiver.",
    },
    conceptId: "chain-of-responsibility",
  },
  {
    id: "fb-command-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "___ запрос в виде объекта, позволяя параметризовать клиентов разными запросами, ставить запросы в очередь, протоколировать их и поддерживать отмену операций.",
      en: "___ a request as an object, letting you parameterize clients with different requests, queue or log requests, and support undoable operations.",
    },
    options: {
      ru: ["Абстрагирует", "Инкапсулирует", "Делегирует", "Представляет"],
      en: ["Abstracts", "Encapsulates", "Delegates", "Represents"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Паттерн Command именно инкапсулирует запрос как самостоятельный объект — это его определяющее свойство, которое и позволяет ставить запросы в очередь, протоколировать их и отменять. «Абстрагирует», «делегирует» и «представляет» описывают другие идеи и не передают суть упаковки запроса в отдельный объект.",
      en: "The Command pattern encapsulates a request as a standalone object — that is its defining property, which is exactly what enables queuing, logging, and undoing requests. \"Abstracts\", \"delegates\", and \"represents\" describe different ideas and miss the core notion of packaging a request into its own object.",
    },
    conceptId: "command",
  },
  {
    id: "fb-interpreter-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Для заданного языка определяет представление его ___, а также интерпретатор, который использует это представление для интерпретации предложений языка.",
      en: "Given a language, defines a representation for its ___ along with an interpreter that uses that representation to interpret sentences in the language.",
    },
    options: {
      ru: ["грамматики", "семантики", "словаря", "алфавита"],
      en: ["grammar", "semantics", "vocabulary", "alphabet"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Паттерн Interpreter строит представление именно грамматики языка — набора правил, порождающих его предложения, и по нему интерпретирует ввод. Семантика описывает смысл, а словарь и алфавит задают лишь слова и символы, но не структуру языка.",
      en: "The Interpreter pattern builds a representation of the language's grammar — the rules that generate its sentences — and interprets input against it. Semantics concerns meaning, while vocabulary and alphabet cover only words and symbols, not the language's structure.",
    },
    conceptId: "interpreter",
  },
  {
    id: "fb-iterator-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "junior",
    prompt: {
      ru: "Предоставляет способ ___ доступа ко всем элементам составного объекта, не раскрывая его внутреннего представления.",
      en: "Provides a way to access the elements of an aggregate object ___ without exposing its underlying representation.",
    },
    options: {
      ru: ["произвольного", "прямого", "последовательного", "параллельного"],
      en: ["randomly", "directly", "sequentially", "concurrently"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Итератор обеспечивает именно последовательный обход элементов коллекции без раскрытия её внутренней структуры — это его определяющая черта. Произвольный, прямой или параллельный доступ не характеризуют суть этого паттерна.",
      en: "The Iterator pattern specifically provides sequential traversal of a collection's elements without revealing its internal structure — that is its defining trait. Random, direct, or concurrent access does not capture the essence of this pattern.",
    },
    conceptId: "iterator",
  },
  {
    id: "fb-mediator-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Определяет объект, ___ способ взаимодействия множества объектов. Mediator обеспечивает слабую связанность, избавляя объекты от необходимости явно ссылаться друг на друга, и позволяет независимо изменять схему их взаимодействия.",
      en: "Defines an object that ___ how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently.",
    },
    options: {
      ru: ["наблюдающий", "инкапсулирующий", "делегирующий", "ограничивающий"],
      en: ["observes", "encapsulates", "delegates", "restricts"],
    },
    correctIndex: 1,
    explanation: {
      ru: "По определению GoF объект-посредник именно инкапсулирует способ взаимодействия множества объектов, скрывая эту логику внутри себя. Варианты «наблюдающий», «делегирующий» и «ограничивающий» описывают иные механизмы (наблюдение как в Observer, делегирование, ограничение) и не соответствуют канонической формулировке.",
      en: "By the GoF definition, the Mediator object encapsulates how a set of objects interact, hiding that logic inside itself. \"Observes\" (the signature verb of the Observer pattern), \"delegates\", and \"restricts\" describe different mechanisms and are not the term used in the canonical intent.",
    },
    conceptId: "mediator",
  },
  {
    id: "fb-memento-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Не нарушая ___, фиксирует и выносит за пределы объекта его внутреннее состояние так, чтобы позднее объект можно было восстановить в этом состоянии.",
      en: "Without violating ___, captures and externalizes an object's internal state so that the object can later be restored to that state.",
    },
    options: {
      ru: ["абстракции", "полиморфизма", "инкапсуляции", "наследования"],
      en: ["abstraction", "polymorphism", "encapsulation", "inheritance"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Ключевая гарантия паттерна Снимок (Memento) — сохранить и восстановить состояние объекта, не раскрывая его внутренней реализации, поэтому инкапсуляция не нарушается. Абстракция, полиморфизм и наследование — другие принципы ООП и не отражают суть этого требования.",
      en: "The core guarantee of the Memento pattern is to save and restore an object's state without exposing its internal implementation, which is exactly why encapsulation is preserved. Abstraction, polymorphism, and inheritance are other OOP concepts and do not capture this specific requirement.",
    },
    conceptId: "memento",
  },
  {
    id: "fb-template-method-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Определяет скелет алгоритма в операции базового класса, откладывая реализацию некоторых шагов на подклассы. Template Method позволяет подклассам ___ отдельные шаги алгоритма, не меняя его общую структуру.",
      en: "Defines the skeleton of an algorithm in an operation of a base class, deferring some steps to subclasses. Template Method lets subclasses ___ certain steps of an algorithm without changing the algorithm's overall structure.",
    },
    options: {
      ru: ["вызывать", "переопределять", "удалять", "дублировать"],
      en: ["call", "redefine", "remove", "duplicate"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Template Method позволяет подклассам переопределять отдельные шаги алгоритма, сохраняя его общую структуру неизменной. Подклассы не вызывают, не удаляют и не дублируют шаги — управление ходом алгоритма остаётся в базовом классе.",
      en: "Template Method lets subclasses redefine individual steps while the base class keeps the overall algorithm fixed. Subclasses do not call, remove, or duplicate the steps — control over the algorithm's flow stays in the base class.",
    },
    conceptId: "template-method",
  },
  {
    id: "fb-visitor-1",
    type: "fill-blank",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Представляет операцию, выполняемую над каждым объектом из некоторой структуры объектов. Visitor позволяет определить новую операцию, не изменяя ___ объектов, над которыми она выполняется.",
      en: "Represents an operation to be performed on each object in an object structure. Visitor lets you define a new operation without changing the ___ of the elements on which it operates.",
    },
    options: {
      ru: ["интерфейсы", "методы", "классы", "поля"],
      en: ["interfaces", "methods", "classes", "fields"],
    },
    correctIndex: 2,
    explanation: {
      ru: "По определению GoF паттерн Visitor позволяет добавлять новые операции, не изменяя классы объектов, над которыми они выполняются, — в этом его ключевая цель. Интерфейсы, методы и поля называют отдельных членов типа, тогда как в определении речь идёт именно о классах элементов как целом.",
      en: "By the GoF definition, Visitor lets you add new operations without changing the classes of the elements it operates on — that is its whole point. Interfaces, methods, and fields name individual members, whereas the definition refers specifically to the element classes as a whole.",
    },
    conceptId: "visitor",
  },
  {
    id: "fb-layered-1",
    type: "fill-blank",
    category: "architecture",
    grade: "junior",
    prompt: {
      ru: "Архитектурный стиль, при котором система разделена на горизонтальные слои с чёткими ролями (классически по Fowler: presentation, domain, data source), где каждый слой предоставляет сервисы слою выше и пользуется сервисами слоя ниже. Зависимости направлены строго ___: слой знает о нижележащем, но ничего не знает о вышележащем.",
      en: "An architectural style in which the system is divided into horizontal layers with well-defined roles (classically, per Fowler: presentation, domain, data source), where each layer provides services to the layer above it and consumes services from the layer below it. Dependencies point strictly ___: a layer knows about the one beneath it but knows nothing about the one above it.",
    },
    options: {
      ru: ["вниз", "вверх", "внутрь", "наружу"],
      en: ["downward", "upward", "inward", "outward"],
    },
    correctIndex: 0,
    explanation: {
      ru: "В слоистой архитектуре зависимости направлены строго вниз: каждый слой знает только о нижележащем и ничего — о вышележащем. «Вверх» — прямое нарушение этого правила, а «внутрь» и «наружу» описывают направление зависимостей в гексагональной и «луковичной» (onion/clean) архитектурах, а не в слоистой.",
      en: "In layered architecture dependencies point strictly downward: each layer knows only about the one beneath it and nothing about the one above. \"Upward\" directly violates this rule, while \"inward\" and \"outward\" describe the dependency direction of hexagonal and onion/clean architectures, not of layered ones.",
    },
    conceptId: "layered",
  },
  {
    id: "fb-mvc-1",
    type: "fill-blank",
    category: "architecture",
    grade: "junior",
    prompt: {
      ru: "Архитектурный стиль пользовательского интерфейса, разделяющий приложение на три роли: Model хранит данные и бизнес-логику, View ___ состояние Model, а Controller интерпретирует ввод пользователя и преобразует его в операции над Model. Model ничего не знает о View и Controller.",
      en: "A user-interface architectural style that splits an application into three roles: the Model holds data and business logic, the View ___ the Model's state, and the Controller interprets user input and turns it into operations on the Model. The Model knows nothing about the View or the Controller.",
    },
    options: {
      ru: ["модифицирует", "отображает", "инкапсулирует", "валидирует"],
      en: ["modifies", "renders", "encapsulates", "validates"],
    },
    correctIndex: 1,
    explanation: {
      ru: "View — пассивное представление, которое лишь отображает текущее состояние Model, поэтому верный термин «отображает». Оно не модифицирует, не инкапсулирует и не валидирует данные — это ответственность Model и Controller.",
      en: "The View is a passive presentation that only renders the Model's current state, so \"renders\" is the correct term. It does not modify, encapsulate, or validate data — those are the responsibilities of the Model and the Controller.",
    },
    conceptId: "mvc",
  },
  {
    id: "fb-mvvm-1",
    type: "fill-blank",
    category: "architecture",
    grade: "middle",
    prompt: {
      ru: "Архитектурный стиль UI-слоя, разделяющий интерфейс на Model (доменные данные и логика), View (___ отображение) и ViewModel (состояние и логика представления). View связывается с ViewModel механизмом data binding и обновляется автоматически; сам ViewModel не имеет ссылки на View. Развитие Presentation Model Мартина Фаулера, оформленное Джоном Госсманом для WPF.",
      en: "A UI-layer architectural style that splits the interface into Model (domain data and logic), View (___ rendering), and ViewModel (presentation state and logic). The View binds to the ViewModel via data binding and updates automatically; the ViewModel itself holds no reference to the View. It is an evolution of Martin Fowler's Presentation Model, formalized by John Gossman for WPF.",
    },
    options: {
      ru: ["императивное", "реактивное", "декларативное", "асинхронное"],
      en: ["imperative", "reactive", "declarative", "asynchronous"],
    },
    correctIndex: 2,
    explanation: {
      ru: "В MVVM (особенно в WPF/XAML) View описывается декларативно: задаётся, что показать, а связывание с данными делает разметку самодостаточной. «Императивное» и «асинхронное» характеризуют способ выполнения кода, а не форму представления, а «реактивное» относится к модели распространения изменений, а не к самому отображению.",
      en: "In MVVM (especially WPF/XAML) the View is expressed declaratively: you state what to show, and data binding makes the markup self-sufficient. \"Imperative\" and \"asynchronous\" describe how code executes rather than the form of the view, while \"reactive\" refers to a change-propagation model, not the rendering itself.",
    },
    conceptId: "mvvm",
  },
  {
    id: "fb-monolith-1",
    type: "fill-blank",
    category: "architecture",
    grade: "middle",
    prompt: {
      ru: "Архитектурный стиль, при котором вся функциональность приложения собирается и разворачивается как ___ и выполняется в одном процессе. Модули взаимодействуют прямыми вызовами внутри процесса, а не по сети (Fowler: single deployable unit).",
      en: "An architectural style in which all of an application's functionality is built and deployed as a ___ and runs in one process. Modules interact through direct in-process calls rather than over the network (Fowler: single deployable unit).",
    },
    options: {
      ru: ["единое целое", "распределённая система", "набор микросервисов", "кластер процессов"],
      en: ["single unit", "distributed system", "collection of microservices", "cluster of processes"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Монолит по определению собирается и разворачивается как единое целое — один разворачиваемый артефакт в одном процессе (Fowler: single deployable unit). Распределённая система, набор микросервисов и кластер процессов, наоборот, описывают многокомпонентные архитектуры, взаимодействующие по сети, что противоречит сути монолита.",
      en: "By definition a monolith is built and deployed as a single unit — one deployable artifact running in one process (Fowler: single deployable unit). A distributed system, a collection of microservices, or a cluster of processes instead describe multi-component architectures that communicate over the network, which contradicts the very idea of a monolith.",
    },
    conceptId: "monolith",
  },
  {
    id: "fb-hexagonal-1",
    type: "fill-blank",
    category: "architecture",
    grade: "senior",
    prompt: {
      ru: "Архитектурный стиль (Alistair Cockburn), в котором приложение можно в равной степени управлять пользователями, программами, автотестами или скриптами и разрабатывать в изоляции от его конечных устройств и баз данных. Ядро приложения объявляет порты — интерфейсы взаимодействия с внешним миром, а ___ транслируют конкретные технологии (UI, HTTP, БД, очереди) в эти порты и обратно. Все зависимости направлены внутрь, к ядру.",
      en: "An architectural style (Alistair Cockburn) in which an application can be driven equally by users, programs, automated tests, or scripts, and be developed in isolation from its eventual run-time devices and databases. The application core declares ports — interfaces for interacting with the outside world — and ___ translate specific technologies (UI, HTTP, databases, queues) into those ports and back. All dependencies point inward, toward the core.",
    },
    options: {
      ru: ["фасады", "адаптеры", "декораторы", "прокси"],
      en: ["facades", "adapters", "decorators", "proxies"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Адаптеры — это компоненты гексагональной архитектуры, которые преобразуют конкретные технологии в порты ядра и обратно (отсюда и название «порты и адаптеры»). Фасады, декораторы и прокси — структурные паттерны GoF с иными задачами (упрощение интерфейса, добавление поведения, контроль доступа) и не являются термином этого стиля.",
      en: "Adapters are the hexagonal-architecture components that convert specific technologies into the core's ports and back (hence the name Ports & Adapters). Facades, decorators, and proxies are GoF structural patterns with different purposes (simplifying an interface, adding behavior, controlling access) and are not the term used in this style.",
    },
    conceptId: "hexagonal",
  },
  {
    id: "fb-clean-architecture-1",
    type: "fill-blank",
    category: "architecture",
    grade: "senior",
    prompt: {
      ru: "Архитектурный стиль, предложенный Robert C. Martin: код организуется в концентрические слои (Entities, Use Cases, Interface Adapters, Frameworks & Drivers) с единственным жёстким правилом — Dependency Rule: зависимости исходного кода направлены только ___, к более высокоуровневым политикам. Внутренние слои ничего не знают о внешних: бизнес-правила не зависят от UI, базы данных и фреймворков.",
      en: "An architectural style introduced by Robert C. Martin: code is organized into concentric layers (Entities, Use Cases, Interface Adapters, Frameworks & Drivers), governed by a single hard rule — the Dependency Rule: source-code dependencies point only ___, toward higher-level policies. Inner layers know nothing about outer ones: business rules don't depend on the UI, the database, or frameworks.",
    },
    options: {
      ru: ["наружу", "внутрь", "вверх", "вниз"],
      en: ["outward", "inward", "upward", "downward"],
    },
    correctIndex: 1,
    explanation: {
      ru: "Dependency Rule требует, чтобы зависимости исходного кода были направлены только внутрь — к более высокоуровневым, стабильным политикам, поэтому внутренние слои ничего не знают о внешних. Вариант «наружу» прямо нарушает это правило, а «вверх»/«вниз» не отражают концентрическую модель Clean Architecture, где направление задаётся радиально, а не по вертикали.",
      en: "The Dependency Rule requires that source-code dependencies point only inward — toward higher-level, more stable policies — which is why inner layers know nothing about outer ones. \"Outward\" directly violates the rule, while \"upward\"/\"downward\" don't match Clean Architecture's concentric model, where dependency direction is radial rather than vertical.",
    },
    conceptId: "clean-architecture",
  },
  {
    id: "fb-event-driven-1",
    type: "fill-blank",
    category: "architecture",
    grade: "senior",
    prompt: {
      ru: "Архитектурный стиль, в котором компоненты взаимодействуют, производя и потребляя события — уведомления о свершившихся фактах. Издатель (producer) публикует событие в шину или брокер (event bus, message broker), не зная получателей; потребители (consumers) подписываются на интересующие события и реагируют независимо и, как правило, ___.",
      en: "An architectural style in which components interact by producing and consuming events—notifications that something has already happened. A producer publishes an event to an event bus or message broker without knowing the recipients; consumers subscribe to the events they care about and react independently and, as a rule, ___.",
    },
    options: {
      ru: ["синхронно", "асинхронно", "последовательно", "немедленно"],
      en: ["synchronously", "asynchronously", "sequentially", "immediately"],
    },
    correctIndex: 1,
    explanation: {
      ru: "В событийно-ориентированной архитектуре потребители обрабатывают события асинхронно — не блокируя издателя и не дожидаясь друг друга, что и обеспечивает слабую связанность и развязку во времени. «Синхронно» прямо противоречит этой идее, а «последовательно» и «немедленно» описывают порядок или скорость, а не независимый неблокирующий характер реакции.",
      en: "In event-driven architecture consumers process events asynchronously—without blocking the producer or waiting for one another—which is precisely what enables loose coupling and decoupling in time. \"Synchronously\" directly contradicts this, while \"sequentially\" and \"immediately\" describe ordering or speed rather than the independent, non-blocking nature of the reaction.",
    },
    conceptId: "event-driven",
  },
  {
    id: "fb-microservices-1",
    type: "fill-blank",
    category: "architecture",
    grade: "lead",
    prompt: {
      ru: "Архитектурный стиль, при котором приложение строится как набор небольших сервисов, каждый из которых работает в собственном процессе, владеет своими данными и общается с остальными через лёгкие сетевые механизмы (обычно HTTP API или сообщения). Сервисы организованы вокруг ___ и развёртываются независимо друг от друга (Fowler, Lewis).",
      en: "An architectural style in which an application is built as a suite of small services, each running in its own process, owning its own data, and communicating with the others through lightweight network mechanisms (typically HTTP APIs or messaging). Services are organized around ___ and are deployed independently of one another (Fowler and Lewis).",
    },
    options: {
      ru: ["технических слоёв", "типов данных", "бизнес-возможностей", "сетевых протоколов"],
      en: ["technical layers", "data types", "business capabilities", "network protocols"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Согласно Fowler и Lewis, микросервисы декомпозируются вокруг бизнес-возможностей, то есть по областям бизнеса. Организация вокруг технических слоёв характерна для монолита, а типы данных и сетевые протоколы описывают способ реализации, а не границы сервисов.",
      en: "Per Fowler and Lewis, microservices are decomposed around business capabilities, i.e. along business domains. Organizing around technical layers is typical of a monolith, while data types and network protocols describe how a service is implemented rather than where its boundaries lie.",
    },
    conceptId: "microservices",
  },
  {
    id: "fb-composition-vs-inheritance-1",
    type: "fill-blank",
    category: "tradeoff",
    grade: "middle",
    prompt: {
      ru: "Сравнение двух механизмов переиспользования кода: class inheritance — переиспользование «белым ящиком» (подкласс видит детали родителя и расширяет его ___) и object composition — переиспользование «чёрным ящиком» (объект собирается из других объектов и делегирует им работу через интерфейсы). Классическая рекомендация GoF: «Favor object composition over class inheritance» — предпочитайте композицию объектов наследованию классов.",
      en: "A comparison of two code-reuse mechanisms: class inheritance is \"white-box\" reuse (a subclass sees the parent's internals and extends it by ___), while object composition is \"black-box\" reuse (an object is assembled from other objects and delegates work to them through interfaces). The classic GoF guideline: \"Favor object composition over class inheritance.\"",
    },
    options: {
      ru: ["переопределением", "делегированием", "композицией", "агрегацией"],
      en: ["overriding", "delegation", "composition", "aggregation"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Белоящичное переиспользование при наследовании работает именно за счёт переопределения методов родителя в подклассе. Делегирование, композиция и агрегация — это механизмы сборки объектов из других объектов (сторона object composition), а не расширения класса через подкласс.",
      en: "White-box reuse via inheritance works precisely by overriding the parent's methods in a subclass. Delegation, composition, and aggregation are ways of assembling objects from other objects (the object-composition side), not of extending a class through a subclass.",
    },
    conceptId: "composition-vs-inheritance",
  },
  {
    id: "fb-coupling-cohesion-1",
    type: "fill-blank",
    category: "tradeoff",
    grade: "middle",
    prompt: {
      ru: "Coupling (зацепление) — степень ___ модулей: насколько изменение или использование одного требует знания внутренностей другого. Cohesion (связность) — степень, в которой элементы модуля объединены одной задачей. Классический ориентир структурного дизайна (Constantine/Yourdon, позднее у Robert C. Martin): стремиться к low coupling и high cohesion.",
      en: "Coupling is the degree of ___ between modules: how much changing or using one requires knowing the internals of another. Cohesion is the degree to which the elements of a module are united around a single task. The classic guideline of structured design (Constantine/Yourdon, later echoed by Robert C. Martin): aim for low coupling and high cohesion.",
    },
    options: {
      ru: ["независимости", "абстракции", "взаимозависимости", "сходства"],
      en: ["independence", "abstraction", "interdependence", "similarity"],
    },
    correctIndex: 2,
    explanation: {
      ru: "Coupling определяется именно как степень взаимозависимости модулей — насколько один опирается на внутренности другого. «Независимость» — это противоположность (цель низкого зацепления), а «абстракция» и «сходство» описывают иные свойства и не выражают меру связей между модулями.",
      en: "Coupling is defined precisely as the degree of interdependence between modules — how much one relies on another's internals. \"Independence\" is the opposite (the goal of low coupling), while \"abstraction\" and \"similarity\" describe different properties and don't express the measure of ties between modules.",
    },
    conceptId: "coupling-cohesion",
  },
  {
    id: "fb-dry-vs-duplication-1",
    type: "fill-blank",
    category: "tradeoff",
    grade: "middle",
    prompt: {
      ru: "DRY (Hunt, Thomas, «The Pragmatic Programmer»): каждый фрагмент ___ должен иметь единственное, непротиворечивое, авторитетное представление в системе. Компромисс DRY vs Duplication — умение отличать дублирование знания (его устраняют) от случайного текстуального сходства кода, который лишь выглядит одинаково, но выражает разные вещи.",
      en: "DRY (Hunt and Thomas, The Pragmatic Programmer): every piece of ___ must have a single, unambiguous, authoritative representation within the system. The DRY vs Duplication trade-off is the skill of telling duplicated knowledge (which you eliminate) apart from incidental textual similarity in code that merely looks alike but expresses different things.",
    },
    options: {
      ru: ["кода", "знания", "логики", "данных"],
      en: ["code", "knowledge", "logic", "data"],
    },
    correctIndex: 1,
    explanation: {
      ru: "В формулировке Ханта и Томаса DRY относится именно к знанию: каждый фрагмент знания должен иметь единственное авторитетное представление. Дистракторы (код, логика, данные) отражают распространённое заблуждение — DRY борется с дублированием знания, а не с текстуальным дублированием кода.",
      en: "In Hunt and Thomas's formulation DRY is about knowledge: every piece of knowledge must have a single authoritative representation. The distractors (code, logic, data) reflect the common misconception — DRY targets duplicated knowledge, not incidental textual duplication of code.",
    },
    conceptId: "dry-vs-duplication",
  },
  {
    id: "fb-abstraction-cost-1",
    type: "fill-blank",
    category: "tradeoff",
    grade: "senior",
    prompt: {
      ru: "Любая абстракция имеет цену: дополнительный слой косвенности (indirection), рост когнитивной нагрузки при чтении и отладке, а также риск «протечки» скрытых деталей (Law of Leaky Abstractions, Joel Spolsky). Абстракция оправдана только тогда, когда выгода от ___ и сокрытия деталей превышает эту цену.",
      en: "Every abstraction has a cost: an extra layer of indirection, higher cognitive load when reading and debugging, and the risk that hidden details leak through (the Law of Leaky Abstractions, Joel Spolsky). An abstraction is justified only when the benefit of ___ and hiding details outweighs that cost.",
    },
    options: {
      ru: ["развязки", "переиспользования", "расширяемости", "гибкости"],
      en: ["decoupling", "reuse", "extensibility", "flexibility"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Развязка (decoupling) — одно из двух ключевых оправданий абстракции наряду с сокрытием деталей: именно снижение зависимостей между компонентами способно окупить цену дополнительного слоя. Переиспользование, расширяемость и гибкость тоже полезны, но в этом определении в паре с сокрытием деталей стоит именно развязка зависимостей.",
      en: "Decoupling is one of the two core justifications for an abstraction alongside hiding details: reducing dependencies between components is what can outweigh the cost of the extra layer. Reuse, extensibility, and flexibility are also desirable, but this definition specifically pairs decoupling with hiding details.",
    },
    conceptId: "abstraction-cost",
  },
  {
    id: "fb-yagni-vs-flexibility-1",
    type: "fill-blank",
    category: "tradeoff",
    grade: "senior",
    prompt: {
      ru: "YAGNI (You Aren't Gonna Need It) — принцип экстремального программирования (Kent Beck, Ron Jeffries; развит в эссе Fowler «Yagni»): не реализуй функциональность и точки расширения, пока они реально не понадобились. Компромисс — между стоимостью спекулятивной гибкости, которую платишь сейчас, и стоимостью ___ потом, если требование всё-таки появится.",
      en: "YAGNI (You Aren't Gonna Need It) is an Extreme Programming principle (Kent Beck, Ron Jeffries; developed in Fowler's essay \"Yagni\"): don't implement functionality or extension points until you actually need them. The trade-off is between the cost of speculative flexibility you pay for now and the cost of ___ later if the requirement does eventually arrive.",
    },
    options: {
      ru: ["рефакторинга", "тестирования", "развёртывания", "сопровождения"],
      en: ["refactoring", "testing", "deployment", "maintenance"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Правильный термин — «рефакторинга»: YAGNI откладывает добавление гибкости, и компромисс касается именно стоимости переработки существующего кода, когда требование всё-таки появится. Тестирование, развёртывание и сопровождение — обычные виды работ, но они не отражают суть отложенного изменения структуры кода.",
      en: "The correct term is \"refactoring\": YAGNI defers adding flexibility, and the trade-off is precisely the cost of reshaping existing code once the requirement finally arrives. Testing, deployment, and maintenance are ordinary activities but don't capture the essence of the deferred structural change.",
    },
    conceptId: "yagni-vs-flexibility",
  },
  {
    id: "fb-performance-vs-readability-1",
    type: "fill-blank",
    category: "tradeoff",
    grade: "lead",
    prompt: {
      ru: "Компромисс между временем выполнения кода и стоимостью его понимания и сопровождения. Оптимизации (ручные циклы, кэши, предвыделенные буферы, денормализация) почти всегда усложняют код, поэтому по умолчанию выбирается читаемость, а производительность повышается точечно — на измеренных ___ путях. Классическая формулировка у Knuth: «premature optimization is the root of all evil» — примерно в 97% случаев о мелких эффективностях стоит забыть, но в критичных 3% оптимизация обязательна.",
      en: "A trade-off between how fast code runs and the cost of understanding and maintaining it. Optimizations (hand-rolled loops, caches, preallocated buffers, denormalization) almost always make code more complex, so readability is the default and performance is raised selectively — on measured ___ paths. Knuth's classic formulation is \"premature optimization is the root of all evil\": in roughly 97% of cases small efficiencies should be forgotten, but in the critical 3% optimization is essential.",
    },
    options: {
      ru: ["горячих", "холодных", "критических", "основных"],
      en: ["hot", "cold", "critical", "core"],
    },
    correctIndex: 0,
    explanation: {
      ru: "Канонический термин — «горячий путь»: часто исполняемый участок кода, выявленный измерением, где оптимизация реально окупается. «Холодные» пути исполняются редко и оптимизировать их незачем, «критический путь» — понятие из планирования зависимостей, а «основной» описывает центральные модули, а не частоту исполнения.",
      en: "The canonical term is \"hot path\" — the frequently executed code, identified by measurement, where optimization actually pays off. \"Cold\" paths run rarely and aren't worth optimizing, a \"critical path\" is a dependency-scheduling concept, and \"core\" describes central modules rather than execution frequency.",
    },
    conceptId: "performance-vs-readability",
  },
];
