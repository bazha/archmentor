import type { ConceptProse, QuestionProse } from '../schema';

export const conceptProse: Record<string, ConceptProse> = {
  "srp": {
    "tagline": "A module should have one reason to change",
    "definition": "A module should be responsible to one, and only one, actor — a group of people (or a role) who could request changes to it for a shared reason. Put another way, a class should have one and only one reason to change: it encapsulates a single responsibility owed to a single stakeholder. This is not the same claim as \"a class should do only one thing\": SRP is about the source of change (the actor), not the number of operations — a class can have several methods and still have exactly one reason to change.",
    "problem": "A class that calculates pay, formats a report, and persists data to the database changes for three independent reasons: the finance department owns the pay rules, the reporting department owns the report format, and the DBA owns the storage schema. A change made for one actor risks accidentally breaking logic that matters to another, and responsibilities fused together like this make the class hard to test and read. This is the classic god-class symptom: the more unrelated reasons to change pile up in one place, the higher the coupling, and the more often one team's commit breaks behavior another team owns.",
    "solution": "Split the responsibilities into separate classes: PayCalculator answers to accounting, EmployeeRepository answers to the DBA, EmployeeReport answers to the reporting department. Each class changes independently and gathers cohesive code that changes for the same single reason. It's important not to confuse SRP with the broader idea of \"separation of concerns\": SoC is an architectural notion about splitting tasks across layers or modules, whereas SRP is a concrete class-level test — \"how many actors could request a change to this class?\" If the answer is more than one, split the class along actor boundaries, not along arbitrary technical categories.",
    "code": "// Violation: three reasons to change in a single class\nclass Employee {\n  calculatePay() { /* accounting rules */ }\n  save() { /* database schema */ }\n  describeInReport() { /* report format */ }\n}\n\n// SRP: each responsibility in its own class\nclass PayCalculator { calculate(e: Employee): number { /* ... */ return 0; } }\nclass EmployeeRepository { save(e: Employee): void { /* ... */ } }\nclass EmployeeReport { render(e: Employee): string { /* ... */ return ''; } }",
    "pros": [
      "Easier to test and understand",
      "Lower coupling and higher cohesion inside each class",
      "Changes stay local and safe — edits for one actor don't touch another actor's code",
      "Simplifies code review: the diff reflects a single reason for change"
    ],
    "cons": [
      "More classes and files, harder to navigate the project structure",
      "Risk of premature splitting \"just in case\" when there is really only one actor, not two",
      "May require extra glue code to coordinate several small classes"
    ],
    "tradeoffs": [
      "Granularity versus ease of navigating the code",
      "Strict separation by actor versus the convenience of keeping related logic together",
      "The number of abstractions today versus flexibility when a new actor shows up tomorrow"
    ],
    "whenToUse": [
      "The class changes for several unrelated reasons",
      "A single class mixes different levels of abstraction — business rules and infrastructure",
      "Different stakeholders regularly request changes to the same file"
    ],
    "whenNotToUse": [
      "A tiny entity where splitting would add nothing but noise",
      "A script or prototype with a single actor and a short lifespan — splitting wouldn't pay off"
    ]
  },
  "ocp": {
    "tagline": "Open for extension, closed for modification",
    "definition": "Software entities — classes, modules, functions — should be open for extension but closed for modification: new behavior is added through new code, not by editing code that already works and is already tested. This is achieved through abstraction and polymorphism: the client works against an interface rather than concrete implementations, so adding a new variant means adding a new class at a pre-planned extension point rather than changing an existing one.",
    "problem": "Computing area with a switch on the shape type has to be edited every time a new shape is introduced: adding a Triangle means finding that switch, adding a case, and rebuilding a module that already worked and was already tested. The same proven code is changed again and again, raising the risk of regressions in branches that already work. Type-based switches like this are typically scattered across the codebase in several places — rendering, serialization, validation — and it's easy to forget to update one of them when a new shape is added.",
    "solution": "Introduce a Shape abstraction with an area() method. A new shape is simply a new class that implements the interface; the consuming code (totalArea) doesn't change at all — the extension point is fixed once and for all. OCP is rarely achieved directly: it usually rests on DIP — the consumer depends on the Shape abstraction rather than concrete classes, and that's exactly what makes plugging in new implementations safe. It's important not to overdo it: introducing an abstraction pays off where variants genuinely keep multiplying, or where external consumers need an extension point (plugins, strategies). A premature abstraction for a hypothetical future change is wasted complexity (this is where YAGNI applies), and it's worth introducing one only once a second real variant, or a concrete extensibility requirement, has appeared.",
    "code": "// Violation: adding a shape requires editing the switch\nclass AreaCalculator {\n  area(shape: { type: string; [k: string]: unknown }): number {\n    switch (shape.type) {\n      case 'circle': return Math.PI * (shape.r as number) ** 2;\n      case 'square': return (shape.side as number) ** 2;\n      default: return 0;\n    }\n  }\n}\n\n// OCP: a new shape is a new class; the consumer is closed for modification\ninterface Shape { area(): number; }\nclass Circle implements Shape { constructor(private r: number) {} area() { return Math.PI * this.r ** 2; } }\nclass Square implements Shape { constructor(private side: number) {} area() { return this.side ** 2; } }\nclass Triangle implements Shape { constructor(private b: number, private h: number) {} area() { return 0.5 * this.b * this.h; } }\n\nfunction totalArea(shapes: Shape[]): number {\n  return shapes.reduce((sum, s) => sum + s.area(), 0); // unchanged when new shapes are added\n}",
    "pros": [
      "New behavior without editing proven code",
      "Fewer regressions in branches that already work",
      "Extensibility through polymorphism and pluggable extension points",
      "A stable public contract for the abstraction's consumers"
    ],
    "cons": [
      "More abstractions and indirection up front",
      "Needless flexibility where nothing will change — over-engineering by guessing at variants",
      "Harder to trace which concrete implementation runs behind the interface while debugging"
    ],
    "tradeoffs": [
      "Flexibility for future change versus simplicity here and now",
      "YAGNI versus readiness to extend: an abstraction pays off only once variants genuinely repeat",
      "Polymorphism versus performance — a virtual call is usually a bit costlier than a direct one"
    ],
    "whenToUse": [
      "New variants are regularly added at a given point in the code",
      "Behavior needs to be pluggable via plugins or configuration",
      "At least one real instance of a new conditional branch has already appeared"
    ],
    "whenNotToUse": [
      "The set of variants is stable and unlikely to grow",
      "This is the first appearance of variability — an abstraction without a second real case is usually premature (YAGNI)"
    ]
  },
  "lsp": {
    "tagline": "A subtype must be substitutable for its base type",
    "definition": "If S is a subtype of T, then objects of type T can be freely replaced with objects of type S without breaking the correctness of the program. Formally (per Barbara Liskov), a subtype must honor the base type's contract under three rules: it must not strengthen preconditions beyond the base type's, must not weaken postconditions below the base type's, and must preserve the base type's invariants. LSP is a principle of behavioral subtyping: it checks not whether method signatures match, but whether the expected behavior matches, from the point of view of a client that works with the base type and shouldn't need to know about the concrete subtype.",
    "problem": "Square inherits from Rectangle and overrides setWidth/setHeight so that width and height always change together instead of independently. A client that works with a Rectangle and expects setWidth not to affect the height (the base type's postcondition) gets the wrong area when a Square is substituted in — the contract is silently broken. The same class of problem shows up in the classic Circle–Ellipse pair: a circle with a single radius can't honestly substitute for an ellipse with independent semi-axes (even though \"is-a\" makes Circle look like a special case of Ellipse, a client that mutates the semi-axes independently breaks the circle's invariant). A typical real-world symptom of this violation is an instanceof/type-check creeping into client code (\"if it's a Square, handle it differently\"): the client is forced to manually work around the broken contract instead of trusting polymorphism.",
    "solution": "Don't build a false \"a square is a rectangle\" hierarchy: in the context of LSP, inheritance isn't about sharing data (a shape's sides) but about compatible behavioral contracts. Model both shapes through a common Shape interface, where Rect and Sq independently and honestly implement their own area() contract, without promising the client anything they can't keep. The general design rule: before making B a subtype of A, check that B doesn't strengthen A's method preconditions (doesn't demand more from calling code), doesn't weaken A's postconditions (delivers no fewer guarantees than A), and preserves A's invariants across every public operation. If even one of those conditions fails, the right tool isn't inheritance — it's composition, or a separate hierarchy behind a shared interface, as in the Shape example.",
    "code": "// LSP violation: Square breaks Rectangle's contract\nclass Rectangle {\n  constructor(protected w: number, protected h: number) {}\n  setWidth(w: number) { this.w = w; }\n  setHeight(h: number) { this.h = h; }\n  area() { return this.w * this.h; }\n}\nclass Square extends Rectangle {\n  setWidth(w: number) { this.w = w; this.h = w; }  // breaks the client's expectations\n  setHeight(h: number) { this.w = h; this.h = h; }\n}\n// setWidth(5); setHeight(4); area() we expect 20, but Square returns 16\n\n// LSP: a shared interface with no false hierarchy\ninterface Shape { area(): number; }\nclass Rect implements Shape { constructor(private w: number, private h: number) {} area() { return this.w * this.h; } }\nclass Sq implements Shape { constructor(private side: number) {} area() { return this.side ** 2; } }",
    "pros": [
      "Polymorphism is safe: base-typed code works with any subtype without surprises",
      "The client doesn't need to know about the subtypes or check for them",
      "Fewer instanceof/type-check branches in client code",
      "Type hierarchies stay predictable and easier to refactor"
    ],
    "cons": [
      "Requires discipline and time to design hierarchies and contracts",
      "Sometimes forces you to give up \"convenient\" inheritance built around shared data",
      "Spotting an LSP violation from type signatures alone isn't always easy — it takes behavioral analysis"
    ],
    "tradeoffs": [
      "Strict contracts versus the temptation to reuse code through inheritance",
      "Flatter hierarchies built with composition versus the compactness of classic inheritance",
      "Time spent analyzing pre-/postconditions versus the speed of just inheriting and overriding"
    ],
    "whenToUse": [
      "You are designing an inheritance hierarchy",
      "The code relies on polymorphic substitution with no type checks",
      "You need to decide whether B is truly a kind of A in terms of behavior, not just shared data"
    ],
    "whenNotToUse": [
      "Inheritance isn't used — the principle doesn't apply",
      "The hierarchy is closed, non-public, and fully controlled by one team with no external consumers — the risk of violation is lower, though not zero"
    ]
  },
  "isp": {
    "tagline": "Don't force a client to depend on methods it doesn't use",
    "definition": "Clients should not be forced to depend on interfaces they don't use. Many specialized, client-specific interfaces (role interfaces) are better than a single general-purpose fat interface. In effect, ISP is SRP applied to interfaces rather than classes: an interface should have one reason to change — the needs of a single group of clients, not the sum of the needs of every possible client at once.",
    "problem": "A fat Worker interface with work() and eat() methods forces the Robot class to implement eat() with a stub that throws a NotImplementedError — the method genuinely can't be implemented meaningfully, yet the interface requires it to exist. A client that only needs work() still depends indirectly on eat(): changing eat()'s signature forces Robot to recompile and potentially break, even though Robot never uses that method. This is a classic ISP-violation symptom — stub methods that throw \"not supported\" signal that the interface bundles together incompatible client roles.",
    "solution": "Break the interface into narrow roles, Workable and Eatable, each describing one facet of behavior needed by a particular group of clients. A class implements only the roles it can actually fulfill: Human implements both, Machine implements only Workable, and no exception-throwing stubs are needed anymore. This move is closely tied to SRP: if an interface, like a class, has exactly one reason to change (one client role), it stays small on its own, with no need for after-the-fact splitting. In practice, narrow role interfaces also make testing easier (mocking one or two methods instead of a dozen) and make a module's real dependencies explicit: a constructor that takes a Workable says more than one that takes a whole Worker.",
    "code": "// Violation: a \"fat\" interface imposes unneeded methods\ninterface Worker {\n  work(): void;\n  eat(): void;\n}\nclass Robot implements Worker {\n  work() { /* ... */ }\n  eat() { throw new Error('a robot does not eat'); } // forced stub\n}\n\n// ISP: narrow interfaces tailored to the client's needs\ninterface Workable { work(): void; }\ninterface Eatable { eat(): void; }\nclass Human implements Workable, Eatable { work() {} eat() {} }\nclass Machine implements Workable { work() {} }",
    "pros": [
      "The client depends only on the behavior it needs",
      "Fewer ripple effects from changes to methods it doesn't use",
      "Simpler implementations — no exception-throwing stubs required",
      "Easier to write mocks and tests for narrow roles"
    ],
    "cons": [
      "More interfaces to maintain and name",
      "Risk of over-fragmenting into too many tiny roles with no practical benefit",
      "A class may end up implementing many small interfaces at once, cluttering its public contract"
    ],
    "tradeoffs": [
      "Precise dependencies versus the number of abstractions in the codebase",
      "Client-specific role interfaces versus a single general interface that's easier to find and remember",
      "Flexibility in composing roles versus the simplicity of one single contract point"
    ],
    "whenToUse": [
      "An interface has grown and some implementations are stuck with empty or exception-throwing methods",
      "Different clients use different, non-overlapping parts of the API",
      "Changing one interface method regularly ripples into classes that don't use it"
    ],
    "whenNotToUse": [
      "The interface is small and every client needs all of its methods, no exceptions",
      "Splitting would create roles that are always implemented and used together — the split would add only indirection"
    ]
  },
  "dip": {
    "tagline": "Depend on abstractions, not on details",
    "definition": "High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions. It's important to distinguish the principle itself (DIP) from the Dependency Injection/IoC technique: DI is just one mechanism used in practice to satisfy DIP (passing a ready-made implementation through a constructor, a setter, or an IoC container), but you can follow DIP without a container at all — it's enough for the high-level code to know only about the interface.",
    "problem": "UserService creates new MySqlDatabase() directly inside itself. The high-level user-registration business logic ends up hard-wired to a specific database engine: it can't be substituted with an in-memory implementation in unit tests, and switching to a different store requires editing UserService itself, even though the registration business rule never changed. Here the direction of the dependency matches the direction of the calls (the high-level module directly creates and calls the low-level one), so changes in the infrastructure layer — swapping a database driver, bumping a client version — leak upward and touch business logic that should be independent of them.",
    "solution": "Introduce a Database abstraction with a save() method, declared by the high-level module (UserService) — it owns the contract, because its needs shape the interface. Both UserService and the concrete implementations (MySqlDatabase2, InMemoryDatabase) depend on this abstraction; the implementation is injected from the outside via the constructor, which inverts the direction of the dependency relative to the direction of the calls: previously the high level depended on the low level, now both depend on an abstraction owned by the high level. DIP is precisely what makes OCP possible at module boundaries: a new Database implementation can be plugged in without changing UserService — the system is extended by adding a new class, not editing an existing one. A DI container (NestJS, InversifyJS, and the like) is a convenient but optional way to wire the interface to an implementation at runtime; the DIP principle itself can be honored manually too, just by passing an object into a constructor.",
    "code": "// Violation: a high-level module depends on a concrete detail\nclass MySqlDatabase { save(data: string) { /* ... */ } }\nclass UserServiceBad {\n  private db = new MySqlDatabase(); // tight coupling to the implementation\n  register(user: string) { this.db.save(user); }\n}\n\n// DIP: both levels depend on an abstraction; the detail is injected from outside\ninterface Database { save(data: string): void; }\nclass MySqlDatabase2 implements Database { save(data: string) { /* ... */ } }\nclass InMemoryDatabase implements Database { save(data: string) { /* ... */ } }\nclass UserService {\n  constructor(private db: Database) {} // depends on the interface\n  register(user: string) { this.db.save(user); }\n}",
    "pros": [
      "Implementations are interchangeable without touching the business logic",
      "Easy to inject a mock or an in-memory implementation in tests",
      "The business logic knows nothing about infrastructure details",
      "DIP at module boundaries opens the door to OCP when the system is extended"
    ],
    "cons": [
      "More interfaces and layers of indirection",
      "Requires a mechanism for wiring the implementation to the abstraction — manually or via a DI container",
      "Reading the code means jumping between the interface and the concrete implementation"
    ],
    "tradeoffs": [
      "Decoupling of modules versus straightforwardness and the number of abstractions",
      "The convenience of a DI container (auto-wiring, configuration) versus the \"magic\" that makes debugging and call tracing harder",
      "An abstraction owned by the high-level module versus the temptation to let the low-level module dictate the interface's shape"
    ],
    "whenToUse": [
      "The business logic must not know about specific infrastructure",
      "You need to swap the implementation in tests or across different environments",
      "A change of infrastructure provider (database, queue, external API) is expected in the foreseeable future"
    ],
    "whenNotToUse": [
      "The detail is stable and will never be replaced — the abstraction would be needless indirection",
      "A simple script or prototype with no tests and no second implementation — a DI container would add infrastructure for its own sake"
    ]
  },
  "strategy": {
    "tagline": "Interchangeable algorithms behind a common interface",
    "definition": "Strategy defines a family of algorithms, encapsulates each one in its own class or function, and makes them interchangeable behind a common interface. The context holds a reference to the currently selected strategy and delegates the work to it without knowing anything about its internals, so the algorithm can vary independently from the client that uses it. In modern TypeScript a strategy is often just a plain function with the right signature rather than a class — the interface collapses into a function type, and encapsulation comes from closures instead of objects. This directly supports the Open/Closed Principle: a new behavior variant is added as a new implementation, with no changes to existing code.",
    "problem": "A class hard-codes a single way of behaving — price calculation, sorting, compression, validation — directly inside its own code. As soon as a second variant of that behavior is needed, a developer bolts on an if/switch keyed to a type or flag, and by the third or fourth variant the conditional logic has sprawled across the whole class and duplicated itself anywhere the same decision gets made. Such a class violates the Open/Closed Principle: adding a new variant means editing existing, already-tested code and risking breaking the branches that already work. Worse, the class is forced to know about every variant at once, even when a given client only ever needs one of them.",
    "solution": "Pull the algorithm out of the context into a separate Strategy abstraction — an interface with a single method, or, in modern TypeScript, simply a function type. Each concrete algorithm implements that interface as its own class, or is exported as a standalone function. The context holds a reference to the current strategy and delegates the work to it through one call site; the choice of concrete strategy happens from the outside — the client supplies the desired implementation via a constructor or setter, and that choice can change at any point while the program runs. Because every strategy implements the same interface, the context treats them polymorphically and knows nothing about their internals: adding a new algorithm means adding a new class or function, not touching the context. It's worth distinguishing Strategy from the State pattern, since structurally they are nearly identical (a context plus a set of interchangeable objects behind an interface): in Strategy the client deliberately picks an algorithm from the outside and switches between strategies only occasionally, whereas in State the transitions between states are driven from the inside, by the state objects themselves, in reaction to events.",
    "code": "interface PricingStrategy { price(base: number): number; }\nclass Regular implements PricingStrategy { price(b: number) { return b; } }\nclass Vip implements PricingStrategy { price(b: number) { return b * 0.8; } }\n\nclass Checkout {\n  constructor(private strategy: PricingStrategy) {}\n  setStrategy(s: PricingStrategy) { this.strategy = s; } // the client makes the choice\n  total(base: number) { return this.strategy.price(base); }\n}\n\nconst checkout = new Checkout(new Regular());\ncheckout.setStrategy(new Vip()); // the algorithm is swapped from outside, with no internal transitions",
    "pros": [
      "Swap the algorithm at runtime without touching the context",
      "Isolates behavior variants from each other and from the client",
      "Eliminates the sprawl of type/flag-driven conditional statements",
      "A new algorithm is added as a separate class or function — follows OCP",
      "In TS/JS a strategy can be a plain function, with no classes or interfaces needed"
    ],
    "cons": [
      "Increases the number of classes (or strategy functions)",
      "The client has to know about the available strategies to pick the right one",
      "If there are only a couple of strategies that never change, the pattern is an unnecessary abstraction"
    ],
    "tradeoffs": [
      "Flexibility in choosing the algorithm versus the number of classes/functions",
      "Interface-based polymorphism versus the simplicity of a plain callback function",
      "Explicit strategy selection by the client versus a hidden choice inside the context (as in Factory Method)"
    ],
    "whenToUse": [
      "There are several variants of one behavior and the number of variants may grow",
      "You need to switch the algorithm at runtime from the outside, without rebuilding the context",
      "The conditional logic for choosing an algorithm has grown and is duplicated in several places"
    ],
    "whenNotToUse": [
      "There is always a single behavior variant that never changes",
      "There are only two or three variants, the count isn't growing, and a plain if is enough"
    ]
  },
  "observer": {
    "tagline": "One-to-many: subscribers are notified of changes automatically",
    "definition": "Observer defines a one-to-many dependency between objects: when the state of one object (the subject) changes, all the objects that depend on it (the observers) are notified and updated automatically, and the subject knows nothing concrete about its observers beyond a common subscription interface. There are two data-delivery models for notifications: push, where the subject hands the new data to each observer along with the notification, and pull, where the notification merely signals that something changed and the observer queries the subject for whatever details it needs through its public interface.",
    "problem": "Several objects need to react when a source's state changes — refresh a screen, recompute a cache, write a log entry — but hard-wiring the source to each specific recipient makes the system inflexible: adding a new recipient forces you to edit the source's code, and the source itself grows, accumulating ever more direct calls to new handlers. Things get worse when recipients must be added and removed dynamically while the program is running: hard-coded calls don't allow that without rebuilding and redeploying. Naive, hand-rolled subscription implementations frequently run into the so-called lapsed-listener problem: a subscriber holds a reference to the source but never explicitly unsubscribes, so the garbage collector can't reclaim the subscriber's memory for as long as the source stays alive.",
    "solution": "The subject keeps a collection of observers that implement a common update interface, and exposes attach/detach methods for dynamic subscription and unsubscription. When its state changes, the subject walks the list of observers and calls an update method on each — either handing over the new data right away (the push model, simpler for the observer but it bloats the notification interface and couples the subject more tightly to the shape of the data), or merely signaling that something changed and letting the observer pull whatever details it needs through the subject's public interface (the pull model, which decouples the two sides more but costs the observer an extra call back). Observers must explicitly unsubscribe once they're no longer needed, or the lapsed-listener problem creeps in. The order in which observers are notified is usually not guaranteed, and an observer that mutates the subject's state while handling a notification can trigger a reentrant call into notify() before the current update cycle has finished — such cascading updates should either be blocked with an explicit reentrancy guard or buffered into a queue of pending events. Classic Observer differs from the broader publish/subscribe idea and an event bus in that subscribers attach directly to the subject, with no broker in between and no named topics or channels — simpler, but less decoupled in a distributed system.",
    "code": "interface Observer { update(temperature: number): void; }\n\nclass WeatherStation {\n  private observers: Observer[] = [];\n  private temperature = 0;\n  subscribe(o: Observer) { this.observers.push(o); }\n  unsubscribe(o: Observer) { this.observers = this.observers.filter((x) => x !== o); }\n  setTemperature(t: number) { this.temperature = t; this.notify(); }\n  private notify() { for (const o of this.observers) o.update(this.temperature); }\n}\n\nclass PhoneDisplay implements Observer {\n  update(t: number) { console.log(`Phone: ${t}°`); }\n}",
    "pros": [
      "Loose coupling between the subject and its observers",
      "Observers can be added and removed at runtime",
      "Supports one-to-many broadcast without changing the subject",
      "The pull model keeps the notification interface from being bloated with extra data"
    ],
    "cons": [
      "The order in which observers are notified is not guaranteed",
      "Cascading updates are hard to debug, especially with reentrant notify() calls",
      "Risk of memory leaks when observers forget to unsubscribe (the lapsed-listener problem)",
      "The push model couples the subject more tightly to the shape of the data it sends"
    ],
    "tradeoffs": [
      "Decoupling components versus predictability of the notification flow",
      "The push model (simpler for the observer) versus the pull model (looser coupling, but an extra callback)",
      "Direct subscription on the subject (simple) versus a broker/event bus with topics (more flexible in a distributed system)"
    ],
    "whenToUse": [
      "A change in one object must be reflected in others without tight coupling",
      "The number and identity of the recipients are not known in advance and change at runtime",
      "You need to support many heterogeneous subscribers to the same event"
    ],
    "whenNotToUse": [
      "There is exactly one recipient and the relationship is simple — a direct call is enough",
      "There are many subscribers spread across different processes/services — a full event bus is needed, not a direct Observer"
    ]
  },
  "factory-method": {
    "tagline": "The subclass decides which object to create",
    "definition": "Factory Method defines, in a base class, an interface for creating an object — the factory method itself — but leaves it to concrete subclasses to decide which class to instantiate. The base class writes its shared algorithm in terms of the abstract product and calls the factory method wherever it needs a new object, without knowing or caring which concrete implementation will be produced; that responsibility belongs to the subclass that overrides the method. Unlike a simple factory — a static method or a standalone class with a conditional that picks a product by some parameter — Factory Method is polymorphic: the choice of concrete product is encoded in the inheritance hierarchy rather than in a branch inside a single method.",
    "problem": "A base class needs to work with a product of a certain kind, but it doesn't know the product's concrete type ahead of time, and that type can differ depending on the context of use — platform, configuration, region. Instantiating it directly with new inside the base class would couple that class to one specific implementation and violate the Open/Closed Principle: supporting a new product variant would mean editing the base class itself. A simple factory with a conditional solves the creation problem but just relocates it to the branch-selection level: adding a new product type still means editing the existing factory code, and all the conditional logic sits in one place that has to be touched on every extension.",
    "solution": "Declare a factory method in the base class (the creator) that returns the product through its interface; the creator's shared algorithm uses that method without knowing anything about the product's concrete class. Each creator subclass overrides the factory method and produces its own concrete product implementation — so a concrete creator and a concrete product end up paired together, forming two parallel class hierarchies (a creator hierarchy and a product hierarchy) that grow in lockstep: a new creator+product pair is added without touching existing code, which is exactly what gives the pattern its Open/Closed compliance. Factory Method differs from Abstract Factory in scope: Factory Method creates exactly one kind of product through a single overridable method and typically relies on inheritance, whereas Abstract Factory is a separate factory object with several methods that produces a consistent family of different products and is usually built through composition rather than inheritance (in fact, Abstract Factory is often implemented as a set of Factory Methods inside its concrete factories). Factory Method is also closely related to Template Method: the factory method itself is essentially a special case of a template method, where the one step delegated to a subclass is object creation rather than some derived computation step.",
    "code": "interface Button { render(): string; }\nclass HtmlButton implements Button { render() { return '<button>'; } }\nclass WindowsButton implements Button { render() { return '[ Button ]'; } }\n\nabstract class Dialog {\n  // factory method: the subclass chooses the concrete product\n  protected abstract createButton(): Button;\n  render(): string {\n    const button = this.createButton(); // shared algorithm in the base class\n    return button.render();\n  }\n}\n\nclass HtmlDialog extends Dialog { protected createButton() { return new HtmlButton(); } }\nclass WindowsDialog extends Dialog { protected createButton() { return new WindowsButton(); } }",
    "pros": [
      "Decouples the base class from concrete products",
      "Object creation is concentrated in a single overridable method",
      "Extend it by adding a new subclass (follows the Open/Closed Principle)",
      "Combines naturally with Template Method: the shared algorithm stays fixed, only creation varies"
    ],
    "cons": [
      "A whole subclass is needed just to create one product",
      "Two parallel class hierarchies grow at once",
      "Heavier than a simple factory with a conditional when there are only a few variants that aren't growing"
    ],
    "tradeoffs": [
      "Creation flexibility through inheritance versus a growing class hierarchy",
      "Polymorphic product selection in subclasses versus a simple factory's centralized conditional",
      "One product kind per creator (Factory Method) versus a consistent product family (Abstract Factory)"
    ],
    "whenToUse": [
      "A class can't anticipate the type of objects it must create",
      "You want to hand off the creation of a single product to subclasses",
      "You want to replace a simple factory's conditional with a proper class hierarchy"
    ],
    "whenNotToUse": [
      "The product type is known and stable — direct instantiation is enough",
      "There are only a few product variants, and a simple factory with a conditional is simpler and clearer"
    ]
  },
  "state": {
    "tagline": "An object alters its behavior when its internal state changes",
    "definition": "State lets an object alter its behavior when its internal state changes, so from the outside it looks as though the object changed its class. Instead of a single flag field or enum whose value is checked in a switch inside every method, each state is pulled out into its own class behind a common interface, and the context object holds a reference to the current state object and delegates every state-dependent request to it. Transitions between states are explicit: either the state object itself assigns the next state to the context, or the context does so based on a result the state object returns.",
    "problem": "An object's behavior depends heavily on its current state and must change at runtime — for example, a document behaves differently in the \"draft\", \"in review\", and \"published\" statuses. The naive approach is an enum or string status flag plus a switch in every method that checks that field and runs the right branch. With two or three states that's tolerable, but as the number of states and methods grows, every switch duplicates the same branching structure, the transition logic gets smeared across all the methods at once, and forgetting to handle a state in one of the switches is a common mistake the compiler doesn't always catch. Adding a new state means editing every one of those switches throughout the class.",
    "solution": "Extract each state into its own class that implements a shared interface whose methods behave differently per state. The context keeps a reference to the current state object and delegates all such requests to it instead of running an internal switch. The transition to a new state is explicit and localized: typically the state object itself, after handling a request, calls a state-change method on the context and hands it the next state object — so the transition rule lives right next to the state it originates from, rather than being smeared across the context. Adding a new state means adding a new class that implements the interface, with no changes to the existing states and no single ever-growing switch. State and Strategy are almost indistinguishable structurally — both have a context and a set of interchangeable objects behind a shared interface — but their intents differ: in Strategy the client deliberately and explicitly picks an algorithm from the outside, and switches happen rarely, driven by the calling code's decision, whereas in State transitions happen from inside the system in reaction to events, often with no external client involved, and the states themselves know about each other and about the transition order. Compared to enum+switch, the State pattern is worth applying once there are enough states and state-dependent methods that duplicated branching becomes a real problem; for two or three simple states with a single method, an enum with a switch remains the more direct and readable choice.",
    "code": "interface TrafficState { next(light: TrafficLight): void; label(): string; }\n\nclass Red implements TrafficState {\n  next(light: TrafficLight) { light.setState(new Green()); } // the state itself defines the transition\n  label() { return 'RED'; }\n}\nclass Green implements TrafficState {\n  next(light: TrafficLight) { light.setState(new Yellow()); }\n  label() { return 'GREEN'; }\n}\nclass Yellow implements TrafficState {\n  next(light: TrafficLight) { light.setState(new Red()); }\n  label() { return 'YELLOW'; }\n}\n\nclass TrafficLight {\n  private state: TrafficState = new Red();\n  setState(s: TrafficState) { this.state = s; }\n  change() { this.state.next(this); } // behavior is determined by the internal state\n  get current() { return this.state.label(); }\n}",
    "pros": [
      "Eliminates bulky state-driven conditional statements",
      "Transitions and per-state behavior are localized inside their own classes",
      "A new state is added as a separate class, without touching the existing ones",
      "The transition rule sits right next to the state it originates from"
    ],
    "cons": [
      "Many small state classes",
      "Warranted only for a genuinely complex state machine",
      "States need to know about neighboring states to drive transitions, which couples them to each other"
    ],
    "tradeoffs": [
      "An explicit state machine versus excess classes for simple cases",
      "Localizing transitions inside states versus enum+switch, where all the logic is visible in one place",
      "Transitions driven from inside the states (State) versus an algorithm chosen from outside by the client (Strategy)"
    ],
    "whenToUse": [
      "An object's behavior depends heavily on its state",
      "There is complex transition logic between states",
      "A switch on an enum state repeats across many methods and keeps growing"
    ],
    "whenNotToUse": [
      "There are few states and the transitions are trivial",
      "A single enum field and one switch, with no duplication across methods, is enough"
    ]
  },
  "abstract-factory": {
    "tagline": "Create families of related objects without coupling to concrete classes",
    "definition": "Abstract Factory provides an interface for creating entire families of related or mutually dependent objects, without specifying their concrete classes. Unlike Factory Method, where a single method for creating one product is overridden, Abstract Factory is a separate object with several creation methods, one per product kind in the family; a concrete factory implements all of them consistently, guaranteeing that the products it creates are meant to work together.",
    "problem": "An application must work with several families of related products — for example, UI widgets for different operating systems or different visual themes — and it's critical to guarantee that products from the same family are used together and never mixed with products from another family (a Mac-style button next to a Windows-style checkbox would look and behave inconsistently). If each product is created independently, through separate Factory Method or simple-factory calls, nothing stops a mistaken combination of products from different families: the compiler won't catch that error, and it only surfaces visually or at runtime.",
    "solution": "Declare an abstract factory interface with one creation method per product kind in the family (say, createButton and createCheckbox). Each concrete factory (MacFactory, WinFactory) implements all of those methods consistently, producing products from the same family and guaranteeing their compatibility at the type level — since there's a single factory, every product it returns is known to belong to the same style. The client works only with the abstract factory interface and the product interfaces, and a concrete factory is plugged in once (say, at application startup, depending on the OS or theme) — after that, all of the client's code stays the same no matter which family was chosen. Abstract Factory differs from Factory Method in scope and mechanism: Factory Method is a single overridable method for one product, usually via inheritance, whereas Abstract Factory is an object with several methods for a whole family of products, usually assembled through composition, and each method of a concrete factory is often itself implemented as its own Factory Method. The main downside is the price of that consistency: if the family needs a new kind of product (say, createRadioButton), you must change the abstract factory interface and then every existing concrete factory, even the ones that were stable and had nothing to do with the change — a direct violation of the Open/Closed Principle at the level of adding a new product kind, even though adding an entirely new family (one new concrete factory) remains painless.",
    "code": "interface Button { paint(): string; }\ninterface Checkbox { paint(): string; }\n\n// a factory creates a whole family of related products\ninterface GUIFactory {\n  createButton(): Button;\n  createCheckbox(): Checkbox;\n}\n\nclass MacButton implements Button { paint() { return 'Mac button'; } }\nclass MacCheckbox implements Checkbox { paint() { return 'Mac checkbox'; } }\nclass WinButton implements Button { paint() { return 'Win button'; } }\nclass WinCheckbox implements Checkbox { paint() { return 'Win checkbox'; } }\n\nclass MacFactory implements GUIFactory {\n  createButton() { return new MacButton(); }\n  createCheckbox() { return new MacCheckbox(); }\n}\nclass WinFactory implements GUIFactory {\n  createButton() { return new WinButton(); }\n  createCheckbox() { return new WinCheckbox(); }\n}",
    "pros": [
      "Guarantees that products from the same family are compatible",
      "Isolates the client from concrete product classes",
      "Swapping a single factory changes the entire family",
      "Adding a whole new family (one new concrete factory) needs no changes to existing code"
    ],
    "cons": [
      "Adding a new kind of product changes the interface of every factory",
      "Many classes and high upfront complexity",
      "Every concrete factory must support all product kinds, even when a given client only needs one"
    ],
    "tradeoffs": [
      "Family consistency versus the rigidity of the factory interface",
      "Cheap to add a new family versus expensive to add a new product kind",
      "One factory with several methods (Abstract Factory) versus one method per subclass (Factory Method)"
    ],
    "whenToUse": [
      "The system must work with several families of related products",
      "It is important not to mix products from different families",
      "The set of product kinds is stable, but families (themes, platforms) may keep being added"
    ],
    "whenNotToUse": [
      "There is only a single kind of product — Factory Method is enough",
      "The set of product kinds changes often — the cost of editing every factory would become too high"
    ]
  },
  "singleton": {
    "tagline": "A single instance of a class and a global point of access to it",
    "definition": "Ensures that a class has only one instance and provides a global point of access to it. The class manages its own lifecycle: a private constructor forbids instantiation via new from the outside, and a static accessor method either lazily creates the single instance on first access or returns the one that already exists. An important caveat: many engineers today consider the classic Singleton more of an anti-pattern compared to a DI-scoped singleton — a service created once inside a dependency-injection container and passed explicitly to wherever it's needed, instead of relying on hidden global access.",
    "problem": "Some objects should exist in the system in exactly one instance — configuration, a logger, a database connection pool. An ordinary class does nothing to stop several instances from being created via new: nothing forbids a second, third, or further call to the constructor, and the system ends up with out-of-sync copies of state. A naive alternative — keeping the single instance in a module-level global variable — doesn't solve the problem either: nothing prevents creating another instance and reassigning it to that same variable, the global namespace gets cluttered, and initialization order across modules isn't guaranteed. What's needed is a way for the class itself to control its own creation and guarantee uniqueness no matter how or when client code reaches for it.",
    "solution": "The class controls its own creation: the constructor is made private to forbid new from the outside, and a static getInstance() method lazily creates the instance on first access, returning that same object — held in a private static field — on every subsequent call. This lazy initialization saves resources when the instance might never be needed. In a multithreaded environment, a naive implementation is vulnerable to a race condition: two threads can simultaneously pass the instance === null check and create two different instances, so production implementations use locking, double-checked locking, or an eager static instance created before any threads start. In JavaScript/TypeScript, the single-threaded execution model in the browser and Node.js removes this problem for synchronous code, but it reappears when working with workers or multiple processes. A more modern alternative is to stop making the class responsible for its own uniqueness at all: create one instance in the application's composition root and pass it in via the constructor (dependency injection); a DI container then plays the role of an explicit, testable \"scoped singleton\" instead of hidden global state.",
    "code": "class AppConfig {\n  private static instance: AppConfig | null = null;\n  private readonly settings = new Map<string, string>();\n\n  private constructor() {} // direct instantiation via new is forbidden\n\n  static getInstance(): AppConfig {\n    if (AppConfig.instance === null) {\n      AppConfig.instance = new AppConfig(); // lazy initialization\n    }\n    return AppConfig.instance;\n  }\n\n  set(key: string, value: string) { this.settings.set(key, value); }\n  get(key: string) { return this.settings.get(key); }\n}\n\nconst a = AppConfig.getInstance();\nconst b = AppConfig.getInstance();\nconsole.log(a === b); // true — a single instance for the entire program",
    "pros": [
      "Guarantees a single instance of the class",
      "A single point of access instead of scattered global variables",
      "Lazy initialization: the instance is created only on first access",
      "Saves resources compared to eager creation at application startup, when an expensive instance might never be needed at all"
    ],
    "cons": [
      "A hidden global dependency: use of the singleton is invisible in method signatures",
      "Makes unit testing harder — the instance is difficult to replace with a mock",
      "Violates the Single Responsibility Principle: the class is responsible both for its own logic and for controlling its own lifecycle",
      "Shared mutable state requires care in a concurrent environment"
    ],
    "tradeoffs": [
      "The convenience of global access versus hidden dependencies and growing coupling",
      "Guaranteed uniqueness versus testability: replacing the instance in tests is hard",
      "Lazy initialization saves resources, but in a multithreaded environment it requires extra synchronization (locking), which complicates the code and can become a bottleneck"
    ],
    "whenToUse": [
      "The system must have exactly one instance of an object, accessible from many places (configuration, a logger, a connection pool)",
      "You need controlled, lazy access to a shared resource",
      "Creating the instance is expensive and it isn't always needed — lazy initialization pays off compared to creating it eagerly at startup"
    ],
    "whenNotToUse": [
      "Uniqueness is not a genuine requirement — it is enough to create one instance and pass it in through the constructor (dependency injection)",
      "The code needs to be easily testable by substituting the dependency with mocks",
      "The application is multithreaded or multi-process, and a naive lazy Singleton without synchronization risks a race condition — eager initialization or a DI container with its own lifecycle management is safer"
    ]
  },
  "builder": {
    "tagline": "Step-by-step construction of a complex object, decoupled from its representation",
    "definition": "Separates the construction of a complex object from its representation, so that the same step-by-step construction process can create different representations. Instead of passing every parameter into a constructor at once, the client asks a separate builder object to perform configuration steps in whatever order is convenient, and only obtains the finished product by calling a final build() method. The construction process is often further encapsulated in a Director object, which knows the specific sequences of steps for common product configurations.",
    "problem": "A complex object's constructor grows out of control: many parameters, some of them optional, and \"telescoping\" constructor overloads start to appear — one with two arguments, another with five, a third with ten, differing only in which optional parts are supplied. Client code is forced to pass long argument lists, some of them placeholder nulls or undefined values, and to remember the exact order of every part of the object. Moreover, the same sequence of construction steps can't be reused to produce different representations of the product (say, an HTML and a PDF version of the same document) — each representation would need its own constructor or factory method.",
    "solution": "Move the construction process into a separate Builder object: it exposes methods for configuring the product's parts step by step, plus a build() method that returns the finished object. The client calls only the steps it needs, in whatever order is convenient; the same construction process can yield different representations, and the product can be made immutable — it comes into existence only as a whole, at the moment build() is called. For common configurations, a separate Director class can sit on top of the builder, knowing ready-made sequences of steps (e.g. buildMinimalRequest() or buildFullRequest()) so the client doesn't have to remember the call order itself; the builder remains reusable on its own for non-standard scenarios where the Director doesn't fit. Unlike Factory Method, which decides in a single call which product class to create, Builder solves a different problem — assembling the parts of one complex product step by step — and the two patterns are often combined: a factory can return the right builder.",
    "code": "interface HttpRequest {\n  readonly method: string;\n  readonly url: string;\n  readonly headers: Record<string, string>;\n  readonly body?: string;\n}\n\nclass HttpRequestBuilder {\n  private headers: Record<string, string> = {};\n  private body?: string;\n  constructor(private method: string, private url: string) {}\n  setHeader(name: string, value: string): this { this.headers[name] = value; return this; }\n  setBody(body: string): this { this.body = body; return this; }\n  build(): HttpRequest { // the product appears only as a whole, at the end of construction\n    return { method: this.method, url: this.url, headers: { ...this.headers }, body: this.body };\n  }\n}\n\nconst request = new HttpRequestBuilder('POST', '/api/users')\n  .setHeader('Content-Type', 'application/json')\n  .setBody(JSON.stringify({ name: 'Ann' }))\n  .build(); // the complex object is assembled step by step, without a telescoping constructor",
    "pros": [
      "Eliminates telescoping constructors with long parameter lists",
      "Step-by-step construction: optional parts are set only when needed",
      "A single construction process can create different representations of the product",
      "The product can be made immutable — it comes into existence as a whole at the moment build() is called"
    ],
    "cons": [
      "An extra builder class for every complex product",
      "More code for simple objects compared to a plain constructor",
      "Until build() is called, the builder is in an intermediate, potentially incomplete state"
    ],
    "tradeoffs": [
      "Readability and flexibility of construction versus an extra class and more code",
      "Control over the construction steps versus the risk of forgetting a required step before build()",
      "A fluent interface that returns this improves the readability of chained calls, but in strictly typed languages it complicates the types when builders are subclassed (the self-returning-type problem)"
    ],
    "whenToUse": [
      "The object has many parameters, a significant portion of which are optional",
      "The object needs to be assembled step by step rather than specified all at once in a constructor",
      "A single construction process must produce different representations of the product"
    ],
    "whenNotToUse": [
      "The object is simple with few parameters — a constructor or object literal is enough",
      "In TypeScript, an object literal with optional fields and default values is sufficient",
      "You only need to pick one of the ready-made product variants by type, without step-by-step configuration of its parts — Factory Method or Abstract Factory is enough"
    ]
  },
  "prototype": {
    "tagline": "New objects are created by copying a prototypical instance",
    "definition": "Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype rather than re-running initialization through a constructor. The copy can be shallow — where nested objects remain shared between the original and the copy — or deep, where the entire graph of nested objects is recursively cloned; choosing the copy depth is the pattern's key architectural decision. A set of pre-configured prototypes is often kept in a prototype registry, from which the client requests the needed sample by key.",
    "problem": "You need to produce copies of objects, but the client shouldn't depend on their concrete classes. Reconstructing an exact copy from the outside is impossible or expensive: some of the state is hidden in private fields, and initialization (database or network requests, heavy computation) is too costly to repeat for every instance. Unlike a Factory, which builds an object \"from scratch\" from a class description, here what's needed is precisely a ready-made sample with already-accumulated state — the problem itself presumes that somewhere in the system there's a suitable instance that's cheaper to copy than to recreate with the same configuration.",
    "solution": "Delegate the copying to the object itself: declare a common interface with a clone() method, and let each class create its own copy — it has access to its own private fields. The client works only with the interface and gets a copy without knowing the concrete class; pre-configured prototype instances serve as templates for mass-producing new objects. A set of named prototypes is conveniently kept in a registry (e.g. Map<string, Shape>), from which the client fetches the needed sample by key and clones it — this replaces a proliferation of factory methods for every product configuration. Unlike Factory Method, where a new object is built from scratch from a class, here a new object is obtained from already-existing state, which pays off when initialization (network requests, file reads, heavy computation) is more expensive than the copy itself.",
    "code": "interface Shape {\n  clone(): Shape; // the object knows how to create its own copy\n}\n\nclass Circle implements Shape {\n  constructor(public x: number, public y: number, public radius: number) {}\n  clone(): Circle {\n    return new Circle(this.x, this.y, this.radius);\n  }\n}\n\nclass Rectangle implements Shape {\n  constructor(public x: number, public y: number, public width: number, public height: number) {}\n  clone(): Rectangle {\n    return new Rectangle(this.x, this.y, this.width, this.height);\n  }\n}\n\n// the client copies the object without knowing its concrete class\nfunction duplicate(shape: Shape): Shape {\n  return shape.clone();\n}\n\nconst original = new Circle(10, 20, 5);\nconst copy = duplicate(original); // an independent copy with the same state",
    "pros": [
      "Copies objects without coupling the client to their concrete classes",
      "Saves expensive initialization: copying a pre-configured instance is cheaper than building one from scratch",
      "Pre-configured prototypes replace a proliferation of subclasses created just for different configurations",
      "Prototypes can be registered and swapped at runtime"
    ],
    "cons": [
      "Correctly cloning objects with circular references and a complex dependency graph is hard",
      "Every class is obligated to implement clone(), and getting the copy depth wrong (shallow vs. deep) leaves you with shared mutable state",
      "TypeScript/JavaScript has no built-in cloning support — clone() must be written and maintained by hand in every class, and it's easy to forget to update it when a new field is added"
    ],
    "tradeoffs": [
      "A shallow copy is faster, but the copies share their nested objects; a deep copy is independent, but more expensive and harder to implement",
      "Flexibility to configure objects at runtime vs. the obligation to maintain a correct clone() in every class",
      "Prototype cheaply copies already-existing state but requires maintaining clone() in every class; Factory Method builds the object from scratch from a class — no win on initialization cost, but no risk of accidentally shared state either"
    ],
    "whenToUse": [
      "Your code must not depend on the concrete classes of the objects it copies",
      "Creating an object from scratch is expensive, and copying a pre-configured instance yields the same result more cheaply",
      "You need many variants of an object that differ only in state — a registry of prototypes instead of a hierarchy of subclasses"
    ],
    "whenNotToUse": [
      "There are few objects and creating them is trivial — a direct new is enough",
      "The object's state holds complex external references (connections, handles) that can't be meaningfully copied",
      "Initializing the object is cheap and needs no external resources — a plain factory or direct new is simpler than writing and maintaining clone()"
    ]
  },
  "adapter": {
    "tagline": "A translator between incompatible interfaces",
    "definition": "Converts the interface of one class into another interface that the client expects, letting classes with incompatible interfaces work together when they otherwise couldn't interact directly. GoF distinguishes two variants: an object adapter wraps the adaptee through composition and therefore works equally well with any of its subclasses, while a class adapter inherits simultaneously from the target interface and from the adaptee, gaining access to its protected members at the cost of being locked to one concrete class instead of its whole hierarchy.",
    "problem": "There is a useful ready-made class — a third-party library, legacy code, or a module owned by another team — but its interface doesn't match what the client code expects: different method names, a different argument order, a different data format. Modifying someone else's, or an already widely used, code is impossible or too risky, and rewriting the client around that specific foreign interface would lock it permanently to that implementation, losing the ability to swap the library later without pain. The pattern arises as a retrofit: the integration is designed only after both interfaces already exist independently of each other.",
    "solution": "Introduce an adapter object that implements the target interface the client expects and holds a reference to the object being adapted — the adaptee — this is the object adapter, built on composition. The adapter translates each call on the target interface into one or more calls on the adaptee, converting method names, argument order, and data formats along the way. The client works only against the target interface and knows nothing about the adapted class, which lets either one be replaced independently. When access to the adaptee's protected members is needed, or the language supports multiple inheritance, a class adapter applies instead: it inherits simultaneously from the target interface and from the adaptee, but is tied to one concrete class rather than its subclasses. When both sides need to call each other through incompatible interfaces, a two-way adapter is built that implements both target interfaces at once.",
    "code": "// Target interface that the client code expects\ninterface Logger { log(message: string): void; }\n\n// Existing class with an incompatible interface (adaptee); we can't change it\nclass LegacyTelemetry {\n  send(payload: { level: string; text: string }): void {\n    console.log(`[${payload.level}] ${payload.text}`);\n  }\n}\n\n// Adapter implements the target interface and translates calls to the adaptee\nclass TelemetryLoggerAdapter implements Logger {\n  constructor(private telemetry: LegacyTelemetry) {}\n  log(message: string): void {\n    this.telemetry.send({ level: 'info', text: message }); // translate the call and the data\n  }\n}\n\nfunction runApp(logger: Logger) { logger.log('application started'); }\nrunApp(new TelemetryLoggerAdapter(new LegacyTelemetry()));",
    "pros": [
      "Lets you reuse an existing class without changing either it or the client code",
      "Decouples the client from a specific third-party implementation: when you switch libraries, only the adapter changes",
      "The interface- and data-conversion logic is gathered in one place (in line with the Single Responsibility Principle)",
      "The same idea underlies the Anti-Corruption Layer: the adapter shields the system's core from an external system's data model"
    ],
    "cons": [
      "The extra layer of objects and indirection adds complexity",
      "When the interfaces differ greatly, the adapter bloats with conversion logic",
      "Can mask poor design: chains of adapters instead of bringing the code to a single unified interface",
      "Easy to confuse with Facade: Adapter reshapes the interface of an existing class to match what the client expects, whereas Facade doesn't change anyone's interface at all — it merely simplifies access to an entire subsystem of many classes"
    ],
    "tradeoffs": [
      "Compatibility without touching existing code versus an extra layer of indirection",
      "Fast, as-is integration versus the cost of maintaining the conversions as both interfaces evolve",
      "The object adapter (composition) is more flexible than the class adapter (inheritance), which is more tightly bound to one adaptee class but grants direct access to its protected members"
    ],
    "whenToUse": [
      "You need to use a ready-made class, but its interface doesn't match what the system expects",
      "Integrating a third-party library or legacy code that can't be modified",
      "You need to isolate the system from a specific external API so that it can be swapped out"
    ],
    "whenNotToUse": [
      "The interfaces are already compatible — a wrapper would just be an unnecessary extra layer",
      "Both classes are yours and can be brought to a common interface directly"
    ]
  },
  "bridge": {
    "tagline": "Two independent hierarchies: abstraction and implementation evolve separately",
    "definition": "Decouples an abstraction from its implementation so that the two can vary independently of each other without being tied together by inheritance. Instead of growing a single class into subclasses for every combination of behavior and platform, the abstraction holds a reference to an implementation object and delegates the primitive operations to it while implementing the high-level logic itself. Unlike Adapter, which is most often bolted on after the fact to connect already-existing incompatible interfaces, Bridge is designed up front, before the code even exists: the two dimensions of variability are built into the architecture from the start.",
    "problem": "A class varies along two independent dimensions at once — for example, shapes × rendering methods, remotes × devices, or database drivers × SQL dialects. Inheritance ties both dimensions into a single hierarchy: every combination needs its own subclass, the number of classes grows as the Cartesian product of the dimensions' sizes, and adding just one new variant in either dimension forces edits across every existing branch of the hierarchy. Over time the hierarchy becomes so dense that nobody dares touch it.",
    "solution": "Split the two dimensions into two independent hierarchies: the Abstraction — the high-level operations visible to the client — and the Implementor — the primitive operations of a concrete platform or technology. The abstraction doesn't inherit the implementation; it receives it through composition (typically via a constructor or setter) and delegates the primitives to it while layering its own logic on top. The Implementor describes only the platform's basic interface and is deliberately allowed to not map one-to-one onto Abstraction's methods — the bridge itself decides how to translate one high-level call into one or several low-level ones. Each hierarchy is extended by its own subclasses independently of the other, and a specific combination of abstraction and implementation is assembled at run time — when the object is created, or even later, by swapping the implementation on the fly.",
    "code": "interface Renderer { renderCircle(radius: number): string; } // implementation hierarchy\nclass SvgRenderer implements Renderer {\n  renderCircle(r: number) { return `<circle r=\"${r}\" />`; }\n}\nclass CanvasRenderer implements Renderer {\n  renderCircle(r: number) { return `arc(0, 0, ${r})`; }\n}\n\n// abstraction hierarchy: holds the implementation via composition — this is the «bridge»\nabstract class Shape {\n  constructor(protected renderer: Renderer) {}\n  abstract draw(): string;\n}\nclass Circle extends Shape {\n  constructor(renderer: Renderer, private radius: number) { super(renderer); }\n  draw() { return this.renderer.renderCircle(this.radius); }\n}\nclass OutlinedCircle extends Circle {\n  draw() { return `outline: ${super.draw()}`; } // the abstraction grows independently\n}\n\nconst shape = new OutlinedCircle(new CanvasRenderer(), 10); // combination at run time",
    "pros": [
      "The abstraction and implementation hierarchies can be extended independently (in line with the Open/Closed Principle)",
      "Instead of a Cartesian product of subclasses, you get the sum of the classes in the two hierarchies",
      "The implementation can be swapped at run time, and the client sees only the abstraction",
      "Platform details are hidden from the high-level code"
    ],
    "cons": [
      "Adds complexity when there is only a single dimension of variation",
      "Requires identifying the right two dimensions up front — getting the split wrong is expensive to fix",
      "Extra indirection: every call goes through a delegation step"
    ],
    "tradeoffs": [
      "Independent evolution of the two hierarchies versus the extra indirection and up-front design it demands",
      "Run-time flexibility in combining variants versus a more complex initial structure compared with straightforward inheritance",
      "The up-front investment in designing two hierarchies instead of one pays off only if both dimensions are actually going to grow; for a stable abstraction/implementation pair it is pure overhead"
    ],
    "whenToUse": [
      "A class varies along two independent dimensions and inheritance breeds a combinatorial explosion of subclasses",
      "You need to select or switch the implementation at run time",
      "A single abstraction must work on top of several platforms/engines (renderers, drivers, APIs)"
    ],
    "whenNotToUse": [
      "There is only one implementation and no second dimension of variation is anticipated",
      "The hierarchy is simple — a bridge would add indirection with no benefit"
    ]
  },
  "composite": {
    "tagline": "Part-whole tree: leaf and container behind a single interface",
    "definition": "Composes objects into tree structures to represent part-whole hierarchies and lets clients treat individual objects (leaves) and their composite groups uniformly, without distinguishing between them at the call site. Unlike Decorator, which wraps a single object in a single other object and layers behavior linearly, Composite builds an actual tree out of an arbitrary number of children and aggregates the result of an operation recursively, bubbling up from the leaves to the root.",
    "problem": "The client works with a recursive structure — a UI tree, a file system, an org chart, document markup — that contains both simple elements and containers composed of those same elements. Without a common interface, the client code is littered with \"is this a leaf or a container?\" checks and separate branches for each case, and every new operation (rendering, size calculation, serialization) has to duplicate that type dispatch again at every level of the tree.",
    "solution": "Declare a common Component interface whose operations are meaningful for both a leaf and a container. A Leaf carries out the operation itself and has no children. A Composite holds a list of child components and delegates the operation to each of them, recursively aggregating the results — so computing a folder's size reduces to summing the sizes of its contents at every level of nesting. The client invokes the operation through the Component interface and never distinguishes whether it is dealing with a single leaf or an entire subtree. A separate question is where to place the composition-management methods (add/remove/getChild): in the common Component interface (transparency — the client works uniformly everywhere, but a leaf ends up with methods that are meaningless for it) or only in Composite (type safety — but the client must cast and distinguish classes before it can add a child).",
    "code": "interface FileSystemNode { size(): number; }\n\nclass FileLeaf implements FileSystemNode {\n  constructor(private bytes: number) {}\n  size() { return this.bytes; }\n}\n\nclass Folder implements FileSystemNode {\n  private children: FileSystemNode[] = [];\n  add(node: FileSystemNode) { this.children.push(node); return this; }\n  // recursive aggregation: the folder delegates the operation to its children\n  size() { return this.children.reduce((sum, c) => sum + c.size(), 0); }\n}\n\nconst root = new Folder()\n  .add(new FileLeaf(100))\n  .add(new Folder().add(new FileLeaf(200)).add(new FileLeaf(50)));\n\nconsole.log(root.size()); // 350 — the client does not distinguish a file from a folder",
    "pros": [
      "The client treats a leaf and an entire subtree uniformly, with no branching on type",
      "Recursive part-whole structures are expressed naturally",
      "New kinds of components can be added without touching client code (honors the Open/Closed Principle)",
      "Simplifies adding new kinds of tree nodes: they only need to implement Component, and the rest of the tree's code never has to distinguish them"
    ],
    "cons": [
      "The common interface ends up too broad: it's hard to constrain at the type level which children a particular container may hold",
      "The add/remove placement dilemma: in the common interface they are meaningless for a leaf, but keeping them only in Composite sacrifices uniformity",
      "Deep recursion over a large tree can hurt performance and, in languages without tail-call optimization, blow the call stack"
    ],
    "tradeoffs": [
      "Transparency vs. safety (the classic GoF trade-off): putting add/remove in the common interface gives uniformity but permits meaningless calls on a leaf; keeping add/remove only in Composite is safer but forces the client to distinguish types",
      "Natural part-whole modeling vs. runtime cost: the tree expresses hierarchy cleanly, but deep nesting adds indirection and recursion overhead, and whole-tree operations become O(n)",
      "Easy to add new leaf/composite types (open to extension), but adding a new operation touches every node type in the hierarchy — the inverse trade-off of Visitor"
    ],
    "whenToUse": [
      "The domain model is a part-whole hierarchy: a UI component tree, a file system, an org chart, nested menus",
      "The client must perform operations on simple and composite objects in the same way",
      "An operation (traversal, rendering, aggregation) needs to be applied recursively across the whole tree without knowing its depth or shape in advance"
    ],
    "whenNotToUse": [
      "The structure is flat and no nesting is anticipated — a common interface with recursion is overkill",
      "The elements differ too much, so a single operation interface would feel artificial"
    ]
  },
  "decorator": {
    "tagline": "Dynamically layering responsibilities through wrappers that share the same interface",
    "definition": "Dynamically adds new responsibilities to an object by wrapping it in another object with the same interface — without modifying the wrapped class's code and without spawning a new subclass for every combination of behavior. Decorator is a flexible alternative to inheritance for extending functionality: where a subclass fixes the set of added responsibilities once and for all at compile time, a decorator lets that set be assembled and changed at run time, wrapping the object one layer at a time.",
    "problem": "An object needs behavior added — logging, compression, encryption, caching — in various combinations, some of which aren't known in advance. Inheritance extends a class statically, at compile time: every combination of responsibilities needs its own subclass, and with three independent responsibilities the hierarchy is poised to balloon to eight classes. On top of that, inherited behavior can't be removed or reordered on an already-created object — it's baked into its type.",
    "solution": "A decorator implements the same interface as the wrapped component and holds a reference to it (typically via an abstract base decorator class that, by default, simply delegates the call further along). Each concrete decorator overrides the method it cares about, adding its own behavior before or after delegating deeper into the chain. Wrappers stack on top of one another in any order at run time — the wrapping order matters and affects the result, since each layer only sees what the previous one returned. To the client, the result is indistinguishable from the original component: it calls the same interface and has no need to know how many wrapper layers are hidden inside. This is the key distinction from Proxy: Proxy also preserves the object's interface, but its purpose is to control access to it (creating it lazily, checking permissions, caching), not to add new responsibilities the way Decorator does.",
    "code": "interface DataSource { read(): string; }\n\nclass FileSource implements DataSource {\n  read() { return 'data'; }\n}\n\n// base decorator: same interface + reference to the wrapped object\nabstract class SourceDecorator implements DataSource {\n  constructor(protected wrappee: DataSource) {}\n  read() { return this.wrappee.read(); }\n}\n\nclass DecryptionDecorator extends SourceDecorator {\n  read() { return `decrypt(${super.read()})`; } // added responsibility\n}\n\nclass UnzipDecorator extends SourceDecorator {\n  read() { return `unzip(${super.read()})`; }\n}\n\n// responsibilities are layered at runtime, one layer at a time\nconst source: DataSource = new UnzipDecorator(new DecryptionDecorator(new FileSource()));\nconsole.log(source.read()); // unzip(decrypt(data))",
    "pros": [
      "Responsibilities are added and combined at runtime rather than at compile time",
      "Combinations of behaviors are assembled from wrappers — without a combinatorial explosion of subclasses",
      "Each responsibility lives in its own class (honors the single-responsibility principle)",
      "Transparent to the client: the interface matches that of the wrapped object"
    ],
    "cons": [
      "A stack of many small wrappers is hard to read and debug",
      "A decorated object is not identical to the original — identity checks break",
      "Removing a specific wrapper from the middle of the chain is difficult"
    ],
    "tradeoffs": [
      "Flexibility of composing behavior versus traceability: a long chain of wrappers makes a call harder to trace",
      "Independence of wrappers versus a hidden dependence on wrapping order (unzip(decrypt(x)) ≠ decrypt(unzip(x)))",
      "Interface transparency versus purpose opacity: from the outside a decorated object looks like the original, but understanding its actual behavior requires unwinding the entire chain of wrappers"
    ],
    "whenToUse": [
      "You need to add responsibilities to individual objects dynamically and transparently to the client",
      "Extending through inheritance is impractical: there are many behavior combinations, and a subclass would be needed for each one",
      "Responsibilities need to be removed or swapped around at runtime"
    ],
    "whenNotToUse": [
      "There is a single, stable behavior — an ordinary class or simple inheritance is enough",
      "Object identity matters to the client: a wrapper is not equal to the original"
    ]
  },
  "facade": {
    "tagline": "A single, simple interface to a complex subsystem",
    "definition": "Provides a unified interface to a set of interfaces in a subsystem, defining a higher-level interface that makes common usage of the subsystem easier. Facade does not forbid clients from reaching the subsystem classes directly — it simply removes the need to know all of them and the right call order for standard scenarios. Unlike Adapter, which reshapes the interface of an existing class to match what a client expects, Facade doesn't adapt anyone's interface — it introduces a new, simpler interface layered on top of subsystem classes that are already mutually consistent.",
    "problem": "For a routine task, the client has to know a dozen of the subsystem's internal classes, their initialization and call order, and the rules for coordinating them — even though the subsystem itself was designed for flexibility rather than for the convenience of one specific use case. The client code ends up tightly coupled to the subsystem's internals: any restructuring of it, any swap of a library used inside it, or any change to the step order breaks every client that has duplicated that call sequence on its own.",
    "solution": "Introduce a facade class with a few high-level methods covering the subsystem's common usage scenarios. The facade itself knows which subsystem objects to delegate to and in what order, hiding that sequence from the client behind a single call. The client normally talks only to the facade, but for fine-grained control it can still reach the subsystem classes directly, bypassing the facade — Facade doesn't lock that door, it just offers a more convenient one. Facade differs from Mediator in the direction of interaction: a facade is a one-way simplification of access from the outside into the subsystem, whereas a mediator coordinates the subsystem's own objects with one another, knowing about them and managing their communication among themselves. Systems are often split into layers, and each layer's facade becomes the single entry point into it for the layer above, reducing coupling between layers.",
    "code": "class Inventory { reserve(sku: string) { return `reserved:${sku}`; } }\nclass Payment { charge(amount: number) { return `charged:${amount}`; } }\nclass Shipping { schedule(sku: string) { return `shipped:${sku}`; } }\n\n// Facade: a single high-level entry point into the order subsystem\nclass OrderFacade {\n  private inventory = new Inventory();\n  private payment = new Payment();\n  private shipping = new Shipping();\n\n  placeOrder(sku: string, amount: number): string[] {\n    // the client knows neither the internal classes nor the call order\n    return [\n      this.inventory.reserve(sku),\n      this.payment.charge(amount),\n      this.shipping.schedule(sku),\n    ];\n  }\n}\n\nconst shop = new OrderFacade();\nshop.placeOrder('book-42', 100); // one simple operation instead of three calls",
    "pros": [
      "Isolates clients from the subsystem's complexity and internal classes",
      "Lowers coupling between the client code and the subsystem: you can restructure it without touching clients",
      "Gives a convenient entry point for common scenarios and helps organize the system into layers",
      "Can serve as a layer's entry point while leaving access to individual subsystem classes open to those who need fine-grained control"
    ],
    "cons": [
      "Risks growing into a god object that knows about the entire application",
      "Covers only common scenarios: for fine-grained control, clients are forced to bypass the facade",
      "Clients that get used to relying only on the facade risk not noticing that part of the subsystem's capability isn't exposed through it at all"
    ],
    "tradeoffs": [
      "Simplicity for common scenarios versus the loss of fine-grained control over the subsystem",
      "A single entry point versus the risk of concentrating knowledge and logic in one class",
      "A single entry point for common scenarios versus the risk that the facade becomes the one place that duplicates the real dependencies between layers"
    ],
    "whenToUse": [
      "You need a simple interface to a complex subsystem for common tasks",
      "You want to reduce coupling between clients and the subsystem's internal classes",
      "You are organizing the system into layers and need an entry point into each layer"
    ],
    "whenNotToUse": [
      "The subsystem is simple and a wrapper simplifies nothing",
      "Clients constantly need direct, fine-grained access to the internal classes — the facade would only duplicate their API"
    ]
  },
  "flyweight": {
    "tagline": "Shared intrinsic state instead of thousands of duplicated objects",
    "definition": "Uses sharing to support large numbers of fine-grained objects efficiently. An object's state is split into intrinsic state — immutable and shared across many objects — and extrinsic state, which depends on context; shared flyweight objects store only the intrinsic state, while the extrinsic state is passed in from outside on each call.",
    "problem": "An application creates a huge number of small, similar objects (text characters, trees on a game map, particles, table cells) that share most of their data — with a million trees, only the coordinates differ, while the species name, texture, and color are identical across thousands of instances. Storing duplicate copies of that shared data in every instance bloats memory usage and garbage-collector pressure to the point where the system becomes unusable, even though, in essence, only a handful of unique combinations need to be kept in memory at all.",
    "solution": "Extract the immutable, shareable part (the intrinsic state) into a separate flyweight class. A factory caches flyweights by a key assembled from the intrinsic-state values and, on a repeat request with the same key, returns the existing instance instead of creating a new one — so thousands of logical objects collapse into a handful of physical ones. The contextual part (extrinsic state: coordinates, current parameters, a reference to the owner) is not stored in the flyweight — the client, or a separate lightweight context object, passes it as method arguments on every call. A flyweight must be immutable; otherwise, editing one \"object\" would silently change the behavior of thousands of others that are, in fact, the very same instance in memory — the same property is what makes shared flyweight objects safe for concurrent access without locks.",
    "code": "// Flyweight: intrinsic state shared across thousands of trees\nclass TreeType {\n  constructor(\n    readonly name: string,\n    readonly color: string,\n    readonly texture: string,\n  ) {}\n  draw(x: number, y: number): string { // extrinsic state comes from outside\n    return `${this.name}/${this.color} at (${x}, ${y})`;\n  }\n}\n\nclass TreeTypeFactory {\n  private static cache = new Map<string, TreeType>();\n  static get(name: string, color: string, texture: string): TreeType {\n    const key = `${name}:${color}:${texture}`;\n    let type = this.cache.get(key);\n    if (!type) {\n      type = new TreeType(name, color, texture);\n      this.cache.set(key, type); // reuse instead of creating a duplicate\n    }\n    return type;\n  }\n}\n\n// Lightweight context: holds only the extrinsic part plus a reference to the flyweight\nclass Tree {\n  constructor(private x: number, private y: number, private type: TreeType) {}\n  draw() { return this.type.draw(this.x, this.y); }\n}",
    "pros": [
      "Dramatically reduces memory usage when there are large numbers of similar objects",
      "Fewer objects created means less pressure on the garbage collector",
      "Shared state is concentrated in one place and is easy to control",
      "The flyweight's immutability makes the shared objects naturally thread-safe without extra synchronization"
    ],
    "cons": [
      "Adds complexity: state must be explicitly split into intrinsic and extrinsic parts",
      "The client must store or compute the extrinsic state and pass it on every call",
      "A flyweight must be immutable — changing a shared object affects every user of it"
    ],
    "tradeoffs": [
      "Memory savings versus the CPU cost of computing and passing the extrinsic state",
      "The simple \"one object owns all its data\" model versus splitting state into two parts",
      "Justified only under genuinely massive duplication — at small scale it adds only complexity"
    ],
    "whenToUse": [
      "The application creates a huge number of small objects and memory becomes the bottleneck",
      "Most of the objects' state is duplicated and can be extracted into a shared, immutable part",
      "The contextual part of the state can be passed in from outside instead of stored in every object"
    ],
    "whenNotToUse": [
      "There are only a few objects — the savings won't justify the added complexity",
      "The objects' state is mostly unique or mutable: there is nothing to share"
    ]
  },
  "proxy": {
    "tagline": "A surrogate controls access to the real object while preserving its interface",
    "definition": "Provides a surrogate, or placeholder, for another object to control access to it. A proxy implements the same interface as the real object (the Subject), so the substitution is transparent to the client: the client calls the proxy's methods exactly as it would call the real object's, and may not even suspect the real object exists. GoF distinguishes several variants: a virtual proxy defers creation of a heavy object, a protection proxy checks permissions before delegating, a remote proxy represents an object that lives in another process or address space, and a smart-reference proxy adds access accounting or reference counting around every call.",
    "problem": "A client needs an object that shouldn't or can't be accessed directly, or is expensive to access: it is costly to create (a large file, a network connection, heavy initialization), it lives in a different address space or on a different machine, or it requires a permission check before every access or accounting/caching of accesses. Baking that logic into the object itself would violate its single responsibility, and duplicating it in every client would scatter the same cross-cutting concern across the whole codebase, risking that a new call site simply forgets about it.",
    "solution": "Introduce a proxy class with the same interface as the real object (the Subject). The client works with the proxy without realizing it; the proxy holds a reference to the real object (or a way to obtain one) and manages its lifecycle — for example, creating it lazily on first real access (virtual proxy), checking access rights before delegating (protection proxy), or forwarding the call over the network to an object living in another process (remote proxy). Before and after delegating, the proxy can run its own logic — logging the access, keeping a counter, caching the result — while remaining indistinguishable from the real object to the calling code. Proxy differs from Adapter in that the interface isn't changed but preserved exactly; it differs from Decorator in that the goal isn't to add new responsibilities to the object but to manage access to the ones it already has.",
    "code": "interface Image { display(): string; }\n\nclass RealImage implements Image {\n  constructor(private filename: string) {\n    console.log(`Loading ${filename} from disk...`); // heavy operation\n  }\n  display() { return `Displaying ${this.filename}`; }\n}\n\n// Virtual Proxy: same interface, controls access to the heavy object\nclass ImageProxy implements Image {\n  private real: RealImage | null = null;\n  constructor(private filename: string) {}\n  display() {\n    this.real ??= new RealImage(this.filename); // create only on first access\n    return this.real.display();\n  }\n}\n\nconst image: Image = new ImageProxy('photo.png'); // nothing has been loaded yet\nimage.display(); // the real object is created here — transparent to the client",
    "pros": [
      "Controls access to the object without changing its code or the clients' code",
      "Lazy creation of heavy objects saves resources (Virtual Proxy)",
      "Cross-cutting concerns — permission checks, caching, access accounting — are moved out of the real object",
      "The substitution is transparent: the client works through the shared Subject interface"
    ],
    "cons": [
      "An extra layer of indirection slows things down and makes debugging harder",
      "The response may come back with a delay (lazy creation, calls to a remote object)",
      "One more class to keep in sync with the Subject interface"
    ],
    "tradeoffs": [
      "Transparent access control versus extra indirection on every call",
      "Resource savings from lazy initialization versus an unpredictable moment for the first delay",
      "Sharing the real object's interface makes the substitution transparent, but for that very reason Proxy is easy to confuse with Decorator by looking at the code alone — telling them apart requires judging intent, not structure"
    ],
    "whenToUse": [
      "A heavy object is best created lazily, on the first real access (Virtual Proxy)",
      "You need to control access rights to the object (Protection Proxy)",
      "The object lives in another process or on another machine, and the client needs a local representative (Remote Proxy)",
      "Call results can be cached without touching the object itself (Caching Proxy)"
    ],
    "whenNotToUse": [
      "Access to the object doesn't need to be controlled — a direct call is simpler and faster",
      "The goal is to add new responsibilities to the object rather than manage access: that's a job for Decorator"
    ]
  },
  "chain-of-responsibility": {
    "tagline": "A request travels along a chain of handlers until one of them handles it",
    "definition": "Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along the chain until an object handles it. The sender knows only the head of the chain and need not know which handler — if any — will ultimately respond; the chain's membership and order can be composed and rearranged independently of the code that issues the request.",
    "problem": "Several objects may be able to handle a request, but which one should is not known in advance, and the set of handlers and their order can change. Hard-wiring the sender to a specific receiver — or a cascade of conditionals deciding \"who is responsible for this case\" — makes the code rigid and hard to extend. A typical example is a middleware pipeline in a web framework: a request must pass through authentication, validation, and logging, but it isn't clear in advance how many steps a given route needs or in what order. Decorator doesn't fit here: a decorator always forwards control and layers its own behavior around the call, whereas this problem needs exactly one participant to claim the request and stop it from propagating further.",
    "solution": "Each handler implements a common interface and holds a reference to the next link. On receiving a request, a handler first decides whether the request falls within its competence: if so, it produces a response and processing stops; if not, it passes the request further down the chain (typically by calling handle() on next, or via super.handle() in a base class). The client sends the request to the first link and does not know who will ultimately respond; the composition and order of the chain are assembled dynamically, for example through setNext(). This structure is a direct analogue of middleware: each layer either intercepts the request and terminates the pipeline, or transparently passes it on unchanged. If no link responds, the request reaches the end of the chain unhandled — that outcome should be planned for explicitly (say, with a default handler at the tail), not assumed away as impossible.",
    "code": "interface Handler { setNext(h: Handler): Handler; handle(request: string): string | null; }\n\nabstract class SupportHandler implements Handler {\n  private next: Handler | null = null;\n  setNext(h: Handler) { this.next = h; return h; }\n  handle(request: string): string | null {\n    return this.next ? this.next.handle(request) : null; // not my case — pass it on\n  }\n}\n\nclass BotSupport extends SupportHandler {\n  handle(r: string) { return r === 'faq' ? 'Bot: answer from the FAQ' : super.handle(r); }\n}\nclass OperatorSupport extends SupportHandler {\n  handle(r: string) { return r === 'billing' ? 'Operator: billing question resolved' : super.handle(r); }\n}\nclass EngineerSupport extends SupportHandler {\n  handle(r: string) { return `Engineer: I'll handle \"${r}\" manually`; }\n}\n\nconst chain = new BotSupport();\nchain.setNext(new OperatorSupport()).setNext(new EngineerSupport());\nchain.handle('billing'); // bot passed it on — handled by the operator",
    "pros": [
      "The sender is decoupled from the concrete receiver of the request",
      "Handlers can be added or reordered without changing the client (satisfies the Open/Closed Principle)",
      "Each handler is responsible for only its own case (in the spirit of the Single Responsibility Principle)",
      "Each link can be tested in isolation, since it knows nothing about its neighbors' internals"
    ],
    "cons": [
      "A request may traverse the entire chain and go unhandled",
      "The path of a request is not obvious, making it harder to debug and trace",
      "A long chain adds the overhead of a sequential traversal"
    ],
    "tradeoffs": [
      "Flexibility in the composition and order of handlers versus no guarantee that the request will be handled at all",
      "Decoupling the sender from the receiver versus transparency of the control flow",
      "Unlike Decorator, where every layer always forwards control and adds its own behavior, here exactly one link can claim the request and halt the chain — a different allocation of responsibility for terminating processing"
    ],
    "whenToUse": [
      "More than one object can handle a request, and the specific handler is not known in advance",
      "The set or order of handlers needs to be configured dynamically",
      "Processing pipelines: access checks, validation, logging (middleware)"
    ],
    "whenNotToUse": [
      "There is exactly one receiver and it is known in advance — a direct call is enough",
      "Handling must be guaranteed to occur, and an \"empty\" pass through the chain is unacceptable"
    ]
  },
  "command": {
    "tagline": "A request as an object: queuing, logging, and undoable operations",
    "definition": "Encapsulates a request as an object, letting you parameterize clients with different requests, queue or log requests, and support undoable operations. Command separates what needs to be done from who performs it and when: the invoker holds and triggers command objects, while the receiver — to which the actual work is ultimately delegated — isn't even aware that a command exists.",
    "problem": "The initiator of an action (a button, a menu item, a scheduler) shouldn't need to know who performs the operation or how. Calling a receiver's method directly couples the two tightly and makes it impossible to defer execution, queue requests, keep an operation log, or undo actions that have already run. If an operation needs to be logged for auditing, retried after a failure, or composed into a larger scenario (a macro), a plain method call isn't suited for that — the call itself vanishes the instant it executes and leaves behind no object you could keep working with.",
    "solution": "The request is packaged as a separate command object with a single execute() method. The command holds a reference to the receiver along with the call parameters, while the invoker works only against the Command interface: it executes commands, accumulates a history, and calls undo() to reverse them. This decouples invoking an operation from performing it. That separation opens the door to composite commands (macro-commands) that themselves implement the Command interface and run their nested commands in sequence, as well as to deferred commands that are placed on a queue and processed later by a worker. A command is usually designed to be immutable: all of the call's parameters are fixed in the constructor, and execute() and undo() simply operate on that already-prepared data rather than accepting new arguments from outside.",
    "code": "interface Command { execute(): void; undo(): void; }\n\nclass Light {\n  on() { console.log('Light on'); }\n  off() { console.log('Light off'); }\n}\n\nclass LightOnCommand implements Command {\n  constructor(private light: Light) {} // command holds the receiver and call parameters\n  execute() { this.light.on(); }\n  undo() { this.light.off(); }\n}\n\nclass RemoteControl {\n  private history: Command[] = [];\n  press(cmd: Command) { cmd.execute(); this.history.push(cmd); } // the request is an object\n  undoLast() { this.history.pop()?.undo(); }\n}\n\nconst remote = new RemoteControl();\nremote.press(new LightOnCommand(new Light())); // invoker doesn't know the receiver\nremote.undoLast();",
    "pros": [
      "Decouples the object that invokes a request from the one that performs it",
      "Commands can be queued, logged, and executed at a later time",
      "Supports undo/redo through a history of executed commands",
      "Composite commands (macros) can be assembled from simpler ones"
    ],
    "cons": [
      "A separate class for every operation inflates the amount of code",
      "An extra layer of indirection between the call and the action",
      "Undo often requires storing enough data to perform the inverse operation, which complicates commands with irreversible side effects (sending an email, charging a payment)"
    ],
    "tradeoffs": [
      "Flexible control over requests (queuing, history, undo) versus a growing number of classes",
      "A uniform interface across all operations versus scattering simple logic across wrapper objects",
      "Unlike Strategy, where the client picks one of several interchangeable algorithms for the same task, Command wraps disparate requests as standalone objects for the sake of queuing, history, and undo — the emphasis is on the action and its lifecycle, not on choosing an algorithm"
    ],
    "whenToUse": [
      "You need to parameterize objects with an action to perform: buttons, menu items, keyboard shortcuts",
      "You need a request queue, deferred execution, or an operation log",
      "You need to undo and redo operations (undo/redo)"
    ],
    "whenNotToUse": [
      "The operation is invoked immediately and directly, with no queuing, history, or undo — the wrapper object doesn't pay for itself",
      "The actions are interchangeable ways of solving the same task — that's a matter of choosing an algorithm (Strategy), not of encapsulating a single request"
    ]
  },
  "interpreter": {
    "tagline": "A mini-language's grammar as a tree of classes that can evaluate its own sentences",
    "definition": "Given a language, defines a representation for its grammar along with an interpreter that uses that representation to interpret sentences in the language. Each grammar rule corresponds to its own class, and a sentence in the language is represented as a tree of such objects whose evaluation reduces to a recursive traversal. In practice the pattern is applied rarely, and only for genuinely small, stable grammars — for anything more serious, reaching for a parser generator or an off-the-shelf rules engine is almost always the better call.",
    "problem": "A system keeps running into the same kind of task, one that is naturally expressed as sentences in a simple language (access rules, filters, formulas, search conditions). Baking the parsing and evaluation of such expressions into a single monolithic parser full of conditionals is painful: every new grammar rule forces edits to shared code, and the expressions themselves can't be built and combined dynamically.",
    "solution": "Map each grammar rule to a class that implements a common interface with an interpret(context) method. Terminal expressions (numbers, variables) evaluate themselves; nonterminal expressions (addition, AND/OR) hold subexpressions and recursively delegate interpretation to them. A sentence in the language is represented as a tree of such objects (an abstract syntax tree), and evaluating it is a recursive traversal that threads a context through the nodes. The tree itself is usually built by a separate step — parsing the source string into objects; that parsing step is outside the pattern's scope, which only takes an already-built tree and interprets it.",
    "code": "interface Expression { interpret(ctx: Map<string, number>): number; }\n\n// terminal expressions evaluate themselves\nclass NumberLiteral implements Expression {\n  constructor(private value: number) {}\n  interpret() { return this.value; }\n}\nclass Variable implements Expression {\n  constructor(private name: string) {}\n  interpret(ctx: Map<string, number>) { return ctx.get(this.name) ?? 0; }\n}\n\n// a nonterminal expression recursively interprets its subexpressions\nclass Add implements Expression {\n  constructor(private left: Expression, private right: Expression) {}\n  interpret(ctx: Map<string, number>) {\n    return this.left.interpret(ctx) + this.right.interpret(ctx);\n  }\n}\n\n// the sentence \"x + (y + 10)\" as a grammar tree\nconst expr = new Add(new Variable('x'), new Add(new Variable('y'), new NumberLiteral(10)));\nexpr.interpret(new Map([['x', 5], ['y', 7]])); // 22",
    "pros": [
      "The grammar is easy to change and extend: a new rule means a new class, and the existing ones are left untouched",
      "Each rule is localized in its own class, so a simple grammar is straightforward to implement",
      "Expressions are built and combined dynamically at runtime from ready-made nodes",
      "Lets you represent complex conditions and rules declaratively, as data (a tree of objects), rather than as imperative code"
    ],
    "cons": [
      "A complex grammar breeds an explosion of classes and becomes hard to maintain",
      "Recursively interpreting a tree of objects is slower than compilation or table-driven parsing",
      "The pattern covers only interpretation: building the tree (parsing the string) is left out of scope"
    ],
    "tradeoffs": [
      "Extending the grammar through classes vs. the explosion of classes on complex languages",
      "The flexibility of dynamically assembled expressions vs. the performance of direct code",
      "A homegrown mini-language vs. off-the-shelf parser generators and embeddable rules engines"
    ],
    "whenToUse": [
      "Recurring tasks are expressed as sentences in a simple language (rules, filters, formulas)",
      "The grammar is simple and relatively stable in its number of rules",
      "Interpretation efficiency isn't critical for the use case"
    ],
    "whenNotToUse": [
      "The grammar is complex — maintaining a class per rule costs more than reaching for a parser generator",
      "The expression is evaluated once and never reused — a plain function is enough",
      "Speed is critical — interpreting a tree of objects loses to compilation"
    ]
  },
  "iterator": {
    "tagline": "Traverse a collection sequentially without exposing its internal structure",
    "definition": "Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation. A distinction is drawn between an external iterator, which the client drives explicitly by calling hasNext()/next() at its own pace, and an internal iterator, which walks the collection itself and invokes a client-supplied callback for every element (as with forEach). Most modern languages bake this idea into built-in facilities — the Iterable/Iterator protocol and generators (function*) in TypeScript, the for...of loop — so implementing the pattern by hand is rarely necessary today.",
    "problem": "A client needs to traverse the elements of a collection, but its internal structure (array, tree, hash table) must not leak out. If you hardwire traversal into the collection itself, its interface bloats, the client becomes coupled to the concrete structure, and running several independent traversals at once becomes impossible. If, on top of that, the traversal has to behave the same way for an array, a tree, and a linked list without the client code being rewritten for each structure, the problem becomes even harder.",
    "solution": "Extract the traversal logic into a separate iterator object with a narrow interface such as hasNext()/next(). The iterator keeps track of the current traversal position, while the collection merely exposes a method to create an iterator. The client works with the elements only through the iterator and knows nothing about how the collection is organized internally. This yields an external iterator — the client itself decides when to request the next element. In languages with generators, the same idea can be expressed as an internal iterator: a generator function drives the traversal itself and hands elements to the client via yield, while the client merely consumes them with for...of without tracking any traversal state. If the underlying collection is mutated while a traversal is in progress (elements added or removed), the iterator's position can become invalid — a robust implementation either forbids such mutations (fail-fast) or explicitly documents its behavior in that case.",
    "code": "interface SongIterator {\n  hasNext(): boolean;\n  next(): string;\n}\n\nclass Playlist {\n  private songs: string[] = [];\n  add(song: string) { this.songs.push(song); }\n  // traversal is extracted into a separate object: the position lives in the iterator\n  createIterator(): SongIterator {\n    let position = 0;\n    return {\n      hasNext: () => position < this.songs.length,\n      next: () => this.songs[position++],\n    };\n  }\n}\n\nconst playlist = new Playlist();\nplaylist.add('Intro');\nplaylist.add('Main Theme');\nconst it = playlist.createIterator();\nwhile (it.hasNext()) console.log(it.next()); // the client never sees the internal array",
    "pros": [
      "A single traversal interface for collections with different internal structures",
      "Several independent traversals of the same collection at once — each iterator keeps its own position",
      "The collection neither exposes its internal representation nor bloats its interface with traversal logic",
      "In languages with generator support, the pattern is implemented almost ceremony-free, via function* and yield"
    ],
    "cons": [
      "Overkill for simple collections: modern languages ship built-in traversal facilities (for...of, Symbol.iterator)",
      "Extra objects and indirection for the sake of a plain loop",
      "Modifying the collection during traversal can invalidate the iterator"
    ],
    "tradeoffs": [
      "Encapsulating the collection's structure vs. direct index access, which is sometimes simpler and faster",
      "A uniform traversal interface vs. the overhead of extra iterator objects",
      "An external iterator gives the client precise control over the pace of traversal (pausing it, interleaving logic between steps), whereas an internal iterator is more compact but takes that control away"
    ],
    "whenToUse": [
      "The collection has a complex internal structure (tree, graph) that must be hidden from the client",
      "You need different ways to traverse, or several simultaneous independent traversals",
      "You want a uniform way to iterate over different types of collections"
    ],
    "whenNotToUse": [
      "The collection is a plain array and the built-in for...of is enough",
      "There is only ever one trivial traversal — a separate iterator object would just add indirection"
    ]
  },
  "mediator": {
    "tagline": "A tangled web of connections between objects is reduced to a single mediator",
    "definition": "Defines an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently. Unlike Observer, where a subject merely broadcasts notifications to its subscribers in a one-to-many fashion and expects no response, a Mediator actively coordinates peer colleagues in both directions, often embodying non-trivial logic for reconciling their actions.",
    "problem": "A group of objects (for example, the controls in a dialog box) communicate directly: each one knows many others, and the connections form a many-to-many web. Such a network is hard to understand, change, and reuse — you can't lift an object out on its own because it references its neighbors, and any change to the interaction protocol ripples across every participant at once.",
    "solution": "Introduce a mediator object that knows all the colleagues and coordinates them. Colleagues no longer reference one another: they report every event only to the mediator, which decides whom to involve and how. The many-to-many web turns into a star — each colleague is connected only to the mediator, and all the interaction logic is concentrated in one place. To keep the mediator from turning into an impenetrable god object, it is often scoped to one specific interaction scenario (say, a separate mediator per form or screen) rather than trying to fold the coordination of the entire application into it.",
    "code": "interface Mediator { notify(sender: object, event: string): void; }\n\nclass Checkbox {\n  constructor(private mediator: Mediator) {}\n  check() { this.mediator.notify(this, 'check'); } // a colleague reports only to the mediator\n}\nclass TextInput {\n  setEnabled(on: boolean) { console.log(`input field: ${on ? 'enabled' : 'disabled'}`); }\n}\nclass SubmitButton {\n  constructor(private mediator: Mediator) {}\n  click() { this.mediator.notify(this, 'click'); }\n}\n\nclass FormDialog implements Mediator {\n  private checkbox = new Checkbox(this);\n  private input = new TextInput();\n  private button = new SubmitButton(this);\n  notify(sender: object, event: string) {\n    // all interaction logic is concentrated in the mediator\n    if (sender === this.checkbox && event === 'check') this.input.setEnabled(true);\n    if (sender === this.button && event === 'click') console.log('submitting the form');\n  }\n}",
    "pros": [
      "Eliminates direct many-to-many connections between colleagues — each one knows only the mediator",
      "Interaction logic lives in one place instead of being scattered across the participants",
      "Individual colleagues are easier to reuse since they don't reference one another",
      "You change the interaction protocol by editing the mediator, without touching the colleagues"
    ],
    "cons": [
      "The mediator risks growing into a hard-to-maintain god object",
      "Complexity doesn't disappear — it just concentrates in a single class",
      "The indirection makes it harder to trace who actually initiated an action"
    ],
    "tradeoffs": [
      "Loose coupling between colleagues in exchange for concentrating complexity in the mediator",
      "Centralized control of interaction versus the transparency of direct calls",
      "Easy swapping of the interaction scheme at the cost of an extra layer of indirection"
    ],
    "whenToUse": [
      "Objects are linked by a complex, poorly structured web of mutual references",
      "An object is hard to reuse because it communicates with many others",
      "Behavior distributed across several classes needs to be customized without a proliferation of subclasses"
    ],
    "whenNotToUse": [
      "Only two or three objects with simple connections interact — a mediator would just add indirection",
      "One-way one-to-many notifications suffice — Observer is enough"
    ]
  },
  "memento": {
    "tagline": "A snapshot of an object's state without breaking its encapsulation",
    "definition": "Without violating encapsulation, captures and externalizes an object's internal state so that the object can later be restored to that state. The originator is the only party that knows how to read and write the state inside a memento; the caretaker treats a memento as an opaque token, responsible only for deciding when to save one and when to hand it back, without ever looking inside. Unlike plain serialization, which typically turns state into a universal portable format (JSON, a binary stream) meant for transfer between processes or systems, Memento is an in-process mechanism: the snapshot remains a language-level object created for undo and rollback, not for data exchange.",
    "problem": "You need to save snapshots of an object's state (undo, transaction rollback, checkpoints), but exposing its internal fields to the outside would break encapsulation, while keeping the entire history inside the object itself bloats it and mixes responsibilities. A simple alternative — serializing the whole object (say, to JSON) and storing that string — solves only part of the problem: it forces the object to support a universal exchange format, works poorly for state with private fields or references to other runtime objects, and is usually far more expensive on CPU than creating a plain JS object.",
    "solution": "The originator creates a snapshot object (the memento) holding its own state and knows how to restore itself from it. The caretaker stores these snapshots as opaque tokens: it decides when to save and when to roll back, but never looks inside the memento. In TypeScript this opacity is usually achieved by convention rather than by a language-level barrier: the memento exposes only private state plus a pair of methods like getState()/restore() meant solely for the originator to use, while the caretaker treats the snapshot as a black box (say, of type unknown) or through a narrowed interface with no access to the state at all. Compared to serializing into an external format, a memento stays a lightweight language object — cheaper on CPU, but poorly suited to storing snapshots long-term across process restarts, where serialization is the better fit.",
    "code": "class EditorMemento {\n  constructor(private readonly state: string) {} // state is hidden from outsiders\n  getState() { return this.state; }\n}\n\nclass Editor {\n  private content = '';\n  type(text: string) { this.content += text; }\n  save(): EditorMemento { return new EditorMemento(this.content); } // the originator creates its own snapshot\n  restore(m: EditorMemento) { this.content = m.getState(); }\n  get text() { return this.content; }\n}\n\nclass History { // caretaker: stores snapshots without looking inside\n  private snapshots: EditorMemento[] = [];\n  push(m: EditorMemento) { this.snapshots.push(m); }\n  pop() { return this.snapshots.pop(); }\n}\n\nconst editor = new Editor();\nconst history = new History();\neditor.type('Hello');\nhistory.push(editor.save());\neditor.type(', world!');\nconst last = history.pop();\nif (last) editor.restore(last); // undo: back to 'Hello'",
    "pros": [
      "Enables undo/rollback without exposing the object's internal structure",
      "Offloads the originator: a separate caretaker maintains the history of snapshots",
      "Snapshots are opaque objects, so clients don't become coupled to the details of the state",
      "Implements undo without paying for a universal serialization format — the snapshot stays a plain language object"
    ],
    "cons": [
      "Frequent snapshots of a large state are expensive in terms of memory",
      "The caretaker must manage the lifecycle of snapshots, otherwise they accumulate indefinitely",
      "In languages without friend access (including TypeScript), it's hard to fully hide a snapshot's contents from everyone except the originator"
    ],
    "tradeoffs": [
      "Depth of the undo history versus the memory consumed by snapshots",
      "Strict encapsulation of the memento versus ease of implementation: a wide memento interface is simpler but undermines the pattern's main guarantee",
      "A lightweight in-process snapshot object versus a portable but heavier serialized format needed for storage across restarts or transfer over the network"
    ],
    "whenToUse": [
      "You need undo, rollback, or checkpoints of an object's state",
      "Reading and writing the internal fields directly from outside would break the object's encapsulation",
      "The state is rich in private details and references to other runtime objects, so serializing it into a portable format is awkward or impossible"
    ],
    "whenNotToUse": [
      "The state is simple and public — plain field copying is enough",
      "The state is huge and snapshots are needed often — the memory cost will outweigh the benefit"
    ]
  },
  "template-method": {
    "tagline": "The algorithm skeleton lives in the base class; the variable steps live in subclasses",
    "definition": "Defines the skeleton of an algorithm in an operation of a base class, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm's overall structure. The variable steps split into mandatory ones — abstract methods a subclass must implement — and optional hooks with a default implementation that a subclass may override or simply leave as is.",
    "problem": "Several classes implement the same algorithm with the same sequence of steps, differing only in the details of individual steps. Copying the whole sequence into each class duplicates the invariant part, and any change to the order of the steps has to be made in every copy. Worse, nothing stops one of the classes from accidentally breaking the step order or skipping a mandatory stage — with copy-pasting, the algorithm and its variants drift apart independently, and over time classes that are supposed to share the same structural behavior start to diverge noticeably.",
    "solution": "Fix the invariant sequence of steps in a single method of the base class — the template method. Declare the variable steps as abstract (or as hooks with a default implementation), and let subclasses override only those. The base class calls the steps in the right order itself — \"don't call us, we'll call you.\" Abstract steps must be implemented by the subclass, or the class stays abstract; hooks, on the other hand, can be left untouched entirely — they offer an extension point rather than a requirement. This inversion of control is exactly the Hollywood principle: the base class dictates when and in what order the steps are called, while the subclass merely supplies their implementation, with no say over the calling sequence itself.",
    "code": "abstract class ReportGenerator {\n  // template method: fixes the skeleton of the algorithm\n  generate(rows: string[]): string {\n    const body = rows.map((r) => this.formatRow(r)).join('\\n');\n    return `${this.header()}\\n${body}\\n${this.footer()}`;\n  }\n  protected abstract header(): string;      // step the subclass must provide\n  protected abstract formatRow(row: string): string;\n  protected footer(): string { return ''; } // hook: overriding is optional\n}\n\nclass CsvReport extends ReportGenerator {\n  protected header() { return 'name'; }\n  protected formatRow(row: string) { return row; }\n}\n\nclass HtmlReport extends ReportGenerator {\n  protected header() { return '<table>'; }\n  protected formatRow(row: string) { return `<tr><td>${row}</td></tr>`; }\n  protected footer() { return '</table>'; }\n}",
    "pros": [
      "The invariant part of the algorithm is written once, eliminating duplication",
      "The base class tightly controls the algorithm's structure and its extension points",
      "Inversion of control: the framework calls the subclass's steps itself (the \"Hollywood principle\")",
      "Hooks allow incremental extension: start from the default behavior and override only what genuinely needs to change"
    ],
    "cons": [
      "The behavior variant is locked in at inheritance time — a step cannot be swapped at runtime",
      "Every combination of steps requires its own subclass",
      "A subclass that breaks a step's contract breaks the base class's algorithm (risk of violating the Liskov Substitution Principle)"
    ],
    "tradeoffs": [
      "Reuse through inheritance versus the flexibility of composition: Strategy solves the same problem through delegation and lets you change behavior at runtime",
      "A rigid skeleton makes the algorithm easy to control but hard to change the step sequence itself — it is shared by all subclasses",
      "Hooks with default behavior lower the barrier to entry for subclasses, but that implicit default behavior isn't always obvious and can surprise anyone who hasn't read the base class's implementation"
    ],
    "whenToUse": [
      "Several classes repeat the same algorithm, differing only in individual steps",
      "You want to allow extension only at specific points of the algorithm while forbidding changes to its structure",
      "You want to pull a duplicated skeleton out of related classes up into a common ancestor"
    ],
    "whenNotToUse": [
      "Steps need to be swapped at runtime or combined freely — Strategy through composition is a better fit",
      "The structure of the algorithm itself differs, not just individual steps"
    ]
  },
  "visitor": {
    "tagline": "A new operation over an object structure without changing its classes",
    "definition": "Represents an operation to be performed on each object in an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates. The mechanism is double dispatch: an element's accept(visitor) method calls a specific method on the visitor (visitX), so the code that runs is selected by two types at once — the element's type and the visitor's type — rather than by one, as with ordinary method polymorphism.",
    "problem": "You have a stable class hierarchy (AST nodes, shapes, document elements) on which you need to perform many disparate operations: export, metrics collection, rendering. Adding each operation as a method on every class means cluttering the classes with unrelated logic and editing the whole hierarchy for every new operation; cascades of instanceof checks in the client are a brittle alternative. This is a specific instance of the so-called expression problem: it's hard to make adding new operations and adding new data types equally cheap.",
    "solution": "The operation is extracted into a separate visitor object with a visit method for each concrete element class. Elements declare a single accept(visitor) method in which they call their own method on the visitor — double dispatch: the operation is selected by both the element type and the visitor type. A new operation is just a new visitor class, and the element hierarchy stays untouched. Double dispatch itself is simply two ordinary virtual calls in a row (accept, then visit), not some special language mechanism; in languages without dispatch on more than one argument at once (like TypeScript), it's implemented exactly this way — by hand, via a pair of methods.",
    "code": "interface ShapeVisitor<R> { visitCircle(c: Circle): R; visitSquare(s: Square): R; }\n\ninterface Shape { accept<R>(v: ShapeVisitor<R>): R; }\n\nclass Circle implements Shape {\n  constructor(public radius: number) {}\n  accept<R>(v: ShapeVisitor<R>): R { return v.visitCircle(this); } // double dispatch\n}\nclass Square implements Shape {\n  constructor(public side: number) {}\n  accept<R>(v: ShapeVisitor<R>): R { return v.visitSquare(this); }\n}\n\n// a new operation is a new visitor; the shape classes don't change\nclass AreaVisitor implements ShapeVisitor<number> {\n  visitCircle(c: Circle) { return Math.PI * c.radius ** 2; }\n  visitSquare(s: Square) { return s.side ** 2; }\n}\nclass XmlExportVisitor implements ShapeVisitor<string> {\n  visitCircle(c: Circle) { return `<circle r=\"${c.radius}\"/>`; }\n  visitSquare(s: Square) { return `<square side=\"${s.side}\"/>`; }\n}\n\nconst shapes: Shape[] = [new Circle(2), new Square(3)];\nconst areas = shapes.map((s) => s.accept(new AreaVisitor()));",
    "pros": [
      "A new operation is added with a single visitor class, without touching the element hierarchy (satisfies the OCP with respect to operations)",
      "Related logic for a single operation is gathered in one class instead of being smeared across all the elements",
      "A visitor can accumulate state while traversing the structure (counters, an export buffer)",
      "Removes instanceof cascades: dispatch on the concrete type happens through accept/visit"
    ],
    "cons": [
      "Adding a new element class requires changing the visitor interface and all of its implementations",
      "A visitor often needs access to the internals of elements, which pushes toward breaking encapsulation",
      "Double dispatch and the dependency cycle between elements and the visitor make the code harder to read"
    ],
    "tradeoffs": [
      "Easy to add operations but hard to add element types — exactly the opposite of ordinary method polymorphism",
      "Clean element classes versus a visitor interface tightly coupled to every concrete class",
      "The ability to accumulate shared traversal state in the visitor (say, a running metric) versus the risk that the visitor itself quietly grows into another god object duplicating the elements' responsibilities"
    ],
    "whenToUse": [
      "The element class hierarchy is stable, but operations over it are added frequently",
      "You need to perform many unrelated operations on the objects of a structure and don't want to clutter the classes with them",
      "The operation depends on the concrete element classes, not just on a common interface"
    ],
    "whenNotToUse": [
      "The element hierarchy frequently gains new classes — every new element breaks all the visitors",
      "There is only one simple operation — an ordinary polymorphic method is enough"
    ]
  },
  "layered": {
    "tagline": "The system is split into horizontal layers; dependencies point only downward",
    "definition": "An architectural style in which the system is divided into horizontal layers with well-defined roles (classically, per Fowler: presentation, domain, data source), where each layer provides services to the layer above it and consumes services from the layer below it. Dependencies point strictly downward: a layer knows about the one beneath it but knows nothing about the one above it.",
    "problem": "Without a separation into layers, UI code, business rules, and data access get tangled together: SQL queries end up in button handlers, and business logic ends up in templates. Such code can't be tested in isolation, you can't swap the storage or the UI without rewriting everything, and a new developer struggles to figure out where anything lives.",
    "solution": "Split the system into layers by technical responsibility: presentation accepts requests and handles the view, domain (service) holds the business logic, and data source encapsulates working with storage. Each layer talks only to the layer directly below it through that layer's public interface, so you can understand, test, or replace a layer knowing nothing more than the contract of the layer beneath it.",
    "code": "// Data source layer: data access only; knows nothing about the layers above\nclass UserRepository {\n  private rows = new Map<string, { id: string; email: string }>();\n  findById(id: string) { return this.rows.get(id) ?? null; }\n}\n\n// Domain layer: business rules; depends only on the layer below\nclass UserService {\n  constructor(private repo: UserRepository) {}\n  getEmail(id: string): string {\n    const user = this.repo.findById(id);\n    if (!user) throw new Error('User not found'); // business rule\n    return user.email;\n  }\n}\n\n// Presentation layer: receives the request, delegates downward\nclass UserController {\n  constructor(private service: UserService) {}\n  handleGet(id: string): { status: number; body: string } {\n    return { status: 200, body: this.service.getEmail(id) };\n  }\n}\n\n// dependencies point strictly downward: Controller -> Service -> Repository\nconst controller = new UserController(new UserService(new UserRepository()));",
    "pros": [
      "A simple, familiar structure — a low barrier to entry for the team",
      "Separation of concerns: UI, business logic, and data access change independently",
      "A layer can be tested in isolation by replacing the layer below it with a stub",
      "Swapping a layer's implementation (e.g., the database) leaves the layers above untouched as long as the contract stays stable"
    ],
    "cons": [
      "The domain depends on the data layer: business logic is coupled to storage details (unlike Hexagonal/Clean, where that dependency is inverted)",
      "Simple operations pass straight through every layer with no logic of their own — you end up with empty pass-through methods (the architecture sinkhole anti-pattern, per Richards)",
      "Layers tend to \"leak\" over time: an upper layer starts reaching past its neighbor or learning the details of lower layers (layer bridging / leaky layers)",
      "Layers on their own are a logical separation, not a deployment boundary: independent scaling comes only from physically splitting into tiers, and even that is coarse — along technical layers rather than features"
    ],
    "tradeoffs": [
      "Clarity and dependency discipline versus extra indirection and pass-through calls on every request",
      "Isolating changes within a layer versus a cross-cutting feature spreading across every layer at once (changing a feature touches every layer)",
      "An easy start for a small system versus harder module extraction later: layers slice the system technically rather than by business capability"
    ],
    "whenToUse": [
      "CRUD applications and typical business systems where a predictable, universally familiar structure matters",
      "A team with mixed experience levels: the style is simple and well documented",
      "The early stage of a product, when the domain's boundaries aren't clear yet and heavier architectures don't pay off"
    ],
    "whenNotToUse": [
      "The domain core is complex and must be fully isolated from infrastructure — Hexagonal or Clean Architecture is a better fit",
      "You need to scale and deploy parts of the system independently — layers don't provide that; look toward microservices",
      "Most operations are simple data pass-through with no logic: the layers turn into empty boilerplate"
    ]
  },
  "mvc": {
    "tagline": "Separating data, presentation, and input handling in the user interface",
    "definition": "A user-interface architectural style that splits an application into three roles: the Model holds data and business logic, the View renders the Model's state, and the Controller interprets user input and turns it into operations on the Model. The Model knows nothing about the View or the Controller. The Controller's job is narrow: parse the input, check authorization, and invoke the right Model operation — the business logic and rules themselves stay in the Model, not in the Controller.",
    "problem": "In UI code, the data, its rendering, and the response to user actions get tangled together in one place: you can't change the look without risking breaking the logic, you can't test the logic without launching the interface, and you can't show the same data in several views without duplication. Beyond that, without an explicit separation of roles, the code handling a request gradually absorbs everything at once — validation, data transformation, database access, and response formatting — which is how a \"fat controller\" is born: code that can't be read or tested piece by piece.",
    "solution": "The responsibilities are split across three roles. The Controller takes user input, checks authorization, and invokes operations on the Model, but holds no business rules itself; the Model changes its state, applies the business logic, and announces the change (classically, via the Observer pattern); the View reads the Model's state and re-renders, without changing anything directly. The logic ends up isolated in the Model, while presentation and input can be changed independently. Historically, there's the classic (Smalltalk) variant, where the Controller and View are tightly coupled and jointly react to input, and the web-common \"Model 2\" variant (Rails, Spring MVC, ASP.NET MVC), where the Controller is a stateless-between-requests handler and the View is a template rendered once per response. To keep the controller from growing unbounded, heavy logic is pushed out of it into separate domain services, leaving the Controller a thin dispatcher.",
    "code": "// Model: data and logic; knows nothing about View or Controller\nclass TaskModel {\n  private tasks: string[] = [];\n  private listeners: Array<() => void> = [];\n  onChange(l: () => void) { this.listeners.push(l); }\n  add(title: string) { this.tasks.push(title); this.listeners.forEach((l) => l()); }\n  all(): readonly string[] { return this.tasks; }\n}\n\n// View: subscribes to the Model itself and reads its state when rendering\nclass TaskView {\n  constructor(private model: TaskModel) {\n    model.onChange(() => this.render()); // Observer: the View follows the Model\n  }\n  render() {\n    console.log(this.model.all().map((t, i) => `${i + 1}. ${t}`).join('\\n'));\n  }\n}\n\n// Controller: only translates user input into operations on the Model\nclass TaskController {\n  constructor(private model: TaskModel) {}\n  handleAddInput(title: string) { this.model.add(title); } // input -> operation on the Model\n}\n\nconst model = new TaskModel();\nconst view = new TaskView(model);\nconst controller = new TaskController(model);\ncontroller.handleAddInput('Learn MVC');",
    "pros": [
      "The Model can be tested without a UI — the logic is isolated from rendering and input",
      "A single Model can be presented by several Views without duplicating logic",
      "Presentation can be reworked without touching the business logic, and vice versa",
      "A simple, widely understood set of roles — a new developer quickly learns where to look for code"
    ],
    "cons": [
      "For simple screens, three components and the wiring between them are excessive structure",
      "The boundary between Controller and View is blurry in practice — it's easy to end up with a \"fat controller\"",
      "You need a mechanism to keep the View in sync with the Model (subscription, manual refresh)"
    ],
    "tradeoffs": [
      "Clean separation of responsibilities versus the extra structure and ceremony on every screen",
      "The Model's independence from the UI versus the need for a separate mechanism to notify the View of changes",
      "A thin Controller with explicit responsibilities versus the risk that, without discipline, logic drifts into the Controller and produces a \"fat controller\""
    ],
    "whenToUse": [
      "A UI with nontrivial logic over the data that has to be tested without the interface",
      "The same data has to be displayed in several views",
      "Presentation and logic change at different rates or are worked on by different people"
    ],
    "whenNotToUse": [
      "A simple, static screen with no logic — the separation won't pay for itself",
      "The framework already imposes a different UI organization (for example, a unidirectional data flow) — don't force MVC on top of it",
      "A UI with rich presentation state (modes, validation flags, computed display properties) — MVVM's two-way binding between the View and a ViewModel fits better here than MVC's manual View-to-Model synchronization"
    ]
  },
  "mvvm": {
    "tagline": "The View binds declaratively to the ViewModel through data binding",
    "definition": "A UI-layer architectural style that splits the interface into Model (domain data and logic), View (declarative rendering), and ViewModel (presentation state and logic). The View binds to the ViewModel via data binding and updates automatically; the ViewModel itself holds no reference to the View. It is an evolution of Martin Fowler's Presentation Model, formalized by John Gossman for WPF.",
    "problem": "Presentation logic — formatting, validation, element visibility and enablement — gets tangled up with View code. You can't cover it with unit tests without spinning up a UI framework, the View bloats, and screen state ends up duplicated across widgets and has to be synchronized by hand.",
    "solution": "Move presentation state and logic into the ViewModel — a \"model of the screen\" expressed as properties and commands, with no references to concrete widgets. The View binds declaratively to the ViewModel's properties through data binding: a change in the ViewModel is reflected in the View automatically (and, with two-way binding, the other way around too). The ViewModel talks to the Model and stays a plain class that is testable without a UI.",
    "code": "// Model — domain data, knows nothing about the UI\ninterface User { firstName: string; lastName: string; }\n\n// ViewModel — presentation state and logic; knows nothing about the View\nclass UserViewModel {\n  private listeners: Array<() => void> = [];\n  constructor(private user: User) {}\n  get fullName() { return `${this.user.firstName} ${this.user.lastName}`; }\n  rename(firstName: string) {\n    this.user = { ...this.user, firstName };\n    this.notify(); // the binding will pick up the change\n  }\n  onChange(fn: () => void) { this.listeners.push(fn); } // binding point\n  private notify() { this.listeners.forEach((fn) => fn()); }\n}\n\n// View — binds to the ViewModel and merely renders its state\nclass UserView {\n  constructor(private vm: UserViewModel) {\n    vm.onChange(() => this.render()); // data binding: the View observes the ViewModel\n  }\n  render() { console.log(`<h1>${this.vm.fullName}</h1>`); }\n}",
    "pros": [
      "Presentation logic is testable without a UI: the ViewModel is a plain class with no references to widgets",
      "The View and the logic evolve independently — you can edit the markup without touching the presentation code",
      "Data binding eliminates the manual code that keeps state and widgets in sync"
    ],
    "cons": [
      "Requires data-binding infrastructure — a framework or a hand-rolled mechanism",
      "Declarative bindings are harder to debug than explicit calls: a binding error often fails silently",
      "For simple screens the ViewModel is a superfluous middleman layer"
    ],
    "tradeoffs": [
      "Testability and decoupling the View from the logic versus an extra layer and the \"magic\" of binding",
      "Automatic synchronization versus transparency of the data flow: it is harder to trace who updated the screen and why"
    ],
    "whenToUse": [
      "UIs with rich state: forms, validation, dependent and computed fields",
      "The platform provides data binding out of the box (WPF, Vue, Knockout, Android Jetpack)",
      "You need to cover the presentation logic with unit tests without launching the UI"
    ],
    "whenNotToUse": [
      "Trivial static screens with almost no state",
      "A platform without binding — a hand-rolled binding mechanism costs more than it is worth"
    ]
  },
  "monolith": {
    "tagline": "The whole system is one codebase and one deployable unit",
    "definition": "An architectural style in which all of an application's functionality is built and deployed as a single unit and runs in one process. Modules interact through direct in-process calls rather than over the network (Fowler: single deployable unit). It is not a synonym for \"badly structured code\" — a well-designed monolith can have clearly separated internal modules with explicit boundaries; that variant is called a modular monolith.",
    "problem": "Early in a product's life the domain boundaries aren't clear yet, and a distributed system charges its price up front: network calls, partial failures, distributed transactions, and orchestrating the deployment of many services. Paying that price before it pays off is premature complexity (Fowler, 'MonolithFirst'). A team that slices the system into services from day one, based on guesses about domain boundaries, usually gets those boundaries wrong and then pays for moving them across the network twice: once for the original (mistaken) split, and again to fix it.",
    "solution": "Keep all functionality in one codebase and one deployable unit. Draw the boundaries internally, with modules and interfaces: calls stay in-process, data lives in a single database with ACID transactions, and deployment and debugging come down to a single application. When modules are disciplined enough to hide their internals behind interfaces and never reach into another module's tables directly, the result is a modular monolith: it delivers most of the organizational benefits of microservices (clear boundaries, independent module development) without a distributed system's network price. Discipline around module boundaries also preserves the option to later extract an overloaded module into its own service once there's a measurable reason to — for instance, it alone needs scaling the rest of the application doesn't.",
    "code": "// Single deployable unit: all modules live in one process and one codebase\ninterface OrderInput { productId: string; quantity: number; }\n\nclass InventoryModule {\n  reserve(productId: string, quantity: number): boolean { return quantity <= 10; }\n}\n\nclass BillingModule {\n  charge(amount: number): string { return `invoice-${amount}`; }\n}\n\nclass OrderModule {\n  // dependencies are plain in-process calls: no network, serialization, or partial failures\n  constructor(private inventory: InventoryModule, private billing: BillingModule) {}\n  placeOrder(input: OrderInput): string {\n    if (!this.inventory.reserve(input.productId, input.quantity)) {\n      throw new Error('out of stock'); // one transaction, one process\n    }\n    return this.billing.charge(input.quantity * 100);\n  }\n}\n\n// the whole application is built and deployed as a single unit\nconst orders = new OrderModule(new InventoryModule(), new BillingModule());",
    "pros": [
      "Simple to build, deploy, and monitor: one application instead of a fleet of services",
      "Calls between modules are in-process, with no network latency, serialization, or partial failures",
      "ACID transactions spanning multiple modules in a single database",
      "End-to-end refactoring and debugging across the whole system in one codebase"
    ],
    "cons": [
      "You can only scale the entire application as a whole, not a single hot module on its own",
      "Any change requires rebuilding and redeploying the whole system",
      "A single technology stack for all parts",
      "Without discipline, module boundaries blur and the system degrades into a 'big ball of mud'"
    ],
    "tradeoffs": [
      "Operational simplicity and strong consistency versus independent scaling and deployment of individual parts",
      "Fast development with a small team versus the rising cost of coordination and build times as the team and codebase grow",
      "The ability to defer the expensive decision about service boundaries versus the risk that, without discipline, module boundaries blur, making \"extract it as a service later\" more expensive than designing it separately from the start"
    ],
    "whenToUse": [
      "A new product or MVP: the domain boundaries aren't clear yet, and splitting them across the network is premature (MonolithFirst)",
      "A small team that finds a single deployable unit easier to maintain than a distributed system",
      "You need strict transactions spanning multiple parts of the system",
      "You want some of the organizational benefits of microservices (clear module boundaries, independent module development) without the network and operational cost — a modular monolith fits here"
    ],
    "whenNotToUse": [
      "Different parts of the system need independent scaling, deployment, or different technology stacks",
      "Many autonomous teams that need to release their parts independently of one another"
    ]
  },
  "hexagonal": {
    "tagline": "The business-logic core talks to the outside world only through ports, and technologies plug in via adapters",
    "definition": "An architectural style (Alistair Cockburn) in which an application can be driven equally by users, programs, automated tests, or scripts, and be developed in isolation from its eventual run-time devices and databases. The application core declares ports — interfaces for interacting with the outside world — and adapters translate specific technologies (UI, HTTP, databases, queues) into those ports and back. All dependencies point inward, toward the core.",
    "problem": "Business logic gets shot through with infrastructure details: SQL queries, the HTTP framework, and third-party service SDKs are woven into the domain code. As a result, the logic can't be tested without a real database and network, and swapping a technology (a different database, a different transport) requires changes throughout the application.",
    "solution": "The core declares ports — interfaces expressed in domain terms. Driving adapters (a REST controller, a CLI, a test) call the core through inbound ports; driven adapters (a Postgres-backed repository, a mail gateway) implement the outbound ports the core needs. Concrete adapters are wired in at the application boundary (the composition root), so the core doesn't know who calls it or where it writes data — a technology can be swapped or mocked without touching the logic.",
    "code": "interface Order { id: string; total: number; }\n\n// Port (owned by the core): what the core needs from the outside world, in domain terms\ninterface OrderRepository { save(order: Order): Promise<void>; }\n\n// Application core: pure business logic, depends only on the port\nclass PlaceOrder {\n  constructor(private readonly orders: OrderRepository) {}\n  async execute(id: string, total: number): Promise<void> {\n    if (total <= 0) throw new Error('Order total must be positive');\n    await this.orders.save({ id, total });\n  }\n}\n\n// Adapters (outside the hexagon): implement the port for a specific technology\nclass PostgresOrderRepository implements OrderRepository {\n  async save(order: Order) { /* INSERT INTO orders ... */ }\n}\nclass InMemoryOrderRepository implements OrderRepository {\n  readonly saved: Order[] = [];\n  async save(order: Order) { this.saved.push(order); }\n}\n\n// Wiring at the boundary: the core doesn't know which adapter is plugged in\nconst placeOrder = new PlaceOrder(new InMemoryOrderRepository()); // in tests\nconst production = new PlaceOrder(new PostgresOrderRepository()); // in production",
    "pros": [
      "Business logic is tested in isolation: adapters are replaced with in-memory or test implementations",
      "Technologies (database, transport, UI) are swapped at the boundary without changing the core",
      "Symmetry of inputs: the core is invoked the same way from REST, a CLI, a queue, or a test",
      "An explicit domain boundary protects it from infrastructure details leaking in"
    ],
    "cons": [
      "Additional interfaces, DTOs, and mapping at every boundary — more code and indirection",
      "For simple CRUD applications the port layer offers little benefit at a noticeable cost",
      "Requires team discipline: it's easy to poke a hole in the boundary by leaking an ORM or framework type into the core"
    ],
    "tradeoffs": [
      "Domain isolation and testability versus the volume of boilerplate (ports, adapters, mapping)",
      "Freedom to swap technologies versus harder navigation: behind a single call sit an interface, an implementation, and the wiring",
      "A clean core versus giving up framework conveniences (active record, ORM decorators) inside the domain"
    ],
    "whenToUse": [
      "Complex domain logic that must be tested without a database, network, or UI",
      "You anticipate swapping or supporting multiple infrastructures: several data sources, transports, or integrations",
      "A long-lived system whose domain must outlast changes of frameworks and technologies"
    ],
    "whenNotToUse": [
      "Thin CRUD over a database with no business rules — the ports become an empty pass-through layer",
      "Prototypes and short-lived services where speed matters more than domain isolation"
    ]
  },
  "clean-architecture": {
    "tagline": "Business rules at the center; frameworks and the database are replaceable details on the periphery",
    "definition": "An architectural style introduced by Robert C. Martin: code is organized into concentric layers (Entities, Use Cases, Interface Adapters, Frameworks & Drivers), governed by a single hard rule — the Dependency Rule: source-code dependencies point only inward, toward higher-level policies. Inner layers know nothing about outer ones: business rules don't depend on the UI, the database, or frameworks.",
    "problem": "Business logic becomes fused with the framework, the ORM, and the UI: you can't test it without standing up infrastructure, swapping the database or the web framework turns into rewriting the system, and domain rules are smeared across controllers and SQL queries.",
    "solution": "The business rules are extracted into an independent core (Entities and Use Cases). The core declares ports — interfaces to the infrastructure it needs — and the outer layers implement those interfaces: the direction of the dependency is inverted via the DIP. Layer boundaries are crossed with simple data structures, so the UI, the database, and frameworks become details you can defer and replace.",
    "code": "// Entities — the core; depends on nothing external\nclass Order {\n  constructor(public readonly id: string, public readonly total: number) {}\n}\n\n// Use Cases — depend only on the core and their own ports\ninterface OrderRepository { findById(id: string): Order | undefined; } // the core declares the port\n\nclass GetOrderTotal {\n  constructor(private readonly orders: OrderRepository) {}\n  execute(id: string): number {\n    const order = this.orders.findById(id);\n    if (!order) throw new Error(`Order ${id} not found`);\n    return order.total;\n  }\n}\n\n// Interface Adapters — the gateway implements the core's port (DIP); the database itself and its driver live in Frameworks & Drivers\nclass SqlOrderRepository implements OrderRepository {\n  findById(id: string) { return new Order(id, 100); } // SQL would go here\n}\n\nconst useCase = new GetOrderTotal(new SqlOrderRepository()); // dependencies point inward",
    "pros": [
      "Business logic can be tested quickly and in isolation, without a database, web, or frameworks",
      "Infrastructure decisions (database, framework, UI) can be deferred and changed",
      "Domain rules are localized in the core rather than smeared across controllers"
    ],
    "cons": [
      "More interfaces, abstractions, and glue code",
      "Mapping data between layers (DTOs vs. entities) adds busywork",
      "A steep learning curve: the team must share the same understanding of the layer boundaries"
    ],
    "tradeoffs": [
      "Independence from infrastructure vs. the amount of boilerplate and indirection",
      "Strict layer boundaries vs. speed of change in simple CRUD"
    ],
    "whenToUse": [
      "A long-lived system with complex domain business logic",
      "Infrastructure decisions haven't been made yet, or are known to be subject to change",
      "You need fast, isolated tests of the business rules"
    ],
    "whenNotToUse": [
      "Simple CRUD or a prototype: the layers add more code than there is logic in the app",
      "Short-lived scripts and utilities with no domain logic"
    ]
  },
  "event-driven": {
    "tagline": "Components communicate through events via a broker, without knowing about each other",
    "definition": "An architectural style in which components interact by producing and consuming events—notifications that something has already happened. A producer publishes an event to an event bus or message broker without knowing the recipients; consumers subscribe to the events they care about and react independently and, as a rule, asynchronously.",
    "problem": "Direct synchronous calls tightly couple modules in a request/response fashion: the sender must know every recipient and its API, adding a new reaction requires modifying the sender, and the failure or slowness of a single recipient blocks the whole call chain. If a multi-step process is coordinated by a dedicated orchestrator that synchronously calls each participant, the orchestrator itself becomes a hub of coupling: it knows about every step and their order, and any change to the process means editing one central module that everything else depends on.",
    "solution": "The interaction is inverted: the source records a fact (\"order placed\") as an event and publishes it to the broker without addressing a specific recipient. Consumers subscribe to the event types they care about and process them independently; a new consumer is added without changing the producer, while the broker buffers the stream, smooths out load spikes, and decouples producer and consumers in time. Coordinating multi-step processes allows two approaches: choreography, where each participant publishes its own event and reacts to others', with the overall step sequence never written down centrally, and orchestration, where a dedicated coordinator calls the participants synchronously or asynchronously through an explicit script. Choreography preserves loose coupling, but its end-to-end flow is harder to reconstruct from the code; orchestration makes the process visible in one place at the cost of a central dependency hub. Because brokers typically offer only \"at-least-once\" delivery, handlers are designed to be idempotent so that redelivering the same event doesn't double-charge a payment or duplicate an order; the relative ordering of events from different sources also isn't guaranteed unless the broker explicitly preserves order per partitioning key.",
    "code": "type OrderPlaced = { orderId: string; total: number };\n\ninterface EventBus {\n  publish(event: OrderPlaced): void;\n  subscribe(handler: (e: OrderPlaced) => void): void;\n}\n\nclass InMemoryBus implements EventBus {\n  private handlers: ((e: OrderPlaced) => void)[] = [];\n  subscribe(h: (e: OrderPlaced) => void) { this.handlers.push(h); }\n  publish(e: OrderPlaced) { for (const h of this.handlers) h(e); }\n}\n\n// producer publishes the fact and doesn't know who will react to it\nclass CheckoutService {\n  constructor(private bus: EventBus) {}\n  placeOrder(orderId: string, total: number) {\n    this.bus.publish({ orderId, total });\n  }\n}\n\n// consumers are independent modules, plugged in without modifying the producer\nconst bus = new InMemoryBus();\nbus.subscribe((e) => console.log(`Notification: order ${e.orderId} accepted`));\nbus.subscribe((e) => console.log(`Analytics: revenue +${e.total}`));\nnew CheckoutService(bus).placeOrder('A-42', 100);",
    "pros": [
      "Loose coupling: the producer doesn't know the consumers or how many there are",
      "A new reaction to an event is added as a new consumer, without touching the producer",
      "Asynchronous processing: the broker buffers the stream and smooths out load spikes",
      "Consumers scale and deploy independently of one another"
    ],
    "cons": [
      "Control flow is implicit: the producer's code doesn't reveal what will happen after an event",
      "End-to-end debugging and tracing event chains is markedly harder than with direct calls",
      "Eventual consistency: data on the consumer side converges with a delay",
      "The broker becomes critical infrastructure that has to be operated and maintained"
    ],
    "tradeoffs": [
      "Loose coupling vs. transparency: a system of direct calls is easier to read than reconstructing implicit event chains",
      "Asynchrony and resilience to spikes vs. strong consistency: you have to live with eventual consistency",
      "Delivery flexibility vs. processing discipline: duplicates and reordering are possible, so handlers must be idempotent"
    ],
    "whenToUse": [
      "Many independent modules or services need to react to the same facts",
      "The set of reactions to an event isn't known in advance and will keep growing",
      "You need asynchronous processing and load-spike smoothing through buffering"
    ],
    "whenNotToUse": [
      "A simple linear request–response scenario: event indirection would only complicate it",
      "The operation requires an immediate, consistent result within a single call (strong consistency)"
    ]
  },
  "microservices": {
    "tagline": "A suite of small, independently deployable services organized around business capabilities",
    "definition": "An architectural style in which an application is built as a suite of small services, each running in its own process, owning its own data, and communicating with the others through lightweight network mechanisms (typically HTTP APIs or messaging). Services are organized around business capabilities and are deployed independently of one another (Fowler and Lewis).",
    "problem": "In a large monolith, teams block one another: every release means deploying the entire application at once, a failure in one module can bring down the whole system, you have to scale everything together even when only one part is under load, and a single technology stack becomes a constraint for everyone.",
    "solution": "The system is split along business-capability boundaries (the Bounded Context from DDD). Each service is a separate application with its own database and its own release cycle; interaction happens only through explicit network contracts, with no shared access to another service's data. A team owns its service end to end: it develops, deploys, and operates the service autonomously.",
    "code": "// Each service is a separate process with its own database and its own deployment.\n// Communication happens only through a network contract; there is no shared domain code.\n\n// Contract for the billing-service (a separate application with its own database)\ninterface BillingApi {\n  charge(orderId: string, amount: number): Promise<{ status: 'paid' | 'declined' }>;\n}\n\n// orders-service (a separate application with its own database)\nclass OrdersService {\n  // an HTTP client to billing is injected, not its classes:\n  // services do not import each other's code\n  constructor(private billing: BillingApi) {}\n\n  async createOrder(customerId: string, items: string[]) {\n    const orderId = `${customerId}-${Date.now()}`;\n    // a call over the network: it can fail independently of us\n    const result = await this.billing.charge(orderId, items.length * 10);\n    if (result.status === 'declined') throw new Error('Payment declined');\n    return { orderId };\n  }\n}",
    "pros": [
      "Independent deployment: a team ships its own service without coordinating a release of the entire system",
      "Targeted scaling: only the service under load is replicated, not the whole application",
      "Fault isolation: with proper design, the failure of one service does not bring down the entire system",
      "Technology freedom: each service can use its own stack and data store suited to its task"
    ],
    "cons": [
      "It is a distributed system: network latency, partial failures, retries, and timeouts become everyday concerns",
      "No ACID transactions across services — you have to live with eventual consistency and patterns such as Saga",
      "Debugging and tracing a request across several services is substantially harder than a stack trace in a monolith",
      "High infrastructure cost: CI/CD per service, orchestration, monitoring, and distributed logging"
    ],
    "tradeoffs": [
      "Team autonomy and independent releases versus the operational complexity of a distributed system",
      "Targeted scaling versus the network overhead of every inter-service interaction",
      "Decentralized data (each service has its own database) versus the loss of end-to-end transactions and cross-service joins"
    ],
    "whenToUse": [
      "A large system developed by several teams that block one another in a monolith",
      "Different parts of the system need radically different scaling or different technologies",
      "You need independent release cycles: parts of the system must ship dozens of times a day without a shared deployment"
    ],
    "whenNotToUse": [
      "A small team or an early-stage product with an unstable domain — Fowler recommends \"Monolith First\": carving along boundaries that have not settled costs more than living with a monolith",
      "The Bounded Context boundaries are not yet clear: the wrong split turns microservices into a distributed monolith",
      "There is no mature DevOps practice (deployment automation, monitoring): the operational cost of the style will not pay off"
    ]
  },
  "composition-vs-inheritance": {
    "tagline": "Assemble behavior from objects, or inherit it from a class",
    "definition": "A comparison of two code-reuse mechanisms: class inheritance is \"white-box\" reuse (a subclass sees the parent's internals and extends it by overriding), while object composition is \"black-box\" reuse (an object is assembled from other objects and delegates work to them through interfaces). The classic GoF guideline: \"Favor object composition over class inheritance.\"",
    "problem": "Inheritance fixes the relationship at compile time: behavior can't be swapped at runtime, and a subclass is bound to the parent's implementation details, so changing the base class breaks its subclasses (the fragile base class problem). When behavior varies along several independent axes (format, delivery, compression), the hierarchy grows combinatorially: one subclass per combination.",
    "solution": "Instead of extending a base class, an object is assembled from parts hidden behind interfaces and delegates work to them. A behavior variant changes by swapping a part, at runtime too, and the dependency is on the interface only, not the implementation. Inheritance is reserved for a genuine \"is-a\" relationship with a stable contract that honors the LSP.",
    "code": "// Inheritance: the behavior variant is baked into the class hierarchy\nclass TextReport { render(data: string) { return `report(${data})`; } }\nclass PdfTextReport extends TextReport { render(d: string) { return `pdf(${super.render(d)})`; } }\n// need a compressed variant too? ZippedPdfTextReport, ZippedHtmlTextReport... — a subclass explosion\n\n// Composition: behavior is assembled from parts behind an interface\ninterface Formatter { format(data: string): string; }\nclass PdfFormatter implements Formatter { format(d: string) { return `pdf(${d})`; } }\nclass HtmlFormatter implements Formatter { format(d: string) { return `html(${d})`; } }\n\nclass Report {\n  constructor(private formatter: Formatter) {} // has-a instead of is-a\n  render(data: string) { return this.formatter.format(data); }\n}\n\nconst report = new Report(new PdfFormatter());\nreport.render('Q3'); // the format changes by swapping a part, with no new hierarchy",
    "pros": [
      "Composition lets you swap behavior at runtime, whereas inheritance fixes it at compile time",
      "Independent axes of behavior combine by assembling parts, with no combinatorial explosion of subclasses",
      "Encapsulation is preserved: an object depends on a part's interface, not on the base class's internals",
      "Parts are easily swapped out for fakes in tests"
    ],
    "cons": [
      "More objects and delegating boilerplate",
      "Behavior is spread across several objects, making it harder to follow end to end",
      "For a simple, stable \"is-a\", inheritance is shorter and more direct"
    ],
    "tradeoffs": [
      "The flexibility of assembling and swapping behavior at runtime versus the indirection and the number of objects",
      "Black-box reuse through interfaces versus the conciseness of inheritance's white-box reuse",
      "Protection from the fragile base class problem versus the extra delegating code"
    ],
    "whenToUse": [
      "Behavior varies along several independent axes, where inheritance would cause a subclass explosion",
      "Behavior needs to be changed or combined at runtime",
      "The relationship between the entities is \"has-a\"/\"uses-a\", not \"is-a\""
    ],
    "whenNotToUse": [
      "A genuine \"is-a\" with a stable contract where the subtype honors the LSP, where inheritance is simpler",
      "A framework or library requires you to extend its base class"
    ]
  },
  "coupling-cohesion": {
    "tagline": "Loose coupling between modules, strong cohesion within each one",
    "definition": "Coupling is the degree of interdependence between modules: how much changing or using one requires knowing the internals of another. Cohesion is the degree to which the elements of a module are united around a single task. The classic guideline of structured design (Constantine/Yourdon, later echoed by Robert C. Martin): aim for low coupling and high cohesion.",
    "problem": "Under tight coupling, changing one module breaks its neighbors in a cascade: the code reaches into other objects' fields, knows the order of their calls, and can't be tested in isolation. Under low cohesion, a module turns into a dumping ground of unrelated functions: it's unclear where to find the logic and what a given change will touch.",
    "solution": "Group code by a single responsibility so that everything inside a module serves one task (high cohesion), and expose only a narrow interface outward while hiding the implementation details — information hiding (low coupling). Modules communicate through abstractions and never manipulate one another's internal state.",
    "code": "// High cohesion: the module does exactly one thing — it calculates the order\nclass OrderCalculator {\n  subtotal(items: { price: number; qty: number }[]): number {\n    return items.reduce((sum, i) => sum + i.price * i.qty, 0);\n  }\n  withTax(amount: number): number {\n    return amount * 1.2;\n  }\n}\n\n// Low coupling: the dependency is a narrow interface, not the SMTP details\ninterface Notifier {\n  send(to: string, text: string): void;\n}\n\nclass OrderService {\n  constructor(private calc: OrderCalculator, private notifier: Notifier) {}\n  checkout(email: string, items: { price: number; qty: number }[]): void {\n    const total = this.calc.withTax(this.calc.subtotal(items));\n    this.notifier.send(email, `Total: ${total}`); // has no idea how the mail is sent\n  }\n}",
    "pros": [
      "Changes stay localized: editing a module's internals doesn't disturb its neighbors",
      "Modules can be tested in isolation by swapping in substitute dependencies",
      "The implementation behind a narrow interface can be replaced without touching clients",
      "The code reads along its responsibility boundaries: it's clear where to look for what"
    ],
    "cons": [
      "Zero coupling doesn't exist: modules have to interact somehow — the only question is the form the connection takes",
      "Excessive decoupling breeds interfaces, adapters, and indirection with no real payoff",
      "The boundaries of \"one task\" are subjective: formal metrics aren't enough — you need judgment about the reasons things change"
    ],
    "tradeoffs": [
      "The explicitness of direct calls versus the flexibility of decoupling: interfaces and events hide who is actually connected to whom and make the flow harder to trace",
      "Aggressive splitting for the sake of low coupling smears a single task across modules — coupling drops on paper, but so does cohesion",
      "Decoupling pays off at boundaries that genuinely change independently, and is redundant between stable parts that always change together"
    ],
    "whenToUse": [
      "Designing the boundaries of modules, packages, and services: what to keep together and what to pull apart",
      "Code review: deciding where new logic should live and whether a class shows feature envy over another's data",
      "Assessing whether a part of the system is ready to be extracted into a separate service or library"
    ],
    "whenNotToUse": [
      "One-off scripts and prototypes: the cost of decoupling won't pay for itself",
      "Code that always changes together isn't worth tearing into separate modules just for formally low coupling"
    ]
  },
  "dry-vs-duplication": {
    "tagline": "Eliminate duplicated knowledge, not incidental similarity in code",
    "definition": "DRY (Hunt and Thomas, The Pragmatic Programmer): every piece of knowledge must have a single, unambiguous, authoritative representation within the system. The DRY vs Duplication trade-off is the skill of telling duplicated knowledge (which you eliminate) apart from incidental textual similarity in code that merely looks alike but expresses different things.",
    "problem": "A copied business rule (a rate, a limit, a format) lives in several places and drifts out of sync: you change the rule in one spot and forget the other, and now you have a silent bug. But blindly fighting every repetition brings the opposite pain: pieces that mean different things get glued into a shared helper, it accumulates flags for each caller, and a change for one breaks the others — the \"wrong abstraction\" (Sandi Metz).",
    "solution": "Before removing a repetition, ask: \"do these places change for the same reason?\" If yes, it is one piece of knowledge — extract it into a single source (a constant, a function, a module). If they change for different reasons, the similarity is incidental — keep the copies independent, or wait for the third occurrence (the Rule of Three, Fowler) to reveal the real axis of generalization.",
    "code": "// Duplicated KNOWLEDGE: the rule \"adulthood = 18\" lives in two places.\n// When the law changes, one copy gets fixed and the other is forgotten.\nfunction canSignContract(age: number) { return age >= 18; }\nfunction canOpenAccount(age: number) { return age >= 18; }\n\n// DRY: a single authoritative source for the rule\nconst ADULT_AGE = 18;\nconst isAdult = (age: number) => age >= ADULT_AGE;\nfunction canSignContractDry(age: number) { return isAdult(age); }\nfunction canOpenAccountDry(age: number) { return isAdult(age); }\n\n// Incidental similarity — NOT duplicated knowledge:\n// the numbers happen to match, but they change for different reasons and different actors.\nconst MAX_LOGIN_LENGTH = 20; // registration-form limit (UX)\nconst MAX_SKU_LENGTH = 20;   // requirement of the warehouse system\n// Merging them into one constant is a false abstraction:\n// changing one rule would silently break the other.",
    "pros": [
      "The rule changes in exactly one place — copies can no longer drift out of sync",
      "The same bug does not multiply across the codebase, and there is less code to review",
      "Knowledge made explicit (a named constant or function) documents the intent by itself"
    ],
    "cons": [
      "Excessive DRY glues incidentally similar code into a false abstraction",
      "Shared code couples all callers: a change made for one risks breaking the rest",
      "Catch-all helpers accumulate flags and toggle parameters to serve every consumer"
    ],
    "tradeoffs": [
      "A single source of knowledge versus coupling independent callers through shared code",
      "Early generalization saves lines now, but the wrong abstraction costs more than duplication (Sandi Metz: \"duplication is far cheaper than the wrong abstraction\")",
      "Rule of Three: tolerate the second copy so that the third occurrence reveals the real axis of generalization"
    ],
    "whenToUse": [
      "The copies express the same piece of knowledge: a business rule, an invariant, a data format",
      "Any change requires updating all copies in sync — a forgotten copy means a bug",
      "The repetition has recurred several times and the axis of generalization is obvious (Rule of Three)"
    ],
    "whenNotToUse": [
      "The code looks textually similar, but the fragments change for different reasons and different actors",
      "Generalizing it requires flags and branches for each caller — a sign of a false abstraction",
      "Fragments of two independent modules/domains happen to match — a shared helper would tie them together with a needless dependency"
    ]
  },
  "abstraction-cost": {
    "tagline": "Every layer of indirection has to earn its keep — abstraction is never free",
    "definition": "Every abstraction has a cost: an extra layer of indirection, higher cognitive load when reading and debugging, and the risk that hidden details leak through (the Law of Leaky Abstractions, Joel Spolsky). An abstraction is justified only when the benefit of decoupling and hiding details outweighs that cost.",
    "problem": "Developers introduce interfaces, factories, and wrappers \"just in case\" — for flexibility that will never be needed. As a result, a simple operation gets smeared across several layers: to understand a single line of logic you have to hop through an interface, a factory, and an implementation. A bad abstraction is even worse: as Sandi Metz points out, duplication is cheaper than the wrong abstraction, because ripping it out later is expensive.",
    "solution": "Treat abstraction as an investment: introduce it when there is a real second implementation or a proven axis of change, not a hypothetical one. Start with the simplest code that works, apply the rule of three before generalizing, and regularly check that each layer still earns its indirection. Remember that abstractions leak: hidden details (the network, storage, encodings) surface anyway during debugging and performance tuning.",
    "code": "// Direct version: zero indirection cost, but hard-wired to localStorage\nfunction saveUserDirect(user: { id: string }) {\n  localStorage.setItem(`user:${user.id}`, JSON.stringify(user));\n}\n\n// Abstraction: decouples the code from storage, but that same line of logic\n// now needs an interface, an implementation, and dependency injection\ninterface KeyValueStore {\n  set(key: string, value: string): void;\n}\n\nclass LocalStore implements KeyValueStore {\n  set(key: string, value: string) { localStorage.setItem(key, value); }\n}\n\nclass UserRepository {\n  constructor(private store: KeyValueStore) {} // cost: three layers instead of one function\n  save(user: { id: string }) {\n    this.store.set(`user:${user.id}`, JSON.stringify(user));\n  }\n}\n\n// Pays off only if there really are multiple implementations:\nconst repo = new UserRepository(new LocalStore()); // in tests — InMemoryStore\nrepo.save({ id: '42' });",
    "pros": [
      "Hides implementation details and reduces coupling between modules",
      "Provides a substitution point: test doubles, alternative implementations",
      "Localizes future changes behind a stable interface"
    ],
    "cons": [
      "Every layer of indirection lengthens the path of reading and debugging the code",
      "Abstractions leak: hidden details surface in performance and bugs",
      "The wrong abstraction locks in a flawed model and is expensive to fix",
      "Speculative generality — code for scenarios that will never happen"
    ],
    "tradeoffs": [
      "Flexibility and decoupling vs. indirection and cognitive load",
      "Hiding details vs. transparency during debugging and optimization",
      "Early abstraction built for future growth vs. cheap direct code that is easy to rewrite"
    ],
    "whenToUse": [
      "There is a real second implementation or a proven axis of change",
      "You need a substitution point for testing an external dependency",
      "An implementation detail (an SDK, protocol, or storage) is unstable and must not spread throughout the code"
    ],
    "whenNotToUse": [
      "There is a single implementation, it is trivial, and unlikely to change — direct code is cheaper",
      "The abstraction is introduced \"just in case\" for hypothetical flexibility",
      "Generalization is done on the first match rather than on a stable pattern"
    ]
  },
  "yagni-vs-flexibility": {
    "tagline": "Don't build flexibility for requirements that don't exist yet",
    "definition": "YAGNI (You Aren't Gonna Need It) is an Extreme Programming principle (Kent Beck, Ron Jeffries; developed in Fowler's essay \"Yagni\"): don't implement functionality or extension points until you actually need them. The trade-off is between the cost of speculative flexibility you pay for now and the cost of refactoring later if the requirement does eventually arrive.",
    "problem": "Teams build in \"flexibility to grow into\": extra interfaces, layers, registries, and configuration for hypothetical future requirements. This speculative generality (Fowler's term) costs money today — it has to be written, tested, read, and maintained — while the predicted requirements often never materialize at all, or arrive in a different form, leaving the abstraction built on the wrong axis of change.",
    "solution": "Implement the simplest solution that covers today's requirements, and keep the code cheap to change (tests, regular refactoring). Introduce an extension point the moment a second real case appears: by then the axis of change is known from facts, and the abstraction is built for actual requirements rather than guesses. You buy flexibility not up front, but when there's a concrete requirement that justifies the cost.",
    "code": "// Speculative flexibility: \"future-proof\" interfaces with only a single implementation\ninterface ReportSource { fetch(): string[][]; }\ninterface ReportFormatter { format(rows: string[][]): string; }\n\nclass CsvFormatter implements ReportFormatter {\n  format(rows: string[][]) { return rows.map((r) => r.join(',')).join('\\n'); }\n}\nclass ArraySource implements ReportSource {\n  constructor(private rows: string[][]) {}\n  fetch() { return this.rows; }\n}\nclass ReportEngine {\n  constructor(private source: ReportSource, private formatter: ReportFormatter) {}\n  build() { return this.formatter.format(this.source.fetch()); }\n}\n\n// YAGNI: today's requirement is exactly one report — CSV from ready-made rows\nfunction buildCsvReport(rows: string[][]): string {\n  return rows.map((r) => r.join(',')).join('\\n');\n}\n// Add the extension point when a second real format appears — the axis of change will then be known",
    "pros": [
      "Less code now — a lower cost to write, read, test, and maintain",
      "Abstractions are built along real axes of change, not guessed ones",
      "Faster delivery of current value: effort isn't spent on unused flexibility"
    ],
    "cons": [
      "If the requirement does arrive, you'll need to refactor — and sometimes migrate data or an API",
      "It demands discipline: without tests and regular refactoring, \"simple\" code quickly ossifies",
      "It's easy to mistake YAGNI for abandoning design altogether and breed chaos instead of simplicity"
    ],
    "tradeoffs": [
      "The cost of extra flexibility today versus the cost of refactoring tomorrow",
      "The speed of delivering current requirements versus readiness for hypothetical future ones",
      "YAGNI only works paired with cheap-to-change code: the weaker your tests and refactoring practices, the more expensive it is to defer flexibility"
    ],
    "whenToUse": [
      "Application code with a fast change cycle and good test coverage",
      "Future requirements are hypotheses and \"just in case\" guesses, not confirmed plans",
      "You're tempted to add a parameter, layer, or registry \"just in case\" when there's only one real scenario"
    ],
    "whenNotToUse": [
      "Public APIs, protocols, and database schemas: changing them after release is expensive, so extensibility is worth thinking through up front",
      "The requirement is confirmed and scheduled for upcoming iterations — that's no longer speculation but a known axis of change"
    ]
  },
  "performance-vs-readability": {
    "tagline": "How fast the code runs versus how fast it can be understood: optimize by measurement, not by intuition",
    "definition": "A trade-off between how fast code runs and the cost of understanding and maintaining it. Optimizations (hand-rolled loops, caches, preallocated buffers, denormalization) almost always make code more complex, so readability is the default and performance is raised selectively — on measured hot paths. Knuth's classic formulation is \"premature optimization is the root of all evil\": in roughly 97% of cases small efficiencies should be forgotten, but in the critical 3% optimization is essential.",
    "problem": "Developers \"optimize\" code on intuition: they rewrite sections in an unreadable style ahead of time, even though the real bottlenecks usually lie elsewhere (I/O, the network, algorithmic complexity, redundant database queries). Intuition about where a program spends its time is systematically wrong. The result is code that is hard to read, change, and review, with almost no gain in speed — while the real bottlenecks are left untouched.",
    "solution": "First write clear code (Kent Beck: \"make it work, make it right, make it fast\"). Then a profiler and metrics reveal the real hot spots — typically a small fraction of the codebase. Only those are optimized: the sped-up code is isolated behind a clear interface, covered by tests, and accompanied by a comment giving the reason and the benchmark numbers, so that unreadability doesn't spread through the system and stays defensible to a reviewer.",
    "code": "interface Order { status: 'paid' | 'pending'; amount: number; }\n\n// Default: the readable version — the intent is obvious at a glance\nfunction totalPaid(orders: Order[]): number {\n  return orders\n    .filter((o) => o.status === 'paid')\n    .reduce((sum, o) => sum + o.amount, 0);\n}\n\n// Hot path (millions of orders, confirmed by the profiler):\n// a single pass with no intermediate arrays. The optimization is isolated\n// behind the same signature and documented: benchmark ~3x on 1M elements.\nfunction totalPaidHot(orders: Order[]): number {\n  let sum = 0;\n  for (let i = 0; i < orders.length; i++) {\n    const o = orders[i];\n    if (o.status === 'paid') sum += o.amount;\n  }\n  return sum;\n}",
    "pros": [
      "The bulk of the codebase stays simple and cheap to maintain",
      "Optimization effort goes into real bottlenecks confirmed by the profiler, not assumed ones",
      "The optimized code is isolated and documented — it's clear why it was written this way and when it can be simplified back"
    ],
    "cons": [
      "Requires measurement infrastructure: a profiler, benchmarks, and production metrics",
      "Deferring optimization carries a risk: architecturally significant decisions (data structures, database schema, service boundaries) are expensive to change after the fact",
      "\"Readability first\" won't save you from algorithmically bad choices — O(n²) on large data isn't cured by micro-optimizations"
    ],
    "tradeoffs": [
      "Execution speed versus the speed of understanding and changing the code",
      "Choosing a performant architecture early where it matters versus prematurely optimizing everything in sight",
      "A local hot-path win versus the growth of overall codebase complexity"
    ],
    "whenToUse": [
      "The profiler has surfaced a hot path and its contribution to latency is confirmed by numbers",
      "There are explicit performance requirements: an SLA, real-time, a game loop, or processing large volumes of data",
      "The optimization can be isolated behind a clear interface and pinned down with a benchmark and tests"
    ],
    "whenNotToUse": [
      "The code runs rarely or off the hot path — the gain won't pay for the lost readability",
      "The bottleneck hasn't been measured: intuition about performance is systematically wrong",
      "The problem is algorithmic (the wrong data structure, redundant queries) — change the algorithm first rather than micro-optimizing individual lines"
    ]
  },
  "database-per-service": {
    "tagline": "Each service owns its private database; others reach it only through its API or events",
    "definition": "A data-storage pattern for microservices: each service keeps its data in its own private database that only that service may access directly. Other services never read from or write to someone else's database directly — they obtain the data they need solely through the owning service's public API or the events it publishes. The database becomes a hidden implementation detail of the service, behind its contract.",
    "problem": "If several microservices share one common database, they become coupled through its schema: one service changing a table can break another, and you can't deploy a service independently — you need a coordinated migration and a joint release of everyone who depends on those tables. A shared database also forces a single kind of DBMS on everyone and becomes a single point of failure and a scaling bottleneck, undermining the very idea of independent services.",
    "solution": "Each service is given its own private database that only it can access directly. All interaction with another service's data goes through the owning service's API or its events. This encapsulates the storage schema inside the service: the team is free to change the data model and even the kind of DBMS (polyglot persistence) as long as the external contract stays stable, and services can be developed, deployed, and scaled independently. The price is giving up cross-service ACID transactions and JOINs: consistency between services is achieved through Saga and eventual consistency, and cross-service queries through API composition or CQRS.",
    "code": "// Each service owns a PRIVATE database — no other service touches it directly.\nclass CustomerDb {\n  private rows = new Map<string, { id: string; name: string; credit: number }>();\n  find(id: string) { return this.rows.get(id) ?? null; }\n}\n\n// Customer Service is the ONLY code allowed to read/write CustomerDb.\nclass CustomerService {\n  constructor(private db: CustomerDb) {}\n  getCredit(id: string): number {\n    const c = this.db.find(id);\n    if (!c) throw new Error('Customer not found'); // data is served via the API, not shared tables\n    return c.credit;\n  }\n}\n\n// Order Service has its OWN database, separate from CustomerDb.\nclass OrderDb {\n  private rows = new Map<string, { id: string; customerId: string; total: number }>();\n  save(row: { id: string; customerId: string; total: number }) { this.rows.set(row.id, row); }\n}\n\n// It needs customer data — Order Service CALLS the Customer Service API, not its database.\nclass OrderService {\n  constructor(private db: OrderDb, private customers: CustomerService) {}\n  place(id: string, customerId: string, total: number) {\n    const credit = this.customers.getCredit(customerId); // an API call, not a JOIN on a shared DB\n    if (total > credit) throw new Error('Credit limit exceeded');\n    this.db.save({ id, customerId, total }); // writes only to its own database\n  }\n}",
    "pros": [
      "Loose coupling: services don't share a schema, so a service can change its data model without breaking others",
      "Independent deployment: no shared-database migration to coordinate across teams",
      "Freedom to pick the right store per service (polyglot persistence) — a relational DB for orders, a search index for the catalog",
      "Fault and load isolation: a problem with one service's database doesn't drag the others down",
      "Clear data ownership: each team fully owns its data behind a stable contract"
    ],
    "cons": [
      "No cross-service ACID transactions or JOINs — consistency across services becomes the application's problem (Saga, eventual consistency)",
      "Queries spanning several services need API composition or CQRS read models instead of a single SQL JOIN",
      "More operational overhead: many databases to provision, back up, monitor, and secure",
      "Data duplication: services keep local copies of data they don't own, kept in sync via events",
      "Harder debugging and reporting: there is no single database to query for a global view"
    ],
    "tradeoffs": [
      "Loose coupling and independent deployment versus losing simple cross-service ACID transactions and JOINs",
      "The freedom of polyglot persistence versus the multiplied operational cost of many stores",
      "Team autonomy and clear data ownership versus eventual consistency and duplicated data that must be reconciled",
      "Isolation of faults and load versus more moving parts and network hops to fetch related data"
    ],
    "whenToUse": [
      "You are building microservices and want teams to develop, deploy, and scale their services independently",
      "Different services genuinely have different storage needs — polyglot persistence pays off",
      "You can accept eventual consistency and are prepared to use Saga for operations that span several services",
      "Data-ownership boundaries follow clear bounded contexts (DDD)"
    ],
    "whenNotToUse": [
      "A small application or a single team, where one shared database is simpler and cheaper — don't split the data prematurely",
      "The domain needs strong cross-entity ACID transactions everywhere and eventual consistency is unacceptable",
      "Reporting and analytics constantly need JOINs across all data — better served by one database or a dedicated data warehouse"
    ]
  },
  "api-gateway": {
    "tagline": "A single entry point for clients: routing, authentication, rate-limiting, and protocol translation at the edge of the system",
    "definition": "A pattern in which all external clients access a microservices system through a single intermediary service located at the edge of the system. The API Gateway receives a request, handles cross-cutting concerns (authentication, rate-limiting, TLS termination), routes the request to the appropriate internal service, translates the protocol when needed, and shapes the response for the client. The client sees one stable API and knows nothing about the number, addresses, or protocols of the services behind the gateway.",
    "problem": "If clients call microservices directly (client-to-service), the client must know the addresses and protocols of dozens of services, and service boundaries leak outward — any refactoring of them breaks clients. Cross-cutting concerns (authentication, rate-limiting, TLS, logging) have to be re-implemented in every service, which breeds duplication and drift. A mobile client also pays dearly to make many requests over a slow network, and some internal protocols (gRPC, AMQP) are simply unreachable from a browser.",
    "solution": "Place a single entry point — the API Gateway — between clients and microservices. The gateway publishes a stable external API and takes on the cross-cutting concerns: it terminates TLS, authenticates the request, applies rate-limiting, routes to the right service by path or headers, translates the external protocol into the internal one, and shapes the response. Internal services can be added, split, or relocated without affecting clients. The key constraint: the gateway stays thin — it holds no domain business logic and merely delegates it to the owning services.",
    "code": "// Internal services — each owns one capability and is unaware of the gateway\ninterface Request { path: string; token?: string; }\ninterface Response { status: number; body: unknown; }\n\ninterface Service {\n  handle(req: Request): Response;\n}\n\nclass OrderService implements Service {\n  handle(_req: Request): Response {\n    return { status: 200, body: { orders: [] } }; // business logic lives here\n  }\n}\nclass UserService implements Service {\n  handle(_req: Request): Response {\n    return { status: 200, body: { name: 'Ann' } };\n  }\n}\n\n// API Gateway: the single entry point. Cross-cutting concerns only, no business logic\nclass ApiGateway {\n  private hits = new Map<string, number>();\n  constructor(private routes: Record<string, Service>) {}\n\n  handle(req: Request): Response {\n    // 1. Authentication — a cross-cutting concern, handled once at the edge\n    if (!req.token) return { status: 401, body: 'Unauthorized' };\n\n    // 2. Rate-limiting per token\n    const n = (this.hits.get(req.token) ?? 0) + 1;\n    this.hits.set(req.token, n);\n    if (n > 100) return { status: 429, body: 'Too Many Requests' };\n\n    // 3. Routing to the owning service by path prefix\n    const prefix = '/' + req.path.split('/')[1];\n    const service = this.routes[prefix];\n    if (!service) return { status: 404, body: 'Not Found' };\n\n    // the gateway only delegates; it does not compute the answer itself\n    return service.handle(req);\n  }\n}\n\nconst gateway = new ApiGateway({\n  '/orders': new OrderService(),\n  '/users': new UserService(),\n});\ngateway.handle({ path: '/orders/42', token: 'abc' });",
    "pros": [
      "Encapsulates the system's internal structure: the client sees one stable API and knows nothing about the number, addresses, or protocols of the services",
      "Cross-cutting concerns (authentication, rate-limiting, TLS termination, logging) are handled in one place instead of being duplicated in every service",
      "Enables protocol translation: a convenient REST/GraphQL on the outside, gRPC, AMQP, and others on the inside",
      "Freedom to refactor: services can be split, merged, and relocated without affecting clients as long as the external contract stays stable"
    ],
    "cons": [
      "Yet another component to develop, deploy, and operate; on failure or unavailability it becomes a single point of failure (SPOF) and therefore needs redundancy",
      "Adds an extra network hop and a potential bottleneck in the latency and throughput of the whole system",
      "Risk of bloat: business logic and aggregation start leaking into the gateway, and it turns into a monolithic intermediary that slows every team down",
      "Updating the gateway requires coordination across teams: changing routes and contracts affects many service owners"
    ],
    "tradeoffs": [
      "Decoupling clients from service topology and centralizing cross-cutting concerns versus an extra hop, a bottleneck, and a single point of failure",
      "One shared gateway (simpler to operate) versus several specialized ones per client type (the BFF variant) with less risk of bloat",
      "Centralizing auth/rate-limiting/TLS in one place versus coupling teams around a shared component and coordinating its changes",
      "The convenience of aggregating responses at the gateway versus the risk of dragging domain business logic into it and turning it into a hidden monolith"
    ],
    "whenToUse": [
      "The system has many microservices and it is inconvenient and unsafe for clients to call each one directly",
      "Cross-cutting concerns — authentication, authorization, rate-limiting, TLS termination — must be handled uniformly across all services",
      "Clients (mobile, browser) work over a slow network or cannot speak internal protocols, and protocol translation is needed",
      "The internal service structure changes frequently and needs to be hidden behind a stable external contract"
    ],
    "whenNotToUse": [
      "There are few services and a single client: direct client-to-service calls are simpler, and a gateway would only add a hop and a point of failure",
      "Different client types have sharply diverging API needs — then several BFFs are usually chosen instead of one gateway",
      "There are no resources to make the gateway fault-tolerant: a single instance with no redundancy makes the whole system brittle"
    ]
  },
  "aggregator": {
    "tagline": "A service that calls several downstream services and merges their responses into a single consolidated result for the client",
    "definition": "A composition pattern in which a dedicated service (or component) accepts a request, calls several independent services — in parallel or as a chain — and merges the retrieved data into a single response before returning it to the client. The Aggregator encapsulates the composition logic (fan-out/fan-in, merging results, handling partial failures) in one place, freeing the client from having to make multiple calls itself and stitch together heterogeneous responses.",
    "problem": "A client (or an application screen) often needs data from several services at once — for example, an order card needs data from the Order, User, and Payment services. If the client makes these calls itself, it must know the service topology, perform several network round-trips (especially costly for mobile clients on a slow connection), handle partial failures of each call, and merge heterogeneous responses on its own. The composition logic ends up duplicated across every client, and any change to the set of downstream services requires updating all of them.",
    "solution": "Introduce a dedicated aggregator service between the client and the downstream services. The Aggregator accepts a single request from the client, calls the needed services — in parallel if their data is independent, or as a chain if one call's result is needed as input to the next — merges the responses according to a predefined schema, and returns a single consolidated result to the client. The Aggregator also decides what to do on a partial failure of one of the calls (return partial data, a default value, or fail the whole request), typically applying a timeout and a Circuit Breaker to each call individually.",
    "code": "// Downstream services -- independent, unaware of the aggregator\ninterface OrderInfo { orderId: string; userId: string; items: string[]; }\ninterface UserInfo { userId: string; name: string; }\ninterface PaymentInfo { orderId: string; status: string; }\n\ninterface OrderService { getOrder(orderId: string): Promise<OrderInfo>; }\ninterface UserService { getUser(userId: string): Promise<UserInfo>; }\ninterface PaymentService { getPayment(orderId: string): Promise<PaymentInfo>; }\n\nclass OrderServiceImpl implements OrderService {\n  async getOrder(orderId: string): Promise<OrderInfo> {\n    return { orderId, userId: 'u-1', items: ['Book', 'Pen'] }; // business logic lives here\n  }\n}\nclass UserServiceImpl implements UserService {\n  async getUser(userId: string): Promise<UserInfo> {\n    return { userId, name: 'Ann' };\n  }\n}\nclass PaymentServiceImpl implements PaymentService {\n  async getPayment(orderId: string): Promise<PaymentInfo> {\n    return { orderId, status: 'CAPTURED' };\n  }\n}\n\ninterface OrderSummary {\n  order: OrderInfo;\n  user: UserInfo | null;\n  payment: PaymentInfo | null;\n}\n\n// Aggregator: fan-out to independent services, fan-in into one response\nclass OrderSummaryAggregator {\n  constructor(\n    private orders: OrderService,\n    private users: UserService,\n    private payments: PaymentService,\n  ) {}\n\n  async getSummary(orderId: string): Promise<OrderSummary> {\n    const order = await this.orders.getOrder(orderId); // chained: the order tells us which user to fetch\n\n    // Parallel fan-out: User and Payment do not depend on each other\n    const [user, payment] = await Promise.allSettled([\n      this.users.getUser(order.userId),\n      this.payments.getPayment(orderId),\n    ]);\n\n    // Merge into a single consolidated response, tolerating partial failure\n    return {\n      order,\n      user: user.status === 'fulfilled' ? user.value : null,\n      payment: payment.status === 'fulfilled' ? payment.value : null,\n    };\n  }\n}\n\nconst aggregator = new OrderSummaryAggregator(\n  new OrderServiceImpl(),\n  new UserServiceImpl(),\n  new PaymentServiceImpl(),\n);\naggregator.getSummary('42');",
    "pros": [
      "Encapsulates the composition logic in one place: the client makes a single request instead of several and knows nothing about the downstream service topology",
      "Reduces the number of round-trips between the client and the system — especially important for mobile and web clients on a slow network",
      "Allows independent calls to be parallelized (fan-out/fan-in), reducing total latency compared with sequential calls made by the client",
      "Centralizes the handling of partial failures and timeouts of downstream services, hiding that complexity from the client"
    ],
    "cons": [
      "The Aggregator becomes an extra network hop and a potential point of failure between the client and the downstream services",
      "The latency of the aggregated call is bounded by the slowest of the required services, and parallel calls require explicit handling of timeouts and partial responses",
      "Couples the aggregator to the response schemas of all downstream services: changing any one of their contracts requires updating the aggregator",
      "Risk of turning into a hidden orchestrator of business logic if domain rules gradually leak into the aggregator instead of it only merging data"
    ],
    "tradeoffs": [
      "Parallel composition (fan-out) minimizes latency but complicates handling of partial failures; a chain of calls is simpler to make fault-tolerant, but its latencies add up",
      "One reusable aggregator shared by several clients is simpler to operate but forces a compromise response shape, whereas a dedicated aggregator for a specific screen (BFF-style) is more precise but multiplies copies",
      "Hiding composition complexity from the client versus coupling the aggregator to the response schemas of every service it calls",
      "The simplicity of aggregating responses directly at the API Gateway level versus extracting a separate aggregator service to preserve the single-responsibility principle"
    ],
    "whenToUse": [
      "A client or screen needs data from several independent services at once, and making several requests from the client is inefficient",
      "Data from different services can be fetched independently and merged according to a clearly defined schema",
      "The client needs to be shielded from partial failures of downstream services by falling back to default values or a partial response",
      "The set and number of called services may change over time, and the client should not be involved in those changes"
    ],
    "whenNotToUse": [
      "The client only needs data from a single service — the aggregator would add an extra network hop with no benefit",
      "The merged data is tightly bound by business rules, e.g. a distributed transaction — then a saga orchestrator (Saga/Process Manager) is needed rather than a simple merge of responses",
      "Different client types (web, mobile) need substantially different shapes of the aggregated response — then a BFF should be considered instead of one shared aggregator"
    ]
  },
  "bff": {
    "tagline": "A dedicated backend per client type, tailored to the needs of that specific UI",
    "definition": "An integration pattern in which each frontend (web, mobile app, partner API) gets its own narrowly tailored server-side layer — a Backend for Frontend. Each BFF aggregates and adapts data from shared downstream services to fit the concrete screens and constraints of its particular client, rather than trying to serve every client through one general-purpose API. The term was coined by Sam Newman describing SoundCloud's practice, where a single API layer stopped coping with the diverging needs of web and mobile clients.",
    "problem": "A single general-purpose API is forced to serve different clients with incompatible needs. A web app wants a rich profile screen with the full order history, while a mobile app wants a compact response to save bandwidth and battery. The shared API either bloats to cover every case or pushes the client into making several round-trips and stitching/filtering data on its own side. Worse, evolving the mobile and the web experiences compete over the same shared code, and a change made for one client risks breaking another.",
    "solution": "Give each frontend its own backend that knows exactly its screens. A BFF calls the shared downstream services (user, order, catalog…), then aggregates and reshapes the responses for its specific client: the web BFF returns an expanded payload, the mobile BFF a trimmed one. The downstream services stay shared and remain unaware of clients. The key rule, per Newman, is to scope not \"one BFF per microservice\" but \"one BFF per user experience\": you usually group clients of the same class and spin up a separate BFF only where the UI needs genuinely diverge. Typically each BFF is owned by the same team that owns its frontend, which removes cross-team coordination when screens change.",
    "code": "// Shared downstream services — used by every frontend\ninterface UserService {\n  getUser(id: string): { id: string; name: string; avatarUrl: string; bio: string };\n}\ninterface OrderService {\n  listOrders(userId: string): { id: string; total: number; status: string }[];\n}\n\n// Web BFF: the screen has room — return an expanded profile and the full order history\nclass WebProfileBff {\n  constructor(private users: UserService, private orders: OrderService) {}\n  getProfileScreen(userId: string) {\n    const u = this.users.getUser(userId);\n    return {\n      name: u.name,\n      bio: u.bio,\n      avatarUrl: u.avatarUrl,\n      orders: this.orders.listOrders(userId), // web shows the whole history\n    };\n  }\n}\n\n// Mobile BFF: save bandwidth — same services, but a trimmed payload for the small screen\nclass MobileProfileBff {\n  constructor(private users: UserService, private orders: OrderService) {}\n  getProfileScreen(userId: string) {\n    const u = this.users.getUser(userId);\n    return {\n      name: u.name,\n      avatarUrl: u.avatarUrl,\n      orderCount: this.orders.listOrders(userId).length, // a count is enough for mobile\n    };\n  }\n}\n\n// One shared OrderService, yet each BFF shapes the response for its own UI\n",
    "pros": [
      "Each client gets an API shaped to its screens: minimal round-trips and no aggregation logic pushed onto the device",
      "Changes made for one client are isolated — a new screen in the mobile app can't break the web",
      "Per-channel optimization: the mobile BFF trims payloads and data volume, the web BFF returns a rich response",
      "The frontend team owns its BFF and can evolve the contract without cross-team coordination",
      "Downstream services stay shared and aren't polluted with client-specific formats"
    ],
    "cons": [
      "More code and deployment units: every new client type adds its own service to evolve, monitor, and ship",
      "Duplicated logic across BFFs — aggregation and calls to the same downstream services get repeated in each",
      "The temptation to spawn a BFF per tiny client instead of grouping by experience class leads to infrastructure sprawl",
      "One more network hop on the request path: added latency and a failure point",
      "Cross-client concerns (auth, rate limiting) can smear across every BFF unless factored out separately"
    ],
    "tradeoffs": [
      "Client-tailored APIs versus duplicated aggregation code across several BFFs",
      "Frontend-team autonomy and speed versus a growing number of services to operate",
      "Less logic and traffic on the client versus an extra network hop and its latency",
      "Isolation of changes between clients versus the risk of shared logic (auth, caching) drifting apart across BFFs",
      "Grouping clients as \"one BFF per experience\" (simpler to operate) versus a separate BFF per client (maximum tailoring)"
    ],
    "whenToUse": [
      "Your frontends have noticeably diverging needs — e.g. a rich web client versus a frugal mobile one",
      "Clients are forced into many round-trips and client-side stitching/filtering because the shared API doesn't fit",
      "Different teams own different frontends and want to evolve their contracts independently",
      "You need per-channel optimization: different data volume, formats, or update cadence for web and mobile"
    ],
    "whenNotToUse": [
      "A single client, or a few clients with near-identical needs — a shared API is simpler",
      "The team is small and can't afford to operate several extra services",
      "The differences between clients boil down to cross-cutting concerns (auth, routing, rate limiting) — an API Gateway suffices here"
    ]
  },
  "circuit-breaker": {
    "tagline": "Stop calling a failing dependency once errors cross a threshold, then periodically probe for its recovery",
    "definition": "A resilience pattern that wraps calls to a remote dependency and tracks their failures. When the number (or rate) of failures crosses a threshold, the breaker trips Open and subsequent calls fail immediately without reaching the dependency. After a configured cooldown it moves to Half-open and lets a limited number of trial calls through: if they succeed, the circuit closes again (Closed); if they fail, it trips Open once more. Three states: Closed → Open → Half-open → Closed.",
    "problem": "When a remote dependency degrades or hangs, the caller keeps sending requests and waiting on timeouts. Threads, connections, and memory pile up on the wait, one service's failure cascades to its callers, and the whole chain goes down. Blind retries make this worse: they pile extra load onto an already-overwhelmed service and keep it from recovering.",
    "solution": "Wrap the calls in a Circuit Breaker that counts failures. Once there are too many, the breaker trips Open and starts returning an error immediately (fail-fast): the caller no longer hangs on timeouts, and the overloaded dependency gets a break. After a cooldown the breaker cautiously probes the dependency with a limited number of calls (Half-open); success closes the circuit again (Closed), failure trips it back to Open. This lets the system isolate a fault quickly and detect recovery on its own, with no manual intervention. Typically an Open state has a fallback or degraded response instead of just propagating the error.",
    "code": "type BreakerState = \"closed\" | \"open\" | \"half-open\";\n\nclass CircuitBreaker {\n  private state: BreakerState = \"closed\";\n  private failureCount = 0;\n  private openedAt = 0;\n\n  constructor(\n    private readonly failureThreshold = 5, // consecutive errors before tripping\n    private readonly cooldownMs = 30_000,  // pause before the trial call\n  ) {}\n\n  async call<T>(action: () => Promise<T>): Promise<T> {\n    if (this.state === \"open\") {\n      if (Date.now() - this.openedAt < this.cooldownMs) {\n        // circuit is open — don't touch the dependency, respond at once (fail-fast)\n        throw new Error(\"Circuit is open: failing fast\");\n      }\n      this.state = \"half-open\"; // cooldown elapsed — let one trial call through\n    }\n    try {\n      const result = await action();\n      this.onSuccess(); // success (including the probe) — the dependency is alive\n      return result;\n    } catch (err) {\n      this.onFailure();\n      throw err;\n    }\n  }\n\n  private onSuccess(): void {\n    this.failureCount = 0;\n    this.state = \"closed\"; // back to normal operation\n  }\n\n  private onFailure(): void {\n    this.failureCount++;\n    // a failed probe, or the error threshold exceeded — trip the circuit open\n    if (this.state === \"half-open\" || this.failureCount >= this.failureThreshold) {\n      this.state = \"open\";\n      this.openedAt = Date.now();\n    }\n  }\n}",
    "pros": [
      "Fail-fast: the caller doesn't hang on a failed dependency's timeouts, freeing threads and connections",
      "Prevents cascading failures — a local fault doesn't spread across the whole system",
      "Takes load off an overloaded dependency, giving it a chance to recover",
      "Detects recovery automatically via the probe calls in Half-open, with no manual intervention"
    ],
    "cons": [
      "While the circuit is open, it also rejects requests that could have succeeded (false positives)",
      "Requires careful tuning of the threshold and cooldown: too sensitive a breaker trips needlessly, too sluggish a one trips too late",
      "Needs a meaningful fallback or degradation for the Open state, otherwise the error is simply propagated upward",
      "Adds state and complexity; in a multi-instance setup the state is usually local to each instance"
    ],
    "tradeoffs": [
      "Fast failure and system protection versus temporarily rejecting requests the dependency might already be able to serve",
      "Threshold sensitivity: tripping early conserves resources but errs more often; tripping late is more accurate but lets through more harm",
      "A simple fail-fast versus a more complex but responsive strategy with a fallback or cache during the Open state"
    ],
    "whenToUse": [
      "Synchronous network calls to external services or resources that can degrade or hang",
      "A dependency's failure threatens to exhaust the caller's threads/connections and trigger a cascade",
      "There is a sensible response to Open: a fallback, cache, degradation, or a fast, clear error",
      "Alongside timeouts, retries, and the Bulkhead pattern as part of an overall resilience strategy"
    ],
    "whenNotToUse": [
      "Local, fast, deterministic in-process calls — there is essentially nothing to protect",
      "One-off transient failures are better handled by a simple retry with backoff than by tripping the whole circuit",
      "Batch or asynchronous processing where the caller can wait and a retry doesn't tie up scarce resources"
    ]
  },
  "bulkhead": {
    "tagline": "Isolate resources into separate pools so a failure in one part can't sink the whole system",
    "definition": "A fault-tolerance pattern in which resources (connection pools, threads, memory, instances) are split into isolated pools — one per dependency or per class of load. An overload or failure in one pool cannot exhaust the resources of the others, so a fault stays localized instead of sinking the whole service. The name and idea come from Michael Nygard's «Release It!», by analogy with the watertight bulkheads of a ship's hull.",
    "problem": "When every call shares one common resource pool (for example, a single thread or connection pool), one slow or failed dependency gradually takes up all the slots: threads block waiting for a response, the pool runs dry, and requests even to perfectly healthy dependencies start to fail. A local degradation turns into a cascading failure of the entire service (resource exhaustion).",
    "solution": "Split resources into separate pools and give each dependency (or class of load) its own quota. Calls to one dependency draw slots only from its pool, so its saturation does not touch the others. When a pool is full, extra calls are rejected fast (fail fast) instead of piling up in an unbounded queue. That way the fault stays locked inside its own «compartment», and the service keeps functioning partially.",
    "code": "// A Bulkhead caps the number of concurrent calls to one dependency at its quota.\n// Saturating one dependency cannot consume the slots reserved for the others.\nclass Bulkhead {\n  private inFlight = 0;\n  constructor(\n    private readonly name: string,\n    private readonly maxConcurrent: number,\n  ) {}\n\n  async run<T>(task: () => Promise<T>): Promise<T> {\n    if (this.inFlight >= this.maxConcurrent) {\n      throw new Error(`Bulkhead \"${this.name}\" is full`); // fail fast, not an unbounded queue\n    }\n    this.inFlight++;\n    try {\n      return await task();\n    } finally {\n      this.inFlight--; // the slot is always released\n    }\n  }\n}\n\n// Each dependency gets its OWN pool — a separate compartment.\nconst paymentsPool = new Bulkhead('payments', 10);\nconst reportsPool = new Bulkhead('reports', 3); // slow, low priority — a small quota\n\nasync function chargeUser(charge: () => Promise<string>) {\n  // A flood of slow report calls saturates reportsPool only;\n  // payments keeps its 10 slots and stays responsive.\n  return paymentsPool.run(charge);\n}",
    "pros": [
      "Localizes a fault: an overloaded or failed dependency does not exhaust the resources of the others",
      "Prevents cascading failures from resource exhaustion — the service stays partially operational",
      "Lets you prioritize load: a larger pool for critical dependencies, a smaller one for secondary ones",
      "Limits the blast radius and gives predictable behavior under load"
    ],
    "cons": [
      "Resources are partitioned up front and rigidly: overall utilization is lower than with one shared pool — idle slots in one pool don't help another",
      "You must tune and maintain the pool sizes: too small throttles throughput, too large fails to isolate",
      "More pools means more thread/connection overhead and more complex configuration and monitoring",
      "Isolation via dedicated threads adds context-switching cost and the overhead of handing tasks between threads"
    ],
    "tradeoffs": [
      "Isolation and resilience versus overall utilization: dedicated quotas protect you but sit idle when a dependency is quiet",
      "Careful tuning of pool sizes versus the simplicity of a single shared pool",
      "Strict isolation with dedicated threads versus cheap semaphore isolation — the latter spawns no extra threads but does not protect against blocking calls"
    ],
    "whenToUse": [
      "A service depends on several external systems with different reliability and latency characteristics",
      "There are slow or unreliable dependencies that could grab all threads/connections of a shared pool",
      "You need to guarantee resources for critical operations regardless of the load on secondary ones",
      "A multi-tenant system where one tenant's load must not affect the others"
    ],
    "whenNotToUse": [
      "A single dependency and homogeneous load — there is nothing to partition, a shared pool is simpler",
      "Resources are extremely scarce: splitting into small pools lowers already-low throughput further",
      "The overhead of isolation (threads, latency) matters more than the risk of a cascading failure"
    ]
  },
  "sidecar": {
    "tagline": "A helper process deployed alongside the main service that takes over cross-cutting concerns",
    "definition": "A pattern in which cross-cutting concerns (traffic proxying, TLS/mTLS, retries, telemetry, configuration) are moved into a separate process — the sidecar — that is deployed in the same unit as the main service (the same pod/host) and shares its lifecycle and network namespace. The application talks to the sidecar over localhost and knows nothing about the details of those concerns. Sidecar is the general pattern (any co-located helper); its canonical instance is the sidecar proxy, which composes into a service mesh.",
    "problem": "Cross-cutting functionality — mTLS, retries, circuit breaking, tracing, metrics collection — is needed by every service in the same way. Embedding it as a library in the application code spreads it across the whole fleet: in a polyglot system it has to be rewritten per language, versions drift, and patching a TLS vulnerability means rebuilding and redeploying dozens of services. Meanwhile the core code mixes business logic with infrastructure concerns.",
    "solution": "Cross-cutting concerns are moved into a separate process — the sidecar — deployed together with the main service in a single deployment unit, sharing its network and lifecycle. In the sidecar-proxy variant, all of the application's inbound and outbound traffic goes through the sidecar over localhost; the sidecar adds TLS, retries, metrics, and tracing transparently to the application. This makes the infrastructure logic independent of the service's language, upgradable separately from it, and centrally managing the fleet of sidecar proxies forms a service mesh (e.g., Istio: a data plane of Envoy proxies + the istiod control plane).",
    "code": "// Cross-cutting concerns live in the sidecar, NOT in the application.\ninterface HttpRequest { url: string; body: string; }\ninterface HttpResponse { status: number; body: string; }\n\n// Sidecar: a separate process deployed in the same pod.\n// It intercepts outbound traffic and adds TLS, retries, telemetry.\nclass SidecarProxy {\n  private calls = 0; // telemetry counter\n  constructor(private transport: (r: HttpRequest) => HttpResponse) {}\n\n  forward(req: HttpRequest): HttpResponse {\n    this.calls++;                                            // telemetry\n    const secure = { ...req, url: req.url.replace('http://', 'https://') }; // TLS origination to upstream\n    for (let attempt = 1; attempt <= 3; attempt++) {          // retry policy\n      const res = this.transport(secure);\n      if (res.status < 500) return res;\n    }\n    return { status: 503, body: 'upstream unavailable' };\n  }\n\n  metrics() { return { outboundCalls: this.calls }; }\n}\n\n// Application: business logic only, talks solely to localhost.\n// It knows nothing about TLS, retries or metrics.\nclass OrderService {\n  constructor(private sidecar: SidecarProxy) {}\n  placeOrder(id: string): HttpResponse {\n    // send to a peer service through the local sidecar\n    return this.sidecar.forward({ url: 'http://payments/charge', body: id });\n  }\n}\n\nconst sidecar = new SidecarProxy((r) => ({ status: 200, body: `ok:${r.url}` }));\nconst app = new OrderService(sidecar);\napp.placeOrder('order-42');",
    "pros": [
      "Cross-cutting concerns (TLS, retries, telemetry) are separated from the application code — the service focuses only on business logic",
      "Language independence: polyglot services reuse the same sidecar, with no per-runtime library needed",
      "Independent lifecycle: the sidecar can be upgraded (e.g., patching a TLS vulnerability) without rebuilding and redeploying the application",
      "Fault and resource isolation: the sidecar is a separate process, so its crash or memory usage doesn't corrupt the application's address space",
      "Foundation of a service mesh: a uniform policy (mTLS, routing, observability) across the whole fleet via a control plane"
    ],
    "cons": [
      "An extra process per instance — memory and CPU overhead multiplied across the whole fleet",
      "An added network hop (application → sidecar → network) increases latency",
      "Operational complexity: more containers to deploy, version, and monitor; harder to debug locally",
      "Coupling of lifecycles and startup order: the application may start before the sidecar is ready (races), and shutdown ordering becomes tricky"
    ],
    "tradeoffs": [
      "Separating cross-cutting logic and reusing it across polyglot services versus per-instance resource cost and an extra local hop",
      "A uniform, centrally managed policy (service mesh) versus increased operational and deployment complexity",
      "Independent sidecar upgrades versus tighter lifecycle and startup-order coupling between two co-located processes",
      "A separate process (isolation, language independence) versus an in-process library (less overhead and no hop, but tied to the language and lifecycle of the application)"
    ],
    "whenToUse": [
      "You need consistent cross-cutting functionality (mTLS, retries, circuit breaking, tracing) across a polyglot fleet of services",
      "You are adopting a service mesh (Istio, Linkerd) with a control plane governing traffic and policy",
      "You need to add capabilities to a legacy or third-party service whose code you can't change",
      "Cross-cutting logic must be upgraded independently of the many services that use it"
    ],
    "whenNotToUse": [
      "A single service or a small homogeneous system where an in-process library is simpler and cheaper",
      "Latency- or resource-critical workloads where the extra hop and per-pod overhead don't pay off",
      "The operational complexity of a mesh outweighs the need for cross-cutting concerns"
    ]
  },
  "saga": {
    "tagline": "A distributed transaction as a chain of local transactions, each with a compensating action for failure",
    "definition": "A data-management pattern in which a distributed business transaction is modeled as a sequence of local transactions: each service performs its own local transaction in its own database and publishes an event or message that triggers the next step. If a step fails, the Saga runs compensating transactions that semantically undo the already-committed steps in reverse order (Garcia-Molina & Salem; Chris Richardson).",
    "problem": "In microservices a business operation often spans several services, each with its own database (database-per-service). A classic ACID transaction is impossible here: there is no single transaction manager, and distributed two-phase commit (2PC) holds locks on every participant until the operation completes, which kills availability and scalability and copes poorly with partial failures. How do you keep data consistent across services without a global transaction?",
    "solution": "Break the operation into a chain of local transactions. Each service commits its own local transaction and triggers the next step. For each step you predefine a compensating transaction — a separate local transaction that semantically undoes its effect (not a database rollback, but a reverse action: refund a payment, cancel a reservation). If step N fails, the already-completed steps are compensated in reverse order. Coordination comes in two flavors: orchestration (a central orchestrator commands the steps and holds the saga's state) and choreography (services react to one another's events with no central coordinator). The price is eventual consistency and a loss of isolation instead of ACID.",
    "code": "// Saga: a distributed transaction as a chain of local transactions,\n// each paired with a compensating action that undoes it on failure.\n\ninterface SagaStep {\n  name: string;\n  action: () => Promise<void>;      // one local transaction in some service\n  compensate: () => Promise<void>; // semantically undoes that local transaction\n}\n\n// Orchestration: a central coordinator drives the steps in order.\nclass SagaOrchestrator {\n  constructor(private readonly steps: SagaStep[]) {}\n\n  async run(): Promise<void> {\n    const done: SagaStep[] = [];\n    try {\n      for (const step of this.steps) {\n        await step.action(); // local tx committed and already visible\n        done.push(step);\n      }\n    } catch (err) {\n      // There is no global rollback across services (no 2PC),\n      // so undo the committed steps in reverse order.\n      for (const step of done.reverse()) {\n        await step.compensate();\n      }\n      throw err;\n    }\n  }\n}\n\n// Each step lives in a different service and commits its own local transaction.\nconst checkout = new SagaOrchestrator([\n  { name: 'reserve-stock', action: async () => {}, compensate: async () => {} }, // Inventory\n  { name: 'charge-card',   action: async () => {}, compensate: async () => {} }, // Payment\n  { name: 'ship-order',    action: async () => {}, compensate: async () => {} }, // Shipping\n]);",
    "pros": [
      "Preserves service autonomy: each step is a local ACID transaction in its own database, with no distributed locks",
      "Higher availability and scalability than 2PC: no coordinator holding locks across all participants",
      "The failure path is explicit: compensating actions make rollback a first-class, testable part of the design",
      "Fits asynchronous messaging well and survives partial failures and temporary unavailability of participants"
    ],
    "cons": [
      "No isolation: intermediate states are visible to others (Saga gives ACD, not ACID) — needs countermeasures such as semantic locks",
      "Compensations are hard to design: they must be idempotent and virtually always succeed, and some effects are irreversible",
      "Complexity grows: you must reason about every failure point and its rollback, and live with eventual consistency",
      "Choreography scatters the overall flow across many services, making the saga hard to understand and debug end to end"
    ],
    "tradeoffs": [
      "Availability and autonomy (local transactions) versus the loss of isolation and ACID guarantees",
      "Orchestration (a clear central flow, but a coupling point and potential bottleneck) versus choreography (loose coupling, but a flow scattered across services)",
      "The simplicity of a single ACID transaction versus explicit compensation logic for every step",
      "Immediate consistency versus eventual consistency with visible intermediate states"
    ],
    "whenToUse": [
      "A business transaction spans several services, each with its own database (database-per-service)",
      "You need to keep data consistent without distributed 2PC and without sacrificing availability",
      "Long-lived processes where holding locks for the whole duration is unacceptable",
      "Every step has a meaningful compensating action (a refund, a cancellation, releasing a reservation)"
    ],
    "whenNotToUse": [
      "All the data lives in a single database — a plain local ACID transaction is simpler and stronger",
      "Steps have effects that cannot be compensated (irreversible external actions) and no countermeasure is acceptable",
      "The team cannot tolerate visible intermediate/inconsistent states and is not willing to add semantic locks"
    ]
  },
  "cqrs": {
    "tagline": "Separating the write model from the read model so each is optimised independently",
    "definition": "Command Query Responsibility Segregation is a pattern that splits state-changing operations (commands) and read operations (queries) into two independent models. The write model enforces domain invariants (often over normalised state, though CQRS does not require it), while the read model holds denormalised projections tailored to specific queries. The two models may use different schemas and even different data stores, and they are kept in sync, usually asynchronously. The term was coined by Greg Young, extending Bertrand Meyer's Command-Query Separation principle; the pattern is documented in detail by Martin Fowler.",
    "problem": "A single model serving both writes and reads is forced into compromises. A normalised schema with invariants is convenient for writing but demands expensive JOINs and aggregations for reading; denormalising for fast queries makes consistent changes harder. Read and write loads usually differ by orders of magnitude and grow differently, yet cannot be scaled separately. In a complex domain the same model accumulates both command logic and dozens of read scenarios, becoming a bottleneck for both performance and maintainability.",
    "solution": "Split the responsibility into two models. The command side accepts commands, checks invariants, and changes state, returning nothing but an acknowledgement. The read side serves queries from separate projections optimised for reads (flat views, materialised views, purpose-built stores). Changes from the write model propagate to the read model — synchronously in the simple case, or asynchronously via events, which yields eventual consistency between the sides. Each side can be designed, deployed, and scaled independently.",
    "code": "// Command: expresses intent to change state, returns no data\ninterface PlaceOrder { orderId: string; total: number }\n\n// Read model: denormalised, shaped for queries\ninterface OrderSummary { orderId: string; total: number; status: string }\n\n// Write side: enforces invariants, mutates state, then projects into the read model\nclass OrderCommandHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  place(cmd: PlaceOrder): void {\n    // ...enforce invariants, persist to the write store...\n    this.readModel.set(cmd.orderId, {\n      orderId: cmd.orderId,\n      total: cmd.total,\n      status: 'placed',\n    });\n  }\n}\n\n// Read side: returns data and never mutates state\nclass OrderQueryHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  byId(orderId: string): OrderSummary | undefined {\n    return this.readModel.get(orderId);\n  }\n}\n\n// One dataset, two models — optimised and scaled independently\nconst readModel = new Map<string, OrderSummary>();\nconst commands = new OrderCommandHandler(readModel);\nconst queries = new OrderQueryHandler(readModel);\ncommands.place({ orderId: 'o-1', total: 100 });\nqueries.byId('o-1'); // { orderId: 'o-1', total: 100, status: 'placed' }",
    "pros": [
      "The read and write models are optimised independently: invariants and a write-oriented model on the write side, denormalised projections on the read side",
      "Independent scaling of the sides — read replicas can grow separately from writes, matching their real load",
      "The write model stays focused on domain commands and invariants instead of accumulating the logic of dozens of read scenarios",
      "Each side can use the storage that suits it (e.g., relational for writes, a search index for reads)"
    ],
    "cons": [
      "A significant rise in complexity: two models, their synchronisation, and projection code instead of one schema",
      "With asynchronous synchronisation between the sides you get eventual consistency — a read may return stale data",
      "Data is duplicated across projections, with a risk of drift when projection building fails",
      "Higher operational cost: monitoring projection lag, idempotency, and rebuilding read models"
    ],
    "tradeoffs": [
      "Independent optimisation and scaling of reads/writes versus increased complexity and code volume",
      "Fast, query-tailored projections versus eventual consistency and the possibility of reading stale data",
      "Flexibility to pick separate stores per side versus the cost of synchronisation and data duplication",
      "A clean, domain-focused write model versus extra projection infrastructure and its operation"
    ],
    "whenToUse": [
      "Read and write loads differ greatly and must be scaled separately",
      "A complex domain where a command model with invariants fits poorly with numerous read scenarios",
      "You need diverse, specialised views of the same data (reports, search, dashboards)",
      "It is applied alongside Event Sourcing, where events project naturally into read models"
    ],
    "whenNotToUse": [
      "Simple CRUD domains where reads and writes work with the same shape of data — CQRS only adds needless complexity",
      "The team is not ready to operate eventual consistency and monitor projection lag",
      "Strict read-after-write consistency is required on every operation without exception"
    ]
  },
  "event-sourcing": {
    "tagline": "State is stored as an append-only log of events; the current value is derived by replaying them",
    "definition": "A data-storage pattern in which the single source of truth is an append-only sequence of events—immutable facts about what has happened to the system. The current state is not stored directly anywhere but is derived by replaying the events in order. Unlike the classic approach, where a table holds only the latest snapshot, the event store records every change as a separate event (Fowler, Greg Young).",
    "problem": "When the database stores only the current state, every update overwrites the previous value and history is lost irrevocably: you cannot tell how the system arrived at its current state, reconstruct its view at any past moment (a temporal query), perform an audit, or debug where a wrong value came from. Adding audit logs by hand is unreliable—sooner or later they drift out of sync with the real data.",
    "solution": "Instead of overwriting state, the system persists every change as an event in an append-only event store—events are immutable and are never deleted or updated. The current state is obtained by folding (reducing) an aggregate's stream of events into a projection. The event log itself becomes a complete audit journal; from it you can reconstruct the state at any point in time, build new projections retroactively, and replay history. For performance, snapshots are stored periodically so the log doesn't have to be replayed from the very beginning.",
    "code": "// State is not stored directly — it is derived by replaying the events.\ntype AccountEvent =\n  | { type: 'Opened'; balance: number }\n  | { type: 'Deposited'; amount: number }\n  | { type: 'Withdrawn'; amount: number };\n\n// The event store only appends: events are immutable facts, never edited.\nclass EventStore {\n  private events: AccountEvent[] = [];\n  append(event: AccountEvent): void { this.events.push(event); }\n  load(): readonly AccountEvent[] { return this.events; }\n}\n\ninterface AccountState { balance: number; }\n\n// A projection folds the event log into the current state.\nfunction project(events: readonly AccountEvent[]): AccountState {\n  return events.reduce<AccountState>((state, e) => {\n    switch (e.type) {\n      case 'Opened': return { balance: e.balance };\n      case 'Deposited': return { balance: state.balance + e.amount };\n      case 'Withdrawn': return { balance: state.balance - e.amount };\n    }\n  }, { balance: 0 });\n}\n\nconst store = new EventStore();\nstore.append({ type: 'Opened', balance: 0 });\nstore.append({ type: 'Deposited', amount: 100 });\nstore.append({ type: 'Withdrawn', amount: 30 });\n\n// Current state = replay of the whole log; history is never lost.\nconsole.log(project(store.load())); // { balance: 70 }",
    "pros": [
      "A complete audit trail out of the box: every change is an immutable fact, history is never lost",
      "Temporal queries: the system's state can be reconstructed at any past moment by replaying the log",
      "Debugging and analysis: replaying the events shows exactly how the system reached its current state",
      "New projections can be built retroactively—the same event log is replayed into a new read model",
      "Pairs naturally with CQRS and event-driven integration: the events already exist and can be published to other services"
    ],
    "cons": [
      "High complexity: the unfamiliar model where state is derived rather than read directly",
      "Querying current state requires replaying the log or a separate projection—snapshots are needed for performance",
      "Event-schema evolution (versioning) is hard: old events are immutable, yet their structure changes over time",
      "Eventual consistency: projections update asynchronously and lag behind the appended events",
      "Deleting data conflicts with the append-only model—GDPR compliance (right to erasure) requires special techniques (crypto-shredding)"
    ],
    "tradeoffs": [
      "Full history and audit vs. simplicity: storing and replaying events costs more than updating a single row of current state",
      "Projection flexibility vs. read cost: any state is derivable from the log, but reading a stored snapshot is faster than replaying",
      "Event immutability vs. model evolution: append-only gives a reliable audit trail but complicates versioning and data deletion",
      "Rich temporal queries vs. operational complexity: the event store and projections are extra infrastructure with their own consistency"
    ],
    "whenToUse": [
      "You need a trustworthy, immutable audit trail—domains with regulatory requirements (finance, accounting, healthcare)",
      "Temporal queries and history analysis matter: how the state changed over time and why",
      "Several different read models over the same data are required—they are conveniently built as separate projections (often together with CQRS)",
      "The domain is naturally described by events (order placed, payment received)—event-driven integration is already at its core"
    ],
    "whenNotToUse": [
      "A simple CRUD domain with no need for history or audit: storing only the current state is simpler and cheaper",
      "The team is not ready for the extra complexity—projections, event versioning, and eventual consistency",
      "The domain requires easy physical deletion of data and workarounds (crypto-shredding) are unacceptable"
    ]
  },
  "anti-corruption-layer": {
    "tagline": "A translation layer that keeps a foreign model from leaking into your domain",
    "definition": "A strategic design pattern from Domain-Driven Design (Eric Evans, part of Context Mapping): an isolating layer between two bounded contexts that translates requests and data from a foreign (legacy or external) model into the terms of your own model and back. The ACL prevents the external system's concepts, structures, and assumptions from entering your domain, protecting its integrity.",
    "problem": "Your service must integrate with a legacy system or external API that has its own — often awkward or alien — data model: cryptic field names, enum codes, denormalization, different business rules. If you call them directly, their concepts spread through the domain code: domain objects grow CUST_ID and TIER_CODE fields, and logic starts depending on the quirks of a foreign contract. The domain gradually gets 'corrupted' — any change in the external system ripples across the whole application, and your own model loses clarity.",
    "solution": "Introduce an Anti-Corruption Layer — an explicit boundary behind which all knowledge of the foreign model lives. The ACL exposes an interface (a port) to the domain in domain terms, and internally translates its calls into the external system's protocol and model, converting responses back into domain objects. Internally the ACL may consist of adapters, facades, and its own translator objects. The domain depends only on this interface and never sees foreign types; when the external contract changes, only the ACL changes.",
    "code": "// Our clean domain model\ninterface Customer { id: string; fullName: string; isPremium: boolean; }\n\n// The external/legacy system's model: foreign field names and an enum code\ninterface LegacyCrmRecord {\n  CUST_ID: string;\n  FNAME: string;\n  LNAME: string;\n  TIER_CODE: number; // 1 = standard, 2 = premium\n}\ninterface LegacyCrmClient { fetch(id: string): LegacyCrmRecord; }\n\n// Port expressed in domain terms — the only thing the domain depends on\ninterface CustomerProvider { getCustomer(id: string): Customer; }\n\n// Anti-Corruption Layer: translates the foreign model into the domain model.\n// A minimal ACL is a single translator; at scale it fans out into\n// several adapters/facades/translators behind this boundary.\nclass CrmAntiCorruptionLayer implements CustomerProvider {\n  constructor(private readonly crm: LegacyCrmClient) {}\n  getCustomer(id: string): Customer {\n    const r = this.crm.fetch(id); // the foreign model never leaves the boundary\n    return {\n      id: r.CUST_ID,\n      fullName: `${r.FNAME} ${r.LNAME}`.trim(),\n      isPremium: r.TIER_CODE === 2,\n    };\n  }\n}\n\n// The domain knows only CustomerProvider, never LegacyCrmRecord\nfunction greet(provider: CustomerProvider, id: string): string {\n  const c = provider.getCustomer(id);\n  return c.isPremium ? `Welcome back, ${c.fullName}` : `Hello, ${c.fullName}`;\n}",
    "pros": [
      "The domain is protected: the foreign model and its quirks don't seep into business logic",
      "Changes to the external or legacy contract are localized to one layer",
      "Your own model stays clean and expressive, free of integration compromises",
      "Simplifies testing the domain: the ACL is easily replaced by a test implementation of the port",
      "Provides a place for integration resilience — retries, error mapping, and caching naturally live here"
    ],
    "cons": [
      "An extra layer of code, models, and mapping that must be written and maintained",
      "The double translation adds overhead and one more hop to debug",
      "The translation logic can grow and become complex itself, especially with rich models",
      "Risk of duplication: part of the external model gets unintentionally mirrored in the domain"
    ],
    "tradeoffs": [
      "Domain purity and independence versus the cost of writing and maintaining a translation layer",
      "Localizing external-contract changes versus the overhead of double mapping",
      "Isolation from the foreign model versus the risk of duplicating its concepts on both sides of the boundary",
      "A full ACL (several translators/adapters) versus lightweight direct mapping where the models nearly coincide"
    ],
    "whenToUse": [
      "Integrating with a legacy system or external API whose model you don't control",
      "The external system's model is alien or poor and threatens to distort your domain",
      "You expect the external contract to change and want to isolate those changes",
      "Two bounded contexts interact and it matters to preserve the integrity of your model"
    ],
    "whenNotToUse": [
      "The external model nearly matches yours — a thin mapping suffices without a separate layer",
      "A one-off integration or prototype where the layer's cost isn't justified",
      "You fully control both sides and can agree on a shared model directly"
    ]
  }
};

export const questionProse: Record<string, QuestionProse> = {
  "ip-strategy-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface Compressor { compress(data: string): string; }\nclass Zip implements Compressor { compress(d: string) { return `zip(${d})`; } }\nclass Gzip implements Compressor { compress(d: string) { return `gzip(${d})`; } }\n\nclass Archiver {\n  constructor(private algo: Compressor) {}\n  use(algo: Compressor) { this.algo = algo; } // the algorithm is set from outside\n  run(data: string) { return this.algo.compress(data); }\n}",
    "options": [
      "State",
      "Strategy",
      "Observer",
      "Factory Method"
    ],
    "explanation": "The compression algorithm is injected from the outside and replaced via the use() method, while the Archiver merely delegates the work to it — this is Strategy. Not State: the switch isn't driven by the object's internal transitions, and the Archiver's state doesn't govern the choice. Not Observer: there are no subscribers and no one-to-many notification broadcast. Not Factory Method: the object isn't created by a subclass but handed in ready-made from the outside."
  },
  "ip-state-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface DocState { publish(doc: Article): void; }\nclass Draft implements DocState {\n  publish(doc: Article) { doc.setState(new Moderation()); } // the state itself defines the transition\n}\nclass Moderation implements DocState {\n  publish(doc: Article) { doc.setState(new Published()); }\n}\nclass Published implements DocState {\n  publish(_doc: Article) { /* already published — no transitions */ }\n}\n\nclass Article {\n  private state: DocState = new Draft();\n  setState(s: DocState) { this.state = s; }\n  publish() { this.state.publish(this); } // behavior depends on the state\n}",
    "options": [
      "Strategy",
      "State",
      "Observer",
      "Abstract Factory"
    ],
    "explanation": "The Draft → Moderation → Published transitions are initiated by the state objects themselves, each assigning the next state to the context, and publish() behaves differently depending on the current state — this is State. Not Strategy: the algorithm isn't selected externally by the client; the switch happens internally through the states' own logic. Not Observer: there are no subscribers or notifications. Not Abstract Factory: nothing is produced in families — behavior changes rather than objects being created."
  },
  "ip-observer-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface Subscriber { notify(headline: string): void; }\n\nclass NewsAgency {\n  private subscribers: Subscriber[] = [];\n  subscribe(s: Subscriber) { this.subscribers.push(s); }\n  publish(headline: string) {\n    for (const s of this.subscribers) s.notify(headline); // broadcast to all\n  }\n}\n\nclass EmailReader implements Subscriber {\n  notify(headline: string) { console.log(`Email: ${headline}`); }\n}",
    "options": [
      "Observer",
      "Strategy",
      "State",
      "Factory Method"
    ],
    "explanation": "NewsAgency keeps a list of subscribers and notifies each of them on publication — a one-to-many dependency with automatic notification, i.e. Observer. Not Strategy: no interchangeable algorithm is being selected; instead, notifications are broadcast to many recipients. Not State: the agency's behavior does not switch as its internal state changes, and there are no transitions. Not Factory Method: subscribers are not created by the agency but registered ready-made via subscribe()."
  },
  "ip-factory-method-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface Transport { deliver(): string; }\nclass Truck implements Transport { deliver() { return 'by road'; } }\nclass Ship implements Transport { deliver() { return 'by sea'; } }\n\nabstract class Logistics {\n  protected abstract createTransport(): Transport; // the subclass decides the type\n  planDelivery(): string {\n    const transport = this.createTransport();\n    return transport.deliver();\n  }\n}\nclass RoadLogistics extends Logistics { protected createTransport() { return new Truck(); } }\nclass SeaLogistics extends Logistics { protected createTransport() { return new Ship(); } }",
    "options": [
      "Abstract Factory",
      "Factory Method",
      "Strategy",
      "Observer"
    ],
    "explanation": "The base class Logistics declares a single factory method createTransport(), and the subclass chooses the concrete product type by overriding it (inheritance), creating exactly one product — this is Factory Method. Not Abstract Factory: there's no factory here that produces a family of several related products. Not Strategy: the subclass determines what to create rather than having a ready-made algorithm injected from outside — this is about instantiating an object, not selecting behavior. Not Observer: there are no subscribers or notifications."
  },
  "ip-abstract-factory-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface Chair { sit(): string; }\ninterface Sofa { lie(): string; }\n\ninterface FurnitureFactory {\n  createChair(): Chair; // family of related products\n  createSofa(): Sofa;\n}\n\nclass ModernChair implements Chair { sit() { return 'modern chair'; } }\nclass ModernSofa implements Sofa { lie() { return 'modern sofa'; } }\nclass VictorianChair implements Chair { sit() { return 'Victorian chair'; } }\nclass VictorianSofa implements Sofa { lie() { return 'Victorian sofa'; } }\n\nclass ModernFactory implements FurnitureFactory {\n  createChair() { return new ModernChair(); }\n  createSofa() { return new ModernSofa(); }\n}\nclass VictorianFactory implements FurnitureFactory {\n  createChair() { return new VictorianChair(); }\n  createSofa() { return new VictorianSofa(); }\n}",
    "options": [
      "Factory Method",
      "Abstract Factory",
      "Strategy",
      "Observer"
    ],
    "explanation": "The FurnitureFactory interface creates a whole family of related products (Chair and Sofa), and each concrete factory guarantees their consistency (all 'modern' or all 'Victorian') — this is Abstract Factory. Not Factory Method: there you have a single factory method for a single product with the choice made through inheritance, whereas here there are several creation methods and composition of factories. Not Strategy: the factories create objects rather than swap an interchangeable behavioral algorithm. Not Observer: there is no subscription or notification."
  },
  "c-srp-1": {
    "prompt": "Which statement most precisely captures the Single Responsibility Principle?",
    "options": [
      "A class should have one, and only one, reason to change",
      "A class should be open for extension but closed for modification",
      "A client should not depend on methods it does not use",
      "A subtype should be substitutable for its base type"
    ],
    "explanation": "SRP: a module has one reason to change — it is responsible to a single actor. The second option describes OCP, the third ISP, and the fourth LSP."
  },
  "c-ocp-1": {
    "prompt": "What does the Open/Closed Principle state?",
    "options": [
      "High-level modules should not depend on low-level ones",
      "Entities should be open for extension but closed for modification",
      "A module should have a single reason to change",
      "Many narrow interfaces are better than one \"fat\" one"
    ],
    "explanation": "OCP: new behavior is added through extension while existing code stays unchanged. The first option describes DIP, the third SRP, and the fourth ISP."
  },
  "c-lsp-1": {
    "prompt": "What requirement does the Liskov Substitution Principle express?",
    "options": [
      "Each class is responsible for exactly one responsibility",
      "Dependencies should point toward abstractions",
      "Objects of the base type can be replaced with objects of a subtype without breaking the correctness of the program",
      "Behavior can be changed without touching existing code"
    ],
    "explanation": "LSP: a subtype must honor the base type's contract and be substitutable for it. The first option describes SRP, the second DIP, and the fourth OCP."
  },
  "c-isp-1": {
    "prompt": "What does the Interface Segregation Principle recommend?",
    "options": [
      "Break large interfaces into narrow, client-specific ones",
      "A subtype must honor the contract of its base type",
      "A class shouldn't create its own dependencies",
      "A module should have only one reason to change"
    ],
    "explanation": "ISP: a client shouldn't depend on methods it doesn't use, so fat interfaces are split into narrow roles. The second option is LSP, the third reflects the idea of DIP, and the fourth is SRP."
  },
  "c-dip-1": {
    "prompt": "What does the Dependency Inversion Principle state?",
    "options": [
      "Interfaces should be as small as possible",
      "A class should have a single reason to change",
      "Subtypes are interchangeable with their base class",
      "High-level and low-level modules depend on abstractions rather than directly on each other"
    ],
    "explanation": "DIP: both high-level and low-level modules depend on abstractions; details depend on abstractions, not the other way around. The first option is ISP, the second is SRP, the third is LSP."
  },
  "t-srp-1": {
    "prompt": "What is the main trade-off of following SRP strictly?",
    "options": [
      "More small classes and more jumping between files, in exchange for low coupling and changes that are easy to make",
      "SRP speeds up program execution at the cost of higher memory use",
      "SRP removes the need to write tests",
      "SRP always reduces the total number of classes"
    ],
    "explanation": "Separating responsibilities lowers coupling and localizes changes, but it increases the number of classes and the cost of navigating the code. The other options are wrong: SRP is not about performance, does not do away with tests, and usually increases the number of classes."
  },
  "t-ocp-1": {
    "prompt": "When does applying OCP tend to hurt more than help?",
    "options": [
      "When the set of variants is stable: abstracting for the sake of extension adds complexity with no real payoff",
      "When the project has automated tests",
      "OCP is always beneficial, in every case without exception",
      "When the project is written in TypeScript"
    ],
    "explanation": "OCP's flexibility isn't free: if no extension ever happens, premature abstractions only complicate the code (the risk of premature generalization). Having tests and the project's language are irrelevant to this trade-off, and \"always beneficial\" is exactly the false claim."
  },
  "t-dip-1": {
    "prompt": "What trade-off does applying the Dependency Inversion Principle carry?",
    "options": [
      "DIP removes all interfaces from the project",
      "Decoupling of modules and testability come at the cost of extra abstractions and indirection",
      "DIP speeds up the code by giving up polymorphism",
      "DIP forbids using concrete classes anywhere in the system"
    ],
    "explanation": "DIP decouples the business logic from the infrastructure and makes testing easier by swapping implementations, but it adds abstractions, indirection, and the need for dependency injection. The other options distort its point: DIP introduces abstractions rather than removing them, is not about speed, and does not forbid concrete classes — it merely inverts the direction of the dependency."
  },
  "c-singleton-1": {
    "prompt": "What does the Singleton pattern guarantee?",
    "options": [
      "A class creates families of related objects without specifying their concrete classes",
      "A class has only one instance, and a global point of access to it is provided",
      "A large number of fine-grained objects save memory by sharing common state",
      "Object creation is delegated to subclasses, which decide which type to instantiate"
    ],
    "explanation": "Per GoF, Singleton guarantees that a class has a single instance and provides a global point of access to it — typically through a private constructor and a static getInstance() method. The first option describes Abstract Factory (families of related products). The third is Flyweight (sharing intrinsic state across many objects to save memory). The fourth is Factory Method (the choice of the concrete product type is deferred to subclasses)."
  },
  "ip-singleton-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "class Logger {\n  private static instance: Logger | null = null;\n  private readonly lines: string[] = [];\n\n  private constructor() {} // constructor is hidden: new Logger() is inaccessible from the outside\n\n  static getInstance(): Logger {\n    if (Logger.instance === null) {\n      Logger.instance = new Logger(); // created only once\n    }\n    return Logger.instance;\n  }\n\n  log(message: string) { this.lines.push(message); }\n  history(): readonly string[] { return this.lines; }\n}\n\nconst first = Logger.getInstance();\nconst second = Logger.getInstance();\nconsole.log(first === second); // true — both point to the same object",
    "options": [
      "Flyweight",
      "Abstract Factory",
      "Singleton",
      "Facade"
    ],
    "explanation": "The private constructor forbids creation via new, the static field holds the single instance, and getInstance() lazily creates it once and always returns the same object (first === second) — this is Singleton. Not Flyweight: there, many fine-grained objects save memory by sharing common intrinsic state, whereas here there is exactly one object and no state is shared between objects. Not Abstract Factory: there is no factory that creates a family of related products behind an interface — the method returns the class itself, not a set of products. Not Facade: Logger does not provide a simplified interface to a complex subsystem — it is itself the single object, not a wrapper over others."
  },
  "c-builder-1": {
    "prompt": "What is the main purpose of the Builder pattern?",
    "options": [
      "Provide an interface for creating families of related objects without specifying their concrete classes",
      "Create new objects by copying an existing prototype instance",
      "Separate the construction of a complex object from its representation, so that the same construction process can create different representations",
      "Delegate the choice of the concrete class to instantiate to subclasses through an overridable method"
    ],
    "explanation": "Per GoF, Builder separates the construction of a complex object from its representation: the client specifies the parts step by step, and the same construction process can yield different representations. The first option is the definition of Abstract Factory (families of related products). The second is Prototype (creation by copying an instance). The fourth is Factory Method (a subclass decides which class to instantiate)."
  },
  "ip-builder-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface Query { readonly sql: string; readonly params: unknown[]; }\n\nclass QueryBuilder {\n  private table = '';\n  private conditions: string[] = [];\n  private params: unknown[] = [];\n  from(table: string): this { this.table = table; return this; }\n  where(cond: string, param: unknown): this { // the next construction step\n    this.conditions.push(cond);\n    this.params.push(param);\n    return this;\n  }\n  build(): Query { // the finished object appears only at the end\n    const where = this.conditions.length ? ` WHERE ${this.conditions.join(' AND ')}` : '';\n    return { sql: `SELECT * FROM ${this.table}${where}`, params: [...this.params] };\n  }\n}\n\nconst query = new QueryBuilder()\n  .from('users')\n  .where('age > ?', 18)\n  .where('active = ?', true)\n  .build(); // the object is assembled step by step from optional parts",
    "options": [
      "Factory Method",
      "Builder",
      "Prototype",
      "Abstract Factory"
    ],
    "explanation": "The Query object is assembled step by step through calls to from() and where(), the client decides how many steps to take, and the finished product appears only when build() is called — this is Builder. Not Factory Method: there is no hierarchy with an overridable factory method where a subclass chooses the concrete product class. Not Prototype: the object is not created by copying an existing instance. Not Abstract Factory: no family of related products is produced through a set of factory methods — a single complex object is constructed part by part."
  },
  "c-prototype-1": {
    "prompt": "Which statement most accurately captures the essence of the Prototype pattern?",
    "options": [
      "Defines an interface for creating an object, but lets subclasses decide which class to instantiate",
      "Specifies the kinds of objects to create using a prototypical instance, and creates new objects by copying this prototype",
      "Ensures a class has only one instance and provides a global point of access to it",
      "Separates the construction of a complex object from its representation, allowing it to be built step by step"
    ],
    "explanation": "Prototype in GoF terms: the kinds of objects to create are specified by a prototypical instance, and new objects are obtained by copying it — the object clones itself through clone(), and the client doesn't depend on concrete classes. The first option is the definition of Factory Method (creation is delegated to subclasses by overriding a method). The third is Singleton (a single instance with global access). The fourth is Builder (step-by-step construction of a complex object). Only the second option describes creation by copying an existing instance."
  },
  "ip-prototype-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface Cloneable { clone(): Cloneable; }\n\nclass Enemy implements Cloneable {\n  constructor(\n    private health: number,\n    private speed: number,\n    private loot: string[],\n  ) {}\n  clone(): Enemy {\n    return new Enemy(this.health, this.speed, [...this.loot]); // a copy with the same state\n  }\n}\n\nclass Spawner {\n  constructor(private sample: Enemy) {} // the prototypical instance\n  spawn(): Enemy {\n    return this.sample.clone(); // new objects — by copying the prototype\n  }\n}\n\nconst boss = new Enemy(500, 1.2, ['gold', 'sword']);\nconst spawner = new Spawner(boss);\nconst enemy1 = spawner.spawn();\nconst enemy2 = spawner.spawn(); // independent copies",
    "options": [
      "Builder",
      "Prototype",
      "Memento",
      "Factory Method"
    ],
    "explanation": "Enemy creates its own copy via the clone() method (having access to its private fields), and Spawner mass-produces new objects by copying a pre-configured prototypical instance — this is Prototype. Not Builder: there is no step-by-step construction of a complex object through a chain of steps and a final build() — the copy is created in a single call. Not Memento: state isn't saved into a snapshot to later restore the same object — new independent objects are created. Not Factory Method: there is no base class with a factory method that subclasses override — the object is produced by copying a ready-made instance rather than via new in a subclass."
  },
  "c-adapter-1": {
    "prompt": "Which statement most accurately describes the Adapter pattern?",
    "options": [
      "Dynamically adds new responsibilities to an object while preserving its original interface",
      "Converts the interface of an existing class into the interface a client expects, letting classes with incompatible interfaces work together",
      "Provides a single, simplified interface to an entire subsystem of many classes",
      "Substitutes a surrogate object with the same interface that controls access to the real object"
    ],
    "explanation": "In GoF, Adapter converts the interface of a class into another one that the client expects — changing the interface is precisely its essence. The first option describes Decorator: it adds behavior but doesn't change the interface. The third is Facade: a simplified entry point into a subsystem, not the adaptation of one class to an already-existing target interface. The fourth is Proxy: the same interface as the real object plus access control, whereas Adapter specifically converts the interface."
  },
  "ip-adapter-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "// Interface that the application expects\ninterface PaymentProcessor { pay(amountCents: number): string; }\n\n// Third-party SDK with an incompatible interface — we can't change it\nclass StripeSdk {\n  makeCharge(amountDollars: number, currency: string): string {\n    return `charged ${amountDollars} ${currency}`;\n  }\n}\n\nclass StripePaymentAdapter implements PaymentProcessor {\n  constructor(private sdk: StripeSdk) {}\n  pay(amountCents: number): string {\n    return this.sdk.makeCharge(amountCents / 100, 'USD'); // translate the call and the data\n  }\n}\n\nfunction checkout(processor: PaymentProcessor) {\n  return processor.pay(2500);\n}\ncheckout(new StripePaymentAdapter(new StripeSdk()));",
    "options": [
      "Facade",
      "Adapter",
      "Decorator",
      "Proxy"
    ],
    "explanation": "StripePaymentAdapter implements the target interface PaymentProcessor that the application expects, wraps the incompatible StripeSdk, and translates the pay() call into makeCharge(), converting the data (cents to dollars) — this is Adapter. Not Facade: it isn't simplifying access to a subsystem of many classes — a single class is brought to the client's already-existing interface. Not Decorator: the wrapper doesn't add new responsibilities to the object and doesn't preserve its original interface — the interface is specifically changed. Not Proxy: with Proxy the interface matches that of the wrapped object and the goal is access control, whereas here the interfaces differ and the goal is compatibility."
  },
  "c-bridge-1": {
    "prompt": "Which statement most accurately describes the intent of the Bridge pattern?",
    "options": [
      "Converts the interface of an existing class into the interface a client expects, so that incompatible classes can work together",
      "Decouples an abstraction from its implementation into two independent hierarchies linked by composition, so that the two can vary independently",
      "Dynamically adds new responsibilities to an object by wrapping it in an object with the same interface",
      "Provides a single, simplified interface to a complex subsystem"
    ],
    "explanation": "Bridge (GoF) means “decouple an abstraction from its implementation so that the two can vary independently”: the abstraction holds its implementation via composition and delegates the primitives to it, and each hierarchy is extended by its own subclasses. The first option is Adapter: it retrofits already-existing, incompatible interfaces to work together, whereas in Bridge both sides are designed together up front. The third option is Decorator: a wrapper with the same interface that adds responsibilities, not the separation of two dimensions of variation. The fourth is Facade: a simplified entry point into a subsystem, not a pair of parallel hierarchies."
  },
  "ip-bridge-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface Device { volume(): number; setVolume(v: number): void; } // implementation hierarchy\n\nclass Tv implements Device {\n  private v = 30;\n  volume() { return this.v; }\n  setVolume(v: number) { this.v = v; }\n}\nclass Radio implements Device {\n  private v = 10;\n  volume() { return this.v; }\n  setVolume(v: number) { this.v = v; }\n}\n\n// abstraction hierarchy: holds the device via composition\nclass Remote {\n  constructor(protected device: Device) {}\n  volumeUp() { this.device.setVolume(this.device.volume() + 10); }\n}\nclass AdvancedRemote extends Remote {\n  mute() { this.device.setVolume(0); } // the abstraction is extended independently of the devices\n}\n\nconst remote = new AdvancedRemote(new Radio()); // combinations are assembled at run time",
    "options": [
      "Strategy",
      "Adapter",
      "Bridge",
      "Abstract Factory"
    ],
    "explanation": "Here there are two independent hierarchies: the abstraction (Remote → AdvancedRemote) and the implementation (Device → Tv, Radio), linked by composition. The abstraction delegates primitive operations to the device, and both hierarchies are extended independently — this is Bridge. Not Strategy: Device is not an interchangeable algorithm for a single behavior but an entire implementation dimension, and the abstraction side also forms its own subclass hierarchy (AdvancedRemote), which Strategy does not have. Not Adapter: no existing class with an incompatible interface is being adapted to an expected one — the Remote and Device interfaces were designed together up front. Not Abstract Factory: the code does not create anything in families of related products — the device is passed in ready-made, and the point is the delegation structure, not object creation."
  },
  "c-composite-1": {
    "prompt": "Which statement most accurately describes the Composite pattern?",
    "options": [
      "Dynamically adds new responsibilities to an object by wrapping it in an object with the same interface",
      "Provides a unified interface to a set of interfaces in a complex subsystem",
      "Composes objects into part-whole tree structures and lets the client work uniformly with individual objects and their compositions",
      "Shares common state among many fine-grained objects to save memory"
    ],
    "explanation": "Composite (GoF) is precisely a part-whole tree built on a common Component interface: a leaf carries out the operation itself, a container recursively delegates it to its children, and the client does not distinguish a single object from a composition. The first option describes Decorator, where a wrapper around exactly one object adds responsibilities rather than assembling a hierarchy. The second is Facade — a simplified entry point into a subsystem, with no tree structure. The fourth is Flyweight — saving memory through shared state, which has nothing to do with part-whole composition."
  },
  "ip-composite-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface OrgUnit { headcount(): number; }\n\nclass Employee implements OrgUnit {\n  headcount() { return 1; } // leaf: counts itself\n}\n\nclass Department implements OrgUnit {\n  private units: OrgUnit[] = [];\n  add(unit: OrgUnit) { this.units.push(unit); return this; }\n  headcount() {\n    // the container recursively delegates the operation to its children\n    return this.units.reduce((total, u) => total + u.headcount(), 0);\n  }\n}\n\nconst company = new Department()\n  .add(new Employee())\n  .add(new Department().add(new Employee()).add(new Employee()));\n\nconsole.log(company.headcount()); // 3 — an employee and a department are handled uniformly",
    "options": [
      "Decorator",
      "Composite",
      "Visitor",
      "Iterator"
    ],
    "explanation": "Employee (the leaf) and Department (the container) implement a common OrgUnit interface; the container holds an arbitrary number of children and recursively aggregates headcount() over the part-whole tree, and the client does not distinguish an employee from an entire department — this is Composite. Not Decorator: a decorator wraps exactly one object to add responsibilities to it, whereas here a node holds many children and aggregates them without enriching anything. Not Visitor: the headcount() operation is declared on the nodes themselves, with no separate visitor object and no double dispatch through accept/visit. Not Iterator: the Iterator pattern extracts collection traversal into a separate object with sequential access, whereas here traversal is an internal detail of the recursive operation rather than a standalone abstraction."
  },
  "c-decorator-1": {
    "prompt": "Which statement most precisely captures the intent of the Decorator pattern?",
    "options": [
      "Substitutes a surrogate with the same interface in place of an object in order to control access to it",
      "Converts the interface of a class into another interface the client expects",
      "Dynamically adds new responsibilities to an object by wrapping it in an object with the same interface — a flexible alternative to inheritance",
      "Composes objects into part-whole tree structures and lets the client treat leaves and containers uniformly"
    ],
    "explanation": "Per GoF, Decorator dynamically attaches additional responsibilities to an object through a wrapper with the same interface and serves as a flexible alternative to subclassing: behavior combinations are assembled at runtime rather than fixed by a hierarchy. The first option describes Proxy — there the wrapper exists to control access (lazy loading, caching, protection), not to build up behavior. The second is Adapter: it changes the interface to one incompatible with the original, whereas Decorator preserves the interface. The fourth is Composite: it is about part-whole trees, not about adding responsibilities to a single object."
  },
  "ip-decorator-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface Notifier { send(msg: string): void; }\n\nclass EmailNotifier implements Notifier {\n  send(msg: string) { console.log(`email: ${msg}`); }\n}\n\nabstract class NotifierWrapper implements Notifier {\n  constructor(protected inner: Notifier) {}\n  send(msg: string) { this.inner.send(msg); }\n}\n\nclass SmsNotifier extends NotifierWrapper {\n  send(msg: string) {\n    super.send(msg);\n    console.log(`sms: ${msg}`); // added responsibility\n  }\n}\n\nclass SlackNotifier extends NotifierWrapper {\n  send(msg: string) {\n    super.send(msg);\n    console.log(`slack: ${msg}`);\n  }\n}\n\n// wrappers are stacked at runtime in the desired combination\nconst notifier: Notifier = new SlackNotifier(new SmsNotifier(new EmailNotifier()));\nnotifier.send('deploy complete');",
    "options": [
      "Proxy",
      "Decorator",
      "Composite",
      "Adapter"
    ],
    "explanation": "Each wrapper implements the same Notifier interface, holds a reference to the nested object, delegates the call to it, and adds its own behavior, and the wrappers stack into a chain at runtime — this is Decorator. Not Proxy: a proxy controls access to a single object (lazy loading, caching, protection) without adding a stack of new responsibilities, and it typically manages the lifecycle of the real object itself — here the goal is precisely layering behavior. Not Composite: there a container holds a collection of children and builds a part-whole tree, whereas here each wrapper holds exactly one nested object. Not Adapter: an adapter converts one interface into another, incompatible one, whereas here the interface is the same at every level."
  },
  "c-facade-1": {
    "prompt": "Which statement most accurately describes the intent of the Facade pattern?",
    "options": [
      "Provides a unified, higher-level interface to a set of interfaces in a subsystem, making it easier to use",
      "Converts the interface of an existing class into another interface that the client expects",
      "Encapsulates the interaction of a set of objects that communicate through a mediator rather than directly with each other",
      "Provides a surrogate with the same interface as an object in order to control access to it"
    ],
    "explanation": "By the GoF definition, Facade provides a unified, higher-level interface to a set of interfaces in a subsystem, making it easier to use; the subsystem still remains directly accessible. The second option describes Adapter, which fits an incompatible interface to the one the client expects. The third is Mediator, where colleague objects communicate with one another through a mediator, rather than a client communicating with a subsystem. The fourth is Proxy: a surrogate mirrors the interface of a single object and controls access to it, whereas a facade introduces a new, simplified interface over several objects."
  },
  "ip-facade-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "class CodecResolver { resolve(format: string) { return `codec:${format}`; } }\nclass BitrateReader { read(file: string) { return `${file}:320kbps`; } }\nclass AudioMixer { mix(file: string) { return `audio(${file})`; } }\n\nclass VideoConverter {\n  private codecs = new CodecResolver();\n  private bitrate = new BitrateReader();\n  private mixer = new AudioMixer();\n\n  convert(file: string, format: string): string {\n    // one simple operation hides the work of several subsystem classes\n    const codec = this.codecs.resolve(format);\n    const rate = this.bitrate.read(file);\n    const audio = this.mixer.mix(file);\n    return `${file} -> ${format} [${codec}, ${rate}, ${audio}]`;\n  }\n}\n\nconst converter = new VideoConverter();\nconverter.convert('movie.avi', 'mp4');",
    "options": [
      "Mediator",
      "Facade",
      "Adapter",
      "Proxy"
    ],
    "explanation": "VideoConverter gives the client a single high-level convert() method that hides several subsystem classes and the order in which they are invoked — that is Facade. Not Mediator: the subsystem classes do not communicate with each other through a mediator; the calls flow one way, from the facade to the subsystem, and the subsystem is unaware of the facade. Not Adapter: there is no incompatible interface being fitted to a target interface the client expects — a new, simplified interface is introduced. Not Proxy: the converter does not mirror the interface of a single real object or control access to it; instead it aggregates several different objects under a simpler API."
  },
  "c-flyweight-1": {
    "prompt": "Which statement best describes the intent of the Flyweight pattern?",
    "options": [
      "Ensures a class has only one instance and provides a global point of access to it",
      "Shares immutable intrinsic state across many small objects and passes contextual (extrinsic) state in from outside, saving memory",
      "Creates new objects by cloning an existing prototype, avoiding expensive re-initialization",
      "Substitutes a surrogate object with the same interface that controls access to the real object"
    ],
    "explanation": "Per GoF, Flyweight \"uses sharing to support large numbers of fine-grained objects efficiently\": the immutable intrinsic part lives in shared objects that a factory reuses, while the client passes the extrinsic part in from outside — hence the memory savings. The first option describes Singleton, where a class has a single instance; Flyweight has many instances — one per combination of intrinsic state. The third is Prototype: creation by cloning, whereas Flyweight does the opposite, avoiding creation by returning an object that already exists. The fourth is Proxy: a surrogate controls access to a single object rather than sharing state across many."
  },
  "ip-flyweight-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "class Glyph {\n  constructor(readonly char: string, readonly font: string) {} // shared part\n  render(x: number, y: number): string { // position comes from outside\n    return `${this.char}[${this.font}] @ (${x}, ${y})`;\n  }\n}\n\nclass GlyphFactory {\n  private cache = new Map<string, Glyph>();\n  get(char: string, font: string): Glyph {\n    const key = `${char}:${font}`;\n    let glyph = this.cache.get(key);\n    if (!glyph) {\n      glyph = new Glyph(char, font);\n      this.cache.set(key, glyph);\n    }\n    return glyph; // same object for the same data\n  }\n}\n\nconst factory = new GlyphFactory();\nconst a1 = factory.get('a', 'Arial');\nconst a2 = factory.get('a', 'Arial');\nconsole.log(a1 === a2); // true: one object for thousands of occurrences of the character\nconsole.log(a1.render(10, 20));\nconsole.log(a2.render(300, 20));",
    "options": [
      "Proxy",
      "Flyweight",
      "Singleton",
      "Prototype"
    ],
    "explanation": "Glyph stores only the immutable, shared (intrinsic) part — the character and the font — while the position (extrinsic) is passed into render() from outside; the factory caches objects by key and returns the same instance for identical data (a1 === a2). That's Flyweight. Not Singleton: the class doesn't restrict itself to a single instance — there are many glyphs, one per \"character + font\" combination. Not Prototype: objects aren't created by cloning a prototype — the factory either creates one with new or returns an existing one. Not Proxy: GlyphFactory isn't a surrogate with the same interface controlling access to another object — it merely reuses shared instances to save memory."
  },
  "c-proxy-1": {
    "prompt": "Which statement most accurately describes the Proxy pattern?",
    "options": [
      "Dynamically adds new responsibilities to an object by wrapping it in a chain of wrappers",
      "Provides a surrogate with the same interface that controls access to the real object",
      "Converts a class's interface into another interface the client expects",
      "Provides a single, simplified interface to a set of interfaces in a complex subsystem"
    ],
    "explanation": "A Proxy is a surrogate for another object: it implements the same Subject interface and controls access to the real object (lazy creation, permission checks, caching, remote calls). The first option describes Decorator, whose goal is to add responsibilities rather than manage access. The third is Adapter, which changes the interface to one incompatible with the original, whereas a Proxy preserves the interface. The fourth is Facade — a simplified front over a whole subsystem, not a one-to-one surrogate for a single object."
  },
  "ip-proxy-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface FinancialReport { read(): string; }\n\nclass QuarterReport implements FinancialReport {\n  read() { return 'quarterly financial figures'; }\n}\n\nclass ReportProxy implements FinancialReport {\n  private real: QuarterReport | null = null;\n  constructor(private role: string) {}\n  read() {\n    if (this.role !== 'admin') {\n      throw new Error('Access denied'); // access control before delegating\n    }\n    this.real ??= new QuarterReport(); // the real object is created lazily\n    return this.real.read();\n  }\n}\n\nconst report: FinancialReport = new ReportProxy('admin');\nreport.read(); // the client doesn't know it's working through a proxy",
    "options": [
      "Decorator",
      "Proxy",
      "Adapter",
      "Facade"
    ],
    "explanation": "ReportProxy implements the same FinancialReport interface, manages the real object's lifecycle itself (creating QuarterReport lazily), and decides whether to let the request reach it (a role check) — this is a Proxy that controls access to the object. It isn't Decorator: the wrapper doesn't add new responsibilities to the result but instead restricts and defers access; besides, a decorator is handed the real object ready-made from outside, whereas here the proxy creates it itself. It isn't Adapter: the interface isn't converted — the proxy and the real object share the same one (FinancialReport). It isn't Facade: there's no simplification of a complex, many-class subsystem, just a one-to-one representative for exactly one object."
  },
  "c-chain-of-responsibility-1": {
    "prompt": "What is the key idea behind the Chain of Responsibility pattern?",
    "options": [
      "A request is passed along a chain of linked handlers until one of them handles it; the sender does not know the ultimate receiver",
      "When the source's state changes, all registered receivers are automatically notified",
      "A request is encapsulated as an object, which allows it to be queued, logged, and undone",
      "The interaction among many objects is centralized in a single mediator so that they do not reference each other directly"
    ],
    "explanation": "Chain of Responsibility decouples the sender from the receiver: the handlers are linked into a chain, and each one either handles the request itself or passes it to the next — so the first option is correct. The second option describes Observer: there the subject broadcasts to all its subscribers at once, rather than passing a request along until the first one handles it. The third is Command: its essence is turning a request into a standalone object with execute(), not routing it along a chain. The fourth is Mediator: there many-to-many connections are replaced by a central coordinator, whereas in the chain the links are connected linearly and each knows only the next one."
  },
  "ip-chain-of-responsibility-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "abstract class CheckHandler {\n  private next: CheckHandler | null = null;\n  setNext(h: CheckHandler): CheckHandler { this.next = h; return h; }\n  check(user: string): string {\n    return this.next ? this.next.check(user) : 'access granted'; // pass it on\n  }\n}\n\nclass AuthCheck extends CheckHandler {\n  check(user: string) {\n    if (user === '') return 'error: not authenticated'; // handled it itself — the chain is stopped\n    return super.check(user);\n  }\n}\nclass RoleCheck extends CheckHandler {\n  check(user: string) {\n    if (user !== 'admin') return 'error: no permissions';\n    return super.check(user);\n  }\n}\n\nconst chain = new AuthCheck();\nchain.setNext(new RoleCheck());\nchain.check('admin'); // each check either responds itself or passes it to the next one",
    "options": [
      "Decorator",
      "Chain of Responsibility",
      "Command",
      "Mediator"
    ],
    "explanation": "The handlers are linked into a chain via setNext(), and the check() request travels along it: each link either responds itself and stops the processing or passes the request to the next one, while the client interacts only with the first link — this is Chain of Responsibility. Not Decorator: a decorator wraps a base component, always delegates to it, and adds behavior \"around\" it, whereas here there is no wrapped core and a link can terminate the processing without passing it on. Not Command: the request is not turned into a standalone object with an execute() method — there is no encapsulated action, queuing, or undo. Not Mediator: there is no central mediator coordinating the interaction among many colleagues — the links are connected linearly and each one knows only its successor."
  },
  "c-command-1": {
    "prompt": "Which statement most accurately describes the Command pattern?",
    "options": [
      "Defines a family of interchangeable algorithms that the client plugs into a context from the outside",
      "Encapsulates a request as an object, letting you queue requests, log them, and support undoable operations",
      "Captures and restores an object's internal state without exposing the details of its implementation",
      "Replaces direct connections between objects with communication through a central mediator object"
    ],
    "explanation": "In the GoF sense, Command turns a request into a standalone object: the command holds the receiver and the call parameters, so requests can be passed around, queued, logged, and reversed via undo(). The first option is the definition of Strategy: there you swap out the algorithm for solving a single task rather than packaging a request-action. The third option is Memento: it's about state snapshots for rollback, not about encapsulating a call. The fourth is Mediator: it centralizes the interaction of many objects rather than wrapping individual operations into objects."
  },
  "ip-command-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface EditorCommand { execute(): void; undo(): void; }\n\nclass TextDocument {\n  content = '';\n  append(text: string) { this.content += text; }\n  cut(len: number) { this.content = this.content.slice(0, -len); }\n}\n\nclass AppendCommand implements EditorCommand {\n  constructor(private doc: TextDocument, private text: string) {} // receiver + parameters\n  execute() { this.doc.append(this.text); }\n  undo() { this.doc.cut(this.text.length); }\n}\n\nclass Toolbar {\n  private history: EditorCommand[] = [];\n  run(cmd: EditorCommand) { cmd.execute(); this.history.push(cmd); } // the request is an object in the history\n  undoLast() { this.history.pop()?.undo(); }\n}",
    "options": [
      "Memento",
      "Command",
      "Strategy",
      "Mediator"
    ],
    "explanation": "The 'append text' request is packaged as an AppendCommand object that holds the receiver (TextDocument) and the call parameters; the Toolbar invoker runs commands through a uniform interface, builds up a history, and undoes them via undo() — this is Command. Not Memento: there are no document state snapshots that get saved and restored — the undo is performed by the inverse cut() operation, not by rolling back to a saved state. Not Strategy: commands aren't interchangeable algorithms for solving a single task but standalone request-actions that are pushed onto a history and undone; Strategy has neither undo() nor a log. Not Mediator: the objects don't communicate through a central intermediary — the Toolbar merely runs and stores commands rather than coordinating the interaction of colleagues."
  },
  "c-interpreter-1": {
    "prompt": "Which description most precisely captures the intent of the Interpreter pattern?",
    "options": [
      "Lets you add new operations over an object structure without changing the classes of its elements",
      "Given a language, defines a representation of its grammar and an interpreter that uses that representation to interpret sentences in the language",
      "Encapsulates a request as an object, letting you queue, log, and undo operations",
      "Composes objects into part-whole tree structures, letting clients treat individual leaves and containers uniformly"
    ],
    "explanation": "The second option is correct — it's the canonical GoF definition of Interpreter: each grammar rule corresponds to a class, and sentences in the language are represented as a tree of such objects and evaluated by a recursive interpret method that takes a context. The first option describes Visitor, where new operations are added from the outside rather than defining a language's grammar. The third describes Command — encapsulating an action as an object, with no language or grammar involved. The fourth describes Composite: Interpreter does build a tree (and often uses Composite as its structure), but the essence of Composite is uniform part-whole treatment, not representing a grammar and interpreting sentences."
  },
  "ip-interpreter-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface BoolExp { interpret(ctx: Record<string, boolean>): boolean; }\n\n// terminal grammar symbol: a variable from the context\nclass VarExp implements BoolExp {\n  constructor(private name: string) {}\n  interpret(ctx: Record<string, boolean>) { return ctx[this.name] ?? false; }\n}\n\n// nonterminal rules recursively interpret their subexpressions\nclass AndExp implements BoolExp {\n  constructor(private left: BoolExp, private right: BoolExp) {}\n  interpret(ctx: Record<string, boolean>) {\n    return this.left.interpret(ctx) && this.right.interpret(ctx);\n  }\n}\nclass NotExp implements BoolExp {\n  constructor(private operand: BoolExp) {}\n  interpret(ctx: Record<string, boolean>) { return !this.operand.interpret(ctx); }\n}\n\n// a sentence in the rules mini-language: isAdmin && !isBanned\nconst rule = new AndExp(new VarExp('isAdmin'), new NotExp(new VarExp('isBanned')));\nrule.interpret({ isAdmin: true, isBanned: false }); // true",
    "options": [
      "Composite",
      "Interpreter",
      "Visitor",
      "Strategy"
    ],
    "explanation": "Each grammar rule of the boolean mini-language is represented by a class (VarExp is a terminal symbol; AndExp and NotExp are nonterminals), the sentence \"isAdmin && !isBanned\" is assembled into a tree, and evaluating it — a recursive interpret call that threads a context through — is Interpreter. Not Composite: the tree here is merely a carrier for the grammar, and the point of the code is interpreting sentences of a language against a context, not treating a part-whole hierarchy uniformly. Not Visitor: the interpret operation is declared inside the nodes themselves; there's no external visitor object using double dispatch to add operations from the outside. Not Strategy: the classes aren't interchangeable algorithms for a single action that a client plugs into a context — they're grammar nodes combined into an expression."
  },
  "c-iterator-1": {
    "prompt": "What is the essence of the Iterator pattern?",
    "options": [
      "Lets you add new operations to element classes without modifying those classes themselves",
      "Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation",
      "Composes objects into a tree structure and lets you treat a group of objects just like a single one",
      "Provides a single simplified interface to a complex subsystem of classes"
    ],
    "explanation": "The GoF Iterator is about sequential access to the elements of an aggregate without exposing its internal structure: traversal is extracted into a separate object with its own position. The first option describes Visitor (new operations without changing the element classes), the third describes Composite (a part-whole tree treated uniformly), and the fourth describes Facade (a simplified entry point into a subsystem)."
  },
  "ip-iterator-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface BookIterator {\n  hasNext(): boolean;\n  next(): string;\n}\n\nclass Shelf {\n  private books: string[] = [];\n  add(title: string) { this.books.push(title); }\n  createIterator(): BookIterator {\n    return new ShelfIterator(this.books); // traversal is delegated to a separate object\n  }\n}\n\nclass ShelfIterator implements BookIterator {\n  private position = 0;\n  constructor(private books: string[]) {}\n  hasNext() { return this.position < this.books.length; }\n  next() { return this.books[this.position++]; }\n}\n\nconst shelf = new Shelf();\nshelf.add('Design Patterns');\nconst it = shelf.createIterator();\nwhile (it.hasNext()) console.log(it.next());",
    "options": [
      "Visitor",
      "Iterator",
      "Composite",
      "Facade"
    ],
    "explanation": "The collection's traversal is extracted into a separate ShelfIterator object with a hasNext()/next() interface and its own position; the client iterates over the books sequentially without seeing Shelf's internal array — this is Iterator. Not Visitor: there is no accept/visit pair or double dispatch, and no new operations are added to the elements — they are simply iterated over. Not Composite: there is no part-whole tree structure with a common interface for leaves and containers — Shelf holds a flat list. Not Facade: ShelfIterator does not simplify access to a complex subsystem of many classes; it solves a single task — sequentially traversing one collection."
  },
  "c-mediator-1": {
    "prompt": "What is the essence of the Mediator pattern?",
    "options": [
      "Defines a one-to-many dependency in which all subscribers are automatically notified when the source's state changes",
      "Encapsulates how a set of objects interact in a separate object so that the participants don't reference one another directly",
      "Provides a single simplified interface to a complex subsystem, hiding its internal structure from the client",
      "Encapsulates a request as an object, letting you parameterize receivers, queue operations, and undo them"
    ],
    "explanation": "In GoF terms, Mediator defines an object that encapsulates how a set of objects interact: colleagues know only the mediator, the many-to-many web of connections is replaced by a star, and the interaction scheme can be changed independently of the participants. The first option is Observer — a one-way broadcast of notifications from a source to its subscribers, not the coordination of peer participants. The third is Facade — a simplified front for an external client, where the subsystem is unaware of the facade, whereas a Mediator's colleagues actively talk to the mediator. The fourth is Command — turning a request into an object for the sake of queuing and undo, which has nothing to do with coordinating interaction."
  },
  "ip-mediator-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface ChatMediator { send(text: string, from: User, to: string): void; }\n\nclass User {\n  constructor(private mediator: ChatMediator, readonly name: string) {}\n  say(text: string, to: string) {\n    this.mediator.send(text, this, to); // a participant knows only the mediator\n  }\n  receive(text: string) { console.log(`${this.name} received: ${text}`); }\n}\n\nclass ChatRoom implements ChatMediator {\n  private users = new Map<string, User>();\n  register(user: User) { this.users.set(user.name, user); }\n  send(text: string, from: User, to: string) {\n    // the mediator, not the participants, determines routing\n    this.users.get(to)?.receive(`${from.name}: ${text}`);\n  }\n}",
    "options": [
      "Facade",
      "Mediator",
      "Observer",
      "Command"
    ],
    "explanation": "The chat participants don't reference one another: every message goes through ChatRoom, which itself decides where to deliver it — the many-to-many interaction is encapsulated in a mediator, so this is Mediator. Not Observer: there's no subscription to a source's state changes and no one-to-many broadcast — the participants are peers exchanging targeted messages through a coordinator. Not Facade: ChatRoom doesn't simplify an interface to a subsystem for an external client — the Users themselves know the mediator and actively call into it, and the relationship is two-way. Not Command: the request isn't encapsulated in a separate object with an execute method, and there's no queuing or undo — plain arguments are passed."
  },
  "c-memento-1": {
    "prompt": "What is the key idea of the Memento pattern?",
    "options": [
      "Encapsulate a request as an object so that operations can be queued and undone",
      "Capture and externalize an object's internal state without violating its encapsulation, so that the object can later be restored to that state",
      "Let an object change its behavior when its internal state changes",
      "Create new objects by copying an existing instance instead of calling a constructor"
    ],
    "explanation": "In GoF terms, Memento is a snapshot of internal state externalized outside the object without breaking encapsulation: the originator creates the snapshot, and the caretaker holds it as an opaque token for later restoration. The first option describes Command (an operation object with queuing and undo via inverse actions), the third describes State (changing behavior across state transitions), and the fourth describes Prototype (creating objects by cloning)."
  },
  "ip-memento-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "class Snapshot {\n  constructor(private readonly hp: number, private readonly level: number) {}\n  getHp() { return this.hp; }\n  getLevel() { return this.level; }\n}\n\nclass Hero {\n  private hp = 100;\n  private level = 1;\n  fight() { this.hp -= 30; this.level += 1; }\n  save(): Snapshot { return new Snapshot(this.hp, this.level); } // the hero creates its own snapshot\n  restore(s: Snapshot) { this.hp = s.getHp(); this.level = s.getLevel(); }\n}\n\nclass SaveSlots { // stores snapshots without looking inside\n  private slots: Snapshot[] = [];\n  push(s: Snapshot) { this.slots.push(s); }\n  pop() { return this.slots.pop(); }\n}\n\nconst hero = new Hero();\nconst slots = new SaveSlots();\nslots.push(hero.save()); // save before the fight\nhero.fight();\nconst last = slots.pop();\nif (last) hero.restore(last); // undo to the saved state",
    "options": [
      "Command",
      "Memento",
      "Prototype",
      "State"
    ],
    "explanation": "Hero creates a snapshot of its own private state (save) and restores itself from it (restore), while SaveSlots merely stores the snapshots as opaque objects — this is the classic originator/memento/caretaker trio of the Memento pattern. Not Command: there's no operation object with an execute() method; it's state snapshots, not requests, that get queued, and undo works by restoring state rather than executing an inverse action. Not Prototype: Snapshot isn't a clone of the hero meant to work on its own — it's a passive data capture that only Hero itself can read; there's no clone() method producing new working objects. Not State: Hero's behavior doesn't change as its internal state changes — there are no state classes with a shared interface and transitions between them."
  },
  "c-template-method-1": {
    "prompt": "Which statement most accurately describes the Template Method pattern?",
    "options": [
      "Encapsulates a family of interchangeable algorithms that the client plugs into a context from the outside",
      "Defines the skeleton of an algorithm in a base class, letting subclasses redefine individual steps without changing its structure",
      "Lets an object alter its behavior when its internal state changes, as if it had changed its class",
      "Defines an interface for creating an object, letting subclasses decide which concrete product class to instantiate"
    ],
    "explanation": "Template Method fixes the invariant sequence of steps in a method of the base class and hands the variable steps to subclasses through overriding — the algorithm's structure stays unchanged. The first option describes Strategy: there the whole algorithm is supplied from the outside through composition, rather than individual steps through inheritance. The third option is the definition of State: behavior switches in step with the object's internal state. The fourth is Factory Method: it is about a subclass creating an object, not about an algorithm skeleton with overridable steps."
  },
  "ip-template-method-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "abstract class DataImporter {\n  // the algorithm skeleton is fixed in the base class\n  import(raw: string): string[] {\n    const parsed = this.parse(raw);\n    const valid = parsed.filter((r) => this.isValid(r));\n    return valid.map((r) => r.trim());\n  }\n  protected abstract parse(raw: string): string[]; // step defined by the subclass\n  protected isValid(row: string): boolean { return row.length > 0; } // hook\n}\n\nclass CsvImporter extends DataImporter {\n  protected parse(raw: string) { return raw.split(','); }\n}\n\nclass LogImporter extends DataImporter {\n  protected parse(raw: string) { return raw.split('\\n'); }\n  protected isValid(row: string) { return !row.startsWith('#'); }\n}",
    "options": [
      "Strategy",
      "Template Method",
      "Decorator",
      "Factory Method"
    ],
    "explanation": "The import() method in the base class fixes an invariant sequence of steps (parse → filter → normalize), while subclasses override only individual steps — parse() and the isValid() hook. This is Template Method. Not Strategy: the algorithm is not passed into a context from the outside as a separate object — the variants are chosen through inheritance, and the skeleton calls the steps itself. Not Factory Method: the overridable step transforms data rather than creating a product object; there is no subclass-driven object creation here. Not Decorator: nothing wraps an object of the same interface to add behavior on top of delegation — this is a plain inheritance hierarchy with overridden steps."
  },
  "c-visitor-1": {
    "prompt": "Which statement most accurately describes the Visitor pattern?",
    "options": [
      "Lets you define a new operation over the objects of a structure without changing their classes: the operation is extracted into a visitor object, and the right method is chosen through double dispatch via accept/visit",
      "Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation",
      "Composes objects into tree structures and lets clients treat individual objects and their compositions uniformly",
      "Encapsulates a request as an object, letting you queue, log, and undo operations"
    ],
    "explanation": "The first is correct: the essence of Visitor per GoF is to represent an operation over each object of a structure so that a new operation can be defined without changing the element classes; the mechanism is double dispatch, where an element calls its own method on the visitor inside accept(). The second option is the definition of Iterator: it is about traversal order, not about extracting operations. The third is Composite: it is about tree-shaped part-whole composition, not about adding operations from the outside. The fourth is Command: it turns the request itself into an object for the sake of queuing and undo, rather than distributing an operation across element types."
  },
  "ip-visitor-1": {
    "prompt": "Which design pattern is used in this code?",
    "code": "interface NodeVisitor { visitText(n: TextNode): void; visitImage(n: ImageNode): void; }\n\ninterface DocNode { accept(v: NodeVisitor): void; }\n\nclass TextNode implements DocNode {\n  constructor(public text: string) {}\n  accept(v: NodeVisitor) { v.visitText(this); } // the element itself chooses the visitor's method\n}\nclass ImageNode implements DocNode {\n  constructor(public src: string) {}\n  accept(v: NodeVisitor) { v.visitImage(this); }\n}\n\nclass HtmlRenderer implements NodeVisitor {\n  html = '';\n  visitText(n: TextNode) { this.html += `<p>${n.text}</p>`; }\n  visitImage(n: ImageNode) { this.html += `<img src=\"${n.src}\">`; }\n}\n\nconst doc: DocNode[] = [new TextNode('Hello'), new ImageNode('logo.png')];\nconst renderer = new HtmlRenderer();\ndoc.forEach((node) => node.accept(renderer));",
    "options": [
      "Composite",
      "Visitor",
      "Strategy",
      "Iterator"
    ],
    "explanation": "The rendering operation is extracted from the node classes into a separate HtmlRenderer object with a visit method for each concrete type, and the nodes call their own method on the visitor through accept() — double dispatch, i.e. Visitor: a new operation (for example, export to Markdown) can be added with a new visitor without touching TextNode and ImageNode. Not Composite: the nodes contain no child nodes and do not form a part-whole tree in which a group is treated uniformly as a single object. Not Strategy: HtmlRenderer is not an interchangeable algorithm that a context holds and delegates a single behavior to — here dispatch happens on the concrete element types through accept/visit. Not Iterator: the traversal is not encapsulated in a separate object with sequential access — a plain forEach is used, and the point of the code is extracting the operation, not the traversal order."
  },
  "c-layered-1": {
    "prompt": "What dependency rule lies at the heart of Layered Architecture?",
    "options": [
      "Each layer depends only on the layer below it and knows nothing about the layers above",
      "Any layer may freely call any other layer, as long as there are no cycles",
      "All layers depend on a shared domain core, and the direction of dependencies is inverted inward",
      "Each layer is deployed as a separate service and communicates with the others over the network"
    ],
    "explanation": "The essence of the layered style is dependency discipline: a layer provides services to the layer above and consumes the one below, so presentation knows about domain, domain knows about data source, but not the other way around. The second option describes the absence of layering: if everyone calls everyone, the separation into layers loses its meaning, even without cycles. The third option is the dependency rule of Hexagonal/Clean Architecture, where dependencies point inward toward the domain rather than downward toward the data. The fourth confuses logical layers with a physical split into services: layers are a code structure, not units of deployment (that's microservices territory)."
  },
  "t-layered-1": {
    "prompt": "What is the main trade-off of Layered Architecture compared with more sophisticated styles?",
    "options": [
      "Layers automatically give you independent scaling of each part of the system",
      "A simple, predictable structure at the cost of pass-through calls and coupling the domain to the data layer",
      "The layered style removes the need for tests, because the layers are isolated",
      "The layered style is always faster in performance than Hexagonal Architecture"
    ],
    "explanation": "The layered style buys a low barrier to entry and a familiar structure at a cost: simple operations pass straight through every layer as empty transit, and the business logic depends on the data layer — in Hexagonal/Clean that dependency is deliberately inverted. The first option is wrong: layers are a logical separation within a single deployment, and you can't scale them independently. The third is wrong: isolating the layers makes testing easier by stubbing out the layer below, but it in no way removes the need for it. The fourth is wrong: the difference between the styles is in the direction of dependencies and the cost of change, not in execution speed; extra pass-through calls add indirection rather than speed the code up."
  },
  "c-mvc-1": {
    "prompt": "How are responsibilities divided among the components in MVC?",
    "options": [
      "The Model holds data and business logic, the View renders the Model's state, and the Controller handles user input and invokes operations on the Model",
      "The Controller contains the business logic, the Model is responsible for rendering, and the View holds the application's data",
      "The View modifies the application's data directly, and the Model merely caches results to speed up rendering",
      "Model, View, and Controller are the three tiers of the system: the database, the server-side API, and the frontend"
    ],
    "explanation": "The first option is correct: in MVC the logic and data live in the Model, the View only renders its state, and the Controller translates user actions into operations on the Model — while the Model knows nothing about either the View or the Controller. The second option scrambles the roles: business logic in the Controller is the \"fat controller\" anti-pattern, and the Model doesn't do any rendering. The third is wrong: the View shouldn't modify data directly — changes flow through the Controller into the Model, otherwise the separation loses its point. The fourth is a common misconception: MVC describes a separation of responsibilities within the user-interface layer, not a division of the system into database, API, and frontend (that's closer to layered architecture)."
  },
  "t-mvc-1": {
    "prompt": "What is the main trade-off of using MVC, and when does it not pay off?",
    "options": [
      "MVC guarantees a bug-free interface, so it's worth using every time",
      "Testability and the independence of logic from presentation are bought at the price of extra structure: for a simple screen with no logic, three components and the wiring between them are superfluous",
      "MVC noticeably slows the application down, because three classes always run slower than one",
      "MVC can't be used without a database, so it isn't suitable for local applications"
    ],
    "explanation": "The second option is correct: splitting into Model, View, and Controller gives you testable logic and independent presentation, but every screen accumulates three components, their wiring, and a synchronization mechanism — for a simple static screen that price doesn't pay off. The first option is false: no style guarantees the absence of bugs, and \"use it every time\" ignores the trade-off itself. The third is wrong: MVC's cost is structural (more code and coupling), not performance; the overhead of delegation is negligible. The fourth is beside the point: the Model is data and logic held in the application's memory, and a database isn't required for MVC."
  },
  "c-mvvm-1": {
    "prompt": "Which statement most accurately describes the role of the ViewModel in MVVM?",
    "options": [
      "The ViewModel holds presentation state and logic and knows nothing about a concrete View; the View binds to its properties through data binding",
      "The ViewModel is a controller that receives user input and directly manipulates the View's elements",
      "The ViewModel is a data-access layer that encapsulates queries to the database and external APIs",
      "The ViewModel holds a reference to the View interface and explicitly calls its update methods when the Model changes"
    ],
    "explanation": "The first is correct: the ViewModel is a \"model of the screen\" with properties and commands, it knows nothing about a concrete View, and data binding provides the connection — that is precisely what sets MVVM apart. The second option describes the Controller from MVC: in MVVM nothing manipulates widgets directly. The third is a data-access layer (a repository), which belongs to the Model, not the ViewModel. The fourth is the MVP arrangement: there the Presenter holds a reference to the View interface and updates it explicitly, whereas in MVVM the direction is reversed — the View itself subscribes to the ViewModel."
  },
  "t-mvvm-1": {
    "prompt": "What is the main trade-off of using MVVM?",
    "options": [
      "MVVM speeds up interface rendering because data binding bypasses re-rendering the View",
      "Testability of the presentation logic and decoupling from the View come at the cost of an extra layer and hard-to-debug declarative bindings",
      "MVVM removes the need for a Model layer — all data lives in the ViewModel",
      "MVVM is always justified, including for trivial static screens with no state"
    ],
    "explanation": "The second is correct: the payoff of MVVM is that the ViewModel is testable without a UI and the View is decoupled from the logic, but the price is an extra layer, binding infrastructure, and the \"magic\" of bindings, whose errors are often silent and hard to debug. The first option is wrong: MVVM is about code organization, not rendering speed; binding by itself speeds up nothing. The third distorts the style: the Model remains a separate layer of domain data, and the ViewModel merely adapts it to the screen. The fourth is a false \"silver bullet\" promise: for simple, stateless screens a ViewModel and binding add complexity with no payoff."
  },
  "c-monolith-1": {
    "prompt": "Which best describes a monolithic architecture?",
    "options": [
      "An application that fundamentally has no modules or separation into layers",
      "All functionality is built and deployed as a single unit and runs in one process",
      "A set of independent services that communicate with each other over the network",
      "A style in which any change requires rewriting the system from scratch"
    ],
    "explanation": "A monolith is defined by its unit of deployment: one codebase, one deployable unit, with modules interacting through direct in-process calls. The first option is wrong: a monolith can be well structured internally (a modular monolith, with layers) — being monolithic is about deployment, not about the absence of modularity. The third option describes microservices, the opposite style. The fourth is a caricature: a change in a monolith requires rebuilding and redeploying the whole application, but not rewriting the system."
  },
  "t-monolith-1": {
    "prompt": "What trade-off does a team accept by choosing a monolith over microservices at the start of a product?",
    "options": [
      "A monolith always runs slower than microservices because of the size of its codebase",
      "A monolith fundamentally rules out horizontal scaling",
      "Deployment simplicity, in-process calls, and ACID transactions in exchange for the inability to scale and release individual parts independently",
      "A monolith doesn't allow modules to be tested in isolation"
    ],
    "explanation": "A monolith gives you one deployable unit, cheap in-process calls, and transactions spanning multiple modules, but the price is a coupled lifecycle: you can only scale and deploy everything as a whole, and coordination costs grow as the team grows (Fowler, 'MonolithFirst'). The first option is wrong: in-process calls are usually faster than network calls, and codebase size doesn't directly affect execution speed. The second is wrong: a monolith can be scaled horizontally with copies behind a load balancer — you just can't scale a single hot module on its own. The fourth is wrong: unit tests are available in any architecture — that's a matter of internal boundaries, not of how the system is deployed."
  },
  "c-hexagonal-1": {
    "prompt": "What is the key idea behind Hexagonal Architecture (Ports & Adapters)?",
    "options": [
      "The application is divided into exactly six layers — one per side of the hexagon",
      "The application core declares ports (interfaces) for communicating with the outside world, and adapters implement them from outside; all dependencies point inward, toward the core",
      "Each external service (database, UI, queue) defines an interface that the core is required to implement",
      "The application is split into independently deployable services that communicate over the network"
    ],
    "explanation": "The second is correct: the essence of the style is that the core owns the ports (interfaces expressed in domain terms), adapters translate concrete technologies into those ports, and dependencies always point inward; that's why the core is driven identically by a UI, tests, or scripts and knows nothing about infrastructure details. \"Exactly six layers\" is a myth: Cockburn's hexagon is merely a visual metaphor — the number of sides means nothing. The third option inverts the style: if infrastructure dictates the interfaces, the core depends on it, whereas Hexagonal requires the opposite direction of dependencies (in the spirit of the DIP). The fourth describes Microservices — a style of deployment and distribution, not the organization of dependencies within a single application."
  },
  "t-hexagonal-1": {
    "prompt": "What trade-off does adopting Hexagonal Architecture entail, and when is it more likely to hurt?",
    "options": [
      "Domain isolation and testability are bought at the price of extra ports, adapters, and mapping; in thin CRUD with no business rules that layer is just needless indirection",
      "Hexagonal Architecture speeds up the application, so it only hurts in systems where performance doesn't matter",
      "The style removes the need to write integration tests for adapters, since the core is already covered by unit tests",
      "Hexagonal Architecture is applicable only in microservices and yields no benefit in a monolith"
    ],
    "explanation": "The first option is correct: the style's main benefit is that the domain is tested without infrastructure and survives changes of technology, but the price is interfaces, DTOs, and mapping at every boundary; when there's almost no domain logic (thin CRUD), the ports turn into an empty layer and the cost outweighs the benefit. The second option is wrong: the style is about organizing dependencies, not performance — the extra indirection tends to add overhead rather than remove it. The third is wrong: unit tests of the core with in-memory adapters don't exercise real SQL, HTTP, and serialization — integration tests for the adapters are still needed. The fourth is wrong: Ports & Adapters is a style for organizing a single application and works perfectly well in a monolith; it is orthogonal to how you deploy."
  },
  "c-clean-architecture-1": {
    "prompt": "Which statement most accurately captures the essence of Clean Architecture?",
    "options": [
      "Each layer calls only the layer directly beneath it, and dependencies run top-down — from the UI down to the database at the base",
      "Source-code dependencies point only inward: outer layers know about inner ones, while business rules know nothing about the UI, the database, or frameworks",
      "Business logic is placed in the framework's controllers so that the framework centrally manages the application's lifecycle",
      "The application is split into independently deployable services, each with its own database and messaging channel"
    ],
    "explanation": "The essence of Clean Architecture is the Dependency Rule: source-code dependencies point only inward, toward higher-level policies, so Entities and Use Cases know nothing about the UI, the database, or frameworks. The first option describes classic Layered Architecture, where the database sits at the base and everything ultimately depends on it — Clean Architecture inverts precisely this, making the database a peripheral detail. The third option violates the style: putting business rules in controllers binds the core to the framework. The fourth describes Microservices — that's about deploying services independently, not about organizing dependencies within a single application."
  },
  "t-clean-architecture-1": {
    "prompt": "What trade-off does adopting Clean Architecture carry, and where are the limits of its applicability?",
    "options": [
      "The main cost is performance: the extra layers make calls so much slower that the style is unfit for high-load systems",
      "The style pays off in any project, including simple CRUD applications and throwaway prototypes, so it has no limits of applicability",
      "Independence of the business logic from frameworks and the database, along with its testability, is achieved at the cost of extra abstractions, mapping between layers, and more code — in simple CRUD that cost can outweigh the benefit",
      "The style tightly binds the core to the chosen framework in exchange for a fast project start"
    ],
    "explanation": "Clean Architecture's real trade-off is complexity: ports, DTOs, and mapping between layers give the core independence and testability, but they add indirection and boilerplate, so in simple CRUD or a prototype, where there's almost no domain logic, the costs outweigh the benefit. The first option is wrong: the overhead of an extra call through an interface is negligible — the style's cost is cognitive and organizational, not a matter of performance. The second is wrong: no style pays off universally; every decision has limits of applicability. The fourth inverts the point: the style actually frees the core from the framework, and if anything it slows the project's start because of the upfront abstractions."
  },
  "c-event-driven-1": {
    "prompt": "Which best captures the essence of Event-driven Architecture?",
    "options": [
      "A central orchestrator invokes services according to a predefined script and waits for a response from each one",
      "Components call each other directly via synchronous requests, and the broker merely balances load across instances",
      "Components interact by publishing and consuming events—notifications that something has already happened; the producer doesn't know who will react to them or how",
      "The system is divided into layers, and each layer calls only the layer directly beneath it"
    ],
    "explanation": "The essence of EDA is inverting the interaction: the producer records a fact as an event and publishes it to the broker, while consumers subscribe and react independently; the producer doesn't know the recipients. The first option describes orchestration with a central coordinator—the opposite of choreography through events, where there is no coordinator. The second is ordinary synchronous request–response interaction: having a load balancer doesn't make the architecture event-driven, the coupling stays direct. The fourth is Layered Architecture: splitting the system into layers with directed dependencies has nothing to do with events."
  },
  "t-event-driven-1": {
    "prompt": "What is the main trade-off a team accepts when moving to Event-driven Architecture?",
    "options": [
      "EDA always reduces the processing latency of every request, because events are handled in parallel",
      "Loose coupling and independent scaling are achieved at the cost of eventual consistency, implicit control flow, and difficult end-to-end debugging",
      "The broker eliminates the single point of failure, so system reliability improves with no additional operational cost",
      "Events make the processing order strictly deterministic, which simplifies reasoning about the system's behavior"
    ],
    "explanation": "The second option is correct: decoupling producers from consumers and scaling them independently is paid for with asynchrony—data converges with a delay (eventual consistency), the chain of \"what happens after an event\" isn't visible from the producer's code, and tracing an end-to-end scenario requires dedicated tooling (correlation IDs, distributed tracing). The first option is wrong: an asynchronous path through a broker usually adds latency to an individual operation—the gain is in throughput and resilience, not in per-request latency. The third is wrong twice over: the broker itself becomes a critical piece of infrastructure and demands operational effort. The fourth claims the opposite of reality: event delivery allows duplicates and reordering, so determinism drops and handlers need to be idempotent."
  },
  "c-microservices-1": {
    "prompt": "Which statement most accurately describes the Microservices architectural style?",
    "options": [
      "An application is a suite of small, independently deployable services, each built around its own business capability, owning its own data and communicating with the others over the network",
      "Splitting an application into modules within a single process, sharing one database and a single deployment",
      "Any architecture in which the client and server communicate through a REST API",
      "A style in which every class in the system is extracted into a separate service for maximum granularity"
    ],
    "explanation": "The defining traits of the style, per Fowler and Lewis: services are built around business capabilities, run in separate processes, deploy independently, and own their own data — that is the first option. The second describes a modular monolith: the modularity is there, but a single process, a shared database, and a shared deployment strip away the main advantage — independent releases. The third confuses the style with the transport: having a REST API does not make a system microservice-based — a monolith can expose REST too. The fourth is the \"nanoservices\" anti-pattern: a service boundary is a business capability (a Bounded Context), not a class; breaking things down to individual classes yields monstrous network coupling with no benefit."
  },
  "t-microservices-1": {
    "prompt": "What is the main trade-off in moving from a monolith to microservices?",
    "options": [
      "Microservices always run faster than a monolith because each service is smaller and simpler",
      "Independent deployment and scaling are bought at the price of distributed complexity: partial network failures, eventual consistency instead of ACID transactions, and expensive operations",
      "Microservices free teams from having to coordinate contracts with one another",
      "The only cost is a higher hosting bill; the complexity of development and debugging does not change"
    ],
    "explanation": "The second option is correct: team autonomy, independent releases, and targeted scaling are paid for with the properties of a distributed system — network latency and partial failures, the loss of end-to-end transactions (Saga and eventual consistency instead of ACID), and a high operational cost (CI/CD per service, tracing, monitoring). The first option is wrong: an in-process call in a monolith is orders of magnitude cheaper than a network call, so microservices are often slower on an individual request — the gain is in scaling, not in call speed. The third is the opposite of the truth: explicit network contracts and their versioning require more coordination, not less. The fourth understates the cost: the main expense is not hosting but precisely the complexity of developing, debugging, and operating a distributed system."
  },
  "t-composition-vs-inheritance-1": {
    "prompt": "What is the essence of the composition vs inheritance trade-off?",
    "options": [
      "Inheritance is always faster than composition because calls don't go through delegation",
      "Composition fully replaces inheritance, so extends in modern code is always a mistake",
      "Composition offers flexible assembly and runtime swapping of behavior at the cost of delegation and more objects; inheritance is more concise for a genuine \"is-a\" but fixes the relationship at compile time and binds the subclass to the parent's internals",
      "The difference is purely syntactic: extends and a private field holding an object yield the same coupling"
    ],
    "explanation": "The third option is correct: this is exactly the GoF trade-off (\"favor object composition over class inheritance\"). Composition reuses code black-box through interfaces and lets you swap parts at runtime, but it adds objects and delegating code; inheritance is shorter for a true \"is-a\", but the relationship is set at compile time and the subclass depends on the parent's implementation (the fragile base class problem). The first option is wrong: the difference in call speed is negligible in practice and is not the point of the trade-off. The second is wrong: GoF recommend preferring composition, not banning inheritance; for a stable \"is-a\" that honors the LSP it is appropriate. The fourth is wrong: the coupling is fundamentally different: extends exposes protected internals and overriding to the subclass (white-box), whereas composition confines the dependency to the part's public interface."
  },
  "cs-composition-vs-inheritance-1": {
    "prompt": "What's wrong with this code, and how would you improve it?",
    "code": "class Stack<T> extends Array<T> {\n  peek(): T | undefined { return this[this.length - 1]; }\n}\n\nconst s = new Stack<number>();\ns.push(1);\ns.push(2);\ns.unshift(0); // inherited from Array: the element is inserted at the \"bottom\" of the stack\ns.splice(0, 2); // the LIFO invariant is broken from outside the class",
    "options": [
      "The only problem is peek: on an empty stack it returns undefined instead of throwing",
      "Inheritance is used purely for code reuse without an \"is-a\" relationship: Stack inherits the entire array API, and unshift/splice break the LIFO invariant. Better to hold the array in a private field and expose only push/pop/peek (composition)",
      "Stack should be made a singleton so nobody creates a second instance and corrupts the data",
      "It's enough to override unshift and splice so they throw; inheritance is appropriate here"
    ],
    "explanation": "The second option is correct: a stack is not \"a kind of array\" but a structure with a LIFO invariant; extends exposes the entire Array API (unshift, splice, indexing) to clients, and the invariant can be broken from outside. Composition, a private array field with a narrow public interface of push/pop/peek, reuses the array's code without inheriting its contract. The first option is wrong: returning undefined is an API-design question and doesn't close the main hole in encapsulation. The third is wrong: a Singleton limits the number of instances and does nothing to protect each instance's invariant. The fourth is wrong: overriding the \"extra\" methods to throw narrows the base type's contract and violates the LSP, so Stack can no longer be substituted where an Array is expected; this is a symptom that the \"is-a\" here is false and inheritance was chosen by mistake."
  },
  "t-coupling-cohesion-1": {
    "prompt": "A team decided to reduce coupling between modules by routing every interaction through interfaces and events. What is the trade-off of that decision?",
    "options": [
      "There is no trade-off: the lower the coupling, the better the design in every case",
      "The dependencies don't disappear, they just become less explicit: indirection grows, and excessive splitting can smear a single task across modules, lowering cohesion",
      "Interfaces and events noticeably slow execution down, so decoupling is justified only in high-load systems",
      "Low coupling requires merging the interacting modules into one, at the cost of class size"
    ],
    "explanation": "The second option is correct: decoupling doesn't remove dependencies, it changes their form — a direct call becomes an interface or an event, the control flow gets harder to trace, and if you carve up code that always changes together for the sake of \"low coupling,\" a single task ends up scattered across modules and cohesion drops. The first option is wrong: low coupling is a guideline, not an absolute — between stable parts that change together, decoupling is redundant. The third is wrong: the price here is readability and indirection, not performance — the overhead of polymorphism and events is almost always negligible. The fourth is wrong: merging modules is the opposite of the idea — it creates a low-cohesion dumping-ground module rather than reducing coupling."
  },
  "cs-coupling-cohesion-1": {
    "prompt": "What's wrong with this code from a coupling and cohesion standpoint, and how would you improve it?",
    "code": "class EmailSender {\n  host = 'smtp.local';\n  connected = false;\n  connect() { this.connected = true; }\n  push(raw: string) { /* low-level send */ }\n}\n\nclass ReportService {\n  send(report: string) {\n    const sender = new EmailSender();\n    sender.host = 'smtp.prod';        // reaching into its internals\n    sender.connect();                 // depending on another's step order\n    if (sender.connected) {\n      sender.push('From: reports\\n' + report); // reassembling another's protocol\n    }\n  }\n}",
    "options": [
      "ReportService is tightly coupled to EmailSender's internals: it creates it itself, mutates its fields, and re-implements the sending protocol — those steps should be hidden inside EmailSender, with the client depending on a narrow interface like send(to, text)",
      "The problem is EmailSender's low cohesion: the connect and push methods should be split across two separate classes",
      "The main mistake is the string concatenation: switching from '+' to template literals will make the coupling go away",
      "The code violates the LSP: ReportService should inherit from EmailSender to gain legitimate access to its fields"
    ],
    "explanation": "The first option is correct: this is content coupling — ReportService knows the host field, the connected flag, and the correct connect → push sequence, i.e. it duplicates another module's protocol inside itself; any change to EmailSender will break every client like this. The cure is information hiding: tuck the connection and the message assembly inside EmailSender, expose a narrow method (or a Notifier interface), and receive the dependency from the outside rather than creating it with new. The second option is wrong: connect and push both serve the single task of sending mail — separating them would actually lower cohesion. The third is wrong: how the strings are joined is cosmetic — coupling comes from knowing another object's internals, not from the '+' operator. The fourth is wrong: inheriting just to reach the fields doesn't \"legitimize\" anything — it maximizes coupling and has nothing to do with the LSP."
  },
  "t-dry-vs-duplication-1": {
    "prompt": "What is the essence of the DRY vs Duplication trade-off?",
    "options": [
      "Any repetition of code is a mistake and must be eliminated the moment it first appears",
      "Eliminating duplicated knowledge protects against rules drifting out of sync, but merging incidentally similar code creates a false abstraction and couples independent parts",
      "DRY is only about the text of the code: identical lines must become a single function regardless of their meaning",
      "Duplication is always preferable to shared code, because abstractions complicate the system"
    ],
    "explanation": "DRY is about a single representation of knowledge: if the copies express one rule, letting them drift out of sync produces silent bugs, so the knowledge is extracted into a single source. But generalization has a price: code merged on the basis of incidental similarity couples independent callers and accumulates flags — the wrong abstraction costs more than duplication (Sandi Metz). The first option is wrong: eliminating every repetition early leads to premature generalization, which is exactly why the Rule of Three exists. The third is wrong: Hunt and Thomas framed DRY in terms of knowledge, not the text of the code — a textual match need not be duplication. The fourth is the opposite extreme: abandoning DRY for genuine duplication of knowledge guarantees that the rules drift out of sync."
  },
  "cs-dry-vs-duplication-1": {
    "prompt": "What is wrong with this code and how would you improve it?",
    "code": "interface CartItem { price: number; qty: number; }\ninterface InvoiceLine { amount: number; }\n\nfunction checkoutTotal(items: CartItem[]) {\n  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);\n  return subtotal * 1.2; // +20% VAT\n}\n\nfunction invoiceTotal(lines: InvoiceLine[]) {\n  const subtotal = lines.reduce((s, l) => s + l.amount, 0);\n  return subtotal * 1.2; // +20% VAT\n}",
    "options": [
      "The VAT rate is a single piece of business knowledge duplicated as a \"magic number\" in two functions; it should be extracted into a single source (a constant or an applyVat function)",
      "The functions are almost identical — they should be merged into one all-purpose calcTotal with a flag that distinguishes the cart from the invoice",
      "Everything is fine: two lines of repetition are acceptable under the Rule of Three, so nothing needs to change",
      "The problem is performance: reduce runs in both functions and should be cached"
    ],
    "explanation": "The 1.2 multiplier in both functions is the same piece of knowledge (the VAT rate). When the rate changes, one copy gets fixed and the other is forgotten — a silent drift out of sync. The right fix is a single source: const VAT_RATE = 0.2 or an applyVat(subtotal) function. The second option is a classic false abstraction: summing the cart and summing the invoice match only textually — they have different types and different reasons to change, and a toggle flag would couple them. The third option is wrong: the Rule of Three applies to incidental code similarity, not to a duplicated business rule — knowledge is extracted right away. The fourth option is beside the point: running reduce over different arrays is not a performance problem, and caching would improve nothing here."
  },
  "t-abstraction-cost-1": {
    "prompt": "What is the essence of the Abstraction Cost trade-off?",
    "options": [
      "Abstractions always slow down program execution, so in performance-critical code they should be avoided entirely",
      "An abstraction reduces coupling and hides details but adds indirection and cognitive load — it is justified only when the benefit of decoupling outweighs that cost",
      "The more levels of abstraction a system has, the better the architecture: each new layer further reduces coupling between modules",
      "The cost of abstraction is temporary: once the team gets used to the layers, indirection stops costing anything"
    ],
    "explanation": "The second option is correct: an abstraction is an investment with both a benefit (decoupling, hiding details, a substitution point) and a cost (indirection, the load of reading and debugging, the risk of leaking details — the Law of Leaky Abstractions). Deciding to introduce it means weighing one against the other. The first option is wrong: the main cost of an abstraction is cognitive, not computational; runtime overhead is often negligible, and \"avoid entirely\" is a false conclusion. The third option is wrong: layers do not improve an architecture by themselves — each must earn its indirection, otherwise it is speculative generality. The fourth is wrong: familiarity does not cancel the cost — the path of reading and debugging through extra layers stays longer for every new team member and during every bug investigation."
  },
  "cs-abstraction-cost-1": {
    "prompt": "The entire application has exactly one greeting implementation and one call site. What is wrong with this code and how would you improve it?",
    "code": "interface GreetingProvider { greet(name: string): string; }\n\nclass DefaultGreetingProvider implements GreetingProvider {\n  greet(name: string) { return `Hello, ${name}!`; }\n}\n\nclass GreetingProviderFactory {\n  static create(): GreetingProvider { return new DefaultGreetingProvider(); }\n}\n\nclass GreetingService {\n  private provider = GreetingProviderFactory.create();\n  greet(name: string) { return this.provider.greet(name); }\n}\n\n// the only call site in the entire application:\nconsole.log(new GreetingService().greet('Ann'));",
    "options": [
      "The SRP is violated: GreetingService combines creating the provider with greeting — the creation should be extracted into a separate injector class",
      "Three layers of indirection have been built around a single trivial implementation with no benefit — the whole thing should be replaced with a plain function, and an interface introduced once a second implementation appears",
      "One more level is missing: an IGreetingService interface and registration in a DI container are needed to make the architecture extensible",
      "The problem is the static factory method: making create() an instance method would make the design correct"
    ],
    "explanation": "The second option is correct: the interface, the factory, and the service wrapper serve a single trivial implementation with a single call site — there is no benefit (substitution, decoupling), only the cost of indirection. This is speculative generality: the right move is a single greet(name) function, introducing an abstraction when a real second implementation or a need for substitution (in tests, for example) actually appears. The first option is wrong: you could formally nitpick about the SRP, but extracting the creation into yet another class only adds a fourth layer — it treats the symptom while making the disease worse. The third option is wrong for the same reason: a DI container and another interface increase the cost of abstraction without any new benefit. The fourth is wrong: whether the factory method is static is a cosmetic detail; the problem is not the form of the factory but that a factory is not needed here at all."
  },
  "t-yagni-vs-flexibility-1": {
    "prompt": "What is the essence of the trade-off between YAGNI and designing flexibility \"to grow into\"?",
    "options": [
      "YAGNI forbids introducing abstractions and interfaces, so the choice is between clean code and working code",
      "Forgoing speculative extension points makes the code cheaper now, but if the requirement does appear, you'll have to pay with refactoring",
      "Future-proofing flexibility always pays off: requirements inevitably grow, so you should build it in everywhere",
      "YAGNI applies only to prototypes; in production code all extension points should be built in up front"
    ],
    "explanation": "The second option is correct: YAGNI is a bet that the cost of a simple solution now plus possible refactoring later is lower than the cost of writing, maintaining, and reading flexibility that may never be needed or may turn out to be on the wrong axis of change. The first option distorts the principle: YAGNI doesn't forbid abstractions — it defers them until there's a real need. The third option is exactly the fallacy YAGNI targets: predicted requirements often never materialize, and \"always pays off\" is unprovable. The fourth is wrong: YAGNI was formulated specifically for production development (XP) and relies on tests and refactoring, not on the code's status as a prototype."
  },
  "cs-yagni-vs-flexibility-1": {
    "prompt": "The product has exactly one notification method — email — and no other requirements are planned. What's wrong with this design and how would you improve it?",
    "code": "interface NotificationChannel<TPayload, TResult> {\n  send(payload: TPayload): Promise<TResult>;\n}\n\nclass ChannelRegistry {\n  private channels = new Map<string, NotificationChannel<any, any>>();\n  register(name: string, ch: NotificationChannel<any, any>) { this.channels.set(name, ch); }\n  resolve(name: string) { return this.channels.get(name); }\n}\n\nclass EmailChannel implements NotificationChannel<string, void> {\n  async send(text: string) { console.log(`email: ${text}`); }\n}\n\nconst registry = new ChannelRegistry();\nregistry.register('email', new EmailChannel());",
    "options": [
      "LSP is violated: EmailChannel isn't substitutable for the base type NotificationChannel and can't be placed in the registry",
      "DRY is violated: the sending logic is duplicated between ChannelRegistry and EmailChannel and should be extracted into a shared base class",
      "Speculative generality: the registry, string keys, and generic types are built for channels that don't exist — for the single scenario a plain EmailChannel or a sendEmail function is enough, and the registry can be introduced when a second real channel appears",
      "It lacks flexibility: you should add an abstract channel factory so that SMS and push can later be plugged in without code changes"
    ],
    "explanation": "The third option is correct: this is classic speculative generality (Fowler's term) — a registry with lookup by string name, the TPayload/TResult generics, and a registration layer all serve channels that don't exist and aren't planned. All this machinery (plus the any that destroys type safety) is the price of flexibility that not a single requirement backs; by YAGNI, a direct EmailChannel or a sendEmail function is enough, and the extension point can be introduced when a second channel appears and the real axis of change becomes clear. The first option is wrong: EmailChannel implements the interface correctly and the contract isn't broken — the problem isn't type substitution. The second is wrong: the registry doesn't send anything, there's no duplicated logic, and a shared base class would only add yet another speculative layer. The fourth proposes making things worse: adding even more flexibility for hypothetical SMS and push — exactly the premature generalization YAGNI warns against."
  },
  "t-performance-vs-readability-1": {
    "prompt": "How should you soundly resolve the trade-off between performance and code readability?",
    "options": [
      "Write readable code by default, and sacrifice readability only on hot paths confirmed by the profiler, isolating and documenting the optimization",
      "Performant code is inherently unreadable, so the team should choose a priority once at the whole-project level and apply it everywhere",
      "Readability is subjective and unmeasurable, so in any conflict performance always takes priority",
      "Micro-optimizations should be baked into all the code up front, so you don't have to rewrite hot paths later"
    ],
    "explanation": "The first option is correct: this is Knuth's classic stance (\"premature optimization is the root of all evil\") — by default code is written for people, and unreadable optimizations are permitted selectively, driven by measurements, isolated behind a clear interface with a documented benchmark. The second option is wrong: this isn't a binary, project-wide choice — hot paths are usually a few percent of the code, and the decision is made locally. The third is wrong: readability directly affects the cost of change and the number of defects, and an unconditional priority on performance leads to unwarranted complexity in cold code. The fourth describes premature optimization in its purest form: intuition about future bottlenecks is systematically wrong, and the entire codebase becomes more expensive to maintain."
  },
  "cs-performance-vs-readability-1": {
    "prompt": "A function builds a list for an admin report that's requested a few times a day over hundreds of records. What's wrong with this code and how would you improve it?",
    "code": "interface User { active: boolean; name: string; }\n\n// Admin report: called a few times a day, users is hundreds of records\nfunction activeUserNames(users: User[]): string[] {\n  const res: string[] = new Array(users.length); // preallocate the buffer\n  let j = 0;\n  for (let i = 0, len = users.length; i < len; ++i) {\n    const u = users[i];\n    if (u.active) res[j++] = u.name;\n  }\n  res.length = j; // trim the unused tail\n  return res;\n}",
    "options": [
      "Premature micro-optimization of a cold path: without profiler data a readable filter/map is better here, and only measured hot spots are worth optimizing",
      "The code isn't fast enough: you should go further and replace the array of strings with a preallocated typed buffer addressed by index",
      "The only problem is mutating res.length — replace it with slice(0, j) and leave the rest as is",
      "It's fine: hand-rolled loops are always preferable to filter/map in production code"
    ],
    "explanation": "The first option is correct: the function is called a few times a day over hundreds of elements — this is plainly a cold path, and the gain from a preallocated buffer, a manual counter j, and caching len is indistinguishable from zero here, while readability suffers noticeably. The idiomatic users.filter((u) => u.active).map((u) => u.name) expresses the intent in a single line; sacrificing that is only worth it after profiling. The second option makes the problem worse — yet more complexity on a path where performance doesn't matter. The third fixes a cosmetic detail without removing the root smell: the unwarranted optimization itself. The fourth is a false generalization: hand-rolled loops are justified on measured hot paths, but shouldn't be the default rule."
  },
  "ms-database-per-service-shared-db": {
    "prompt": "Why does Database per Service forbid one service from accessing another service's database directly?",
    "options": [
      "Because relational databases can't handle concurrent connections from several services at once",
      "Because a shared database is always slower than several smaller databases",
      "Because a shared database couples services through its schema and blocks independent deployment and technology choice",
      "Because microservices are forbidden from using SQL and may only use NoSQL stores"
    ],
    "explanation": "The point of the pattern is to remove coupling through data: if services share one database, one changing a table breaks the others, and independent deployment becomes impossible without a coordinated migration. A private database hides the schema behind the API, so the team can freely change the data model and the DBMS. The first option is a technical misconception: databases handle many connections fine — that's not the issue. The second is wrong: performance depends on load and schema, not the number of databases; the pattern's motive is coupling and autonomy, not speed. The fourth is a myth: the pattern dictates no DBMS type; on the contrary, it enables polyglot persistence, SQL included."
  },
  "ms-database-per-service-no-acid": {
    "prompt": "A business operation must update data owned by two different services. Under Database per Service, how is consistency achieved?",
    "options": [
      "There is no cross-service ACID transaction; the steps are coordinated with a Saga and you accept eventual consistency",
      "A distributed two-phase commit (2PC) across both databases is the recommended default",
      "A single ACID transaction automatically spans both databases",
      "You merge the two databases back into one so a normal transaction works again"
    ],
    "explanation": "Private databases mean one service's transaction can't atomically touch another's data. The canonical answer (Richardson) is a Saga: a sequence of local transactions with compensations, giving eventual consistency. The second option is a common misconception: 2PC creates tight coupling and reduces availability, so microservices avoid it rather than recommend it. The third is technically impossible: there is simply no single transaction spanning two independent databases. The fourth destroys the pattern itself — going back to a shared database restores the very coupling the pattern was meant to remove."
  },
  "ms-database-per-service-identify": {
    "prompt": "Which microservices pattern does this code illustrate?",
    "code": "// Order Service has its own database (OrderDb). It gets customer data from another service.\nclass OrderService {\n  constructor(private db: OrderDb, private customers: CustomerService) {}\n  place(id: string, customerId: string, total: number) {\n    const credit = this.customers.getCredit(customerId); // an API call to a neighbouring service, not a query against its table\n    if (total > credit) throw new Error('Credit limit exceeded');\n    this.db.save({ id, customerId, total }); // writes only to its own database\n  }\n}",
    "options": [
      "Shared Database — services read and write each other's tables directly",
      "Database per Service — each service has a private database and exposes its data only through its API",
      "CQRS — splitting the write model from a separate read model",
      "API Gateway — a single entry point that routes external client requests to services"
    ],
    "explanation": "Order Service writes only to its own OrderDb and obtains customer data via customers.getCredit(...) — that is, through the owning service's API rather than a query against its table. That is Database per Service. The first option is the direct opposite: here there is precisely no direct access to another's database. The third (CQRS) is about separating reads from writes within the model — none of that here. The fourth (API Gateway) is about a single entry point for external clients; the example is one internal service calling another, not a gateway."
  },
  "ms-api-gateway-responsibilities": {
    "prompt": "Which of the following belongs to the responsibilities of an API Gateway?",
    "options": [
      "Request routing, authentication, rate-limiting, and TLS termination at the edge of the system",
      "Storing and modifying domain business data — for example, computing the final order total",
      "Orchestrating distributed transactions and holding saga state across services",
      "The persistent storage that services read from and write their data to"
    ],
    "explanation": "The API Gateway is a thin intermediary at the edge of the system, responsible for cross-cutting concerns: routing, authentication, rate-limiting, TLS termination, protocol translation, and response shaping. The second option is wrong: domain business logic (e.g., computing a price) is kept by the owning services, and leaking it into the gateway turns it into a hidden monolith. The third option is the role of a saga orchestrator (Saga/Process Manager), not the gateway. The fourth describes a database: the gateway stores nothing and is not a source of data — it only proxies requests to the services."
  },
  "ms-api-gateway-vs-direct": {
    "prompt": "What is the main trade-off of an API Gateway compared with direct client-to-service calls?",
    "options": [
      "It decouples clients from service topology and centralizes cross-cutting concerns at the cost of an extra hop and a potential single point of failure",
      "It eliminates network latency entirely, because the client makes only a single request",
      "It removes the need for service fault tolerance, since it guarantees their availability itself",
      "It makes microservices unnecessary by merging their logic into one place"
    ],
    "explanation": "Direct calls are simpler and avoid an extra hop, but force the client to know every service and duplicate cross-cutting concerns. The gateway hides the topology and centralizes auth/rate-limiting/TLS, but adds a network hop, a bottleneck, and a point of failure that must be made redundant — that is the trade-off. The second option is wrong: the gateway adds a hop rather than eliminating latency; a gain is possible only when it aggregates several calls, not a 'full elimination'. The third is wrong: the gateway itself needs fault tolerance, and services must still protect themselves, e.g. via a Circuit Breaker. The fourth is wrong: the gateway does not replace services but sits in front of them, and pulling their logic into it is precisely the anti-pattern."
  },
  "ms-api-gateway-identify": {
    "prompt": "Which pattern does the Edge class implement in this snippet?",
    "code": "interface Req { path: string; token?: string; }\ninterface Svc { handle(r: Req): unknown; }\n\nclass Edge {\n  constructor(private routes: Record<string, Svc>) {}\n  handle(r: Req) {\n    if (!r.token) return { status: 401 };            // authentication\n    const svc = this.routes['/' + r.path.split('/')[1]]; // routing\n    if (!svc) return { status: 404 };\n    return svc.handle(r);                              // delegate to the service\n  }\n}",
    "options": [
      "API Gateway",
      "Aggregator — it collects and merges responses from several services into one",
      "Circuit Breaker — it opens the circuit when a called service fails",
      "Repository — it encapsulates access to a data store"
    ],
    "explanation": "The Edge class is a single entry point that authenticates the request, routes it by path to the right service, and delegates the handling without computing the answer itself: this is an API Gateway. Aggregator is wrong — here the request goes to exactly one service rather than being assembled from several. Circuit Breaker is wrong — there is no failure tracking, threshold, or opening of the circuit. Repository is wrong — there is no store and no data read/write operations; the class merely proxies the request to a service."
  },
  "ms-aggregator-core-responsibility": {
    "prompt": "What is the core responsibility of the Aggregator pattern?",
    "options": [
      "Call several downstream services and merge their responses into a single consolidated result for the client",
      "Serve as the single entry point for all clients and handle cross-cutting concerns — authentication, rate-limiting, TLS termination",
      "Translate the client's external protocol (REST) into the services' internal protocol (gRPC, AMQP)",
      "Hold the state of a distributed transaction and coordinate compensating actions across services"
    ],
    "explanation": "The Aggregator is defined precisely by data composition: it calls several services and stitches their responses into one. The second option is the responsibility of an API Gateway: a gateway may include aggregation as one of its features, but its defining role is cross-cutting concerns at the edge, not merging data. The third option is also a gateway (or protocol-adapter) concern, not the aggregator's: an Aggregator by itself is not required to change protocols. The fourth describes a Saga/Process Manager — coordinating a distributed transaction and compensations — rather than simply merging the results of independent calls."
  },
  "ms-aggregator-parallel-vs-chained": {
    "prompt": "What is the difference between parallel and chained composition of calls in an Aggregator, and what is the trade-off?",
    "options": [
      "Parallel composition calls independent services at the same time and minimizes total latency, but complicates handling of partial failures; chained composition calls services sequentially, when one call's result is needed as input to the next, and its latencies add up",
      "Parallel composition is only possible with synchronous calls, and chained composition only with asynchronous ones",
      "Chained composition is always faster than parallel composition, because it eliminates network latency between calls",
      "There is no difference: the aggregator always calls services the same way regardless of dependencies between the data"
    ],
    "explanation": "The choice between fan-out (parallel) and a chain is driven by data dependency: independent calls should be parallelized for latency, but then a decision must be made explicitly about what happens if one of them fails; dependent calls inevitably form a chain, and their latencies add up. The second option is wrong: both parallel and chained composition can be implemented with either synchronous or asynchronous calls — that is an orthogonal choice. The third option is wrong and contradicts the point: a chain does not eliminate network latency but stacks it call after call, which is usually slower. The fourth is wrong: the choice of composition style depends precisely on whether one call's data depends on another call's result."
  },
  "ms-aggregator-identify-pattern": {
    "prompt": "Which pattern does the Composer class implement in this snippet?",
    "code": "interface Req { userId: string; }\ninterface Svc { call(r: Req): Promise<Record<string, unknown>>; }\n\nclass Composer {\n  constructor(private profile: Svc, private orders: Svc, private recs: Svc) {}\n\n  async handle(r: Req) {\n    const [profile, orders, recs] = await Promise.all([\n      this.profile.call(r),\n      this.orders.call(r),\n      this.recs.call(r),\n    ]);\n    return { ...profile, orders, recommendations: recs }; // merged into one response\n  }\n}",
    "options": [
      "Aggregator — it calls several independent services in parallel and merges their responses into one",
      "API Gateway — a single entry point handling routing, authentication, and rate-limiting",
      "Circuit Breaker — it opens the call chain when the called service fails",
      "BFF (Backend for Frontend) — a dedicated aggregator designed for the needs of one specific client"
    ],
    "explanation": "The Composer does exactly what defines an Aggregator: it calls three independent services in parallel (Promise.all) and stitches their responses into one object — this is fan-out/fan-in with no tie to any specific client type. API Gateway is wrong: the code has no path-based routing, authentication, or rate-limiting — only service calls and data merging. Circuit Breaker is wrong: there is no failure tracking, threshold, or opening of the call chain. BFF is wrong by construction of the example — nothing in the code ties it to a specific client application (mobile or web); this is a generic aggregator, and a BFF is its specialized special case."
  },
  "ms-bff-vs-gateway": {
    "prompt": "How does a Backend for Frontend differ from a single general-purpose API Gateway?",
    "options": [
      "A BFF is a separate backend for a specific client type whose API is tailored to that UI's needs, whereas a general-purpose gateway exposes one shared API to all clients",
      "A BFF and a general-purpose gateway are synonyms: both just proxy requests to downstream services",
      "A BFF runs on the client (in the browser or app), while a gateway runs on the server",
      "A BFF replaces the downstream microservices by merging them into one monolithic service"
    ],
    "explanation": "The essence of a BFF is one server-side layer per client type, with the API fitted to that frontend's screens and constraints; a general-purpose API Gateway instead exposes a single API to all clients at once. The second option is wrong: a gateway is usually single and shared, whereas BFFs are deliberately multiple and distinct — they are not synonyms. The third is wrong: a BFF is a server-side component, not client code; the name means \"a backend owned by the frontend,\" not \"running inside the frontend.\" The fourth is wrong: a BFF does not replace the downstream services — it calls and aggregates them, leaving them shared and independent."
  },
  "ms-bff-multiple": {
    "prompt": "By what principle should you decide how many separate BFFs to create?",
    "options": [
      "Create a separate BFF where the user-experience needs genuinely diverge (e.g. web versus mobile), grouping similar clients together",
      "Create one BFF per downstream microservice, so every service has its own facade",
      "Always keep exactly one BFF for the whole application, otherwise the pattern loses its point",
      "Create a new BFF per client instance when scaling, to spread the load"
    ],
    "explanation": "Per Newman, the BFF boundary is drawn along the user experience: you introduce a separate BFF where UI needs diverge and group clients of the same class together — this avoids both a bloated shared API and uncontrolled service proliferation. The second option is the classic misconception: \"one BFF per microservice\" turns BFFs into thin service facades and loses the whole idea of client tailoring. The third is wrong: a single BFF for everything brings back the general-purpose-API problem of trying to please everyone. The fourth confuses logically slicing BFFs by client type with horizontal scaling: load growth is handled by replicas of one BFF, not by new kinds of it."
  },
  "ms-bff-ownership": {
    "prompt": "Why does the BFF approach usually put the owning team together with the team of the corresponding frontend?",
    "options": [
      "Because the frontend and its BFF change together for the same screens — shared ownership removes cross-team coordination and speeds up changes",
      "Because frontend developers are cheaper than backend developers, saving budget",
      "Because a BFF can technically only be written in the same language as the frontend",
      "Because it automatically makes the downstream services part of the frontend team"
    ],
    "explanation": "A BFF exists to serve specific screens, so its contract changes at that frontend's cadence; when the same team owns the BFF, changing a screen and its backend happens without negotiating with another team — a direct consequence of Conway's Law. The second option is wrong: the motive is speed and autonomy, not the cost of specialists. The third is wrong: a BFF is an ordinary server-side service and can be written in any stack — matching languages is not required. The fourth is wrong: the downstream services stay shared and owned by their own teams — a BFF merely calls them, it doesn't absorb them."
  },
  "ms-circuit-breaker-states": {
    "prompt": "A Circuit Breaker is in the Open state after a run of errors. What happens next per the canonical scheme?",
    "options": [
      "It stays Open forever until the service is restarted by hand",
      "It returns straight to Closed and lets all traffic through again",
      "After the cooldown it moves to Half-open and lets a trial call through",
      "It alternates Open and Closed, letting every second request reach the dependency"
    ],
    "explanation": "The canonical Nygard/Fowler scheme: from Open, once the cooldown elapses, the breaker moves to Half-open and lets a limited number of trial calls through — success closes the circuit (Closed), failure trips it Open again. \"Forever until a manual restart\" is wrong: the point of a breaker is self-recovery without intervention. \"Straight to Closed\" skips Half-open — the breaker won't restore all traffic before confirming the dependency is alive. \"Alternates Open/Closed per request\" is invented behavior; transitions are driven by the failure threshold and the cooldown timer, not by request parity."
  },
  "ms-circuit-breaker-fail-fast-vs-retry": {
    "prompt": "Why does a Circuit Breaker in the Open state reject calls immediately (fail-fast) instead of retrying the request to the dependency?",
    "options": [
      "Because retries to the service always break the operation's idempotence",
      "Fail-fast frees the caller instantly and spares the already-overloaded dependency extra attempts",
      "Because fail-fast simply returns the last cached successful response to the client",
      "Because a retry is only allowed at the API Gateway level, never in the client itself"
    ],
    "explanation": "The point of fail-fast: the caller gets an answer instantly, without hanging on timeouts or holding threads and connections, while the degraded dependency receives no new requests and can recover. A blind retry does the exact opposite — it piles load onto an already-overloaded service and keeps the caller's resources tied up, prolonging and deepening the outage. Idempotence is a concern of retry logic, not the reason for tripping the circuit, and retries don't \"always\" break it. Caching the last response is a fallback strategy, not what the breaker itself does in Open. The level at which a retry runs (client or Gateway) is irrelevant to the fail-fast decision."
  },
  "ms-circuit-breaker-identify": {
    "prompt": "Which resilience pattern does this class implement?",
    "code": "type State = \"closed\" | \"open\" | \"half-open\";\n\nclass Guard {\n  private state: State = \"closed\";\n  private failures = 0;\n  private openedAt = 0;\n  constructor(private threshold = 5, private cooldownMs = 30_000) {}\n\n  async run<T>(action: () => Promise<T>): Promise<T> {\n    if (this.state === \"open\") {\n      if (Date.now() - this.openedAt < this.cooldownMs)\n        throw new Error(\"rejected: failing fast\"); // don't touch the dependency\n      this.state = \"half-open\"; // try a single call\n    }\n    try {\n      const r = await action();\n      this.failures = 0;\n      this.state = \"closed\"; // recovered\n      return r;\n    } catch (e) {\n      if (++this.failures >= this.threshold || this.state === \"half-open\") {\n        this.state = \"open\";\n        this.openedAt = Date.now();\n      }\n      throw e;\n    }\n  }\n}",
    "options": [
      "Circuit Breaker",
      "Retry with exponential backoff",
      "Bulkhead",
      "Rate Limiter"
    ],
    "explanation": "Three states closed/open/half-open, a failure counter with a threshold, tripping after it's exceeded, a cooldown, and a single trial call that closes the circuit on success — this is exactly a Circuit Breaker. Retry with backoff would instead re-attempt the failed call with growing pauses, not block access to the dependency. Bulkhead would isolate resources (thread/connection pools) per dependency to cap concurrency, not count errors. A Rate Limiter would cap request frequency regardless of whether calls fail, whereas here the transitions are driven precisely by call outcomes."
  },
  "ms-bulkhead-purpose": {
    "prompt": "What is the primary purpose of the Bulkhead pattern?",
    "options": [
      "It isolates resources into separate pools so that an overload or failure of one dependency cannot exhaust resources and bring down the whole service",
      "It detects a failed dependency and temporarily stops calling it, giving it time to recover",
      "It retries a failed call several times with increasing delay until it succeeds",
      "It caches a dependency's responses to reduce the number of calls to it"
    ],
    "explanation": "Bulkhead partitions resources into isolated pools so that the saturation or failure of one dependency stays locked in its «compartment» and does not cause resource exhaustion across the whole service. Option 2 describes a Circuit Breaker (tripping on errors), option 3 is Retry with backoff, and option 4 is caching; all three solve different problems and provide no resource isolation between dependencies."
  },
  "ms-bulkhead-vs-circuit-breaker": {
    "prompt": "How does Bulkhead differ from Circuit Breaker?",
    "options": [
      "Bulkhead partitions resources into isolated pools to limit the blast radius; Circuit Breaker tracks the error rate and trips the circuit, stopping calls to an unhealthy dependency",
      "They are the same thing: both trip the circuit once an error threshold is crossed",
      "Bulkhead retries calls on failure, while Circuit Breaker limits the number of concurrent calls",
      "Bulkhead applies only on the client side, while Circuit Breaker applies only on the server side"
    ],
    "explanation": "These are distinct, complementary patterns. Bulkhead works along the resource axis: it isolates pools so one dependency's failure cannot take resources from the others. Circuit Breaker works along the dependency-health axis: it counts errors and, once a threshold is crossed, trips the circuit and fails calls fast until the dependency recovers. Option 2 conflates them — Bulkhead «trips» nothing. Option 3 gives Bulkhead the Retry logic, while limiting concurrent calls is in fact Bulkhead's job, so the roles are swapped. Option 4 invents a client/server split: both patterns typically live on the calling side and are not bound that rigidly."
  },
  "ms-bulkhead-ship-hull-analogy": {
    "prompt": "What analogy does the name of the Bulkhead pattern draw on (Michael Nygard, «Release It!»)?",
    "options": [
      "The watertight bulkheads of a ship's hull: a breach floods only one compartment rather than the whole vessel",
      "An automatic fuse in an electrical panel that breaks the circuit on overload",
      "A dam that holds back the pressure of water up to a critical level",
      "A multi-stage system of locks that lets vessels through one at a time"
    ],
    "explanation": "The name is a direct reference to shipbuilding: a ship's hull is divided by watertight bulkheads, so a breach floods only the damaged compartment instead of sinking the whole vessel — just as isolated pools keep a fault contained to one part of the system. Option 2 is the analogy for Circuit Breaker (an electrical fuse), not Bulkhead. Options 3 and 4 (a dam, locks) are plausible «water» images but have nothing to do with the term's origin."
  },
  "ms-sidecar-purpose": {
    "prompt": "What is the primary purpose of the Sidecar pattern?",
    "options": [
      "Split the application into independently deployable business services",
      "Deploy a helper process alongside the main service so it takes over cross-cutting concerns (proxying, TLS, telemetry) without changing the application code",
      "Route external client requests to internal services through a single entry point",
      "Cache responses closer to the client to reduce latency"
    ],
    "explanation": "A sidecar is a co-located helper process that offloads cross-cutting concerns (proxy, TLS/mTLS, retries, telemetry) from the application, sharing its pod and network; the application is left with pure business logic. The first option describes microservices decomposition — that's about service boundaries, not about moving infrastructure into a helper. The third option is an API Gateway: a single entry point for external clients, whereas a sidecar accompanies each service instance and handles its own traffic. The fourth is a cache/CDN: reducing latency through data proximity, which is not the essence of a sidecar."
  },
  "ms-sidecar-process-vs-library": {
    "prompt": "Why implement cross-cutting functionality as a separate sidecar process rather than as a library embedded in the application?",
    "options": [
      "A separate process eliminates network latency because everything runs in the same pod",
      "A library and a sidecar are functionally identical, and the choice between them is purely stylistic",
      "A separate process is language-independent and is upgraded/deployed independently of the application — at the cost of an extra local hop and per-instance overhead",
      "A sidecar frees a service mesh from needing a control plane"
    ],
    "explanation": "The main gain of a separate process is language independence (one sidecar for a polyglot fleet) and an independent lifecycle (upgrade the proxy without rebuilding the application), and the price is an extra local hop and per-instance resource cost; a library, conversely, is cheaper and hop-free but tied to the language and lifecycle of the service. The first option is wrong: a sidecar actually adds a local hop (application → sidecar) rather than eliminating latency. The second is wrong: the differences are substantial — they are precisely what forms the trade-off. The fourth is wrong: sidecar proxies form the data plane, but a centralized policy still requires a control plane (in Istio, istiod)."
  },
  "ms-sidecar-service-mesh": {
    "prompt": "How does the Sidecar pattern relate to a service mesh?",
    "options": [
      "A service mesh deploys a sidecar proxy next to every service; the fleet of those proxies forms the data plane, governed by a central control plane",
      "A service mesh replaces sidecars with a single shared gateway for the whole cluster",
      "A service mesh is a library linked into each service, with no separate processes",
      "Sidecars and a service mesh are unrelated; a mesh operates only at the database layer"
    ],
    "explanation": "A service mesh is a direct application of the Sidecar pattern at scale: a sidecar proxy (e.g., Envoy) is placed next to every service, all the proxies together form the data plane, and a centralized control plane (in Istio, istiod) hands them the policy for mTLS, routing, and observability. The second option describes more of a single-gateway model rather than a mesh, where a helper accompanies each instance. The third is wrong: the essence of a mesh is precisely the separate proxy processes, not an in-code library. The fourth is wrong: a mesh governs network interaction between services, not work with the database."
  },
  "ms-saga-why-not-2pc": {
    "prompt": "Why do microservices prefer a Saga over a distributed ACID transaction via two-phase commit (2PC)?",
    "options": [
      "Each service owns its own database, and 2PC holds locks on all participants until the operation completes, undermining availability and scalability; a Saga uses independent local transactions instead",
      "A Saga provides the same isolation and ACID guarantees as 2PC, just faster",
      "2PC is fundamentally impossible to implement in modern databases",
      "A Saga removes the need for any data consistency between services altogether"
    ],
    "explanation": "The core reason is the cost of locking and coupling: 2PC needs a shared coordinator and holds locks on all participants until commit, which kills availability and scalability in a distributed system where each service owns its database. A Saga replaces this with a chain of local transactions. The 'same isolation' option is wrong: a Saga deliberately sacrifices isolation (ACD, not ACID) and yields eventual consistency. 2PC is quite implementable (XA and others) — the issue is unacceptable cost, not impossibility. 'Removes the need for consistency' is also wrong: a Saga still enforces consistency, but eventual consistency, via compensations."
  },
  "ms-saga-compensating-action": {
    "prompt": "What is a compensating action (compensating transaction) in a Saga?",
    "options": [
      "A separate local transaction that semantically undoes the effect of an already-committed step (e.g. refund a charge), because committed steps cannot be rolled back automatically",
      "A retry of the failed step until it eventually succeeds",
      "A database ROLLBACK command that atomically reverts all steps of the saga at once",
      "A lock that prevents other transactions from seeing the saga's intermediate state"
    ],
    "explanation": "A compensation is a separate reverse-action transaction, not a database rollback: the payment is already committed, so it cannot be 'rolled back' — it can only be refunded. A retry is forward recovery for retriable steps, not the undoing of something already done. There is no single ROLLBACK spanning several services — which is exactly why compensations are needed. A lock against others' reads is a semantic lock, a countermeasure for the lack of isolation, not the definition of a compensation."
  },
  "ms-saga-orchestration-vs-choreography": {
    "prompt": "What distinguishes orchestration from choreography as ways to coordinate a Saga?",
    "options": [
      "In orchestration a central coordinator commands the steps and holds the saga's state; in choreography there is no central coordinator — each service reacts to events and publishes its own, with logic distributed across participants",
      "Orchestration works through events, whereas choreography works through synchronous RPC calls",
      "Orchestration provides ACID guarantees while choreography provides only eventual consistency",
      "Choreography requires a central coordinator, while orchestration lets services talk directly peer-to-peer"
    ],
    "explanation": "The key difference is where the coordination logic lives: in orchestration it is a central orchestrator that knows the whole flow and the saga's state; in choreography there is no coordinator, services exchange events and each decides for itself. The second option confuses the communication mechanism with the coordination model — both typically run over asynchronous events. The third is wrong: both approaches yield eventual consistency, and ACID appears in neither. The fourth is inverted: it is orchestration that relies on a central component, while choreography is the decentralized, event-driven one."
  },
  "ms-cqrs-vs-crud": {
    "prompt": "What fundamentally distinguishes CQRS from a plain CRUD approach with a single model?",
    "options": [
      "Separate models for writing and for reading, each of which can be optimised and scaled independently",
      "The presence of a service layer between controllers and the repository",
      "Mandatory use of a message broker for all operations",
      "Storing state as a sequence of events instead of table rows"
    ],
    "explanation": "The essence of CQRS is a split of responsibility: the command side changes state and holds invariants, the read side serves queries from separate projections, and each can evolve and scale independently. In CRUD a single model does both. The service-layer option describes ordinary layered architecture, not CQRS. A message broker is just one possible way to synchronise, not a hallmark of the pattern: CQRS works over a single shared database synchronously too. Storing state as events is Event Sourcing — a separate pattern often used together with CQRS but not equivalent to it."
  },
  "ms-cqrs-not-event-sourcing": {
    "prompt": "How are CQRS and Event Sourcing related?",
    "options": [
      "They are independent patterns: CQRS separates read and write models and does not require storing state as events; Event Sourcing is an optional complement",
      "They are two names for one and the same pattern",
      "CQRS cannot be applied without an event store",
      "Event Sourcing automatically includes CQRS, so CQRS does not exist on its own"
    ],
    "explanation": "CQRS and Event Sourcing are different patterns that pair well but apply separately. CQRS merely separates the read and write models and can run over an ordinary database, with no events at all. Event Sourcing stores state as a sequence of events and often uses CQRS to build read models, but there is no reverse dependency. So it is wrong to call them one pattern, to require an event store for CQRS, or to claim CQRS does not exist on its own: they are commonly conflated precisely because Greg Young described them together."
  },
  "ms-cqrs-identify-scaling": {
    "prompt": "The code splits handling into a command side and a query side over the same data. Which pattern is this, and what is its main payoff?",
    "code": "class OrderCommandHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  place(cmd: PlaceOrder): void { /* mutates state, projects into the read model */ }\n}\n\nclass OrderQueryHandler {\n  constructor(private readModel: Map<string, OrderSummary>) {}\n  byId(id: string): OrderSummary | undefined { return this.readModel.get(id); }\n}",
    "options": [
      "CQRS — the write model and the read model can be optimised and scaled independently",
      "Repository — hides the data source behind a collection-like interface",
      "Event Sourcing — state is reconstructed by replaying stored events",
      "Saga — coordination of a long-running distributed transaction across services"
    ],
    "explanation": "Splitting into OrderCommandHandler (mutates state) and OrderQueryHandler (reads only) over a separate read model is CQRS, and its key payoff is that the read and write sides are optimised and scaled independently. Repository is a single data-access interface; it does not split reads and writes into separate models. Event Sourcing would involve storing and replaying events, which is absent here — the read model is updated by projection, not by replay. Saga addresses a different problem entirely — consistency of a long-running transaction across services."
  },
  "ms-event-sourcing-1": {
    "prompt": "How does Event Sourcing fundamentally differ from the classic approach of storing only the current state?",
    "options": [
      "The current state is still kept in a table, with a separate change log maintained alongside it for auditing",
      "The single source of truth is an append-only sequence of immutable events, and the current state is derived by replaying them",
      "It is a caching technique: events are held in memory to speed up reading the current state from a table",
      "Events fully replace the database, so the current state can no longer be reconstructed from them"
    ],
    "explanation": "The second option is correct: in Event Sourcing the source of truth is the append-only log of immutable events itself, and the current state is not stored but derived by folding the log into a projection. The first option is the most common substitution: there the source of truth remains the current-state table, while the change log is merely bolted on and can silently drift out of sync with the data; in Event Sourcing the state is secondary and always consistent with the events because it is derived from them. The third is wrong: events are a durable source of truth, not a cache for faster reads (on the contrary, reading usually requires replay or a projection). The fourth contradicts the essence of the pattern: the current state is precisely what gets reconstructed from the events."
  },
  "ms-event-sourcing-2": {
    "prompt": "Which capability does Event Sourcing specifically provide that you cannot get by storing only the current state?",
    "options": [
      "Instant reading of the current state with no computation whatsoever",
      "The ability to reconstruct the system's state at any past moment and obtain a complete, immutable audit trail by replaying the event log",
      "Automatic strong consistency of all read models with no delay",
      "A guarantee that any data can be physically deleted at any moment on demand"
    ],
    "explanation": "The second option is correct: because every change-fact is stored, the log can be replayed up to any point to obtain the state as of that moment (a temporal query), and the append-only log itself is a trustworthy audit trail. The first option describes an advantage of storing a snapshot, not of Event Sourcing: in Event Sourcing reading typically requires replaying the log or a separate projection (snapshots are needed to speed it up). The third is wrong: projections update asynchronously, so eventual consistency—not strong consistency—is characteristic. The fourth contradicts the pattern: the append-only model fundamentally does not delete events, and the right to erasure has to be implemented with workarounds such as crypto-shredding."
  },
  "ms-event-sourcing-3": {
    "prompt": "Why is Event Sourcing so often applied together with CQRS?",
    "options": [
      "CQRS is mandatory: without it events cannot be persisted to an event store at all",
      "The event log is awkward for arbitrary queries, so CQRS builds separate optimized read models (projections) from it, separating the writing of events from reading",
      "CQRS eliminates eventual consistency by making projections strongly consistent with the event log",
      "CQRS lets you update already-written events in place, which simplifies their versioning"
    ],
    "explanation": "The second option is correct: an append-only log is awkward for arbitrary queries, and CQRS is precisely what separates the command (writing events) from the query (reading), letting you build separate read-optimized projections that are naturally populated from the event stream. The first option is wrong: Event Sourcing works without CQRS—it is a standalone storage pattern; the two simply complement each other well. The third is wrong: separating reads from writes does not remove eventual consistency—on the contrary, projections are read asynchronously and lag behind the log. The fourth contradicts the foundation of Event Sourcing: events are immutable and are not updated in place, and versioning is handled through upcasting and schema versions, not by editing events."
  },
  "ms-anti-corruption-layer-purpose": {
    "prompt": "What is the primary purpose of an Anti-Corruption Layer in Domain-Driven Design terms?",
    "options": [
      "Stop calls to the external system when it starts failing too often, to avoid cascading failures",
      "Cache responses from a slow external service to reduce domain latency",
      "Keep a legacy or external system's model from leaking into your domain by translating it into your model's terms at the boundary",
      "Aggregate several backend services behind a single entry point so the client makes one request"
    ],
    "explanation": "The essence of an ACL per Evans is an isolating translation layer that protects your model's integrity by keeping foreign concepts out of the domain. The first option describes a Circuit Breaker (fault tolerance), not model protection. The second is caching — a possible boundary responsibility, but not the ACL's purpose. The fourth is an API Gateway/Facade: call aggregation, not translation of the model between bounded contexts."
  },
  "ms-anti-corruption-layer-vs-direct": {
    "prompt": "Why introduce an ACL instead of calling the external system's model directly and mapping its fields inline throughout the domain code?",
    "options": [
      "Because all knowledge of the foreign model and its quirks is confined to one boundary: the domain evolves independently, and changes to the external contract touch only the ACL",
      "Because direct integration is impossible when the external system uses a different transport protocol",
      "Because the ACL removes the network call, so direct integration is always slower",
      "Because direct integration violates encapsulation only when the external system is written in another language"
    ],
    "explanation": "The ACL's value is localization: the foreign model doesn't spread across the domain, and there is a single point of change when the external contract shifts. The second option is false: direct integration is technically possible over any transport — the problem is model leakage, not the protocol. The third is wrong: the ACL doesn't remove the network call (it still reaches the external system) and adds mapping rather than cutting latency. The fourth invents a condition that doesn't exist: domain corruption is independent of the external system's language."
  },
  "ms-anti-corruption-layer-adapter": {
    "prompt": "How does the Anti-Corruption Layer relate to the Adapter pattern?",
    "options": [
      "ACL and Adapter are unrelated: Adapter changes behavior, while an ACL only changes data formats",
      "An ACL is a special case of Adapter that must always be implemented as a single class",
      "Adapter works between bounded contexts, whereas an ACL operates only within a single class",
      "An ACL scales the Adapter idea up to the architectural level: like Adapter it translates at a boundary, but it protects a whole bounded context's model — often combining adapters, facades, and its own translators — rather than converting one class's interface"
    ],
    "explanation": "Adapter (GoF) converts one class's interface to the expected one; the ACL takes that same boundary-translation idea and raises it to the bounded-context level, protecting a whole model and typically comprising several adapters, facades, and translator objects. The first option is wrong: both are about boundary translation, and Adapter doesn't 'change behavior' (that's Decorator/Proxy). The second is mistaken: an ACL need not be a single class — it's usually a whole layer. The third reverses the roles: it's the ACL that lives between bounded contexts, while Adapter is a localized, class-level device."
  },
  "fb-srp-1": {
    "prompt": "A module should be responsible to one, and only one, ___. Put another way, a class should have one and only one reason to change — it encapsulates a single responsibility.",
    "options": [
      "client",
      "interface",
      "actor",
      "module"
    ],
    "explanation": "In Robert Martin's modern formulation, SRP says a module is responsible to a single actor — a group of stakeholders who want the same kind of change — and that actor defines the one reason to change. Client, interface, and module denote technical or consuming entities rather than the source of responsibility, so they do not fit."
  },
  "fb-ocp-1": {
    "prompt": "Software entities (classes, modules, functions) should be open for ___ but closed for modification: new behavior is added without editing existing code.",
    "options": [
      "inheritance",
      "scaling",
      "extension",
      "overriding"
    ],
    "explanation": "The Open/Closed Principle states entities should be open specifically for extension — adding new behavior without editing existing code. Inheritance and overriding are just mechanisms used to achieve extensibility, while scaling concerns load rather than design."
  },
  "fb-lsp-1": {
    "prompt": "If S is a subtype of T, then objects of type T can be replaced with objects of type S without breaking the correctness of the program. A subtype must honor the base type's contract: it must not strengthen ___ or weaken postconditions.",
    "options": [
      "invariants",
      "constraints",
      "preconditions",
      "dependencies"
    ],
    "explanation": "Liskov's principle explicitly forbids a subtype from strengthening preconditions: a subtype method must not demand more from callers than the base type, or substitution would break the program. Invariants, constraints, and dependencies are real OOP notions, but the substitution rule is stated precisely by the precondition/postcondition pair."
  },
  "fb-isp-1": {
    "prompt": "Clients should not be forced to depend on interfaces they don't use. Many specialized, client-specific interfaces are better than a single ___ one.",
    "options": [
      "fat",
      "abstract",
      "immutable",
      "public"
    ],
    "explanation": "ISP's core metaphor is the \"fat\" interface — one overloaded with more members than any single client needs; the principle favors many small, client-specific interfaces instead. \"Abstract\", \"immutable\", and \"public\" describe other interface properties (abstraction level, mutability, visibility) and are not the term ISP contrasts with specialized interfaces."
  },
  "fb-dip-1": {
    "prompt": "High-level modules should not depend on low-level modules; both should depend on ___. Abstractions should not depend on details; details should depend on abstractions.",
    "options": [
      "abstractions",
      "implementations",
      "details",
      "modules"
    ],
    "explanation": "The core of the Dependency Inversion Principle is that both high- and low-level modules depend on abstractions rather than on each other. \"Implementations\" and \"details\" are exactly the concretions the principle forbids depending on, and \"modules\" would restore the direct coupling between levels."
  },
  "fb-strategy-1": {
    "prompt": "Defines a family of algorithms, encapsulates each one, and makes them ___. Strategy lets the algorithm vary independently from the clients that use it.",
    "options": [
      "immutable",
      "extensible",
      "interchangeable",
      "abstract"
    ],
    "explanation": "The core idea of the Strategy pattern is to make the algorithms interchangeable so a client can swap one for another at runtime. \"Immutable\", \"extensible\", and \"abstract\" describe unrelated properties and miss the point of swappable strategies."
  },
  "fb-observer-1": {
    "prompt": "Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are ___ and updated automatically.",
    "options": [
      "registered",
      "notified",
      "destroyed",
      "blocked"
    ],
    "explanation": "In the Observer pattern the subject notifies all its dependents whenever its state changes, and only then are they updated — this is the core of the definition. \"Registered\" describes only the subscription step, while \"destroyed\" and \"blocked\" contradict the idea of automatic notification."
  },
  "fb-factory-method-1": {
    "prompt": "Defines an interface for creating an object, but lets subclasses decide which class to ___. Factory Method lets a class defer instantiation to subclasses.",
    "options": [
      "extend",
      "configure",
      "instantiate",
      "import"
    ],
    "explanation": "The essence of Factory Method is that subclasses decide which concrete class to instantiate, that is, to create an instance of — the act of object creation is the point. \"Extend\", \"configure\", and \"import\" describe other operations on a class and don't capture the creational act of instance creation."
  },
  "fb-state-1": {
    "prompt": "Lets an object alter its ___ when its internal state changes; it appears as though the object has changed its class.",
    "options": [
      "structure",
      "behavior",
      "interface",
      "implementation"
    ],
    "explanation": "The State pattern is fundamentally about letting an object change its behavior depending on its internal state. The structure, interface, and implementation of the class stay the same and don't capture what the pattern actually does."
  },
  "fb-abstract-factory-1": {
    "prompt": "Provides an interface for creating ___ of related or dependent objects without specifying their concrete classes.",
    "options": [
      "hierarchies",
      "families",
      "collections",
      "instances"
    ],
    "explanation": "\"Families\" is the core idea of the Abstract Factory pattern: it produces whole groups of interrelated, mutually consistent products. \"Hierarchies\" refer to inheritance relationships, \"collections\" to containers of same-type elements, and \"instances\" to single objects — none of which captures the notion of a family of related objects."
  },
  "fb-singleton-1": {
    "prompt": "Ensures that a class has only one ___ and provides a global point of access to it.",
    "options": [
      "instance",
      "method",
      "constructor",
      "interface"
    ],
    "explanation": "The essence of the Singleton pattern is guaranteeing a single instance of a class and giving global access to it. The distractors \"method\", \"constructor\", and \"interface\" are other class members that a class can have several of, and none of them captures the idea of a single object."
  },
  "fb-builder-1": {
    "prompt": "___ the construction of a complex object from its representation, so that the same construction process can create different representations.",
    "options": [
      "Hides",
      "Separates",
      "Combines",
      "Copies"
    ],
    "explanation": "The Builder pattern specifically separates the construction of a complex object from its representation, letting one process produce different representations. \"Hides\" describes encapsulation (Facade), \"combines\" contradicts the idea of separation, and \"copies\" belongs to Prototype."
  },
  "fb-prototype-1": {
    "prompt": "Specify the kinds of objects to create using a prototypical instance, and create new objects by ___ this prototype.",
    "options": [
      "instantiating",
      "inheriting",
      "copying",
      "composing"
    ],
    "explanation": "The Prototype pattern creates new objects specifically by copying (cloning) an existing prototype — that is its defining mechanism. Instantiating via a constructor, inheriting, and composing are different approaches that do not capture the essence of prototyping."
  },
  "fb-adapter-1": {
    "prompt": "Converts the interface of a class into another interface that clients expect. Adapter lets classes work together that otherwise couldn't because of ___ interfaces.",
    "options": [
      "legacy",
      "incompatible",
      "abstract",
      "internal"
    ],
    "explanation": "Adapter exists precisely to connect classes whose interfaces are incompatible, so \"incompatible\" is the only fit. Legacy, abstract, or internal interfaces may well be compatible and don't capture the pattern's purpose."
  },
  "fb-bridge-1": {
    "prompt": "Decouples an abstraction from its implementation so that the two can vary ___. Instead of inheritance, the abstraction holds a reference to an implementation object and delegates the work to it.",
    "options": [
      "simultaneously",
      "independently",
      "synchronously",
      "dynamically"
    ],
    "explanation": "The whole point of Bridge is to let the abstraction and the implementation change separately — that is, independently. \"Simultaneously\", \"synchronously\" and \"dynamically\" describe a different property of how change happens and miss the mutual decoupling of the two hierarchies."
  },
  "fb-composite-1": {
    "prompt": "Composes objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects ___.",
    "options": [
      "recursively",
      "uniformly",
      "polymorphically",
      "independently"
    ],
    "explanation": "The whole point of Composite is that a client handles a leaf and a container the same way through a common interface, so \"uniformly\" fits. \"Recursively\", \"polymorphically\", and \"independently\" name other properties and miss the core idea of treating individual objects and their compositions identically."
  },
  "fb-decorator-1": {
    "prompt": "Dynamically adds new responsibilities to an object by ___ it in another object with the same interface. Decorator is a flexible alternative to subclassing for extending functionality.",
    "options": [
      "placing",
      "wrapping",
      "embedding",
      "converting"
    ],
    "explanation": "The essence of the Decorator pattern is that it wraps the original object in a wrapper sharing the same interface and delegates calls to it, dynamically adding behavior. \"Converting\" is wrong because the original object is not altered, while \"placing\" and \"embedding\" fail to convey the wrapper that preserves the shared interface and stays transparent to the client."
  },
  "fb-facade-1": {
    "prompt": "Provides a ___ interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.",
    "options": [
      "typed",
      "unified",
      "abstract",
      "generic"
    ],
    "explanation": "Facade provides a unified interface that consolidates the subsystem's separate interfaces into a single access point. \"Typed\", \"abstract\", and \"generic\" fail to capture the unifying role."
  },
  "fb-flyweight-1": {
    "prompt": "Uses sharing to support large numbers of fine-grained objects efficiently. An object's state is split into intrinsic state — ___ and shared across many objects — and extrinsic state, which depends on context; shared flyweight objects store only the intrinsic state, while the extrinsic state is passed in from outside on each call.",
    "options": [
      "mutable",
      "static",
      "immutable",
      "transient"
    ],
    "explanation": "Intrinsic state must be immutable so that a single flyweight can be safely shared across many objects — mutable state would break sharing. \"Mutable\" is the direct opposite, while \"static\" and \"transient\" describe lifetime/scope rather than the immutability property that makes sharing possible."
  },
  "fb-proxy-1": {
    "prompt": "Provides a surrogate, or placeholder, for another object to control access to it. A proxy implements the same ___ as the real object, so the substitution is transparent to the client.",
    "options": [
      "class",
      "interface",
      "method",
      "type"
    ],
    "explanation": "A proxy must implement the same interface as the real object, and it is this shared interface that makes the substitution transparent to the client. \"Class\", \"method\", and \"type\" miss the point: the surrogate does not inherit a class or mirror a single method, it reproduces the whole interface contract."
  },
  "fb-chain-of-responsibility-1": {
    "prompt": "Avoid coupling the ___ of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along the chain until an object handles it.",
    "options": [
      "handler",
      "sender",
      "client",
      "subscriber"
    ],
    "explanation": "The pattern's intent is to decouple the sender of a request from its receiver, letting the request travel the chain until it is handled. \"Handler\" is the receiving side, while \"client\" and \"subscriber\" (the latter belonging to Observer) are unrelated roles, not the party being freed from coupling to the receiver."
  },
  "fb-command-1": {
    "prompt": "___ a request as an object, letting you parameterize clients with different requests, queue or log requests, and support undoable operations.",
    "options": [
      "Abstracts",
      "Encapsulates",
      "Delegates",
      "Represents"
    ],
    "explanation": "The Command pattern encapsulates a request as a standalone object — that is its defining property, which is exactly what enables queuing, logging, and undoing requests. \"Abstracts\", \"delegates\", and \"represents\" describe different ideas and miss the core notion of packaging a request into its own object."
  },
  "fb-interpreter-1": {
    "prompt": "Given a language, defines a representation for its ___ along with an interpreter that uses that representation to interpret sentences in the language.",
    "options": [
      "grammar",
      "semantics",
      "vocabulary",
      "alphabet"
    ],
    "explanation": "The Interpreter pattern builds a representation of the language's grammar — the rules that generate its sentences — and interprets input against it. Semantics concerns meaning, while vocabulary and alphabet cover only words and symbols, not the language's structure."
  },
  "fb-iterator-1": {
    "prompt": "Provides a way to access the elements of an aggregate object ___ without exposing its underlying representation.",
    "options": [
      "randomly",
      "directly",
      "sequentially",
      "concurrently"
    ],
    "explanation": "The Iterator pattern specifically provides sequential traversal of a collection's elements without revealing its internal structure — that is its defining trait. Random, direct, or concurrent access does not capture the essence of this pattern."
  },
  "fb-mediator-1": {
    "prompt": "Defines an object that ___ how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently.",
    "options": [
      "observes",
      "encapsulates",
      "delegates",
      "restricts"
    ],
    "explanation": "By the GoF definition, the Mediator object encapsulates how a set of objects interact, hiding that logic inside itself. \"Observes\" (the signature verb of the Observer pattern), \"delegates\", and \"restricts\" describe different mechanisms and are not the term used in the canonical intent."
  },
  "fb-memento-1": {
    "prompt": "Without violating ___, captures and externalizes an object's internal state so that the object can later be restored to that state.",
    "options": [
      "abstraction",
      "polymorphism",
      "encapsulation",
      "inheritance"
    ],
    "explanation": "The core guarantee of the Memento pattern is to save and restore an object's state without exposing its internal implementation, which is exactly why encapsulation is preserved. Abstraction, polymorphism, and inheritance are other OOP concepts and do not capture this specific requirement."
  },
  "fb-template-method-1": {
    "prompt": "Defines the skeleton of an algorithm in an operation of a base class, deferring some steps to subclasses. Template Method lets subclasses ___ certain steps of an algorithm without changing the algorithm's overall structure.",
    "options": [
      "call",
      "redefine",
      "remove",
      "duplicate"
    ],
    "explanation": "Template Method lets subclasses redefine individual steps while the base class keeps the overall algorithm fixed. Subclasses do not call, remove, or duplicate the steps — control over the algorithm's flow stays in the base class."
  },
  "fb-visitor-1": {
    "prompt": "Represents an operation to be performed on each object in an object structure. Visitor lets you define a new operation without changing the ___ of the elements on which it operates.",
    "options": [
      "interfaces",
      "methods",
      "classes",
      "fields"
    ],
    "explanation": "By the GoF definition, Visitor lets you add new operations without changing the classes of the elements it operates on — that is its whole point. Interfaces, methods, and fields name individual members, whereas the definition refers specifically to the element classes as a whole."
  },
  "fb-layered-1": {
    "prompt": "An architectural style in which the system is divided into horizontal layers with well-defined roles (classically, per Fowler: presentation, domain, data source), where each layer provides services to the layer above it and consumes services from the layer below it. Dependencies point strictly ___: a layer knows about the one beneath it but knows nothing about the one above it.",
    "options": [
      "downward",
      "upward",
      "inward",
      "outward"
    ],
    "explanation": "In layered architecture dependencies point strictly downward: each layer knows only about the one beneath it and nothing about the one above. \"Upward\" directly violates this rule, while \"inward\" and \"outward\" describe the dependency direction of hexagonal and onion/clean architectures, not of layered ones."
  },
  "fb-mvc-1": {
    "prompt": "A user-interface architectural style that splits an application into three roles: the Model holds data and business logic, the View ___ the Model's state, and the Controller interprets user input and turns it into operations on the Model. The Model knows nothing about the View or the Controller.",
    "options": [
      "modifies",
      "renders",
      "encapsulates",
      "validates"
    ],
    "explanation": "The View is a passive presentation that only renders the Model's current state, so \"renders\" is the correct term. It does not modify, encapsulate, or validate data — those are the responsibilities of the Model and the Controller."
  },
  "fb-mvvm-1": {
    "prompt": "A UI-layer architectural style that splits the interface into Model (domain data and logic), View (___ rendering), and ViewModel (presentation state and logic). The View binds to the ViewModel via data binding and updates automatically; the ViewModel itself holds no reference to the View. It is an evolution of Martin Fowler's Presentation Model, formalized by John Gossman for WPF.",
    "options": [
      "imperative",
      "reactive",
      "declarative",
      "asynchronous"
    ],
    "explanation": "In MVVM (especially WPF/XAML) the View is expressed declaratively: you state what to show, and data binding makes the markup self-sufficient. \"Imperative\" and \"asynchronous\" describe how code executes rather than the form of the view, while \"reactive\" refers to a change-propagation model, not the rendering itself."
  },
  "fb-monolith-1": {
    "prompt": "An architectural style in which all of an application's functionality is built and deployed as a ___ and runs in one process. Modules interact through direct in-process calls rather than over the network (Fowler: single deployable unit).",
    "options": [
      "single unit",
      "distributed system",
      "collection of microservices",
      "cluster of processes"
    ],
    "explanation": "By definition a monolith is built and deployed as a single unit — one deployable artifact running in one process (Fowler: single deployable unit). A distributed system, a collection of microservices, or a cluster of processes instead describe multi-component architectures that communicate over the network, which contradicts the very idea of a monolith."
  },
  "fb-hexagonal-1": {
    "prompt": "An architectural style (Alistair Cockburn) in which an application can be driven equally by users, programs, automated tests, or scripts, and be developed in isolation from its eventual run-time devices and databases. The application core declares ports — interfaces for interacting with the outside world — and ___ translate specific technologies (UI, HTTP, databases, queues) into those ports and back. All dependencies point inward, toward the core.",
    "options": [
      "facades",
      "adapters",
      "decorators",
      "proxies"
    ],
    "explanation": "Adapters are the hexagonal-architecture components that convert specific technologies into the core's ports and back (hence the name Ports & Adapters). Facades, decorators, and proxies are GoF structural patterns with different purposes (simplifying an interface, adding behavior, controlling access) and are not the term used in this style."
  },
  "fb-clean-architecture-1": {
    "prompt": "An architectural style introduced by Robert C. Martin: code is organized into concentric layers (Entities, Use Cases, Interface Adapters, Frameworks & Drivers), governed by a single hard rule — the Dependency Rule: source-code dependencies point only ___, toward higher-level policies. Inner layers know nothing about outer ones: business rules don't depend on the UI, the database, or frameworks.",
    "options": [
      "outward",
      "inward",
      "upward",
      "downward"
    ],
    "explanation": "The Dependency Rule requires that source-code dependencies point only inward — toward higher-level, more stable policies — which is why inner layers know nothing about outer ones. \"Outward\" directly violates the rule, while \"upward\"/\"downward\" don't match Clean Architecture's concentric model, where dependency direction is radial rather than vertical."
  },
  "fb-event-driven-1": {
    "prompt": "An architectural style in which components interact by producing and consuming events—notifications that something has already happened. A producer publishes an event to an event bus or message broker without knowing the recipients; consumers subscribe to the events they care about and react independently and, as a rule, ___.",
    "options": [
      "synchronously",
      "asynchronously",
      "sequentially",
      "immediately"
    ],
    "explanation": "In event-driven architecture consumers process events asynchronously—without blocking the producer or waiting for one another—which is precisely what enables loose coupling and decoupling in time. \"Synchronously\" directly contradicts this, while \"sequentially\" and \"immediately\" describe ordering or speed rather than the independent, non-blocking nature of the reaction."
  },
  "fb-microservices-1": {
    "prompt": "An architectural style in which an application is built as a suite of small services, each running in its own process, owning its own data, and communicating with the others through lightweight network mechanisms (typically HTTP APIs or messaging). Services are organized around ___ and are deployed independently of one another (Fowler and Lewis).",
    "options": [
      "technical layers",
      "data types",
      "business capabilities",
      "network protocols"
    ],
    "explanation": "Per Fowler and Lewis, microservices are decomposed around business capabilities, i.e. along business domains. Organizing around technical layers is typical of a monolith, while data types and network protocols describe how a service is implemented rather than where its boundaries lie."
  },
  "fb-composition-vs-inheritance-1": {
    "prompt": "A comparison of two code-reuse mechanisms: class inheritance is \"white-box\" reuse (a subclass sees the parent's internals and extends it by ___), while object composition is \"black-box\" reuse (an object is assembled from other objects and delegates work to them through interfaces). The classic GoF guideline: \"Favor object composition over class inheritance.\"",
    "options": [
      "overriding",
      "delegation",
      "composition",
      "aggregation"
    ],
    "explanation": "White-box reuse via inheritance works precisely by overriding the parent's methods in a subclass. Delegation, composition, and aggregation are ways of assembling objects from other objects (the object-composition side), not of extending a class through a subclass."
  },
  "fb-coupling-cohesion-1": {
    "prompt": "Coupling is the degree of ___ between modules: how much changing or using one requires knowing the internals of another. Cohesion is the degree to which the elements of a module are united around a single task. The classic guideline of structured design (Constantine/Yourdon, later echoed by Robert C. Martin): aim for low coupling and high cohesion.",
    "options": [
      "independence",
      "abstraction",
      "interdependence",
      "similarity"
    ],
    "explanation": "Coupling is defined precisely as the degree of interdependence between modules — how much one relies on another's internals. \"Independence\" is the opposite (the goal of low coupling), while \"abstraction\" and \"similarity\" describe different properties and don't express the measure of ties between modules."
  },
  "fb-dry-vs-duplication-1": {
    "prompt": "DRY (Hunt and Thomas, The Pragmatic Programmer): every piece of ___ must have a single, unambiguous, authoritative representation within the system. The DRY vs Duplication trade-off is the skill of telling duplicated knowledge (which you eliminate) apart from incidental textual similarity in code that merely looks alike but expresses different things.",
    "options": [
      "code",
      "knowledge",
      "logic",
      "data"
    ],
    "explanation": "In Hunt and Thomas's formulation DRY is about knowledge: every piece of knowledge must have a single authoritative representation. The distractors (code, logic, data) reflect the common misconception — DRY targets duplicated knowledge, not incidental textual duplication of code."
  },
  "fb-abstraction-cost-1": {
    "prompt": "Every abstraction has a cost: an extra layer of indirection, higher cognitive load when reading and debugging, and the risk that hidden details leak through (the Law of Leaky Abstractions, Joel Spolsky). An abstraction is justified only when the benefit of ___ and hiding details outweighs that cost.",
    "options": [
      "decoupling",
      "coupling",
      "duplication",
      "boilerplate"
    ],
    "explanation": "Decoupling is one of the two core justifications for an abstraction alongside hiding details: reducing dependencies between components is what can outweigh the cost of the extra layer. Coupling, duplication, and boilerplate are costs an abstraction should reduce, not benefits it provides."
  },
  "fb-yagni-vs-flexibility-1": {
    "prompt": "YAGNI (You Aren't Gonna Need It) is an Extreme Programming principle (Kent Beck, Ron Jeffries; developed in Fowler's essay \"Yagni\"): don't implement functionality or extension points until you actually need them. The trade-off is between the cost of speculative flexibility you pay for now and the cost of ___ later if the requirement does eventually arrive.",
    "options": [
      "refactoring",
      "testing",
      "deployment",
      "maintenance"
    ],
    "explanation": "The correct term is \"refactoring\": YAGNI defers adding flexibility, and the trade-off is precisely the cost of reshaping existing code once the requirement finally arrives. Testing, deployment, and maintenance are ordinary activities but don't capture the essence of the deferred structural change."
  },
  "fb-performance-vs-readability-1": {
    "prompt": "A trade-off between how fast code runs and the cost of understanding and maintaining it. Optimizations (hand-rolled loops, caches, preallocated buffers, denormalization) almost always make code more complex, so readability is the default and performance is raised selectively — on measured ___ paths. Knuth's classic formulation is \"premature optimization is the root of all evil\": in roughly 97% of cases small efficiencies should be forgotten, but in the critical 3% optimization is essential.",
    "options": [
      "hot",
      "cold",
      "critical",
      "core"
    ],
    "explanation": "The canonical term is \"hot path\" — the frequently executed code, identified by measurement, where optimization actually pays off. \"Cold\" paths run rarely and aren't worth optimizing, a \"critical path\" is a dependency-scheduling concept, and \"core\" describes central modules rather than execution frequency."
  }
};
