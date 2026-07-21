import type { ConceptCore } from '../schema';

export const conceptsCore: ConceptCore[] = [
  {
    "id": "srp",
    "name": "Single Responsibility Principle",
    "aka": [
      "SRP"
    ],
    "category": "solid",
    "grade": "junior",
    "related": [
      "ocp",
      "dip",
      "isp",
      "coupling-cohesion"
    ],
    "tags": [
      "принципы",
      "связанность"
    ],
    "diagram": "classDiagram\n  class Employee {\n    <<god class>>\n    +calculatePay()\n    +save()\n    +describeInReport()\n  }\n\n  class PayCalculator {\n    +calculate(Employee) number\n  }\n  class EmployeeRepository {\n    +save(Employee) void\n  }\n  class EmployeeReport {\n    +render(Employee) string\n  }\n\n  PayCalculator ..> Employee : accounting actor\n  EmployeeRepository ..> Employee : DBA actor\n  EmployeeReport ..> Employee : reporting actor",
    "codeLang": "typescript"
  },
  {
    "id": "ocp",
    "name": "Open/Closed Principle",
    "aka": [
      "OCP"
    ],
    "category": "solid",
    "grade": "junior",
    "related": [
      "lsp",
      "dip",
      "srp",
      "strategy"
    ],
    "tags": [
      "принципы",
      "расширяемость"
    ],
    "diagram": "classDiagram\n  class Shape {\n    <<interface>>\n    +area() number\n  }\n  class Circle {\n    +area() number\n  }\n  class Square {\n    +area() number\n  }\n  class Triangle {\n    +area() number\n  }\n  class AreaClient {\n    +totalArea(Shape[]) number\n  }\n\n  Shape <|.. Circle\n  Shape <|.. Square\n  Shape <|.. Triangle\n  AreaClient --> Shape",
    "codeLang": "typescript"
  },
  {
    "id": "lsp",
    "name": "Liskov Substitution Principle",
    "aka": [
      "LSP"
    ],
    "category": "solid",
    "grade": "junior",
    "related": [
      "ocp",
      "dip",
      "composition-vs-inheritance"
    ],
    "tags": [
      "принципы",
      "наследование"
    ],
    "diagram": "classDiagram\n  class Shape {\n    <<interface>>\n    +area() number\n  }\n  class Rect {\n    +area() number\n  }\n  class Sq {\n    +area() number\n  }\n\n  Shape <|.. Rect\n  Shape <|.. Sq\n  note for Sq \"independent contract, not a Rectangle subclass\"",
    "codeLang": "typescript"
  },
  {
    "id": "isp",
    "name": "Interface Segregation Principle",
    "aka": [
      "ISP"
    ],
    "category": "solid",
    "grade": "junior",
    "related": [
      "srp",
      "dip",
      "ocp",
      "abstraction-cost"
    ],
    "tags": [
      "принципы",
      "интерфейсы"
    ],
    "diagram": "classDiagram\n  class Worker {\n    <<interface>>\n    +work()\n    +eat()\n  }\n  class Workable {\n    <<interface>>\n    +work()\n  }\n  class Eatable {\n    <<interface>>\n    +eat()\n  }\n  class Human\n  class Machine\n\n  Workable <|.. Human\n  Eatable <|.. Human\n  Workable <|.. Machine\n  note for Worker \"before: fat interface forces Robot.eat() to throw\"",
    "codeLang": "typescript"
  },
  {
    "id": "dip",
    "name": "Dependency Inversion Principle",
    "aka": [
      "DIP"
    ],
    "category": "solid",
    "grade": "middle",
    "related": [
      "ocp",
      "isp",
      "srp",
      "abstraction-cost"
    ],
    "tags": [
      "принципы",
      "внедрение зависимостей"
    ],
    "diagram": "classDiagram\n  class UserService {\n    +register(user)\n  }\n  class Database {\n    <<interface>>\n    +save(data)\n  }\n  class MySqlDatabase {\n    +save(data)\n  }\n  class InMemoryDatabase {\n    +save(data)\n  }\n\n  UserService --> Database\n  Database <|.. MySqlDatabase\n  Database <|.. InMemoryDatabase",
    "codeLang": "typescript"
  },
  {
    "id": "strategy",
    "name": "Strategy",
    "aka": [
      "Policy"
    ],
    "category": "behavioral",
    "grade": "middle",
    "related": [
      "state",
      "ocp",
      "template-method",
      "command"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Checkout {\n    +total(base)\n  }\n  class PricingStrategy {\n    <<interface>>\n    +price(base)\n  }\n  Checkout o--> PricingStrategy : delegates\n  PricingStrategy <|.. Regular\n  PricingStrategy <|.. Vip",
    "codeLang": "typescript"
  },
  {
    "id": "observer",
    "name": "Observer",
    "aka": [
      "Dependents",
      "Publish-Subscribe"
    ],
    "category": "behavioral",
    "grade": "middle",
    "related": [
      "strategy",
      "mediator",
      "event-driven",
      "command"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Subject {\n    +attach(o)\n    +notify()\n  }\n  class Observer {\n    <<interface>>\n    +update()\n  }\n  Subject o--> \"many\" Observer\n  Observer <|.. ConcreteObserver",
    "codeLang": "typescript"
  },
  {
    "id": "factory-method",
    "name": "Factory Method",
    "aka": [
      "Virtual Constructor"
    ],
    "category": "creational",
    "grade": "middle",
    "related": [
      "abstract-factory",
      "template-method",
      "ocp"
    ],
    "tags": [
      "паттерны",
      "порождающие"
    ],
    "diagram": "classDiagram\n  class Creator {\n    +factoryMethod()\n    +operation()\n  }\n  class Product {\n    <<interface>>\n  }\n  Creator <|-- ConcreteCreator\n  Product <|.. ConcreteProduct\n  ConcreteCreator ..> ConcreteProduct : creates",
    "codeLang": "typescript"
  },
  {
    "id": "state",
    "name": "State",
    "category": "behavioral",
    "grade": "senior",
    "related": [
      "strategy",
      "command",
      "template-method"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class TrafficLight {\n    -state: TrafficState\n    +change()\n  }\n  class TrafficState {\n    <<interface>>\n    +next(light)\n  }\n  TrafficLight o--> TrafficState\n  TrafficState <|.. Red\n  TrafficState <|.. Green\n  TrafficState <|.. Yellow\n  Red ..> Green : next()\n  Green ..> Yellow : next()\n  Yellow ..> Red : next()",
    "codeLang": "typescript"
  },
  {
    "id": "abstract-factory",
    "name": "Abstract Factory",
    "aka": [
      "Kit"
    ],
    "category": "creational",
    "grade": "senior",
    "related": [
      "factory-method",
      "builder",
      "dip"
    ],
    "tags": [
      "паттерны",
      "порождающие"
    ],
    "diagram": "classDiagram\n  class AbstractFactory {\n    <<interface>>\n    +createA()\n    +createB()\n  }\n  AbstractFactory <|.. ConcreteFactory1\n  AbstractFactory <|.. ConcreteFactory2\n  AbstractFactory ..> ProductA : creates\n  AbstractFactory ..> ProductB : creates",
    "codeLang": "typescript"
  },
  {
    "id": "singleton",
    "name": "Singleton",
    "category": "creational",
    "grade": "junior",
    "related": [
      "factory-method",
      "abstract-factory",
      "flyweight",
      "dip"
    ],
    "tags": [
      "паттерны",
      "порождающие"
    ],
    "diagram": "classDiagram\n  class Singleton {\n    -static instance: Singleton\n    -Singleton()\n    +static getInstance() Singleton\n    +operation()\n  }\n  Singleton --> Singleton : getInstance() returns the same instance",
    "codeLang": "typescript"
  },
  {
    "id": "builder",
    "name": "Builder",
    "category": "creational",
    "grade": "middle",
    "related": [
      "abstract-factory",
      "factory-method",
      "prototype",
      "composite"
    ],
    "tags": [
      "паттерны",
      "порождающие"
    ],
    "diagram": "classDiagram\n  class Director {\n    +construct(builder)\n  }\n  class HttpRequestBuilder {\n    +setHeader(name, value) this\n    +setBody(body) this\n    +build() HttpRequest\n  }\n  class HttpRequest {\n    +method\n    +url\n    +headers\n    +body\n  }\n  Director --> HttpRequestBuilder : directs\n  HttpRequestBuilder ..> HttpRequest : creates",
    "codeLang": "typescript"
  },
  {
    "id": "prototype",
    "name": "Prototype",
    "aka": [
      "Clone"
    ],
    "category": "creational",
    "grade": "middle",
    "related": [
      "factory-method",
      "abstract-factory",
      "memento"
    ],
    "tags": [
      "паттерны",
      "порождающие"
    ],
    "diagram": "classDiagram\n  class Shape {\n    <<interface>>\n    +clone() Shape\n  }\n  class Circle {\n    +radius\n    +clone() Circle\n  }\n  class Rectangle {\n    +width\n    +height\n    +clone() Rectangle\n  }\n  class PrototypeRegistry {\n    -prototypes: Map~string, Shape~\n    +register(key, prototype)\n    +create(key) Shape\n  }\n  Shape <|.. Circle\n  Shape <|.. Rectangle\n  PrototypeRegistry o--> Shape : stores",
    "codeLang": "typescript"
  },
  {
    "id": "adapter",
    "name": "Adapter",
    "aka": [
      "Wrapper"
    ],
    "category": "structural",
    "grade": "junior",
    "related": [
      "facade",
      "decorator",
      "proxy",
      "bridge",
      "anti-corruption-layer"
    ],
    "tags": [
      "паттерны",
      "структурные"
    ],
    "diagram": "classDiagram\n  class Target {\n    <<interface>>\n    +request()\n  }\n  class Adaptee {\n    +specificRequest()\n  }\n  Target <|.. Adapter\n  Adapter o--> Adaptee",
    "codeLang": "typescript"
  },
  {
    "id": "bridge",
    "name": "Bridge",
    "aka": [
      "Handle/Body"
    ],
    "category": "structural",
    "grade": "senior",
    "related": [
      "adapter",
      "strategy",
      "abstract-factory",
      "composition-vs-inheritance"
    ],
    "tags": [
      "паттерны",
      "структурные"
    ],
    "diagram": "classDiagram\n  class Abstraction {\n    #implementor: Implementor\n    +operation()\n  }\n  class RefinedAbstraction\n  class Implementor {\n    <<interface>>\n    +operationImpl()\n  }\n  Abstraction o--> Implementor\n  Abstraction <|-- RefinedAbstraction\n  Implementor <|.. ConcreteImplementorA\n  Implementor <|.. ConcreteImplementorB",
    "codeLang": "typescript"
  },
  {
    "id": "composite",
    "name": "Composite",
    "category": "structural",
    "grade": "middle",
    "related": [
      "decorator",
      "iterator",
      "visitor",
      "flyweight"
    ],
    "tags": [
      "паттерны",
      "структурные"
    ],
    "diagram": "classDiagram\n  class Component {\n    <<interface>>\n    +operation()\n  }\n  Component <|.. Leaf\n  Component <|.. Composite\n  Composite o--> \"children\" Component",
    "codeLang": "typescript"
  },
  {
    "id": "decorator",
    "name": "Decorator",
    "aka": [
      "Wrapper"
    ],
    "category": "structural",
    "grade": "middle",
    "related": [
      "proxy",
      "adapter",
      "composite",
      "composition-vs-inheritance"
    ],
    "tags": [
      "паттерны",
      "структурные"
    ],
    "diagram": "classDiagram\n  class Component {\n    <<interface>>\n    +operation()\n  }\n  Component <|.. ConcreteComponent\n  Component <|.. Decorator\n  Decorator o--> Component : wraps\n  Decorator <|-- ConcreteDecorator",
    "codeLang": "typescript"
  },
  {
    "id": "facade",
    "name": "Facade",
    "category": "structural",
    "grade": "junior",
    "related": [
      "adapter",
      "mediator",
      "proxy"
    ],
    "tags": [
      "паттерны",
      "структурные"
    ],
    "diagram": "classDiagram\n  class Facade {\n    +operation()\n  }\n  class SubsystemA {\n    +operationA()\n  }\n  class SubsystemB {\n    +operationB()\n  }\n  class SubsystemC {\n    +operationC()\n  }\n  Facade --> SubsystemA\n  Facade --> SubsystemB\n  Facade --> SubsystemC",
    "codeLang": "typescript"
  },
  {
    "id": "flyweight",
    "name": "Flyweight",
    "aka": [
      "Приспособленец"
    ],
    "category": "structural",
    "grade": "senior",
    "related": [
      "singleton",
      "prototype",
      "composite",
      "proxy"
    ],
    "tags": [
      "паттерны",
      "структурные"
    ],
    "diagram": "classDiagram\n  class FlyweightFactory {\n    -cache: Map~string, Flyweight~\n    +getFlyweight(key) Flyweight\n  }\n  class Flyweight {\n    <<interface>>\n    +operation(extrinsicState)\n  }\n  class Context {\n    -extrinsicState\n    -flyweight: Flyweight\n  }\n  FlyweightFactory ..> Flyweight : caches\n  Context o--> Flyweight",
    "codeLang": "typescript"
  },
  {
    "id": "proxy",
    "name": "Proxy",
    "aka": [
      "Surrogate"
    ],
    "category": "structural",
    "grade": "middle",
    "related": [
      "decorator",
      "adapter",
      "facade"
    ],
    "tags": [
      "паттерны",
      "структурные"
    ],
    "diagram": "classDiagram\n  class Subject {\n    <<interface>>\n    +request()\n  }\n  Subject <|.. RealSubject\n  Subject <|.. Proxy\n  Proxy o--> RealSubject",
    "codeLang": "typescript"
  },
  {
    "id": "chain-of-responsibility",
    "name": "Chain of Responsibility",
    "aka": [
      "CoR"
    ],
    "category": "behavioral",
    "grade": "middle",
    "related": [
      "command",
      "decorator",
      "mediator"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Handler {\n    <<interface>>\n    +setNext(h)\n    +handle(req)\n  }\n  Handler o--> \"next\" Handler\n  Handler <|.. ConcreteHandlerA\n  Handler <|.. ConcreteHandlerB",
    "codeLang": "typescript"
  },
  {
    "id": "command",
    "name": "Command",
    "aka": [
      "Action",
      "Transaction"
    ],
    "category": "behavioral",
    "grade": "middle",
    "related": [
      "strategy",
      "memento",
      "chain-of-responsibility"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Command {\n    <<interface>>\n    +execute()\n    +undo()\n  }\n  class Invoker {\n    +history\n    +run(cmd)\n    +undoLast()\n  }\n  class Receiver {\n    +action()\n  }\n  class ConcreteCommand {\n    -receiver\n    +execute()\n    +undo()\n  }\n  Invoker o--> Command\n  Command <|.. ConcreteCommand\n  ConcreteCommand --> Receiver",
    "codeLang": "typescript"
  },
  {
    "id": "interpreter",
    "name": "Interpreter",
    "category": "behavioral",
    "grade": "senior",
    "related": [
      "composite",
      "visitor",
      "flyweight"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Expression {\n    <<interface>>\n    +interpret(context)\n  }\n  class TerminalExpression {\n    +interpret(context)\n  }\n  class NonterminalExpression {\n    -left: Expression\n    -right: Expression\n    +interpret(context)\n  }\n  Expression <|.. TerminalExpression\n  Expression <|.. NonterminalExpression\n  NonterminalExpression o--> Expression",
    "codeLang": "typescript"
  },
  {
    "id": "iterator",
    "name": "Iterator",
    "aka": [
      "Cursor"
    ],
    "category": "behavioral",
    "grade": "junior",
    "related": [
      "composite",
      "visitor",
      "factory-method",
      "memento"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Iterator {\n    <<interface>>\n    +hasNext()\n    +next()\n  }\n  class Aggregate {\n    <<interface>>\n    +createIterator()\n  }\n  class ConcreteIterator {\n    -position\n    +hasNext()\n    +next()\n  }\n  class ConcreteAggregate {\n    +createIterator()\n  }\n  Iterator <|.. ConcreteIterator\n  Aggregate <|.. ConcreteAggregate\n  ConcreteAggregate ..> ConcreteIterator : creates",
    "codeLang": "typescript"
  },
  {
    "id": "mediator",
    "name": "Mediator",
    "aka": [
      "Intermediary",
      "Controller"
    ],
    "category": "behavioral",
    "grade": "senior",
    "related": [
      "observer",
      "facade",
      "command",
      "chain-of-responsibility"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Mediator {\n    <<interface>>\n    +notify(sender, event)\n  }\n  class ConcreteMediator {\n    +notify(sender, event)\n  }\n  class Colleague {\n    -mediator: Mediator\n  }\n  class ColleagueA\n  class ColleagueB\n  Mediator <|.. ConcreteMediator\n  Colleague <|-- ColleagueA\n  Colleague <|-- ColleagueB\n  Colleague --> Mediator\n  ConcreteMediator o--> ColleagueA\n  ConcreteMediator o--> ColleagueB",
    "codeLang": "typescript"
  },
  {
    "id": "memento",
    "name": "Memento",
    "aka": [
      "Token",
      "Snapshot"
    ],
    "category": "behavioral",
    "grade": "middle",
    "related": [
      "command",
      "prototype",
      "state"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Originator {\n    -state\n    +save() Memento\n    +restore(m: Memento)\n  }\n  class Memento {\n    -state\n    +getState()\n  }\n  class Caretaker {\n    -history: Memento[]\n  }\n  Originator ..> Memento : creates\n  Caretaker o--> Memento : stores (opaque)",
    "codeLang": "typescript"
  },
  {
    "id": "template-method",
    "name": "Template Method",
    "category": "behavioral",
    "grade": "middle",
    "related": [
      "strategy",
      "factory-method",
      "composition-vs-inheritance"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class AbstractClass {\n    +templateMethod()\n    #step1()*\n    #hook()\n  }\n  class ConcreteClassA {\n    #step1()\n    #hook()\n  }\n  class ConcreteClassB {\n    #step1()\n  }\n  AbstractClass <|-- ConcreteClassA\n  AbstractClass <|-- ConcreteClassB",
    "codeLang": "typescript"
  },
  {
    "id": "visitor",
    "name": "Visitor",
    "category": "behavioral",
    "grade": "senior",
    "related": [
      "composite",
      "iterator",
      "interpreter",
      "ocp"
    ],
    "tags": [
      "паттерны",
      "поведенческие"
    ],
    "diagram": "classDiagram\n  class Visitor {\n    <<interface>>\n    +visitConcreteElementA(e)\n    +visitConcreteElementB(e)\n  }\n  class Element {\n    <<interface>>\n    +accept(v: Visitor)\n  }\n  class ConcreteElementA {\n    +accept(v)\n  }\n  class ConcreteElementB {\n    +accept(v)\n  }\n  class ConcreteVisitor1\n  class ConcreteVisitor2\n  Element <|.. ConcreteElementA\n  Element <|.. ConcreteElementB\n  Visitor <|.. ConcreteVisitor1\n  Visitor <|.. ConcreteVisitor2\n  ConcreteElementA ..> Visitor : accept(v) calls visitConcreteElementA\n  ConcreteElementB ..> Visitor : accept(v) calls visitConcreteElementB",
    "codeLang": "typescript"
  },
  {
    "id": "layered",
    "name": "Layered Architecture",
    "aka": [
      "N-tier Architecture",
      "Multitier Architecture"
    ],
    "category": "architecture",
    "grade": "junior",
    "related": [
      "hexagonal",
      "clean-architecture",
      "mvc",
      "monolith"
    ],
    "tags": [
      "архитектура",
      "архитектурные стили",
      "слои"
    ],
    "diagram": "flowchart TD\n  P[Presentation] --> B[Business Logic]\n  B --> D[Data Access]\n  D --> DB[(Database)]",
    "codeLang": "typescript"
  },
  {
    "id": "mvc",
    "name": "MVC",
    "aka": [
      "Model-View-Controller"
    ],
    "category": "architecture",
    "grade": "junior",
    "related": [
      "mvvm",
      "layered",
      "observer",
      "srp"
    ],
    "tags": [
      "архитектура",
      "ui"
    ],
    "diagram": "flowchart LR\n  U[User] -->|input| C[Controller]\n  C -->|invoke operation| M[Model]\n  M -->|change state + notify| V[View]\n  V -->|read state| M\n  V -->|render| U\n  M -.->|knows nothing about| C\n  M -.->|knows nothing about| V",
    "codeLang": "typescript"
  },
  {
    "id": "mvvm",
    "name": "MVVM",
    "aka": [
      "Model-View-ViewModel"
    ],
    "category": "architecture",
    "grade": "middle",
    "related": [
      "mvc",
      "observer",
      "layered"
    ],
    "tags": [
      "архитектура",
      "ui-паттерны"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "monolith",
    "name": "Monolith",
    "aka": [
      "Monolithic Architecture"
    ],
    "category": "architecture",
    "grade": "middle",
    "related": [
      "microservices",
      "layered",
      "hexagonal",
      "coupling-cohesion"
    ],
    "tags": [
      "архитектура",
      "архитектурные стили"
    ],
    "diagram": "flowchart TB\n  subgraph App[Single Deployable Unit]\n    UI[Presentation]\n    Order[Order Module]\n    Inventory[Inventory Module]\n    Billing[Billing Module]\n    DB[(Shared Database)]\n    UI --> Order\n    Order -->|in-process call| Inventory\n    Order -->|in-process call| Billing\n    Inventory --> DB\n    Billing --> DB\n  end",
    "codeLang": "typescript"
  },
  {
    "id": "hexagonal",
    "name": "Hexagonal Architecture (Ports & Adapters)",
    "aka": [
      "Ports and Adapters"
    ],
    "category": "architecture",
    "grade": "senior",
    "related": [
      "dip",
      "clean-architecture",
      "layered",
      "adapter"
    ],
    "tags": [
      "архитектура",
      "архитектурные стили",
      "ports-and-adapters"
    ],
    "diagram": "flowchart LR\n  A[Adapters: UI / API] --> PIn((Ports))\n  PIn --> Core[Domain Core]\n  Core --> POut((Ports))\n  POut --> Inf[Adapters: DB / External]",
    "codeLang": "typescript"
  },
  {
    "id": "clean-architecture",
    "name": "Clean Architecture",
    "category": "architecture",
    "grade": "senior",
    "related": [
      "hexagonal",
      "layered",
      "dip"
    ],
    "tags": [
      "архитектура",
      "архитектурные стили"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "event-driven",
    "name": "Event-driven Architecture",
    "aka": [
      "EDA",
      "Event-driven"
    ],
    "category": "architecture",
    "grade": "senior",
    "related": [
      "observer",
      "mediator",
      "microservices",
      "coupling-cohesion",
      "saga"
    ],
    "tags": [
      "архитектура",
      "асинхронность",
      "интеграция"
    ],
    "diagram": "flowchart LR\n  P[Producer: Checkout Service] -->|publish OrderPlaced| B[[Event Broker]]\n  B -->|deliver| C1[Consumer: Notifications]\n  B -->|deliver| C2[Consumer: Analytics]\n  B -->|deliver| C3[Consumer: Shipping]\n  C1 -.->|no reply expected| B\n  C2 -.->|no reply expected| B",
    "codeLang": "typescript"
  },
  {
    "id": "microservices",
    "name": "Microservices",
    "aka": [
      "Microservice Architecture"
    ],
    "category": "architecture",
    "grade": "lead",
    "related": [
      "monolith",
      "event-driven",
      "hexagonal",
      "coupling-cohesion"
    ],
    "tags": [
      "архитектура",
      "распределённые системы"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "composition-vs-inheritance",
    "name": "Composition vs Inheritance",
    "category": "tradeoff",
    "grade": "middle",
    "related": [
      "strategy",
      "decorator",
      "template-method",
      "lsp"
    ],
    "tags": [
      "trade-offs",
      "проектирование"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "coupling-cohesion",
    "name": "Coupling & Cohesion",
    "aka": [
      "Low Coupling, High Cohesion"
    ],
    "category": "tradeoff",
    "grade": "middle",
    "related": [
      "srp",
      "dip",
      "isp",
      "facade"
    ],
    "tags": [
      "trade-offs",
      "модульность",
      "принципы"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "dry-vs-duplication",
    "name": "DRY vs Duplication",
    "aka": [
      "Don't Repeat Yourself",
      "Single Source of Truth"
    ],
    "category": "tradeoff",
    "grade": "middle",
    "related": [
      "srp",
      "abstraction-cost",
      "yagni-vs-flexibility",
      "coupling-cohesion"
    ],
    "tags": [
      "компромиссы",
      "принципы"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "abstraction-cost",
    "name": "Abstraction Cost",
    "aka": [
      "Cost of Abstraction"
    ],
    "category": "tradeoff",
    "grade": "senior",
    "related": [
      "yagni-vs-flexibility",
      "dip",
      "coupling-cohesion",
      "dry-vs-duplication"
    ],
    "tags": [
      "trade-offs",
      "абстракция",
      "косвенность",
      "leaky abstractions"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "yagni-vs-flexibility",
    "name": "YAGNI vs Flexibility",
    "aka": [
      "You Aren't Gonna Need It"
    ],
    "category": "tradeoff",
    "grade": "senior",
    "related": [
      "abstraction-cost",
      "ocp",
      "dry-vs-duplication",
      "strategy"
    ],
    "tags": [
      "компромиссы",
      "принципы",
      "XP"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "performance-vs-readability",
    "name": "Performance vs Readability",
    "aka": [
      "Premature Optimization"
    ],
    "category": "tradeoff",
    "grade": "lead",
    "related": [
      "abstraction-cost",
      "yagni-vs-flexibility",
      "dry-vs-duplication"
    ],
    "tags": [
      "trade-offs",
      "производительность",
      "читаемость"
    ],
    "codeLang": "typescript"
  },
  {
    "id": "database-per-service",
    "name": "Database per Service",
    "aka": [
      "Private Database per Service"
    ],
    "category": "microservices",
    "grade": "middle",
    "related": [
      "microservices",
      "saga",
      "cqrs",
      "api-gateway"
    ],
    "tags": [
      "микросервисы",
      "хранение данных",
      "связанность"
    ],
    "diagram": "flowchart LR\n  OS[Order Service] --> ODB[(Order DB)]\n  CS[Customer Service] --> CDB[(Customer DB)]\n  IS[Inventory Service] --> IDB[(Inventory DB)]\n  OS -->|API / events| CS\n  OS -->|API / events| IS",
    "codeLang": "typescript"
  },
  {
    "id": "api-gateway",
    "name": "API Gateway",
    "aka": [
      "Gateway",
      "Edge Service"
    ],
    "category": "microservices",
    "grade": "middle",
    "related": [
      "bff",
      "aggregator",
      "circuit-breaker",
      "microservices"
    ],
    "tags": [
      "микросервисы",
      "gateway",
      "маршрутизация",
      "cross-cutting concerns"
    ],
    "diagram": "flowchart LR\n  C[Client] --> G[API Gateway]\n  G --> A[Order Service]\n  G --> B[User Service]\n  G --> D[Payment Service]",
    "codeLang": "typescript"
  },
  {
    "id": "aggregator",
    "name": "Aggregator",
    "category": "microservices",
    "grade": "senior",
    "related": [
      "api-gateway",
      "bff"
    ],
    "tags": [
      "микросервисы",
      "композиция",
      "fan-out/fan-in",
      "оркестрация данных"
    ],
    "diagram": "flowchart LR\n  C[Client] --> AG[Aggregator]\n  AG --> S1[Order Service]\n  AG --> S2[User Service]\n  AG --> S3[Payment Service]\n  S1 --> M[Merge responses]\n  S2 --> M\n  S3 --> M\n  M --> C",
    "codeLang": "typescript"
  },
  {
    "id": "bff",
    "name": "Backend for Frontend",
    "aka": [
      "BFF",
      "Backends for Frontends"
    ],
    "category": "microservices",
    "grade": "senior",
    "related": [
      "api-gateway",
      "aggregator"
    ],
    "tags": [
      "микросервисы",
      "api",
      "фронтенд",
      "интеграция"
    ],
    "diagram": "flowchart LR\n  Web[Web App] --> WebBFF[Web BFF]\n  Mobile[Mobile App] --> MobileBFF[Mobile BFF]\n  WebBFF --> UserSvc[User Service]\n  WebBFF --> OrderSvc[Order Service]\n  WebBFF --> CatalogSvc[Catalog Service]\n  MobileBFF --> UserSvc\n  MobileBFF --> OrderSvc\n  MobileBFF --> CatalogSvc",
    "codeLang": "typescript"
  },
  {
    "id": "circuit-breaker",
    "name": "Circuit Breaker",
    "aka": [
      "Fail-fast breaker"
    ],
    "category": "microservices",
    "grade": "middle",
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
    "diagram": "stateDiagram-v2\n    [*] --> Closed\n    Closed --> Open: failures reach threshold\n    Open --> HalfOpen: cooldown elapsed\n    HalfOpen --> Closed: probe succeeds\n    HalfOpen --> Open: probe fails\n    Closed --> Closed: call succeeds",
    "codeLang": "typescript"
  },
  {
    "id": "bulkhead",
    "name": "Bulkhead",
    "aka": [
      "Bulkhead Isolation",
      "Resource Isolation"
    ],
    "category": "microservices",
    "grade": "senior",
    "related": [
      "circuit-breaker",
      "microservices"
    ],
    "tags": [
      "устойчивость",
      "resilience",
      "изоляция ресурсов",
      "отказоустойчивость"
    ],
    "diagram": "flowchart TD\n  C[Client requests] --> R{Router}\n  R --> PA[Pool A: 10 slots]\n  R --> PB[Pool B: 3 slots]\n  R --> PC[Pool C: 5 slots]\n  PA --> SA[Service A]\n  PB --> SB[Service B - slow]\n  PC --> SC[Service C]",
    "codeLang": "typescript"
  },
  {
    "id": "sidecar",
    "name": "Sidecar",
    "aka": [
      "Sidecar Pattern",
      "Sidekick Pattern"
    ],
    "category": "microservices",
    "grade": "senior",
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
    "diagram": "flowchart LR\n  subgraph Pod\n    direction LR\n    App[Application Container]\n    Sidecar[Sidecar Proxy Container]\n    App <-->|localhost| Sidecar\n  end\n  Sidecar <-->|mTLS| Mesh[Other Services]",
    "codeLang": "typescript"
  },
  {
    "id": "saga",
    "name": "Saga",
    "aka": [
      "Saga Pattern"
    ],
    "category": "microservices",
    "grade": "senior",
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
    "diagram": "sequenceDiagram\n    participant O as Orchestrator\n    participant Order as Order Service\n    participant Payment as Payment Service\n    participant Inventory as Inventory Service\n    O->>Order: Create order (local tx)\n    Order-->>O: Order created\n    O->>Payment: Charge payment (local tx)\n    Payment-->>O: Payment captured\n    O->>Inventory: Reserve stock (local tx)\n    Inventory-->>O: Out of stock (failure)\n    Note over O,Inventory: Failure triggers compensation\n    O->>Payment: Refund payment (compensating tx)\n    Payment-->>O: Payment refunded\n    O->>Order: Cancel order (compensating tx)\n    Order-->>O: Order cancelled",
    "codeLang": "typescript"
  },
  {
    "id": "cqrs",
    "name": "CQRS",
    "aka": [
      "Command Query Responsibility Segregation"
    ],
    "category": "microservices",
    "grade": "senior",
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
    "diagram": "flowchart LR\n  Client[Client]\n  Client -->|Command| CH[Command Handler]\n  CH --> WM[(Write Model)]\n  WM -->|Events / Sync| PROJ[Projections]\n  PROJ --> RM[(Read Model)]\n  Client -->|Query| QH[Query Handler]\n  QH --> RM",
    "codeLang": "typescript"
  },
  {
    "id": "event-sourcing",
    "name": "Event Sourcing",
    "category": "microservices",
    "grade": "lead",
    "related": [
      "cqrs",
      "event-driven",
      "saga"
    ],
    "tags": [
      "микросервисы",
      "данные",
      "аудит"
    ],
    "diagram": "flowchart LR\n    C[Command] --> A[Aggregate]\n    A -->|append new event| E[(Event Store)]\n    E -->|replay events| P[Projection]\n    P --> S[Current State]\n    S --> Q[Queries]\n    E -. rebuild anytime .-> P",
    "codeLang": "typescript"
  },
  {
    "id": "anti-corruption-layer",
    "name": "Anti-Corruption Layer",
    "aka": [
      "ACL"
    ],
    "category": "microservices",
    "grade": "senior",
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
    "diagram": "flowchart LR\n  A[\"Domain Model (your bounded context)\"] <--> B[\"Anti-Corruption Layer (translator)\"]\n  B <--> C[\"Legacy / External System\"]",
    "codeLang": "typescript"
  }
];
