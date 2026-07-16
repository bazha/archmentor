import type { Concept } from '../schema';

export const patterns: Concept[] = [
  {
    id: "strategy",
    name: "Strategy",
    aka: [
      "Policy",
    ],
    category: "behavioral",
    grade: "middle",
    tagline: {
      ru: "Взаимозаменяемые алгоритмы за общим интерфейсом",
      en: "Interchangeable algorithms behind a common interface",
    },
    definition: {
      ru: "Определяет семейство алгоритмов, инкапсулирует каждый из них и делает их взаимозаменяемыми. Strategy позволяет менять алгоритм независимо от клиента, который им пользуется.",
      en: "Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Strategy lets the algorithm vary independently from the clients that use it.",
    },
    problem: {
      ru: "Класс жёстко зашивает один способ поведения (расчёт цены, сортировку, сжатие). Добавление или замена варианта требует правки самого класса и плодит условные операторы.",
      en: "A class hard-codes a single way of behaving (price calculation, sorting, compression). Adding or replacing a variant requires editing the class itself and breeds conditional statements.",
    },
    solution: {
      ru: "Выносим алгоритм за интерфейс Strategy. Контекст хранит ссылку на выбранную стратегию и делегирует ей работу; клиент подставляет нужную стратегию извне.",
      en: "Extract the algorithm behind a Strategy interface. The context holds a reference to the chosen strategy and delegates the work to it; the client supplies the desired strategy from the outside.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface PricingStrategy { price(base: number): number; }",
          "class Regular implements PricingStrategy { price(b: number) { return b; } }",
          "class Vip implements PricingStrategy { price(b: number) { return b * 0.8; } }",
          "",
          "class Checkout {",
          "  constructor(private strategy: PricingStrategy) {}",
          "  setStrategy(s: PricingStrategy) { this.strategy = s; } // выбор делает клиент",
          "  total(base: number) { return this.strategy.price(base); }",
          "}",
          "",
          "const checkout = new Checkout(new Regular());",
          "checkout.setStrategy(new Vip()); // алгоритм заменён извне, без внутренних переходов",
        ].join('\n'),
        en: [
          "interface PricingStrategy { price(base: number): number; }",
          "class Regular implements PricingStrategy { price(b: number) { return b; } }",
          "class Vip implements PricingStrategy { price(b: number) { return b * 0.8; } }",
          "",
          "class Checkout {",
          "  constructor(private strategy: PricingStrategy) {}",
          "  setStrategy(s: PricingStrategy) { this.strategy = s; } // the client makes the choice",
          "  total(base: number) { return this.strategy.price(base); }",
          "}",
          "",
          "const checkout = new Checkout(new Regular());",
          "checkout.setStrategy(new Vip()); // the algorithm is swapped from outside, with no internal transitions",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Замена алгоритма во время выполнения",
        "Изоляция вариантов поведения",
        "Убирает разрастание условных операторов",
      ],
      en: [
        "Swap the algorithm at runtime",
        "Isolates behavior variants",
        "Eliminates the sprawl of conditional statements",
      ],
    },
    cons: {
      ru: [
        "Растёт число классов",
        "Клиент должен знать о существующих стратегиях",
      ],
      en: [
        "Increases the number of classes",
        "The client has to know about the available strategies",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость выбора алгоритма против количества классов",
      ],
      en: [
        "Flexibility in choosing the algorithm versus the number of classes",
      ],
    },
    whenToUse: {
      ru: [
        "Есть несколько вариантов одного поведения",
        "Нужно переключать алгоритм в рантайме извне",
      ],
      en: [
        "There are several variants of one behavior",
        "You need to switch the algorithm at runtime from the outside",
      ],
    },
    whenNotToUse: {
      ru: [
        "Вариант поведения всегда один и не меняется",
      ],
      en: [
        "There is always a single behavior variant that never changes",
      ],
    },
    related: [
      "state",
    ],
    diagram: `classDiagram
  class Checkout {
    +total(base)
  }
  class PricingStrategy {
    <<interface>>
    +price(base)
  }
  Checkout o--> PricingStrategy : delegates
  PricingStrategy <|.. Regular
  PricingStrategy <|.. Vip`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "observer",
    name: "Observer",
    aka: [
      "Dependents",
      "Publish-Subscribe",
    ],
    category: "behavioral",
    grade: "middle",
    tagline: {
      ru: "Один-ко-многим: подписчики узнают об изменениях автоматически",
      en: "One-to-many: subscribers are notified of changes automatically",
    },
    definition: {
      ru: "Определяет зависимость «один ко многим» между объектами так, что при изменении состояния одного объекта все зависящие от него автоматически уведомляются и обновляются.",
      en: "Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.",
    },
    problem: {
      ru: "Несколько объектов должны реагировать на изменение состояния источника, но жёсткая привязка источника к каждому получателю делает систему негибкой: добавление нового получателя требует правки источника.",
      en: "Several objects need to react when a source's state changes, but hard-wiring the source to each recipient makes the system inflexible: adding a new recipient forces you to modify the source.",
    },
    solution: {
      ru: "Источник (subject) хранит список подписчиков (observers) и при изменении состояния вызывает у каждого метод обновления. Подписчики добавляются и удаляются динамически, источник о них ничего конкретного не знает.",
      en: "The subject keeps a list of observers and, whenever its state changes, calls an update method on each of them. Observers are added and removed dynamically, and the subject knows nothing concrete about them.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface Observer { update(temperature: number): void; }",
          "",
          "class WeatherStation {",
          "  private observers: Observer[] = [];",
          "  private temperature = 0;",
          "  subscribe(o: Observer) { this.observers.push(o); }",
          "  unsubscribe(o: Observer) { this.observers = this.observers.filter((x) => x !== o); }",
          "  setTemperature(t: number) { this.temperature = t; this.notify(); }",
          "  private notify() { for (const o of this.observers) o.update(this.temperature); }",
          "}",
          "",
          "class PhoneDisplay implements Observer {",
          "  update(t: number) { console.log(`Телефон: ${t}°`); }",
          "}",
        ].join('\n'),
        en: [
          "interface Observer { update(temperature: number): void; }",
          "",
          "class WeatherStation {",
          "  private observers: Observer[] = [];",
          "  private temperature = 0;",
          "  subscribe(o: Observer) { this.observers.push(o); }",
          "  unsubscribe(o: Observer) { this.observers = this.observers.filter((x) => x !== o); }",
          "  setTemperature(t: number) { this.temperature = t; this.notify(); }",
          "  private notify() { for (const o of this.observers) o.update(this.temperature); }",
          "}",
          "",
          "class PhoneDisplay implements Observer {",
          "  update(t: number) { console.log(`Phone: ${t}°`); }",
          "}",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Слабая связанность источника и подписчиков",
        "Подписчиков можно добавлять и убирать в рантайме",
        "Поддержка вещания «один ко многим»",
      ],
      en: [
        "Loose coupling between the subject and its observers",
        "Observers can be added and removed at runtime",
        "Supports one-to-many broadcast communication",
      ],
    },
    cons: {
      ru: [
        "Порядок уведомления не гарантирован",
        "Каскадные обновления трудно отлаживать",
        "Риск утечек памяти при забытой отписке",
      ],
      en: [
        "The order in which observers are notified is not guaranteed",
        "Cascading updates are hard to debug",
        "Risk of memory leaks when observers forget to unsubscribe",
      ],
    },
    tradeoffs: {
      ru: [
        "Развязка компонентов против предсказуемости потока уведомлений",
      ],
      en: [
        "Decoupling components versus predictability of the notification flow",
      ],
    },
    whenToUse: {
      ru: [
        "Изменение одного объекта должно отражаться на других без жёсткой привязки",
        "Число и состав получателей заранее неизвестны",
      ],
      en: [
        "A change in one object must be reflected in others without tight coupling",
        "The number and identity of the recipients are not known in advance",
      ],
    },
    whenNotToUse: {
      ru: [
        "Получатель ровно один и связь простая — достаточно прямого вызова",
      ],
      en: [
        "There is exactly one recipient and the relationship is simple — a direct call is enough",
      ],
    },
    related: [
      "strategy",
    ],
    diagram: `classDiagram
  class Subject {
    +attach(o)
    +notify()
  }
  class Observer {
    <<interface>>
    +update()
  }
  Subject o--> "many" Observer
  Observer <|.. ConcreteObserver`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "factory-method",
    name: "Factory Method",
    aka: [
      "Virtual Constructor",
    ],
    category: "creational",
    grade: "middle",
    tagline: {
      ru: "Подкласс решает, какой объект создать",
      en: "The subclass decides which object to create",
    },
    definition: {
      ru: "Определяет интерфейс для создания объекта, но позволяет подклассам решать, какой класс инстанцировать. Factory Method делегирует создание объекта подклассам.",
      en: "Defines an interface for creating an object, but lets subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.",
    },
    problem: {
      ru: "Базовый класс должен работать с продуктом, но не знает заранее его конкретный тип. Прямое создание через new в базовом классе привязало бы его к конкретной реализации.",
      en: "The base class needs to work with a product but doesn't know its concrete type ahead of time. Creating it directly with new inside the base class would couple that class to a specific implementation.",
    },
    solution: {
      ru: "Объявляем в базовом классе фабричный метод, возвращающий продукт по интерфейсу. Каждый подкласс переопределяет этот единственный метод и создаёт свою конкретную реализацию, а общий алгоритм остаётся в базовом классе.",
      en: "Declare a factory method in the base class that returns the product through its interface. Each subclass overrides this single method to create its own concrete implementation, while the shared algorithm stays in the base class.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface Button { render(): string; }",
          "class HtmlButton implements Button { render() { return '<button>'; } }",
          "class WindowsButton implements Button { render() { return '[ Button ]'; } }",
          "",
          "abstract class Dialog {",
          "  // фабричный метод: конкретный продукт выбирает подкласс",
          "  protected abstract createButton(): Button;",
          "  render(): string {",
          "    const button = this.createButton(); // общий алгоритм в базовом классе",
          "    return button.render();",
          "  }",
          "}",
          "",
          "class HtmlDialog extends Dialog { protected createButton() { return new HtmlButton(); } }",
          "class WindowsDialog extends Dialog { protected createButton() { return new WindowsButton(); } }",
        ].join('\n'),
        en: [
          "interface Button { render(): string; }",
          "class HtmlButton implements Button { render() { return '<button>'; } }",
          "class WindowsButton implements Button { render() { return '[ Button ]'; } }",
          "",
          "abstract class Dialog {",
          "  // factory method: the subclass chooses the concrete product",
          "  protected abstract createButton(): Button;",
          "  render(): string {",
          "    const button = this.createButton(); // shared algorithm in the base class",
          "    return button.render();",
          "  }",
          "}",
          "",
          "class HtmlDialog extends Dialog { protected createButton() { return new HtmlButton(); } }",
          "class WindowsDialog extends Dialog { protected createButton() { return new WindowsButton(); } }",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Убирает привязку базового класса к конкретным продуктам",
        "Создание сосредоточено в одном методе",
        "Расширяется новым подклассом (соответствует OCP)",
      ],
      en: [
        "Decouples the base class from concrete products",
        "Object creation is concentrated in a single method",
        "Extend it by adding a new subclass (follows the Open/Closed Principle)",
      ],
    },
    cons: {
      ru: [
        "Ради одного продукта нужен подкласс",
        "Растёт иерархия классов",
      ],
      en: [
        "A whole subclass is needed just to create one product",
        "The class hierarchy grows",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость создания через наследование против роста иерархии",
      ],
      en: [
        "Creation flexibility through inheritance versus a growing class hierarchy",
      ],
    },
    whenToUse: {
      ru: [
        "Класс не знает заранее, объекты какого типа создавать",
        "Создание одного продукта нужно отдать подклассам",
      ],
      en: [
        "A class can't anticipate the type of objects it must create",
        "You want to hand off the creation of a single product to subclasses",
      ],
    },
    whenNotToUse: {
      ru: [
        "Тип продукта известен и стабилен — достаточно прямого создания",
      ],
      en: [
        "The product type is known and stable — direct instantiation is enough",
      ],
    },
    related: [
      "abstract-factory",
    ],
    diagram: `classDiagram
  class Creator {
    +factoryMethod()
    +operation()
  }
  class Product {
    <<interface>>
  }
  Creator <|-- ConcreteCreator
  Product <|.. ConcreteProduct
  ConcreteCreator ..> ConcreteProduct : creates`,
    tags: [
      "паттерны",
      "порождающие",
    ],
  },
  {
    id: "state",
    name: "State",
    category: "behavioral",
    grade: "senior",
    tagline: {
      ru: "Объект меняет поведение при смене внутреннего состояния",
      en: "An object alters its behavior when its internal state changes",
    },
    definition: {
      ru: "Позволяет объекту менять поведение при изменении его внутреннего состояния. Со стороны кажется, будто объект сменил класс.",
      en: "Lets an object alter its behavior when its internal state changes; it appears as though the object has changed its class.",
    },
    problem: {
      ru: "Поведение объекта зависит от его состояния и должно меняться в рантайме, а логика переходов расползается по громоздким условным операторам, завязанным на текущее состояние.",
      en: "An object's behavior depends on its state and has to change at runtime, but the transition logic sprawls across bulky conditionals that are all keyed off the current state.",
    },
    solution: {
      ru: "Выделяем каждое состояние в отдельный класс с общим интерфейсом. Контекст делегирует запрос текущему объекту-состоянию, а сами состояния инициируют переход, назначая контексту следующее состояние.",
      en: "Extract each state into its own class behind a common interface. The context delegates the request to the current state object, and the states themselves drive transitions by assigning the next state to the context.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface TrafficState { next(light: TrafficLight): void; label(): string; }",
          "",
          "class Red implements TrafficState {",
          "  next(light: TrafficLight) { light.setState(new Green()); } // переход задаёт само состояние",
          "  label() { return 'RED'; }",
          "}",
          "class Green implements TrafficState {",
          "  next(light: TrafficLight) { light.setState(new Yellow()); }",
          "  label() { return 'GREEN'; }",
          "}",
          "class Yellow implements TrafficState {",
          "  next(light: TrafficLight) { light.setState(new Red()); }",
          "  label() { return 'YELLOW'; }",
          "}",
          "",
          "class TrafficLight {",
          "  private state: TrafficState = new Red();",
          "  setState(s: TrafficState) { this.state = s; }",
          "  change() { this.state.next(this); } // поведение определяется внутренним состоянием",
          "  get current() { return this.state.label(); }",
          "}",
        ].join('\n'),
        en: [
          "interface TrafficState { next(light: TrafficLight): void; label(): string; }",
          "",
          "class Red implements TrafficState {",
          "  next(light: TrafficLight) { light.setState(new Green()); } // the state itself defines the transition",
          "  label() { return 'RED'; }",
          "}",
          "class Green implements TrafficState {",
          "  next(light: TrafficLight) { light.setState(new Yellow()); }",
          "  label() { return 'GREEN'; }",
          "}",
          "class Yellow implements TrafficState {",
          "  next(light: TrafficLight) { light.setState(new Red()); }",
          "  label() { return 'YELLOW'; }",
          "}",
          "",
          "class TrafficLight {",
          "  private state: TrafficState = new Red();",
          "  setState(s: TrafficState) { this.state = s; }",
          "  change() { this.state.next(this); } // behavior is determined by the internal state",
          "  get current() { return this.state.label(); }",
          "}",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Убирает громоздкие условные операторы",
        "Переходы и поведение состояний локализованы",
        "Новое состояние добавляется отдельным классом",
      ],
      en: [
        "Eliminates bulky conditional statements",
        "Transitions and per-state behavior are localized",
        "A new state is added as a separate class",
      ],
    },
    cons: {
      ru: [
        "Много мелких классов состояний",
        "Оправдан лишь при действительно сложной машине состояний",
      ],
      en: [
        "Many small state classes",
        "Warranted only for a genuinely complex state machine",
      ],
    },
    tradeoffs: {
      ru: [
        "Явная машина состояний против избыточных классов для простых случаев",
      ],
      en: [
        "An explicit state machine versus excess classes for simple cases",
      ],
    },
    whenToUse: {
      ru: [
        "Поведение объекта существенно зависит от его состояния",
        "Есть сложная логика переходов между состояниями",
      ],
      en: [
        "An object's behavior depends heavily on its state",
        "There is complex transition logic between states",
      ],
    },
    whenNotToUse: {
      ru: [
        "Состояний мало и переходы тривиальны",
      ],
      en: [
        "There are few states and the transitions are trivial",
      ],
    },
    related: [
      "strategy",
    ],
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "abstract-factory",
    name: "Abstract Factory",
    aka: [
      "Kit",
    ],
    category: "creational",
    grade: "senior",
    tagline: {
      ru: "Создание семейств связанных объектов без привязки к конкретным классам",
      en: "Create families of related objects without coupling to concrete classes",
    },
    definition: {
      ru: "Предоставляет интерфейс для создания семейств связанных или зависимых объектов, не указывая их конкретных классов.",
      en: "Provides an interface for creating families of related or dependent objects without specifying their concrete classes.",
    },
    problem: {
      ru: "Приложение должно работать с несколькими семействами связанных продуктов (например, элементы интерфейса под разные ОС) и гарантировать, что продукты из одного семейства используются вместе, а не смешиваются.",
      en: "An application must work with several families of related products (for example, UI elements for different operating systems) and guarantee that products from the same family are used together and not mixed.",
    },
    solution: {
      ru: "Объявляем интерфейс фабрики с методами создания каждого продукта семейства. Каждая конкретная фабрика создаёт согласованный набор продуктов одного семейства; клиент работает только с абстрактной фабрикой и интерфейсами продуктов.",
      en: "Declare a factory interface with a method for creating each product in the family. Each concrete factory produces a consistent set of products from a single family; the client works only with the abstract factory and the product interfaces.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface Button { paint(): string; }",
          "interface Checkbox { paint(): string; }",
          "",
          "// фабрика создаёт целое семейство связанных продуктов",
          "interface GUIFactory {",
          "  createButton(): Button;",
          "  createCheckbox(): Checkbox;",
          "}",
          "",
          "class MacButton implements Button { paint() { return 'Mac button'; } }",
          "class MacCheckbox implements Checkbox { paint() { return 'Mac checkbox'; } }",
          "class WinButton implements Button { paint() { return 'Win button'; } }",
          "class WinCheckbox implements Checkbox { paint() { return 'Win checkbox'; } }",
          "",
          "class MacFactory implements GUIFactory {",
          "  createButton() { return new MacButton(); }",
          "  createCheckbox() { return new MacCheckbox(); }",
          "}",
          "class WinFactory implements GUIFactory {",
          "  createButton() { return new WinButton(); }",
          "  createCheckbox() { return new WinCheckbox(); }",
          "}",
        ].join('\n'),
        en: [
          "interface Button { paint(): string; }",
          "interface Checkbox { paint(): string; }",
          "",
          "// a factory creates a whole family of related products",
          "interface GUIFactory {",
          "  createButton(): Button;",
          "  createCheckbox(): Checkbox;",
          "}",
          "",
          "class MacButton implements Button { paint() { return 'Mac button'; } }",
          "class MacCheckbox implements Checkbox { paint() { return 'Mac checkbox'; } }",
          "class WinButton implements Button { paint() { return 'Win button'; } }",
          "class WinCheckbox implements Checkbox { paint() { return 'Win checkbox'; } }",
          "",
          "class MacFactory implements GUIFactory {",
          "  createButton() { return new MacButton(); }",
          "  createCheckbox() { return new MacCheckbox(); }",
          "}",
          "class WinFactory implements GUIFactory {",
          "  createButton() { return new WinButton(); }",
          "  createCheckbox() { return new WinCheckbox(); }",
          "}",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Гарантирует совместимость продуктов одного семейства",
        "Изолирует клиент от конкретных классов",
        "Семейство меняется заменой одной фабрики",
      ],
      en: [
        "Guarantees that products from the same family are compatible",
        "Isolates the client from concrete classes",
        "Swapping a single factory changes the entire family",
      ],
    },
    cons: {
      ru: [
        "Добавление нового вида продукта меняет интерфейс всех фабрик",
        "Много классов и высокая начальная сложность",
      ],
      en: [
        "Adding a new kind of product changes the interface of every factory",
        "Many classes and high upfront complexity",
      ],
    },
    tradeoffs: {
      ru: [
        "Согласованность семейств против жёсткости интерфейса фабрики",
      ],
      en: [
        "Family consistency versus the rigidity of the factory interface",
      ],
    },
    whenToUse: {
      ru: [
        "Система должна работать с несколькими семействами связанных продуктов",
        "Важно не смешивать продукты из разных семейств",
      ],
      en: [
        "The system must work with several families of related products",
        "It is important not to mix products from different families",
      ],
    },
    whenNotToUse: {
      ru: [
        "Есть лишь один вид продукта — хватит Factory Method",
      ],
      en: [
        "There is only a single kind of product — Factory Method is enough",
      ],
    },
    related: [
      "factory-method",
    ],
    diagram: `classDiagram
  class AbstractFactory {
    <<interface>>
    +createA()
    +createB()
  }
  AbstractFactory <|.. ConcreteFactory1
  AbstractFactory <|.. ConcreteFactory2
  AbstractFactory ..> ProductA : creates
  AbstractFactory ..> ProductB : creates`,
    tags: [
      "паттерны",
      "порождающие",
    ],
  },
];
