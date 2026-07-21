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
      ru: "Strategy определяет семейство алгоритмов, инкапсулирует каждый из них в собственном классе или функции и делает их взаимозаменяемыми за счёт общего интерфейса. Контекст хранит ссылку на выбранную стратегию и делегирует ей работу, ничего не зная о её внутреннем устройстве, поэтому алгоритм можно менять независимо от клиента, который им пользуется. В современном TypeScript стратегией часто выступает не класс, а простая функция с нужной сигнатурой — интерфейс тогда вырождается в тип функции, а «инкапсуляция» алгоритма достигается замыканием. Такой подход прямо поддерживает принцип открытости/закрытости: новый вариант поведения добавляется новой реализацией, без изменения существующего кода.",
      en: "Strategy defines a family of algorithms, encapsulates each one in its own class or function, and makes them interchangeable behind a common interface. The context holds a reference to the currently selected strategy and delegates the work to it without knowing anything about its internals, so the algorithm can vary independently from the client that uses it. In modern TypeScript a strategy is often just a plain function with the right signature rather than a class — the interface collapses into a function type, and encapsulation comes from closures instead of objects. This directly supports the Open/Closed Principle: a new behavior variant is added as a new implementation, with no changes to existing code.",
    },
    problem: {
      ru: "Класс жёстко зашивает один способ поведения — расчёт цены, сортировку, сжатие, валидацию — прямо в свой код. Как только требуется второй вариант того же поведения, разработчик добавляет условный оператор if/switch по типу или флагу, а с третьим и четвёртым вариантом условная логика расползается по всему классу и дублируется в других местах, где принимается то же решение. Такой класс нарушает принцип открытости/закрытости: для добавления нового варианта приходится редактировать существующий, проверенный код, рискуя сломать уже работающие ветки. Кроме того, класс вынужден знать обо всех вариантах поведения сразу, даже если конкретному клиенту нужен только один из них.",
      en: "A class hard-codes a single way of behaving — price calculation, sorting, compression, validation — directly inside its own code. As soon as a second variant of that behavior is needed, a developer bolts on an if/switch keyed to a type or flag, and by the third or fourth variant the conditional logic has sprawled across the whole class and duplicated itself anywhere the same decision gets made. Such a class violates the Open/Closed Principle: adding a new variant means editing existing, already-tested code and risking breaking the branches that already work. Worse, the class is forced to know about every variant at once, even when a given client only ever needs one of them.",
    },
    solution: {
      ru: "Выносим алгоритм за пределы контекста в отдельную абстракцию Strategy — интерфейс с одним методом (или, в современном TS, просто тип функции). Каждый конкретный алгоритм реализует этот интерфейс в своём классе или экспортируется как отдельная функция. Контекст хранит ссылку на текущую стратегию и делегирует ей работу через единственную точку вызова; выбор конкретной стратегии происходит снаружи — клиент подставляет нужную реализацию в конструктор или сеттер, и это решение может меняться в любой момент выполнения программы. Поскольку стратегии реализуют общий интерфейс, контекст работает с ними полиморфно и ничего не знает об их внутренних деталях: добавление нового алгоритма — это добавление нового класса или функции, а не правка контекста. Важно отличать Strategy от паттерна State, хотя структурно они почти идентичны (контекст + набор взаимозаменяемых объектов за интерфейсом): в Strategy клиент осознанно выбирает алгоритм снаружи и переключения между стратегиями обычно случаются редко, тогда как в State переходы между состояниями инициируются изнутри, самими объектами состояния, как реакция на события.",
      en: "Pull the algorithm out of the context into a separate Strategy abstraction — an interface with a single method, or, in modern TypeScript, simply a function type. Each concrete algorithm implements that interface as its own class, or is exported as a standalone function. The context holds a reference to the current strategy and delegates the work to it through one call site; the choice of concrete strategy happens from the outside — the client supplies the desired implementation via a constructor or setter, and that choice can change at any point while the program runs. Because every strategy implements the same interface, the context treats them polymorphically and knows nothing about their internals: adding a new algorithm means adding a new class or function, not touching the context. It's worth distinguishing Strategy from the State pattern, since structurally they are nearly identical (a context plus a set of interchangeable objects behind an interface): in Strategy the client deliberately picks an algorithm from the outside and switches between strategies only occasionally, whereas in State the transitions between states are driven from the inside, by the state objects themselves, in reaction to events.",
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
        "Замена алгоритма во время выполнения без изменения контекста",
        "Изолирует варианты поведения друг от друга и от клиента",
        "Убирает разрастание условных операторов по типу/флагу",
        "Новый алгоритм добавляется отдельным классом или функцией — соответствует OCP",
        "В TS/JS может быть обычной функцией без создания классов и интерфейсов",
      ],
      en: [
        "Swap the algorithm at runtime without touching the context",
        "Isolates behavior variants from each other and from the client",
        "Eliminates the sprawl of type/flag-driven conditional statements",
        "A new algorithm is added as a separate class or function — follows OCP",
        "In TS/JS a strategy can be a plain function, with no classes or interfaces needed",
      ],
    },
    cons: {
      ru: [
        "Растёт число классов (или функций-стратегий)",
        "Клиент должен знать о существующих стратегиях, чтобы выбрать нужную",
        "Если стратегий мало и они не меняются, паттерн — лишняя абстракция",
      ],
      en: [
        "Increases the number of classes (or strategy functions)",
        "The client has to know about the available strategies to pick the right one",
        "If there are only a couple of strategies that never change, the pattern is an unnecessary abstraction",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость выбора алгоритма против количества классов/функций",
        "Полиморфизм через интерфейс против простоты функции-колбэка",
        "Явный выбор стратегии клиентом против скрытого выбора внутри контекста (как в Factory Method)",
      ],
      en: [
        "Flexibility in choosing the algorithm versus the number of classes/functions",
        "Interface-based polymorphism versus the simplicity of a plain callback function",
        "Explicit strategy selection by the client versus a hidden choice inside the context (as in Factory Method)",
      ],
    },
    whenToUse: {
      ru: [
        "Есть несколько вариантов одного поведения, и число вариантов может расти",
        "Нужно переключать алгоритм в рантайме извне, без пересборки контекста",
        "Условная логика выбора алгоритма разрослась и дублируется в нескольких местах",
      ],
      en: [
        "There are several variants of one behavior and the number of variants may grow",
        "You need to switch the algorithm at runtime from the outside, without rebuilding the context",
        "The conditional logic for choosing an algorithm has grown and is duplicated in several places",
      ],
    },
    whenNotToUse: {
      ru: [
        "Вариант поведения всегда один и не меняется",
        "Вариантов всего два-три, они не растут, и достаточно простого if",
      ],
      en: [
        "There is always a single behavior variant that never changes",
        "There are only two or three variants, the count isn't growing, and a plain if is enough",
      ],
    },
    related: [
      "state",
      "ocp",
      "template-method",
      "command",
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
      ru: "Observer определяет зависимость «один ко многим» между объектами: когда состояние одного объекта (субъекта, subject) меняется, все зависящие от него объекты (наблюдатели, observers) автоматически уведомляются и обновляются, причём субъект не знает ничего конкретного о своих наблюдателях, кроме общего интерфейса подписки. Различают две модели передачи данных при уведомлении: push, когда субъект сам передаёт наблюдателю новые данные вместе с уведомлением, и pull, когда уведомление лишь сообщает о факте изменения, а наблюдатель сам запрашивает у субъекта нужные детали через его публичный интерфейс.",
      en: "Observer defines a one-to-many dependency between objects: when the state of one object (the subject) changes, all the objects that depend on it (the observers) are notified and updated automatically, and the subject knows nothing concrete about its observers beyond a common subscription interface. There are two data-delivery models for notifications: push, where the subject hands the new data to each observer along with the notification, and pull, where the notification merely signals that something changed and the observer queries the subject for whatever details it needs through its public interface.",
    },
    problem: {
      ru: "Несколько объектов должны реагировать на изменение состояния источника — обновить экран, пересчитать кэш, записать лог, — но жёсткая привязка источника к каждому конкретному получателю делает систему негибкой: добавление нового получателя требует правки кода источника, а сам источник разрастается, обрастая прямыми вызовами всё новых обработчиков. Ситуация усложняется, если получателей нужно добавлять и убирать динамически в процессе работы программы: жёсткие вызовы не позволяют этого сделать без пересборки и повторного развёртывания. Наивные самодельные реализации подписки нередко приводят к так называемой «утечке забытого слушателя» (lapsed listener problem): подписчик получает ссылку на источник, но никогда явно не отписывается, и сборщик мусора не может освободить память подписчика, пока жив источник.",
      en: "Several objects need to react when a source's state changes — refresh a screen, recompute a cache, write a log entry — but hard-wiring the source to each specific recipient makes the system inflexible: adding a new recipient forces you to edit the source's code, and the source itself grows, accumulating ever more direct calls to new handlers. Things get worse when recipients must be added and removed dynamically while the program is running: hard-coded calls don't allow that without rebuilding and redeploying. Naive, hand-rolled subscription implementations frequently run into the so-called lapsed-listener problem: a subscriber holds a reference to the source but never explicitly unsubscribes, so the garbage collector can't reclaim the subscriber's memory for as long as the source stays alive.",
    },
    solution: {
      ru: "Источник (subject) хранит коллекцию подписчиков (observers), реализующих общий интерфейс обновления, и предоставляет методы attach/detach для динамической подписки и отписки. При изменении состояния субъект перебирает список подписчиков и вызывает у каждого метод обновления — либо сразу передавая новые данные (push-модель, проще для наблюдателя, но раздувает интерфейс уведомления и жёстче связывает субъект с содержимым данных), либо лишь сигнализируя о факте изменения, оставляя наблюдателю запросить нужные подробности через публичный интерфейс субъекта (pull-модель, слабее связывает стороны, но требует от наблюдателя лишнего обратного вызова). Важно явно отписываться, когда наблюдатель больше не нужен, иначе возникает утечка забытого слушателя. Порядок вызова наблюдателей обычно не гарантирован, а сам наблюдатель, изменяя состояние субъекта во время получения уведомления, может спровоцировать реентерабельный повторный вызов notify() внутри ещё не завершённого цикла обновления — такие каскадные обновления стоит либо запрещать явной блокировкой повторного входа, либо буферизировать события в очередь. От более широкого понятия publish/subscribe и событийной шины (event bus) классический Observer отличается тем, что подписка идёт напрямую на субъект, без посредника-брокера и без именованных топиков/каналов — что проще, но менее развязано в распределённых системах.",
      en: "The subject keeps a collection of observers that implement a common update interface, and exposes attach/detach methods for dynamic subscription and unsubscription. When its state changes, the subject walks the list of observers and calls an update method on each — either handing over the new data right away (the push model, simpler for the observer but it bloats the notification interface and couples the subject more tightly to the shape of the data), or merely signaling that something changed and letting the observer pull whatever details it needs through the subject's public interface (the pull model, which decouples the two sides more but costs the observer an extra call back). Observers must explicitly unsubscribe once they're no longer needed, or the lapsed-listener problem creeps in. The order in which observers are notified is usually not guaranteed, and an observer that mutates the subject's state while handling a notification can trigger a reentrant call into notify() before the current update cycle has finished — such cascading updates should either be blocked with an explicit reentrancy guard or buffered into a queue of pending events. Classic Observer differs from the broader publish/subscribe idea and an event bus in that subscribers attach directly to the subject, with no broker in between and no named topics or channels — simpler, but less decoupled in a distributed system.",
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
        "Поддержка вещания «один ко многим» без изменения источника",
        "Pull-модель позволяет не раздувать интерфейс уведомления лишними данными",
      ],
      en: [
        "Loose coupling between the subject and its observers",
        "Observers can be added and removed at runtime",
        "Supports one-to-many broadcast without changing the subject",
        "The pull model keeps the notification interface from being bloated with extra data",
      ],
    },
    cons: {
      ru: [
        "Порядок уведомления не гарантирован",
        "Каскадные обновления трудно отлаживать, особенно при реентерабельных вызовах notify()",
        "Риск утечек памяти при забытой отписке (lapsed listener)",
        "Push-модель жёстче связывает субъект с формой передаваемых данных",
      ],
      en: [
        "The order in which observers are notified is not guaranteed",
        "Cascading updates are hard to debug, especially with reentrant notify() calls",
        "Risk of memory leaks when observers forget to unsubscribe (the lapsed-listener problem)",
        "The push model couples the subject more tightly to the shape of the data it sends",
      ],
    },
    tradeoffs: {
      ru: [
        "Развязка компонентов против предсказуемости потока уведомлений",
        "Push-модель (проще наблюдателю) против pull-модели (слабее связь, но лишний обратный вызов)",
        "Прямая подписка на субъект (просто) против брокера/шины событий с топиками (гибче в распределённой системе)",
      ],
      en: [
        "Decoupling components versus predictability of the notification flow",
        "The push model (simpler for the observer) versus the pull model (looser coupling, but an extra callback)",
        "Direct subscription on the subject (simple) versus a broker/event bus with topics (more flexible in a distributed system)",
      ],
    },
    whenToUse: {
      ru: [
        "Изменение одного объекта должно отражаться на других без жёсткой привязки",
        "Число и состав получателей заранее неизвестны и меняются в рантайме",
        "Нужно поддержать множество разнородных подписчиков одного и того же события",
      ],
      en: [
        "A change in one object must be reflected in others without tight coupling",
        "The number and identity of the recipients are not known in advance and change at runtime",
        "You need to support many heterogeneous subscribers to the same event",
      ],
    },
    whenNotToUse: {
      ru: [
        "Получатель ровно один и связь простая — достаточно прямого вызова",
        "Подписчиков много, они в разных процессах/сервисах — нужна полноценная шина событий, а не прямой Observer",
      ],
      en: [
        "There is exactly one recipient and the relationship is simple — a direct call is enough",
        "There are many subscribers spread across different processes/services — a full event bus is needed, not a direct Observer",
      ],
    },
    related: [
      "strategy",
      "mediator",
      "event-driven",
      "command",
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
      ru: "Factory Method определяет в базовом классе интерфейс для создания объекта — фабричный метод — но оставляет конкретным подклассам решение, экземпляр какого класса создавать. Базовый класс пишет свой общий алгоритм в терминах абстрактного продукта и вызывает фабричный метод там, где нужен новый объект, не зная и не заботясь о том, какая именно реализация будет создана; эту заботу берёт на себя подкласс, переопределяющий метод. В отличие от простой фабрики (статического метода или отдельного класса с условным оператором, выбирающим продукт по параметру), Factory Method полиморфен: выбор конкретного продукта закодирован в иерархии наследования, а не в ветвлении внутри одного метода.",
      en: "Factory Method defines, in a base class, an interface for creating an object — the factory method itself — but leaves it to concrete subclasses to decide which class to instantiate. The base class writes its shared algorithm in terms of the abstract product and calls the factory method wherever it needs a new object, without knowing or caring which concrete implementation will be produced; that responsibility belongs to the subclass that overrides the method. Unlike a simple factory — a static method or a standalone class with a conditional that picks a product by some parameter — Factory Method is polymorphic: the choice of concrete product is encoded in the inheritance hierarchy rather than in a branch inside a single method.",
    },
    problem: {
      ru: "Базовый класс должен работать с продуктом определённого рода, но не знает заранее его конкретный тип, а этот тип может отличаться в зависимости от контекста использования — платформы, конфигурации, региона. Прямое создание через new внутри базового класса привязало бы его к конкретной реализации и нарушило бы принцип открытости/закрытости: для поддержки нового варианта продукта пришлось бы редактировать сам базовый класс. Простая фабрика с условным оператором решает задачу создания, но переносит проблему на уровень выбора ветки: при добавлении нового типа продукта нужно снова редактировать существующий код фабрики, и вся условная логика сосредоточена в одном месте, которое приходится трогать при каждом расширении.",
      en: "A base class needs to work with a product of a certain kind, but it doesn't know the product's concrete type ahead of time, and that type can differ depending on the context of use — platform, configuration, region. Instantiating it directly with new inside the base class would couple that class to one specific implementation and violate the Open/Closed Principle: supporting a new product variant would mean editing the base class itself. A simple factory with a conditional solves the creation problem but just relocates it to the branch-selection level: adding a new product type still means editing the existing factory code, and all the conditional logic sits in one place that has to be touched on every extension.",
    },
    solution: {
      ru: "Объявляем в базовом классе (создателе) фабричный метод, возвращающий продукт через его интерфейс; общий алгоритм создателя пользуется этим методом, ничего не зная о конкретном классе продукта. Каждый подкласс-создатель переопределяет фабричный метод и создаёт свою конкретную реализацию продукта — так конкретный создатель и конкретный продукт оказываются связаны попарно, образуя две параллельные иерархии классов (иерархию создателей и иерархию продуктов), которые растут синхронно: новая пара «создатель + продукт» добавляется без изменения существующего кода, что и даёт соответствие OCP. От Abstract Factory паттерн отличается масштабом: Factory Method создаёт ровно один вид продукта через единственный переопределяемый метод и обычно опирается на наследование, тогда как Abstract Factory — это отдельный объект-фабрика с несколькими методами, создающий согласованное семейство разных продуктов, и обычно строится через композицию, а не наследование (более того, Abstract Factory часто реализуется набором Factory Method внутри конкретных фабрик). Factory Method также тесно связан с Template Method: сам фабричный метод — это, по сути, частный случай шаблонного метода, где единственный шаг алгоритма, делегируемый подклассу, — создание объекта, а не производный шаг вычисления.",
      en: "Declare a factory method in the base class (the creator) that returns the product through its interface; the creator's shared algorithm uses that method without knowing anything about the product's concrete class. Each creator subclass overrides the factory method and produces its own concrete product implementation — so a concrete creator and a concrete product end up paired together, forming two parallel class hierarchies (a creator hierarchy and a product hierarchy) that grow in lockstep: a new creator+product pair is added without touching existing code, which is exactly what gives the pattern its Open/Closed compliance. Factory Method differs from Abstract Factory in scope: Factory Method creates exactly one kind of product through a single overridable method and typically relies on inheritance, whereas Abstract Factory is a separate factory object with several methods that produces a consistent family of different products and is usually built through composition rather than inheritance (in fact, Abstract Factory is often implemented as a set of Factory Methods inside its concrete factories). Factory Method is also closely related to Template Method: the factory method itself is essentially a special case of a template method, where the one step delegated to a subclass is object creation rather than some derived computation step.",
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
        "Создание сосредоточено в одном переопределяемом методе",
        "Расширяется новым подклассом (соответствует OCP)",
        "Естественно сочетается с Template Method: общий алгоритм неизменен, варьируется только создание",
      ],
      en: [
        "Decouples the base class from concrete products",
        "Object creation is concentrated in a single overridable method",
        "Extend it by adding a new subclass (follows the Open/Closed Principle)",
        "Combines naturally with Template Method: the shared algorithm stays fixed, only creation varies",
      ],
    },
    cons: {
      ru: [
        "Ради одного продукта нужен целый подкласс",
        "Растут сразу две параллельные иерархии классов",
        "Сложнее простой фабрики с условным оператором, если вариантов немного и они не растут",
      ],
      en: [
        "A whole subclass is needed just to create one product",
        "Two parallel class hierarchies grow at once",
        "Heavier than a simple factory with a conditional when there are only a few variants that aren't growing",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость создания через наследование против роста иерархии",
        "Полиморфный выбор продукта в подклассах против централизованного условного оператора простой фабрики",
        "Один вид продукта на создателя (Factory Method) против согласованного семейства продуктов (Abstract Factory)",
      ],
      en: [
        "Creation flexibility through inheritance versus a growing class hierarchy",
        "Polymorphic product selection in subclasses versus a simple factory's centralized conditional",
        "One product kind per creator (Factory Method) versus a consistent product family (Abstract Factory)",
      ],
    },
    whenToUse: {
      ru: [
        "Класс не знает заранее, объекты какого типа создавать",
        "Создание одного продукта нужно отдать подклассам",
        "Нужно избавиться от условного оператора в простой фабрике, заменив его иерархией",
      ],
      en: [
        "A class can't anticipate the type of objects it must create",
        "You want to hand off the creation of a single product to subclasses",
        "You want to replace a simple factory's conditional with a proper class hierarchy",
      ],
    },
    whenNotToUse: {
      ru: [
        "Тип продукта известен и стабилен — достаточно прямого создания",
        "Вариантов продукта немного, и простая фабрика с условным оператором проще и понятнее",
      ],
      en: [
        "The product type is known and stable — direct instantiation is enough",
        "There are only a few product variants, and a simple factory with a conditional is simpler and clearer",
      ],
    },
    related: [
      "abstract-factory",
      "template-method",
      "ocp",
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
      ru: "State позволяет объекту менять поведение при изменении его внутреннего состояния так, что со стороны это выглядит, будто объект сменил класс. Вместо одного поля-флага или enum, значение которого проверяется в switch на каждом методе, каждое состояние выделяется в собственный класс с общим интерфейсом, а объект-контекст хранит ссылку на текущий объект-состояние и делегирует ему все зависящие от состояния запросы. Переходы между состояниями явные: либо сам объект состояния назначает контексту следующее состояние, либо это делает контекст на основании результата, возвращённого состоянием.",
      en: "State lets an object alter its behavior when its internal state changes, so from the outside it looks as though the object changed its class. Instead of a single flag field or enum whose value is checked in a switch inside every method, each state is pulled out into its own class behind a common interface, and the context object holds a reference to the current state object and delegates every state-dependent request to it. Transitions between states are explicit: either the state object itself assigns the next state to the context, or the context does so based on a result the state object returns.",
    },
    problem: {
      ru: "Поведение объекта существенно зависит от его текущего состояния и должно меняться в рантайме — например, документ ведёт себя по-разному в статусах «черновик», «на модерации», «опубликован». Наивный подход — enum или строковый флаг состояния плюс switch в каждом методе, который проверяет это поле и выполняет нужную ветку. Пока состояний два-три, это терпимо, но с ростом числа состояний и методов каждый switch дублирует одну и ту же структуру ветвления, логика переходов размазывается по всем методам сразу, а забыть обработать состояние в одном из switch — типичная ошибка, которую компилятор не всегда ловит. Добавление нового состояния означает правку каждого такого switch по всему классу.",
      en: "An object's behavior depends heavily on its current state and must change at runtime — for example, a document behaves differently in the \"draft\", \"in review\", and \"published\" statuses. The naive approach is an enum or string status flag plus a switch in every method that checks that field and runs the right branch. With two or three states that's tolerable, but as the number of states and methods grows, every switch duplicates the same branching structure, the transition logic gets smeared across all the methods at once, and forgetting to handle a state in one of the switches is a common mistake the compiler doesn't always catch. Adding a new state means editing every one of those switches throughout the class.",
    },
    solution: {
      ru: "Выделяем каждое состояние в отдельный класс, реализующий общий интерфейс с методами, поведение которых зависит от состояния. Контекст хранит ссылку на текущий объект-состояние и делегирует ему все такие запросы вместо внутреннего switch. Переход в новое состояние явный и локализован: типично сам объект состояния, обработав запрос, вызывает у контекста метод смены состояния и передаёт следующий объект-состояние — так правило перехода лежит рядом с состоянием, из которого оно происходит, а не размазано по контексту. Добавление нового состояния — это добавление нового класса, реализующего интерфейс, без правки уже существующих состояний и без единого разрастающегося switch. State и Strategy почти неразличимы по структуре — в обоих есть контекст и набор взаимозаменяемых объектов за общим интерфейсом, — но их интенты различны: в Strategy клиент осознанно и явно выбирает алгоритм снаружи, и переключения происходят редко и по решению вызывающего кода, тогда как в State переходы происходят изнутри системы как реакция на события, часто без участия внешнего клиента, а сами состояния знают друг о друге и о порядке переходов. По сравнению с enum+switch паттерн State стоит применять, когда состояний и зависящих от них методов достаточно много, чтобы дублирование ветвления стало проблемой; для двух-трёх простых состояний с одним методом enum со switch остаётся более прямым и читаемым решением.",
      en: "Extract each state into its own class that implements a shared interface whose methods behave differently per state. The context keeps a reference to the current state object and delegates all such requests to it instead of running an internal switch. The transition to a new state is explicit and localized: typically the state object itself, after handling a request, calls a state-change method on the context and hands it the next state object — so the transition rule lives right next to the state it originates from, rather than being smeared across the context. Adding a new state means adding a new class that implements the interface, with no changes to the existing states and no single ever-growing switch. State and Strategy are almost indistinguishable structurally — both have a context and a set of interchangeable objects behind a shared interface — but their intents differ: in Strategy the client deliberately and explicitly picks an algorithm from the outside, and switches happen rarely, driven by the calling code's decision, whereas in State transitions happen from inside the system in reaction to events, often with no external client involved, and the states themselves know about each other and about the transition order. Compared to enum+switch, the State pattern is worth applying once there are enough states and state-dependent methods that duplicated branching becomes a real problem; for two or three simple states with a single method, an enum with a switch remains the more direct and readable choice.",
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
        "Убирает громоздкие условные операторы по состоянию",
        "Переходы и поведение состояний локализованы в своих классах",
        "Новое состояние добавляется отдельным классом, без правки существующих",
        "Правило перехода лежит рядом с состоянием, из которого оно происходит",
      ],
      en: [
        "Eliminates bulky state-driven conditional statements",
        "Transitions and per-state behavior are localized inside their own classes",
        "A new state is added as a separate class, without touching the existing ones",
        "The transition rule sits right next to the state it originates from",
      ],
    },
    cons: {
      ru: [
        "Много мелких классов состояний",
        "Оправдан лишь при действительно сложной машине состояний",
        "Состояния должны знать о соседних состояниях, чтобы задавать переходы — это связывает их между собой",
      ],
      en: [
        "Many small state classes",
        "Warranted only for a genuinely complex state machine",
        "States need to know about neighboring states to drive transitions, which couples them to each other",
      ],
    },
    tradeoffs: {
      ru: [
        "Явная машина состояний против избыточных классов для простых случаев",
        "Локализация переходов в состояниях против enum+switch, где вся логика видна в одном месте",
        "Переходы, инициируемые изнутри состояний (State), против выбора алгоритма снаружи клиентом (Strategy)",
      ],
      en: [
        "An explicit state machine versus excess classes for simple cases",
        "Localizing transitions inside states versus enum+switch, where all the logic is visible in one place",
        "Transitions driven from inside the states (State) versus an algorithm chosen from outside by the client (Strategy)",
      ],
    },
    whenToUse: {
      ru: [
        "Поведение объекта существенно зависит от его состояния",
        "Есть сложная логика переходов между состояниями",
        "Switch по enum-состоянию повторяется во многих методах и разрастается",
      ],
      en: [
        "An object's behavior depends heavily on its state",
        "There is complex transition logic between states",
        "A switch on an enum state repeats across many methods and keeps growing",
      ],
    },
    whenNotToUse: {
      ru: [
        "Состояний мало и переходы тривиальны",
        "Достаточно одного enum-поля и одного switch без дублирования по методам",
      ],
      en: [
        "There are few states and the transitions are trivial",
        "A single enum field and one switch, with no duplication across methods, is enough",
      ],
    },
    related: [
      "strategy",
      "command",
      "template-method",
    ],
    diagram: `classDiagram
  class TrafficLight {
    -state: TrafficState
    +change()
  }
  class TrafficState {
    <<interface>>
    +next(light)
  }
  TrafficLight o--> TrafficState
  TrafficState <|.. Red
  TrafficState <|.. Green
  TrafficState <|.. Yellow
  Red ..> Green : next()
  Green ..> Yellow : next()
  Yellow ..> Red : next()`,
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
      ru: "Abstract Factory предоставляет интерфейс для создания целых семейств связанных или взаимозависимых объектов, не указывая их конкретных классов. В отличие от Factory Method, где переопределяется единственный метод создания одного продукта, Abstract Factory — это отдельный объект с несколькими методами создания, по одному на каждый вид продукта в семействе; конкретная фабрика реализует все эти методы согласованно, гарантируя, что созданные ею продукты предназначены работать друг с другом.",
      en: "Abstract Factory provides an interface for creating entire families of related or mutually dependent objects, without specifying their concrete classes. Unlike Factory Method, where a single method for creating one product is overridden, Abstract Factory is a separate object with several creation methods, one per product kind in the family; a concrete factory implements all of them consistently, guaranteeing that the products it creates are meant to work together.",
    },
    problem: {
      ru: "Приложение должно работать с несколькими семействами связанных продуктов — например, элементы интерфейса под разные операционные системы или разные визуальные темы — и критично важно гарантировать, что продукты из одного семейства используются вместе и никогда не смешиваются с продуктами другого семейства (кнопка в стиле Mac рядом с чекбоксом в стиле Windows выглядела бы и вела бы себя несогласованно). Если создавать каждый продукт независимо, отдельными вызовами Factory Method или простых фабрик, ничто не мешает по ошибке скомбинировать продукты из разных семейств: компилятор такую ошибку не поймает, а обнаруживается она только визуально или в рантайме.",
      en: "An application must work with several families of related products — for example, UI widgets for different operating systems or different visual themes — and it's critical to guarantee that products from the same family are used together and never mixed with products from another family (a Mac-style button next to a Windows-style checkbox would look and behave inconsistently). If each product is created independently, through separate Factory Method or simple-factory calls, nothing stops a mistaken combination of products from different families: the compiler won't catch that error, and it only surfaces visually or at runtime.",
    },
    solution: {
      ru: "Объявляем интерфейс абстрактной фабрики с одним методом создания на каждый вид продукта в семействе (например, createButton и createCheckbox). Каждая конкретная фабрика (MacFactory, WinFactory) реализует все эти методы согласованно, создавая продукты одного и того же семейства и гарантируя их совместимость на уровне типов — раз фабрика одна, все продукты, которые она вернула, заведомо из одного стиля. Клиент работает только с интерфейсом абстрактной фабрики и интерфейсами продуктов, а конкретная фабрика подставляется один раз (например, при старте приложения в зависимости от ОС или темы) — после этого весь код клиента остаётся неизменным независимо от выбранного семейства. От Factory Method паттерн отличается масштабом и механизмом: Factory Method — это один переопределяемый метод для одного продукта, обычно через наследование, тогда как Abstract Factory — это объект с несколькими методами для целого семейства продуктов, обычно собираемый через композицию, и нередко каждый метод конкретной фабрики внутри реализован как свой Factory Method. Главный недостаток — цена согласованности: если в семейство нужно добавить новый вид продукта (скажем, createRadioButton), приходится менять интерфейс абстрактной фабрики и следом — каждую существующую конкретную фабрику, даже те, что уже стабильны и не были задействованы в изменении; это прямое нарушение принципа открытости/закрытости на уровне добавления нового вида продукта, хотя добавление нового семейства (новой конкретной фабрики целиком) по-прежнему безболезненно.",
      en: "Declare an abstract factory interface with one creation method per product kind in the family (say, createButton and createCheckbox). Each concrete factory (MacFactory, WinFactory) implements all of those methods consistently, producing products from the same family and guaranteeing their compatibility at the type level — since there's a single factory, every product it returns is known to belong to the same style. The client works only with the abstract factory interface and the product interfaces, and a concrete factory is plugged in once (say, at application startup, depending on the OS or theme) — after that, all of the client's code stays the same no matter which family was chosen. Abstract Factory differs from Factory Method in scope and mechanism: Factory Method is a single overridable method for one product, usually via inheritance, whereas Abstract Factory is an object with several methods for a whole family of products, usually assembled through composition, and each method of a concrete factory is often itself implemented as its own Factory Method. The main downside is the price of that consistency: if the family needs a new kind of product (say, createRadioButton), you must change the abstract factory interface and then every existing concrete factory, even the ones that were stable and had nothing to do with the change — a direct violation of the Open/Closed Principle at the level of adding a new product kind, even though adding an entirely new family (one new concrete factory) remains painless.",
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
        "Изолирует клиента от конкретных классов продуктов",
        "Семейство меняется заменой одной фабрики",
        "Добавление нового семейства (новой конкретной фабрики) не требует правки существующего кода",
      ],
      en: [
        "Guarantees that products from the same family are compatible",
        "Isolates the client from concrete product classes",
        "Swapping a single factory changes the entire family",
        "Adding a whole new family (one new concrete factory) needs no changes to existing code",
      ],
    },
    cons: {
      ru: [
        "Добавление нового вида продукта меняет интерфейс всех фабрик",
        "Много классов и высокая начальная сложность",
        "Каждая конкретная фабрика должна поддерживать все виды продуктов, даже если клиенту нужен только один",
      ],
      en: [
        "Adding a new kind of product changes the interface of every factory",
        "Many classes and high upfront complexity",
        "Every concrete factory must support all product kinds, even when a given client only needs one",
      ],
    },
    tradeoffs: {
      ru: [
        "Согласованность семейств против жёсткости интерфейса фабрики",
        "Лёгкое добавление нового семейства против дорогого добавления нового вида продукта",
        "Одна фабрика с несколькими методами (Abstract Factory) против одного метода на подкласс (Factory Method)",
      ],
      en: [
        "Family consistency versus the rigidity of the factory interface",
        "Cheap to add a new family versus expensive to add a new product kind",
        "One factory with several methods (Abstract Factory) versus one method per subclass (Factory Method)",
      ],
    },
    whenToUse: {
      ru: [
        "Система должна работать с несколькими семействами связанных продуктов",
        "Важно не смешивать продукты из разных семейств",
        "Набор видов продуктов стабилен, а семейства (темы, платформы) могут добавляться",
      ],
      en: [
        "The system must work with several families of related products",
        "It is important not to mix products from different families",
        "The set of product kinds is stable, but families (themes, platforms) may keep being added",
      ],
    },
    whenNotToUse: {
      ru: [
        "Есть лишь один вид продукта — хватит Factory Method",
        "Набор видов продуктов часто меняется — цена правки всех фабрик станет слишком высокой",
      ],
      en: [
        "There is only a single kind of product — Factory Method is enough",
        "The set of product kinds changes often — the cost of editing every factory would become too high",
      ],
    },
    related: [
      "factory-method",
      "builder",
      "dip",
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
