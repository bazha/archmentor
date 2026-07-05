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
      en: "Взаимозаменяемые алгоритмы за общим интерфейсом",
    },
    definition: {
      ru: "Определяет семейство алгоритмов, инкапсулирует каждый из них и делает их взаимозаменяемыми. Strategy позволяет менять алгоритм независимо от клиента, который им пользуется.",
      en: "Определяет семейство алгоритмов, инкапсулирует каждый из них и делает их взаимозаменяемыми. Strategy позволяет менять алгоритм независимо от клиента, который им пользуется.",
    },
    problem: {
      ru: "Класс жёстко зашивает один способ поведения (расчёт цены, сортировку, сжатие). Добавление или замена варианта требует правки самого класса и плодит условные операторы.",
      en: "Класс жёстко зашивает один способ поведения (расчёт цены, сортировку, сжатие). Добавление или замена варианта требует правки самого класса и плодит условные операторы.",
    },
    solution: {
      ru: "Выносим алгоритм за интерфейс Strategy. Контекст хранит ссылку на выбранную стратегию и делегирует ей работу; клиент подставляет нужную стратегию извне.",
      en: "Выносим алгоритм за интерфейс Strategy. Контекст хранит ссылку на выбранную стратегию и делегирует ей работу; клиент подставляет нужную стратегию извне.",
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
          "  setStrategy(s: PricingStrategy) { this.strategy = s; } // выбор делает клиент",
          "  total(base: number) { return this.strategy.price(base); }",
          "}",
          "",
          "const checkout = new Checkout(new Regular());",
          "checkout.setStrategy(new Vip()); // алгоритм заменён извне, без внутренних переходов",
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
        "Замена алгоритма во время выполнения",
        "Изоляция вариантов поведения",
        "Убирает разрастание условных операторов",
      ],
    },
    cons: {
      ru: [
        "Растёт число классов",
        "Клиент должен знать о существующих стратегиях",
      ],
      en: [
        "Растёт число классов",
        "Клиент должен знать о существующих стратегиях",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость выбора алгоритма против количества классов",
      ],
      en: [
        "Гибкость выбора алгоритма против количества классов",
      ],
    },
    whenToUse: {
      ru: [
        "Есть несколько вариантов одного поведения",
        "Нужно переключать алгоритм в рантайме извне",
      ],
      en: [
        "Есть несколько вариантов одного поведения",
        "Нужно переключать алгоритм в рантайме извне",
      ],
    },
    whenNotToUse: {
      ru: [
        "Вариант поведения всегда один и не меняется",
      ],
      en: [
        "Вариант поведения всегда один и не меняется",
      ],
    },
    related: [
      "state",
    ],
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
      en: "Один-ко-многим: подписчики узнают об изменениях автоматически",
    },
    definition: {
      ru: "Определяет зависимость «один ко многим» между объектами так, что при изменении состояния одного объекта все зависящие от него автоматически уведомляются и обновляются.",
      en: "Определяет зависимость «один ко многим» между объектами так, что при изменении состояния одного объекта все зависящие от него автоматически уведомляются и обновляются.",
    },
    problem: {
      ru: "Несколько объектов должны реагировать на изменение состояния источника, но жёсткая привязка источника к каждому получателю делает систему негибкой: добавление нового получателя требует правки источника.",
      en: "Несколько объектов должны реагировать на изменение состояния источника, но жёсткая привязка источника к каждому получателю делает систему негибкой: добавление нового получателя требует правки источника.",
    },
    solution: {
      ru: "Источник (subject) хранит список подписчиков (observers) и при изменении состояния вызывает у каждого метод обновления. Подписчики добавляются и удаляются динамически, источник о них ничего конкретного не знает.",
      en: "Источник (subject) хранит список подписчиков (observers) и при изменении состояния вызывает у каждого метод обновления. Подписчики добавляются и удаляются динамически, источник о них ничего конкретного не знает.",
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
          "  update(t: number) { console.log(`Телефон: ${t}°`); }",
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
        "Слабая связанность источника и подписчиков",
        "Подписчиков можно добавлять и убирать в рантайме",
        "Поддержка вещания «один ко многим»",
      ],
    },
    cons: {
      ru: [
        "Порядок уведомления не гарантирован",
        "Каскадные обновления трудно отлаживать",
        "Риск утечек памяти при забытой отписке",
      ],
      en: [
        "Порядок уведомления не гарантирован",
        "Каскадные обновления трудно отлаживать",
        "Риск утечек памяти при забытой отписке",
      ],
    },
    tradeoffs: {
      ru: [
        "Развязка компонентов против предсказуемости потока уведомлений",
      ],
      en: [
        "Развязка компонентов против предсказуемости потока уведомлений",
      ],
    },
    whenToUse: {
      ru: [
        "Изменение одного объекта должно отражаться на других без жёсткой привязки",
        "Число и состав получателей заранее неизвестны",
      ],
      en: [
        "Изменение одного объекта должно отражаться на других без жёсткой привязки",
        "Число и состав получателей заранее неизвестны",
      ],
    },
    whenNotToUse: {
      ru: [
        "Получатель ровно один и связь простая — достаточно прямого вызова",
      ],
      en: [
        "Получатель ровно один и связь простая — достаточно прямого вызова",
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
    id: "factory-method",
    name: "Factory Method",
    aka: [
      "Virtual Constructor",
    ],
    category: "creational",
    grade: "middle",
    tagline: {
      ru: "Подкласс решает, какой объект создать",
      en: "Подкласс решает, какой объект создать",
    },
    definition: {
      ru: "Определяет интерфейс для создания объекта, но позволяет подклассам решать, какой класс инстанцировать. Factory Method делегирует создание объекта подклассам.",
      en: "Определяет интерфейс для создания объекта, но позволяет подклассам решать, какой класс инстанцировать. Factory Method делегирует создание объекта подклассам.",
    },
    problem: {
      ru: "Базовый класс должен работать с продуктом, но не знает заранее его конкретный тип. Прямое создание через new в базовом классе привязало бы его к конкретной реализации.",
      en: "Базовый класс должен работать с продуктом, но не знает заранее его конкретный тип. Прямое создание через new в базовом классе привязало бы его к конкретной реализации.",
    },
    solution: {
      ru: "Объявляем в базовом классе фабричный метод, возвращающий продукт по интерфейсу. Каждый подкласс переопределяет этот единственный метод и создаёт свою конкретную реализацию, а общий алгоритм остаётся в базовом классе.",
      en: "Объявляем в базовом классе фабричный метод, возвращающий продукт по интерфейсу. Каждый подкласс переопределяет этот единственный метод и создаёт свою конкретную реализацию, а общий алгоритм остаётся в базовом классе.",
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
      },
    },
    pros: {
      ru: [
        "Убирает привязку базового класса к конкретным продуктам",
        "Создание сосредоточено в одном методе",
        "Расширяется новым подклассом (соответствует OCP)",
      ],
      en: [
        "Убирает привязку базового класса к конкретным продуктам",
        "Создание сосредоточено в одном методе",
        "Расширяется новым подклассом (соответствует OCP)",
      ],
    },
    cons: {
      ru: [
        "Ради одного продукта нужен подкласс",
        "Растёт иерархия классов",
      ],
      en: [
        "Ради одного продукта нужен подкласс",
        "Растёт иерархия классов",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость создания через наследование против роста иерархии",
      ],
      en: [
        "Гибкость создания через наследование против роста иерархии",
      ],
    },
    whenToUse: {
      ru: [
        "Класс не знает заранее, объекты какого типа создавать",
        "Создание одного продукта нужно отдать подклассам",
      ],
      en: [
        "Класс не знает заранее, объекты какого типа создавать",
        "Создание одного продукта нужно отдать подклассам",
      ],
    },
    whenNotToUse: {
      ru: [
        "Тип продукта известен и стабилен — достаточно прямого создания",
      ],
      en: [
        "Тип продукта известен и стабилен — достаточно прямого создания",
      ],
    },
    related: [
      "abstract-factory",
    ],
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
      en: "Объект меняет поведение при смене внутреннего состояния",
    },
    definition: {
      ru: "Позволяет объекту менять поведение при изменении его внутреннего состояния. Со стороны кажется, будто объект сменил класс.",
      en: "Позволяет объекту менять поведение при изменении его внутреннего состояния. Со стороны кажется, будто объект сменил класс.",
    },
    problem: {
      ru: "Поведение объекта зависит от его состояния и должно меняться в рантайме, а логика переходов расползается по громоздким условным операторам, завязанным на текущее состояние.",
      en: "Поведение объекта зависит от его состояния и должно меняться в рантайме, а логика переходов расползается по громоздким условным операторам, завязанным на текущее состояние.",
    },
    solution: {
      ru: "Выделяем каждое состояние в отдельный класс с общим интерфейсом. Контекст делегирует запрос текущему объекту-состоянию, а сами состояния инициируют переход, назначая контексту следующее состояние.",
      en: "Выделяем каждое состояние в отдельный класс с общим интерфейсом. Контекст делегирует запрос текущему объекту-состоянию, а сами состояния инициируют переход, назначая контексту следующее состояние.",
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
      },
    },
    pros: {
      ru: [
        "Убирает громоздкие условные операторы",
        "Переходы и поведение состояний локализованы",
        "Новое состояние добавляется отдельным классом",
      ],
      en: [
        "Убирает громоздкие условные операторы",
        "Переходы и поведение состояний локализованы",
        "Новое состояние добавляется отдельным классом",
      ],
    },
    cons: {
      ru: [
        "Много мелких классов состояний",
        "Оправдан лишь при действительно сложной машине состояний",
      ],
      en: [
        "Много мелких классов состояний",
        "Оправдан лишь при действительно сложной машине состояний",
      ],
    },
    tradeoffs: {
      ru: [
        "Явная машина состояний против избыточных классов для простых случаев",
      ],
      en: [
        "Явная машина состояний против избыточных классов для простых случаев",
      ],
    },
    whenToUse: {
      ru: [
        "Поведение объекта существенно зависит от его состояния",
        "Есть сложная логика переходов между состояниями",
      ],
      en: [
        "Поведение объекта существенно зависит от его состояния",
        "Есть сложная логика переходов между состояниями",
      ],
    },
    whenNotToUse: {
      ru: [
        "Состояний мало и переходы тривиальны",
      ],
      en: [
        "Состояний мало и переходы тривиальны",
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
      en: "Создание семейств связанных объектов без привязки к конкретным классам",
    },
    definition: {
      ru: "Предоставляет интерфейс для создания семейств связанных или зависимых объектов, не указывая их конкретных классов.",
      en: "Предоставляет интерфейс для создания семейств связанных или зависимых объектов, не указывая их конкретных классов.",
    },
    problem: {
      ru: "Приложение должно работать с несколькими семействами связанных продуктов (например, элементы интерфейса под разные ОС) и гарантировать, что продукты из одного семейства используются вместе, а не смешиваются.",
      en: "Приложение должно работать с несколькими семействами связанных продуктов (например, элементы интерфейса под разные ОС) и гарантировать, что продукты из одного семейства используются вместе, а не смешиваются.",
    },
    solution: {
      ru: "Объявляем интерфейс фабрики с методами создания каждого продукта семейства. Каждая конкретная фабрика создаёт согласованный набор продуктов одного семейства; клиент работает только с абстрактной фабрикой и интерфейсами продуктов.",
      en: "Объявляем интерфейс фабрики с методами создания каждого продукта семейства. Каждая конкретная фабрика создаёт согласованный набор продуктов одного семейства; клиент работает только с абстрактной фабрикой и интерфейсами продуктов.",
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
      },
    },
    pros: {
      ru: [
        "Гарантирует совместимость продуктов одного семейства",
        "Изолирует клиент от конкретных классов",
        "Семейство меняется заменой одной фабрики",
      ],
      en: [
        "Гарантирует совместимость продуктов одного семейства",
        "Изолирует клиент от конкретных классов",
        "Семейство меняется заменой одной фабрики",
      ],
    },
    cons: {
      ru: [
        "Добавление нового вида продукта меняет интерфейс всех фабрик",
        "Много классов и высокая начальная сложность",
      ],
      en: [
        "Добавление нового вида продукта меняет интерфейс всех фабрик",
        "Много классов и высокая начальная сложность",
      ],
    },
    tradeoffs: {
      ru: [
        "Согласованность семейств против жёсткости интерфейса фабрики",
      ],
      en: [
        "Согласованность семейств против жёсткости интерфейса фабрики",
      ],
    },
    whenToUse: {
      ru: [
        "Система должна работать с несколькими семействами связанных продуктов",
        "Важно не смешивать продукты из разных семейств",
      ],
      en: [
        "Система должна работать с несколькими семействами связанных продуктов",
        "Важно не смешивать продукты из разных семейств",
      ],
    },
    whenNotToUse: {
      ru: [
        "Есть лишь один вид продукта — хватит Factory Method",
      ],
      en: [
        "Есть лишь один вид продукта — хватит Factory Method",
      ],
    },
    related: [
      "factory-method",
    ],
    tags: [
      "паттерны",
      "порождающие",
    ],
  },
];
