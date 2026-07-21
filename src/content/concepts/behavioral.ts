import type { Concept, Question } from '../schema';

export const behavioral: Concept[] = [
  {
    id: "chain-of-responsibility",
    name: "Chain of Responsibility",
    aka: [
      "CoR",
    ],
    category: "behavioral",
    grade: "middle",
    tagline: {
      ru: "Запрос идёт по цепочке обработчиков, пока один из них его не обработает",
      en: "A request travels along a chain of handlers until one of them handles it",
    },
    definition: {
      ru: "Избавляет отправителя запроса от жёсткой привязки к получателю, давая возможность обработать запрос более чем одному объекту. Получатели связываются в цепочку, и запрос передаётся по ней, пока какой-нибудь объект его не обработает. Отправитель знает только первое звено цепочки и не обязан знать, какой конкретно обработчик (и откликнется ли вообще хоть один) в итоге ответит на запрос; состав и порядок звеньев можно менять независимо от кода, который этот запрос порождает.",
      en: "Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along the chain until an object handles it. The sender knows only the head of the chain and need not know which handler — if any — will ultimately respond; the chain's membership and order can be composed and rearranged independently of the code that issues the request.",
    },
    problem: {
      ru: "Запрос могут обработать несколько объектов, но какой именно — заранее неизвестно, а их набор и порядок могут меняться. Жёсткая привязка отправителя к конкретному получателю или каскад условных операторов «кто отвечает за этот случай» делают код негибким и трудным для расширения. Типичный пример — конвейер middleware в веб-фреймворке: запрос должен пройти проверку авторизации, валидацию и логирование, но заранее неясно, сколько шагов нужно конкретному маршруту и в каком порядке. Decorator здесь не подходит: декоратор всегда передаёт управление дальше и добавляет своё поведение вокруг вызова, а в этой задаче ровно один участник должен забрать запрос себе и остановить его дальнейшее движение.",
      en: "Several objects may be able to handle a request, but which one should is not known in advance, and the set of handlers and their order can change. Hard-wiring the sender to a specific receiver — or a cascade of conditionals deciding \"who is responsible for this case\" — makes the code rigid and hard to extend. A typical example is a middleware pipeline in a web framework: a request must pass through authentication, validation, and logging, but it isn't clear in advance how many steps a given route needs or in what order. Decorator doesn't fit here: a decorator always forwards control and layers its own behavior around the call, whereas this problem needs exactly one participant to claim the request and stop it from propagating further.",
    },
    solution: {
      ru: "Каждый обработчик реализует общий интерфейс и хранит ссылку на следующее звено. Получив запрос, обработчик сначала решает, относится ли он к его компетенции: если да — формирует ответ и обработка останавливается, если нет — передаёт запрос дальше по цепочке (обычно вызовом handle() у next или через super.handle() в базовом классе). Клиент отправляет запрос первому звену и не знает, кто в итоге ответит; состав и порядок цепочки собираются динамически, например через setNext(). Эта структура — точный аналог middleware: каждый слой либо перехватывает запрос и завершает конвейер, либо прозрачно пропускает его дальше без изменений. Если ни одно звено не откликнулось, запрос доходит до конца цепочки необработанным — это стоит предусмотреть явно (например, обработчиком по умолчанию в хвосте цепочки), а не считать невозможным случаем.",
      en: "Each handler implements a common interface and holds a reference to the next link. On receiving a request, a handler first decides whether the request falls within its competence: if so, it produces a response and processing stops; if not, it passes the request further down the chain (typically by calling handle() on next, or via super.handle() in a base class). The client sends the request to the first link and does not know who will ultimately respond; the composition and order of the chain are assembled dynamically, for example through setNext(). This structure is a direct analogue of middleware: each layer either intercepts the request and terminates the pipeline, or transparently passes it on unchanged. If no link responds, the request reaches the end of the chain unhandled — that outcome should be planned for explicitly (say, with a default handler at the tail), not assumed away as impossible.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface Handler { setNext(h: Handler): Handler; handle(request: string): string | null; }",
          "",
          "abstract class SupportHandler implements Handler {",
          "  private next: Handler | null = null;",
          "  setNext(h: Handler) { this.next = h; return h; }",
          "  handle(request: string): string | null {",
          "    return this.next ? this.next.handle(request) : null; // не мой случай — передаю дальше",
          "  }",
          "}",
          "",
          "class BotSupport extends SupportHandler {",
          "  handle(r: string) { return r === 'faq' ? 'Бот: ответ из FAQ' : super.handle(r); }",
          "}",
          "class OperatorSupport extends SupportHandler {",
          "  handle(r: string) { return r === 'billing' ? 'Оператор: вопрос оплаты решён' : super.handle(r); }",
          "}",
          "class EngineerSupport extends SupportHandler {",
          "  handle(r: string) { return `Инженер: разберу «${r}» вручную`; }",
          "}",
          "",
          "const chain = new BotSupport();",
          "chain.setNext(new OperatorSupport()).setNext(new EngineerSupport());",
          "chain.handle('billing'); // бот передал дальше — обработал оператор",
        ].join('\n'),
        en: [
          "interface Handler { setNext(h: Handler): Handler; handle(request: string): string | null; }",
          "",
          "abstract class SupportHandler implements Handler {",
          "  private next: Handler | null = null;",
          "  setNext(h: Handler) { this.next = h; return h; }",
          "  handle(request: string): string | null {",
          "    return this.next ? this.next.handle(request) : null; // not my case — pass it on",
          "  }",
          "}",
          "",
          "class BotSupport extends SupportHandler {",
          "  handle(r: string) { return r === 'faq' ? 'Bot: answer from the FAQ' : super.handle(r); }",
          "}",
          "class OperatorSupport extends SupportHandler {",
          "  handle(r: string) { return r === 'billing' ? 'Operator: billing question resolved' : super.handle(r); }",
          "}",
          "class EngineerSupport extends SupportHandler {",
          "  handle(r: string) { return `Engineer: I'll handle \"${r}\" manually`; }",
          "}",
          "",
          "const chain = new BotSupport();",
          "chain.setNext(new OperatorSupport()).setNext(new EngineerSupport());",
          "chain.handle('billing'); // bot passed it on — handled by the operator",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Отправитель развязан с конкретным получателем запроса",
        "Обработчики добавляются и переставляются без правки клиента (соответствует OCP)",
        "Каждый обработчик отвечает только за свой случай (в духе SRP)",
        "Каждое звено тестируется в изоляции: оно ничего не знает о внутреннем устройстве соседей",
      ],
      en: [
        "The sender is decoupled from the concrete receiver of the request",
        "Handlers can be added or reordered without changing the client (satisfies the Open/Closed Principle)",
        "Each handler is responsible for only its own case (in the spirit of the Single Responsibility Principle)",
        "Each link can be tested in isolation, since it knows nothing about its neighbors' internals",
      ],
    },
    cons: {
      ru: [
        "Запрос может пройти всю цепочку и остаться необработанным",
        "Путь запроса неочевиден — сложнее отлаживать и отслеживать",
        "Длинная цепочка добавляет накладные расходы на последовательный проход",
      ],
      en: [
        "A request may traverse the entire chain and go unhandled",
        "The path of a request is not obvious, making it harder to debug and trace",
        "A long chain adds the overhead of a sequential traversal",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость состава и порядка обработчиков против отсутствия гарантии, что запрос вообще будет обработан",
        "Развязка отправителя и получателя против прозрачности потока управления",
        "В отличие от Decorator, где каждый слой обязательно передаёт управление дальше и добавляет своё поведение, здесь ровно одно звено может забрать запрос и остановить цепочку — иное распределение ответственности за завершение обработки",
      ],
      en: [
        "Flexibility in the composition and order of handlers versus no guarantee that the request will be handled at all",
        "Decoupling the sender from the receiver versus transparency of the control flow",
        "Unlike Decorator, where every layer always forwards control and adds its own behavior, here exactly one link can claim the request and halt the chain — a different allocation of responsibility for terminating processing",
      ],
    },
    whenToUse: {
      ru: [
        "Запрос могут обработать несколько объектов, и конкретный обработчик заранее неизвестен",
        "Набор или порядок обработчиков должен настраиваться динамически",
        "Конвейеры промежуточной обработки: проверки доступа, валидация, логирование (middleware)",
      ],
      en: [
        "More than one object can handle a request, and the specific handler is not known in advance",
        "The set or order of handlers needs to be configured dynamically",
        "Processing pipelines: access checks, validation, logging (middleware)",
      ],
    },
    whenNotToUse: {
      ru: [
        "Получатель ровно один и известен заранее — достаточно прямого вызова",
        "Обработка обязана произойти гарантированно, а «пустой» проход цепочки недопустим",
      ],
      en: [
        "There is exactly one receiver and it is known in advance — a direct call is enough",
        "Handling must be guaranteed to occur, and an \"empty\" pass through the chain is unacceptable",
      ],
    },
    related: [
      "command",
      "decorator",
      "mediator",
    ],
    diagram: `classDiagram
  class Handler {
    <<interface>>
    +setNext(h)
    +handle(req)
  }
  Handler o--> "next" Handler
  Handler <|.. ConcreteHandlerA
  Handler <|.. ConcreteHandlerB`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "command",
    name: "Command",
    aka: [
      "Action",
      "Transaction",
    ],
    category: "behavioral",
    grade: "middle",
    tagline: {
      ru: "Запрос как объект: очереди, логирование и отмена операций",
      en: "A request as an object: queuing, logging, and undoable operations",
    },
    definition: {
      ru: "Инкапсулирует запрос в виде объекта, позволяя параметризовать клиентов разными запросами, ставить запросы в очередь, протоколировать их и поддерживать отмену операций. Команда отделяет то, что нужно выполнить, от того, кто и когда это выполнит: инициатор (invoker) хранит и запускает объекты-команды, а получатель (receiver), которому в итоге делегируется реальная работа, о существовании команды вообще не подозревает.",
      en: "Encapsulates a request as an object, letting you parameterize clients with different requests, queue or log requests, and support undoable operations. Command separates what needs to be done from who performs it and when: the invoker holds and triggers command objects, while the receiver — to which the actual work is ultimately delegated — isn't even aware that a command exists.",
    },
    problem: {
      ru: "Инициатор действия (кнопка, пункт меню, планировщик) не должен знать, кто и как выполнит операцию. Прямой вызов метода получателя жёстко связывает их между собой и не позволяет откладывать выполнение, ставить запросы в очередь, вести журнал операций или отменять уже выполненные действия. Если операцию нужно логировать для аудита, повторить после сбоя или собрать в составной сценарий (макрос), обычный вызов метода для этого не годится: сам вызов исчезает сразу после выполнения и не оставляет после себя объекта, с которым можно было бы работать дальше.",
      en: "The initiator of an action (a button, a menu item, a scheduler) shouldn't need to know who performs the operation or how. Calling a receiver's method directly couples the two tightly and makes it impossible to defer execution, queue requests, keep an operation log, or undo actions that have already run. If an operation needs to be logged for auditing, retried after a failure, or composed into a larger scenario (a macro), a plain method call isn't suited for that — the call itself vanishes the instant it executes and leaves behind no object you could keep working with.",
    },
    solution: {
      ru: "Запрос оформляется отдельным объектом-командой с единым методом execute(). Команда хранит ссылку на получателя (receiver) и параметры вызова, а инициатор (invoker) работает только с интерфейсом Command: выполняет команды, накапливает историю и вызывает undo() для отмены. Так вызов операции отделяется от её выполнения. Такое разделение открывает путь к составным командам (макрокомандам), которые сами реализуют интерфейс Command и последовательно прогоняют вложенные команды, а также к отложенным командам, которые кладутся в очередь и обрабатываются воркером позже. Команду обычно проектируют неизменяемой: все параметры вызова фиксируются в конструкторе, а execute() и undo() лишь используют уже готовые данные, не принимая новых аргументов извне.",
      en: "The request is packaged as a separate command object with a single execute() method. The command holds a reference to the receiver along with the call parameters, while the invoker works only against the Command interface: it executes commands, accumulates a history, and calls undo() to reverse them. This decouples invoking an operation from performing it. That separation opens the door to composite commands (macro-commands) that themselves implement the Command interface and run their nested commands in sequence, as well as to deferred commands that are placed on a queue and processed later by a worker. A command is usually designed to be immutable: all of the call's parameters are fixed in the constructor, and execute() and undo() simply operate on that already-prepared data rather than accepting new arguments from outside.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface Command { execute(): void; undo(): void; }",
          "",
          "class Light {",
          "  on() { console.log('Свет включён'); }",
          "  off() { console.log('Свет выключен'); }",
          "}",
          "",
          "class LightOnCommand implements Command {",
          "  constructor(private light: Light) {} // команда хранит получателя и параметры",
          "  execute() { this.light.on(); }",
          "  undo() { this.light.off(); }",
          "}",
          "",
          "class RemoteControl {",
          "  private history: Command[] = [];",
          "  press(cmd: Command) { cmd.execute(); this.history.push(cmd); } // запрос — объект",
          "  undoLast() { this.history.pop()?.undo(); }",
          "}",
          "",
          "const remote = new RemoteControl();",
          "remote.press(new LightOnCommand(new Light())); // инициатор не знает получателя",
          "remote.undoLast();",
        ].join('\n'),
        en: [
          "interface Command { execute(): void; undo(): void; }",
          "",
          "class Light {",
          "  on() { console.log('Light on'); }",
          "  off() { console.log('Light off'); }",
          "}",
          "",
          "class LightOnCommand implements Command {",
          "  constructor(private light: Light) {} // command holds the receiver and call parameters",
          "  execute() { this.light.on(); }",
          "  undo() { this.light.off(); }",
          "}",
          "",
          "class RemoteControl {",
          "  private history: Command[] = [];",
          "  press(cmd: Command) { cmd.execute(); this.history.push(cmd); } // the request is an object",
          "  undoLast() { this.history.pop()?.undo(); }",
          "}",
          "",
          "const remote = new RemoteControl();",
          "remote.press(new LightOnCommand(new Light())); // invoker doesn't know the receiver",
          "remote.undoLast();",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Развязывает инициатора запроса и его получателя",
        "Команды можно ставить в очередь, логировать и выполнять отложенно",
        "Поддержка undo/redo через историю выполненных команд",
        "Составные команды (макросы) собираются из простых",
      ],
      en: [
        "Decouples the object that invokes a request from the one that performs it",
        "Commands can be queued, logged, and executed at a later time",
        "Supports undo/redo through a history of executed commands",
        "Composite commands (macros) can be assembled from simpler ones",
      ],
    },
    cons: {
      ru: [
        "Отдельный класс на каждую операцию — растёт объём кода",
        "Дополнительный слой косвенности между вызовом и действием",
        "Undo часто требует хранить достаточно данных для обратной операции, что усложняет команды с необратимыми побочными эффектами (отправка письма, списание платежа)",
      ],
      en: [
        "A separate class for every operation inflates the amount of code",
        "An extra layer of indirection between the call and the action",
        "Undo often requires storing enough data to perform the inverse operation, which complicates commands with irreversible side effects (sending an email, charging a payment)",
      ],
    },
    tradeoffs: {
      ru: [
        "Гибкость управления запросами (очереди, история, отмена) против роста числа классов",
        "Единообразный интерфейс всех операций против размазывания простой логики по объектам-обёрткам",
        "В отличие от Strategy, где клиент выбирает один из взаимозаменяемых алгоритмов для решения одной и той же задачи, Command оборачивает разнородные запросы как самостоятельные объекты ради очереди, истории и отмены — акцент на действии и его жизненном цикле, а не на выборе алгоритма",
      ],
      en: [
        "Flexible control over requests (queuing, history, undo) versus a growing number of classes",
        "A uniform interface across all operations versus scattering simple logic across wrapper objects",
        "Unlike Strategy, where the client picks one of several interchangeable algorithms for the same task, Command wraps disparate requests as standalone objects for the sake of queuing, history, and undo — the emphasis is on the action and its lifecycle, not on choosing an algorithm",
      ],
    },
    whenToUse: {
      ru: [
        "Нужно параметризовать объекты выполняемым действием: кнопки, пункты меню, горячие клавиши",
        "Нужны очередь запросов, отложенное выполнение или журнал операций",
        "Требуется отмена и повтор операций (undo/redo)",
      ],
      en: [
        "You need to parameterize objects with an action to perform: buttons, menu items, keyboard shortcuts",
        "You need a request queue, deferred execution, or an operation log",
        "You need to undo and redo operations (undo/redo)",
      ],
    },
    whenNotToUse: {
      ru: [
        "Операция вызывается сразу и напрямую, без очередей, истории и отмены — объект-обёртка не окупается",
        "Действия взаимозаменяемы и решают одну и ту же задачу разными способами — это выбор алгоритма (Strategy), а не инкапсуляция отдельного запроса",
      ],
      en: [
        "The operation is invoked immediately and directly, with no queuing, history, or undo — the wrapper object doesn't pay for itself",
        "The actions are interchangeable ways of solving the same task — that's a matter of choosing an algorithm (Strategy), not of encapsulating a single request",
      ],
    },
    related: [
      "strategy",
      "memento",
      "chain-of-responsibility",
    ],
    diagram: `classDiagram
  class Command {
    <<interface>>
    +execute()
    +undo()
  }
  class Invoker {
    +history
    +run(cmd)
    +undoLast()
  }
  class Receiver {
    +action()
  }
  class ConcreteCommand {
    -receiver
    +execute()
    +undo()
  }
  Invoker o--> Command
  Command <|.. ConcreteCommand
  ConcreteCommand --> Receiver`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "interpreter",
    name: "Interpreter",
    category: "behavioral",
    grade: "senior",
    tagline: {
      ru: "Грамматика мини-языка как дерево классов, умеющее вычислять свои предложения",
      en: "A mini-language's grammar as a tree of classes that can evaluate its own sentences",
    },
    definition: {
      ru: "Для заданного языка определяет представление его грамматики, а также интерпретатор, который использует это представление для интерпретации предложений языка. Каждому правилу грамматики соответствует свой класс, а предложение языка представляется деревом таких объектов, вычисление которого сводится к рекурсивному обходу. На практике паттерн применяется редко и только для действительно маленьких, стабильных грамматик — для языков посерьёзнее почти всегда выгоднее взять парсер-генератор или готовый движок правил.",
      en: "Given a language, defines a representation for its grammar along with an interpreter that uses that representation to interpret sentences in the language. Each grammar rule corresponds to its own class, and a sentence in the language is represented as a tree of such objects whose evaluation reduces to a recursive traversal. In practice the pattern is applied rarely, and only for genuinely small, stable grammars — for anything more serious, reaching for a parser generator or an off-the-shelf rules engine is almost always the better call.",
    },
    problem: {
      ru: "В системе регулярно возникают однотипные задачи, которые естественно выражаются предложениями простого языка (правила доступа, фильтры, формулы, условия поиска). Зашивать разбор и вычисление таких выражений в один монолитный парсер с условными операторами тяжело: каждое новое правило грамматики требует правки общего кода, а сами выражения нельзя строить и комбинировать динамически.",
      en: "A system keeps running into the same kind of task, one that is naturally expressed as sentences in a simple language (access rules, filters, formulas, search conditions). Baking the parsing and evaluation of such expressions into a single monolithic parser full of conditionals is painful: every new grammar rule forces edits to shared code, and the expressions themselves can't be built and combined dynamically.",
    },
    solution: {
      ru: "Каждому правилу грамматики сопоставляем класс с общим интерфейсом и методом interpret(context). Терминальные выражения (числа, переменные) вычисляют себя сами, нетерминальные (сложение, И/ИЛИ) хранят подвыражения и рекурсивно делегируют им интерпретацию. Предложение языка представляется деревом таких объектов (абстрактным синтаксическим деревом), а его вычисление — рекурсивным обходом с передачей контекста. Само дерево обычно строится отдельным шагом — разбором исходной строки в объекты; этот этап (парсинг) остаётся за рамками паттерна, который лишь берёт уже готовое дерево и интерпретирует его.",
      en: "Map each grammar rule to a class that implements a common interface with an interpret(context) method. Terminal expressions (numbers, variables) evaluate themselves; nonterminal expressions (addition, AND/OR) hold subexpressions and recursively delegate interpretation to them. A sentence in the language is represented as a tree of such objects (an abstract syntax tree), and evaluating it is a recursive traversal that threads a context through the nodes. The tree itself is usually built by a separate step — parsing the source string into objects; that parsing step is outside the pattern's scope, which only takes an already-built tree and interprets it.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface Expression { interpret(ctx: Map<string, number>): number; }",
          "",
          "// терминальные выражения вычисляют себя сами",
          "class NumberLiteral implements Expression {",
          "  constructor(private value: number) {}",
          "  interpret() { return this.value; }",
          "}",
          "class Variable implements Expression {",
          "  constructor(private name: string) {}",
          "  interpret(ctx: Map<string, number>) { return ctx.get(this.name) ?? 0; }",
          "}",
          "",
          "// нетерминальное выражение рекурсивно интерпретирует подвыражения",
          "class Add implements Expression {",
          "  constructor(private left: Expression, private right: Expression) {}",
          "  interpret(ctx: Map<string, number>) {",
          "    return this.left.interpret(ctx) + this.right.interpret(ctx);",
          "  }",
          "}",
          "",
          "// предложение языка «x + (y + 10)» как дерево грамматики",
          "const expr = new Add(new Variable('x'), new Add(new Variable('y'), new NumberLiteral(10)));",
          "expr.interpret(new Map([['x', 5], ['y', 7]])); // 22",
        ].join('\n'),
        en: [
          "interface Expression { interpret(ctx: Map<string, number>): number; }",
          "",
          "// terminal expressions evaluate themselves",
          "class NumberLiteral implements Expression {",
          "  constructor(private value: number) {}",
          "  interpret() { return this.value; }",
          "}",
          "class Variable implements Expression {",
          "  constructor(private name: string) {}",
          "  interpret(ctx: Map<string, number>) { return ctx.get(this.name) ?? 0; }",
          "}",
          "",
          "// a nonterminal expression recursively interprets its subexpressions",
          "class Add implements Expression {",
          "  constructor(private left: Expression, private right: Expression) {}",
          "  interpret(ctx: Map<string, number>) {",
          "    return this.left.interpret(ctx) + this.right.interpret(ctx);",
          "  }",
          "}",
          "",
          "// the sentence \"x + (y + 10)\" as a grammar tree",
          "const expr = new Add(new Variable('x'), new Add(new Variable('y'), new NumberLiteral(10)));",
          "expr.interpret(new Map([['x', 5], ['y', 7]])); // 22",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Грамматику легко менять и расширять: новое правило — новый класс, существующие не трогаются",
        "Каждое правило локализовано в своём классе — простая грамматика реализуется прямолинейно",
        "Выражения строятся и комбинируются динамически в рантайме из готовых узлов",
        "Позволяет представлять сложные условия и правила декларативно, как данные (дерево объектов), а не как императивный код",
      ],
      en: [
        "The grammar is easy to change and extend: a new rule means a new class, and the existing ones are left untouched",
        "Each rule is localized in its own class, so a simple grammar is straightforward to implement",
        "Expressions are built and combined dynamically at runtime from ready-made nodes",
        "Lets you represent complex conditions and rules declaratively, as data (a tree of objects), rather than as imperative code",
      ],
    },
    cons: {
      ru: [
        "Сложная грамматика порождает взрыв классов и становится трудно сопровождаемой",
        "Рекурсивная интерпретация дерева объектов медленнее компиляции или таблично-управляемого разбора",
        "Паттерн описывает только интерпретацию: построение дерева (парсинг строки) остаётся за кадром",
      ],
      en: [
        "A complex grammar breeds an explosion of classes and becomes hard to maintain",
        "Recursively interpreting a tree of objects is slower than compilation or table-driven parsing",
        "The pattern covers only interpretation: building the tree (parsing the string) is left out of scope",
      ],
    },
    tradeoffs: {
      ru: [
        "Расширяемость грамматики через классы против взрыва числа классов на сложных языках",
        "Гибкость динамически собираемых выражений против производительности прямого кода",
        "Свой мини-язык против готовых парсер-генераторов и встраиваемых движков правил",
      ],
      en: [
        "Extending the grammar through classes vs. the explosion of classes on complex languages",
        "The flexibility of dynamically assembled expressions vs. the performance of direct code",
        "A homegrown mini-language vs. off-the-shelf parser generators and embeddable rules engines",
      ],
    },
    whenToUse: {
      ru: [
        "Повторяющиеся задачи выражаются предложениями простого языка (правила, фильтры, формулы)",
        "Грамматика проста и относительно стабильна по числу правил",
        "Эффективность интерпретации не критична для сценария использования",
      ],
      en: [
        "Recurring tasks are expressed as sentences in a simple language (rules, filters, formulas)",
        "The grammar is simple and relatively stable in its number of rules",
        "Interpretation efficiency isn't critical for the use case",
      ],
    },
    whenNotToUse: {
      ru: [
        "Грамматика сложная — сопровождать класс на каждое правило дороже, чем взять парсер-генератор",
        "Выражение вычисляется один раз и не переиспользуется — хватит обычной функции",
        "Критична скорость — интерпретация дерева объектов проигрывает компиляции",
      ],
      en: [
        "The grammar is complex — maintaining a class per rule costs more than reaching for a parser generator",
        "The expression is evaluated once and never reused — a plain function is enough",
        "Speed is critical — interpreting a tree of objects loses to compilation",
      ],
    },
    related: [
      "composite",
      "visitor",
      "flyweight",
    ],
    diagram: `classDiagram
  class Expression {
    <<interface>>
    +interpret(context)
  }
  class TerminalExpression {
    +interpret(context)
  }
  class NonterminalExpression {
    -left: Expression
    -right: Expression
    +interpret(context)
  }
  Expression <|.. TerminalExpression
  Expression <|.. NonterminalExpression
  NonterminalExpression o--> Expression`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "iterator",
    name: "Iterator",
    aka: [
      "Cursor",
    ],
    category: "behavioral",
    grade: "junior",
    tagline: {
      ru: "Последовательный обход коллекции без раскрытия её внутреннего устройства",
      en: "Traverse a collection sequentially without exposing its internal structure",
    },
    definition: {
      ru: "Предоставляет способ последовательного доступа ко всем элементам составного объекта, не раскрывая его внутреннего представления. Различают внешний итератор, которым явно управляет клиент, вызывая hasNext()/next() в нужном ему темпе, и внутренний итератор, который сам обходит коллекцию и вызывает переданную клиентом функцию для каждого элемента (как forEach). Большинство современных языков воплощают эту идею во встроенных механизмах — протоколе Iterable/Iterator и генераторах (function*) в TypeScript, цикле for...of, — поэтому вручную реализовывать паттерн сегодня приходится редко.",
      en: "Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation. A distinction is drawn between an external iterator, which the client drives explicitly by calling hasNext()/next() at its own pace, and an internal iterator, which walks the collection itself and invokes a client-supplied callback for every element (as with forEach). Most modern languages bake this idea into built-in facilities — the Iterable/Iterator protocol and generators (function*) in TypeScript, the for...of loop — so implementing the pattern by hand is rarely necessary today.",
    },
    problem: {
      ru: "Клиенту нужно обходить элементы коллекции, но её внутренняя структура (массив, дерево, хэш-таблица) не должна торчать наружу. Если зашить обход в саму коллекцию, её интерфейс раздувается, клиент привязывается к конкретной структуре, а несколько независимых обходов одновременно становятся невозможны. Если вдобавок обход должен работать одинаково для массива, дерева и связанного списка, а клиентский код не должен переписываться под каждую структуру заново, задача усложняется ещё сильнее.",
      en: "A client needs to traverse the elements of a collection, but its internal structure (array, tree, hash table) must not leak out. If you hardwire traversal into the collection itself, its interface bloats, the client becomes coupled to the concrete structure, and running several independent traversals at once becomes impossible. If, on top of that, the traversal has to behave the same way for an array, a tree, and a linked list without the client code being rewritten for each structure, the problem becomes even harder.",
    },
    solution: {
      ru: "Выносим логику обхода в отдельный объект-итератор с узким интерфейсом вида hasNext()/next(). Итератор хранит текущую позицию обхода, а коллекция лишь предоставляет метод создания итератора. Клиент работает с элементами только через итератор и ничего не знает о том, как коллекция устроена внутри. Так получается внешний итератор — клиент сам решает, когда запросить следующий элемент. В языках с генераторами ту же идею можно выразить внутренним итератором: функция-генератор сама управляет обходом и отдаёт элементы клиенту через yield, а клиент лишь потребляет их в for...of, не заботясь о состоянии обхода. Если исходная коллекция меняется во время активного обхода (элементы добавляются или удаляются), позиция итератора может стать невалидной — надёжная реализация либо запрещает такие изменения (fail-fast), либо явно документирует своё поведение в этом случае.",
      en: "Extract the traversal logic into a separate iterator object with a narrow interface such as hasNext()/next(). The iterator keeps track of the current traversal position, while the collection merely exposes a method to create an iterator. The client works with the elements only through the iterator and knows nothing about how the collection is organized internally. This yields an external iterator — the client itself decides when to request the next element. In languages with generators, the same idea can be expressed as an internal iterator: a generator function drives the traversal itself and hands elements to the client via yield, while the client merely consumes them with for...of without tracking any traversal state. If the underlying collection is mutated while a traversal is in progress (elements added or removed), the iterator's position can become invalid — a robust implementation either forbids such mutations (fail-fast) or explicitly documents its behavior in that case.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface SongIterator {",
          "  hasNext(): boolean;",
          "  next(): string;",
          "}",
          "",
          "class Playlist {",
          "  private songs: string[] = [];",
          "  add(song: string) { this.songs.push(song); }",
          "  // обход вынесен в отдельный объект: позиция хранится в итераторе",
          "  createIterator(): SongIterator {",
          "    let position = 0;",
          "    return {",
          "      hasNext: () => position < this.songs.length,",
          "      next: () => this.songs[position++],",
          "    };",
          "  }",
          "}",
          "",
          "const playlist = new Playlist();",
          "playlist.add('Intro');",
          "playlist.add('Main Theme');",
          "const it = playlist.createIterator();",
          "while (it.hasNext()) console.log(it.next()); // клиент не видит внутренний массив",
        ].join('\n'),
        en: [
          "interface SongIterator {",
          "  hasNext(): boolean;",
          "  next(): string;",
          "}",
          "",
          "class Playlist {",
          "  private songs: string[] = [];",
          "  add(song: string) { this.songs.push(song); }",
          "  // traversal is extracted into a separate object: the position lives in the iterator",
          "  createIterator(): SongIterator {",
          "    let position = 0;",
          "    return {",
          "      hasNext: () => position < this.songs.length,",
          "      next: () => this.songs[position++],",
          "    };",
          "  }",
          "}",
          "",
          "const playlist = new Playlist();",
          "playlist.add('Intro');",
          "playlist.add('Main Theme');",
          "const it = playlist.createIterator();",
          "while (it.hasNext()) console.log(it.next()); // the client never sees the internal array",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Единый интерфейс обхода для коллекций с разной внутренней структурой",
        "Несколько независимых обходов одной коллекции одновременно — у каждого итератора своя позиция",
        "Коллекция не раскрывает внутреннее представление и не раздувает свой интерфейс логикой обхода",
        "В языках с поддержкой генераторов паттерн реализуется почти без церемоний — через function* и yield",
      ],
      en: [
        "A single traversal interface for collections with different internal structures",
        "Several independent traversals of the same collection at once — each iterator keeps its own position",
        "The collection neither exposes its internal representation nor bloats its interface with traversal logic",
        "In languages with generator support, the pattern is implemented almost ceremony-free, via function* and yield",
      ],
    },
    cons: {
      ru: [
        "Избыточен для простых коллекций: в современных языках есть встроенные средства обхода (for...of, Symbol.iterator)",
        "Дополнительные объекты и косвенность ради простого перебора",
        "Изменение коллекции во время обхода может сделать итератор невалидным",
      ],
      en: [
        "Overkill for simple collections: modern languages ship built-in traversal facilities (for...of, Symbol.iterator)",
        "Extra objects and indirection for the sake of a plain loop",
        "Modifying the collection during traversal can invalidate the iterator",
      ],
    },
    tradeoffs: {
      ru: [
        "Инкапсуляция структуры коллекции против прямого доступа по индексу, который иногда проще и быстрее",
        "Универсальный интерфейс обхода против накладных расходов на дополнительные объекты-итераторы",
        "Внешний итератор даёт клиенту точный контроль над темпом обхода (можно приостановить, вставить логику между шагами), тогда как внутренний итератор компактнее, но урезает этот контроль",
      ],
      en: [
        "Encapsulating the collection's structure vs. direct index access, which is sometimes simpler and faster",
        "A uniform traversal interface vs. the overhead of extra iterator objects",
        "An external iterator gives the client precise control over the pace of traversal (pausing it, interleaving logic between steps), whereas an internal iterator is more compact but takes that control away",
      ],
    },
    whenToUse: {
      ru: [
        "Коллекция имеет сложную внутреннюю структуру (дерево, граф), которую нужно скрыть от клиента",
        "Нужны разные способы обхода или несколько одновременных независимых обходов",
        "Нужен единый способ перебора разных типов коллекций",
      ],
      en: [
        "The collection has a complex internal structure (tree, graph) that must be hidden from the client",
        "You need different ways to traverse, or several simultaneous independent traversals",
        "You want a uniform way to iterate over different types of collections",
      ],
    },
    whenNotToUse: {
      ru: [
        "Коллекция — простой массив, и встроенного for...of достаточно",
        "Обход всегда один и тривиален — отдельный объект-итератор лишь добавит косвенности",
      ],
      en: [
        "The collection is a plain array and the built-in for...of is enough",
        "There is only ever one trivial traversal — a separate iterator object would just add indirection",
      ],
    },
    related: [
      "composite",
      "visitor",
      "factory-method",
      "memento",
    ],
    diagram: `classDiagram
  class Iterator {
    <<interface>>
    +hasNext()
    +next()
  }
  class Aggregate {
    <<interface>>
    +createIterator()
  }
  class ConcreteIterator {
    -position
    +hasNext()
    +next()
  }
  class ConcreteAggregate {
    +createIterator()
  }
  Iterator <|.. ConcreteIterator
  Aggregate <|.. ConcreteAggregate
  ConcreteAggregate ..> ConcreteIterator : creates`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "mediator",
    name: "Mediator",
    aka: [
      "Intermediary",
      "Controller",
    ],
    category: "behavioral",
    grade: "senior",
    tagline: {
      ru: "Сложная сеть связей между объектами сводится к одному посреднику",
      en: "A tangled web of connections between objects is reduced to a single mediator",
    },
    definition: {
      ru: "Определяет объект, инкапсулирующий способ взаимодействия множества объектов. Mediator обеспечивает слабую связанность, избавляя объекты от необходимости явно ссылаться друг на друга, и позволяет независимо изменять схему их взаимодействия. В отличие от Observer, где источник лишь рассылает уведомления подписчикам по схеме «один ко многим» и не ждёт ответа, посредник в Mediator активно координирует равноправных коллег в обе стороны, зачастую реализуя нетривиальную логику согласования их действий.",
      en: "Defines an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly, and it lets you vary their interaction independently. Unlike Observer, where a subject merely broadcasts notifications to its subscribers in a one-to-many fashion and expects no response, a Mediator actively coordinates peer colleagues in both directions, often embodying non-trivial logic for reconciling their actions.",
    },
    problem: {
      ru: "Группа объектов (например, элементы диалогового окна) общается напрямую: каждый знает многих других, связи образуют «многие ко многим». Такую сеть трудно понять, изменить и переиспользовать — объект нельзя взять отдельно, потому что он ссылается на соседей, а любое изменение протокола взаимодействия расползается сразу по всем участникам системы, вынуждая переписывать код в каждом из них.",
      en: "A group of objects (for example, the controls in a dialog box) communicate directly: each one knows many others, and the connections form a many-to-many web. Such a network is hard to understand, change, and reuse — you can't lift an object out on its own because it references its neighbors, and any change to the interaction protocol ripples across every participant at once.",
    },
    solution: {
      ru: "Вводим объект-посредник (mediator), который знает всех коллег (colleagues) и координирует их. Коллеги не ссылаются друг на друга: о любом событии они сообщают только посреднику, а тот решает, кого и как задействовать. Сеть «многие ко многим» превращается в «звезду»: каждый коллега связан лишь с посредником, и вся логика взаимодействия сосредоточена в одном месте. Чтобы посредник не превратился в непроницаемый god object, его часто ограничивают одним конкретным сценарием взаимодействия (например, отдельный посредник на каждую форму или экран), а не пытаются свести в нём координацию всего приложения целиком.",
      en: "Introduce a mediator object that knows all the colleagues and coordinates them. Colleagues no longer reference one another: they report every event only to the mediator, which decides whom to involve and how. The many-to-many web turns into a star — each colleague is connected only to the mediator, and all the interaction logic is concentrated in one place. To keep the mediator from turning into an impenetrable god object, it is often scoped to one specific interaction scenario (say, a separate mediator per form or screen) rather than trying to fold the coordination of the entire application into it.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface Mediator { notify(sender: object, event: string): void; }",
          "",
          "class Checkbox {",
          "  constructor(private mediator: Mediator) {}",
          "  check() { this.mediator.notify(this, 'check'); } // коллега сообщает только посреднику",
          "}",
          "class TextInput {",
          "  setEnabled(on: boolean) { console.log(`поле ввода: ${on ? 'включено' : 'выключено'}`); }",
          "}",
          "class SubmitButton {",
          "  constructor(private mediator: Mediator) {}",
          "  click() { this.mediator.notify(this, 'click'); }",
          "}",
          "",
          "class FormDialog implements Mediator {",
          "  private checkbox = new Checkbox(this);",
          "  private input = new TextInput();",
          "  private button = new SubmitButton(this);",
          "  notify(sender: object, event: string) {",
          "    // вся логика взаимодействия сосредоточена в посреднике",
          "    if (sender === this.checkbox && event === 'check') this.input.setEnabled(true);",
          "    if (sender === this.button && event === 'click') console.log('отправка формы');",
          "  }",
          "}",
        ].join('\n'),
        en: [
          "interface Mediator { notify(sender: object, event: string): void; }",
          "",
          "class Checkbox {",
          "  constructor(private mediator: Mediator) {}",
          "  check() { this.mediator.notify(this, 'check'); } // a colleague reports only to the mediator",
          "}",
          "class TextInput {",
          "  setEnabled(on: boolean) { console.log(`input field: ${on ? 'enabled' : 'disabled'}`); }",
          "}",
          "class SubmitButton {",
          "  constructor(private mediator: Mediator) {}",
          "  click() { this.mediator.notify(this, 'click'); }",
          "}",
          "",
          "class FormDialog implements Mediator {",
          "  private checkbox = new Checkbox(this);",
          "  private input = new TextInput();",
          "  private button = new SubmitButton(this);",
          "  notify(sender: object, event: string) {",
          "    // all interaction logic is concentrated in the mediator",
          "    if (sender === this.checkbox && event === 'check') this.input.setEnabled(true);",
          "    if (sender === this.button && event === 'click') console.log('submitting the form');",
          "  }",
          "}",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Убирает прямые связи «многие ко многим» между коллегами — каждый знает только посредника",
        "Логика взаимодействия собрана в одном месте, а не размазана по участникам",
        "Отдельные коллеги проще переиспользовать: они не ссылаются друг на друга",
        "Протокол взаимодействия меняется правкой посредника, без изменения коллег",
      ],
      en: [
        "Eliminates direct many-to-many connections between colleagues — each one knows only the mediator",
        "Interaction logic lives in one place instead of being scattered across the participants",
        "Individual colleagues are easier to reuse since they don't reference one another",
        "You change the interaction protocol by editing the mediator, without touching the colleagues",
      ],
    },
    cons: {
      ru: [
        "Посредник рискует разрастись в трудноподдерживаемый god object",
        "Сложность не исчезает, а концентрируется в одном классе",
        "Косвенность затрудняет отслеживание, кто на самом деле инициировал действие",
      ],
      en: [
        "The mediator risks growing into a hard-to-maintain god object",
        "Complexity doesn't disappear — it just concentrates in a single class",
        "The indirection makes it harder to trace who actually initiated an action",
      ],
    },
    tradeoffs: {
      ru: [
        "Слабая связанность коллег в обмен на концентрацию сложности в посреднике",
        "Централизованный контроль взаимодействия против прозрачности прямых вызовов",
        "Лёгкая замена схемы взаимодействия ценой дополнительного уровня косвенности",
      ],
      en: [
        "Loose coupling between colleagues in exchange for concentrating complexity in the mediator",
        "Centralized control of interaction versus the transparency of direct calls",
        "Easy swapping of the interaction scheme at the cost of an extra layer of indirection",
      ],
    },
    whenToUse: {
      ru: [
        "Объекты связаны сложной, плохо структурированной сетью взаимных ссылок",
        "Объект трудно переиспользовать, потому что он общается со многими другими",
        "Поведение, распределённое между несколькими классами, нужно настраивать без множества подклассов",
      ],
      en: [
        "Objects are linked by a complex, poorly structured web of mutual references",
        "An object is hard to reuse because it communicates with many others",
        "Behavior distributed across several classes needs to be customized without a proliferation of subclasses",
      ],
    },
    whenNotToUse: {
      ru: [
        "Взаимодействуют два-три объекта с простыми связями — посредник лишь добавит косвенность",
        "Достаточно односторонних уведомлений «один ко многим» — хватит Observer",
      ],
      en: [
        "Only two or three objects with simple connections interact — a mediator would just add indirection",
        "One-way one-to-many notifications suffice — Observer is enough",
      ],
    },
    related: [
      "observer",
      "facade",
      "command",
      "chain-of-responsibility",
    ],
    diagram: `classDiagram
  class Mediator {
    <<interface>>
    +notify(sender, event)
  }
  class ConcreteMediator {
    +notify(sender, event)
  }
  class Colleague {
    -mediator: Mediator
  }
  class ColleagueA
  class ColleagueB
  Mediator <|.. ConcreteMediator
  Colleague <|-- ColleagueA
  Colleague <|-- ColleagueB
  Colleague --> Mediator
  ConcreteMediator o--> ColleagueA
  ConcreteMediator o--> ColleagueB`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "memento",
    name: "Memento",
    aka: [
      "Token",
      "Snapshot",
    ],
    category: "behavioral",
    grade: "middle",
    tagline: {
      ru: "Снимок состояния объекта без нарушения его инкапсуляции",
      en: "A snapshot of an object's state without breaking its encapsulation",
    },
    definition: {
      ru: "Не нарушая инкапсуляции, фиксирует и выносит за пределы объекта его внутреннее состояние так, чтобы позднее объект можно было восстановить в этом состоянии. Автор снимка (originator) — единственный, кто умеет читать и записывать состояние внутрь memento; хранитель (caretaker) обращается со снимком как с непрозрачным токеном, отвечая лишь за то, когда его сохранить и когда вернуть обратно, не заглядывая внутрь. В отличие от обычной сериализации, которая превращает состояние в универсальный переносимый формат (JSON, бинарный поток) для передачи между процессами или системами, Memento — внутрипроцессный механизм: снимок остаётся объектом языка и создаётся ради отмены и отката, а не ради обмена данными.",
      en: "Without violating encapsulation, captures and externalizes an object's internal state so that the object can later be restored to that state. The originator is the only party that knows how to read and write the state inside a memento; the caretaker treats a memento as an opaque token, responsible only for deciding when to save one and when to hand it back, without ever looking inside. Unlike plain serialization, which typically turns state into a universal portable format (JSON, a binary stream) meant for transfer between processes or systems, Memento is an in-process mechanism: the snapshot remains a language-level object created for undo and rollback, not for data exchange.",
    },
    problem: {
      ru: "Нужно сохранять снимки состояния объекта (undo, откат транзакции, чекпоинты), но раскрытие его внутренних полей наружу сломало бы инкапсуляцию, а хранение всей истории внутри самого объекта раздувает его и смешивает ответственности. Простая альтернатива — сериализовать объект целиком (например, в JSON) и хранить эту строку — решает задачу лишь частично: она заставляет объект поддерживать универсальный формат обмена, плохо подходит для состояния с приватными полями или ссылками на другие объекты рантайма и обычно намного дороже по CPU, чем создание обычного JS-объекта.",
      en: "You need to save snapshots of an object's state (undo, transaction rollback, checkpoints), but exposing its internal fields to the outside would break encapsulation, while keeping the entire history inside the object itself bloats it and mixes responsibilities. A simple alternative — serializing the whole object (say, to JSON) and storing that string — solves only part of the problem: it forces the object to support a universal exchange format, works poorly for state with private fields or references to other runtime objects, and is usually far more expensive on CPU than creating a plain JS object.",
    },
    solution: {
      ru: "Источник (originator) сам создаёт объект-снимок (memento) со своим состоянием и сам умеет восстанавливаться из него. Хранитель (caretaker) складирует снимки как непрозрачные токены: он решает, когда сохранить и когда откатить, но внутрь снимка не заглядывает. В TypeScript эта непрозрачность обычно достигается соглашением, а не языковым барьером: у memento — только приватное состояние и пара методов вроде getState()/restore(), предназначенных исключительно для источника, а хранитель работает со снимком как с чёрным ящиком (например, типа unknown) или через урезанный интерфейс без доступа к состоянию. По сравнению с сериализацией во внешний формат, memento остаётся лёгким объектом языка — это дешевле по CPU, но плохо подходит для долговременного хранения снимков между перезапусками процесса: для этого лучше подходит именно сериализация.",
      en: "The originator creates a snapshot object (the memento) holding its own state and knows how to restore itself from it. The caretaker stores these snapshots as opaque tokens: it decides when to save and when to roll back, but never looks inside the memento. In TypeScript this opacity is usually achieved by convention rather than by a language-level barrier: the memento exposes only private state plus a pair of methods like getState()/restore() meant solely for the originator to use, while the caretaker treats the snapshot as a black box (say, of type unknown) or through a narrowed interface with no access to the state at all. Compared to serializing into an external format, a memento stays a lightweight language object — cheaper on CPU, but poorly suited to storing snapshots long-term across process restarts, where serialization is the better fit.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "class EditorMemento {",
          "  constructor(private readonly state: string) {} // состояние скрыто от посторонних",
          "  getState() { return this.state; }",
          "}",
          "",
          "class Editor {",
          "  private content = '';",
          "  type(text: string) { this.content += text; }",
          "  save(): EditorMemento { return new EditorMemento(this.content); } // снимок делает сам источник",
          "  restore(m: EditorMemento) { this.content = m.getState(); }",
          "  get text() { return this.content; }",
          "}",
          "",
          "class History { // caretaker: хранит снимки, не заглядывая внутрь",
          "  private snapshots: EditorMemento[] = [];",
          "  push(m: EditorMemento) { this.snapshots.push(m); }",
          "  pop() { return this.snapshots.pop(); }",
          "}",
          "",
          "const editor = new Editor();",
          "const history = new History();",
          "editor.type('Привет');",
          "history.push(editor.save());",
          "editor.type(', мир!');",
          "const last = history.pop();",
          "if (last) editor.restore(last); // откат: снова 'Привет'",
        ].join('\n'),
        en: [
          "class EditorMemento {",
          "  constructor(private readonly state: string) {} // state is hidden from outsiders",
          "  getState() { return this.state; }",
          "}",
          "",
          "class Editor {",
          "  private content = '';",
          "  type(text: string) { this.content += text; }",
          "  save(): EditorMemento { return new EditorMemento(this.content); } // the originator creates its own snapshot",
          "  restore(m: EditorMemento) { this.content = m.getState(); }",
          "  get text() { return this.content; }",
          "}",
          "",
          "class History { // caretaker: stores snapshots without looking inside",
          "  private snapshots: EditorMemento[] = [];",
          "  push(m: EditorMemento) { this.snapshots.push(m); }",
          "  pop() { return this.snapshots.pop(); }",
          "}",
          "",
          "const editor = new Editor();",
          "const history = new History();",
          "editor.type('Hello');",
          "history.push(editor.save());",
          "editor.type(', world!');",
          "const last = history.pop();",
          "if (last) editor.restore(last); // undo: back to 'Hello'",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Даёт undo/rollback, не раскрывая внутреннее устройство объекта",
        "Разгружает источник: историю снимков ведёт отдельный хранитель",
        "Снимки — непрозрачные объекты, клиенты не завязываются на детали состояния",
        "Реализует undo без затрат на универсальный формат сериализации — снимок остаётся обычным объектом языка",
      ],
      en: [
        "Enables undo/rollback without exposing the object's internal structure",
        "Offloads the originator: a separate caretaker maintains the history of snapshots",
        "Snapshots are opaque objects, so clients don't become coupled to the details of the state",
        "Implements undo without paying for a universal serialization format — the snapshot stays a plain language object",
      ],
    },
    cons: {
      ru: [
        "Частые снимки большого состояния дорого стоят по памяти",
        "Хранитель должен управлять жизненным циклом снимков, иначе они копятся бесконечно",
        "В языках без friend-доступа (включая TypeScript) полностью скрыть содержимое снимка от всех, кроме источника, затруднительно",
      ],
      en: [
        "Frequent snapshots of a large state are expensive in terms of memory",
        "The caretaker must manage the lifecycle of snapshots, otherwise they accumulate indefinitely",
        "In languages without friend access (including TypeScript), it's hard to fully hide a snapshot's contents from everyone except the originator",
      ],
    },
    tradeoffs: {
      ru: [
        "Глубина истории откатов против расхода памяти на снимки",
        "Строгая инкапсуляция снимка против простоты реализации: широкий интерфейс memento проще, но подтачивает главную гарантию паттерна",
        "Лёгкий снимок-объект в рамках одного процесса против переносимого, но более тяжёлого сериализованного формата, нужного для хранения между перезапусками или передачи по сети",
      ],
      en: [
        "Depth of the undo history versus the memory consumed by snapshots",
        "Strict encapsulation of the memento versus ease of implementation: a wide memento interface is simpler but undermines the pattern's main guarantee",
        "A lightweight in-process snapshot object versus a portable but heavier serialized format needed for storage across restarts or transfer over the network",
      ],
    },
    whenToUse: {
      ru: [
        "Нужны undo, откат или чекпоинты состояния объекта",
        "Прямое чтение и запись внутренних полей извне нарушили бы инкапсуляцию объекта",
        "Состояние богато приватными деталями и ссылками на другие объекты рантайма, поэтому сериализация в переносимый формат неудобна или невозможна",
      ],
      en: [
        "You need undo, rollback, or checkpoints of an object's state",
        "Reading and writing the internal fields directly from outside would break the object's encapsulation",
        "The state is rich in private details and references to other runtime objects, so serializing it into a portable format is awkward or impossible",
      ],
    },
    whenNotToUse: {
      ru: [
        "Состояние простое и публичное — достаточно обычного копирования полей",
        "Состояние огромно, а снимки нужны часто — стоимость памяти перевесит выгоду",
      ],
      en: [
        "The state is simple and public — plain field copying is enough",
        "The state is huge and snapshots are needed often — the memory cost will outweigh the benefit",
      ],
    },
    related: [
      "command",
      "prototype",
      "state",
    ],
    diagram: `classDiagram
  class Originator {
    -state
    +save() Memento
    +restore(m: Memento)
  }
  class Memento {
    -state
    +getState()
  }
  class Caretaker {
    -history: Memento[]
  }
  Originator ..> Memento : creates
  Caretaker o--> Memento : stores (opaque)`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "template-method",
    name: "Template Method",
    category: "behavioral",
    grade: "middle",
    tagline: {
      ru: "Скелет алгоритма в базовом классе, изменяемые шаги — в подклассах",
      en: "The algorithm skeleton lives in the base class; the variable steps live in subclasses",
    },
    definition: {
      ru: "Определяет скелет алгоритма в операции базового класса, откладывая реализацию некоторых шагов на подклассы. Template Method позволяет подклассам переопределять отдельные шаги алгоритма, не меняя его общую структуру. Изменяемые шаги делятся на обязательные — абстрактные методы, которые подкласс должен реализовать, — и необязательные хуки с реализацией по умолчанию, которые подкласс может переопределить, а может и оставить как есть.",
      en: "Defines the skeleton of an algorithm in an operation of a base class, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm's overall structure. The variable steps split into mandatory ones — abstract methods a subclass must implement — and optional hooks with a default implementation that a subclass may override or simply leave as is.",
    },
    problem: {
      ru: "Несколько классов реализуют один и тот же алгоритм с одинаковой последовательностью шагов, различаясь лишь деталями отдельных шагов. Копирование всей последовательности в каждый класс дублирует инвариантную часть, и любое изменение порядка шагов приходится вносить во все копии. Более того, ничто не мешает одному из классов случайно нарушить порядок шагов или пропустить обязательный этап — при копипасте алгоритм и его вариации расходятся независимо друг от друга, и со временем классы, которые должны вести себя одинаково по структуре, заметно отличаются.",
      en: "Several classes implement the same algorithm with the same sequence of steps, differing only in the details of individual steps. Copying the whole sequence into each class duplicates the invariant part, and any change to the order of the steps has to be made in every copy. Worse, nothing stops one of the classes from accidentally breaking the step order or skipping a mandatory stage — with copy-pasting, the algorithm and its variants drift apart independently, and over time classes that are supposed to share the same structural behavior start to diverge noticeably.",
    },
    solution: {
      ru: "Инвариантную последовательность шагов фиксируем в одном методе базового класса — шаблонном методе. Изменяемые шаги объявляем абстрактными (или хуками с реализацией по умолчанию), а подклассы переопределяют только их. Базовый класс сам вызывает шаги в нужном порядке — «не звоните нам, мы позвоним вам». Абстрактные шаги подкласс обязан реализовать, иначе класс останется абстрактным; хуки же можно вовсе не трогать — они задают точку расширения, а не требование. Такая инверсия управления и называется принципом Голливуда: базовый класс диктует, когда и в каком порядке вызываются шаги, а подкласс лишь поставляет их реализацию, не имея права влиять на саму последовательность вызовов.",
      en: "Fix the invariant sequence of steps in a single method of the base class — the template method. Declare the variable steps as abstract (or as hooks with a default implementation), and let subclasses override only those. The base class calls the steps in the right order itself — \"don't call us, we'll call you.\" Abstract steps must be implemented by the subclass, or the class stays abstract; hooks, on the other hand, can be left untouched entirely — they offer an extension point rather than a requirement. This inversion of control is exactly the Hollywood principle: the base class dictates when and in what order the steps are called, while the subclass merely supplies their implementation, with no say over the calling sequence itself.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "abstract class ReportGenerator {",
          "  // шаблонный метод: фиксирует скелет алгоритма",
          "  generate(rows: string[]): string {",
          "    const body = rows.map((r) => this.formatRow(r)).join('\\n');",
          "    return `${this.header()}\\n${body}\\n${this.footer()}`;",
          "  }",
          "  protected abstract header(): string;      // шаг обязан задать подкласс",
          "  protected abstract formatRow(row: string): string;",
          "  protected footer(): string { return ''; } // хук: переопределять не обязательно",
          "}",
          "",
          "class CsvReport extends ReportGenerator {",
          "  protected header() { return 'name'; }",
          "  protected formatRow(row: string) { return row; }",
          "}",
          "",
          "class HtmlReport extends ReportGenerator {",
          "  protected header() { return '<table>'; }",
          "  protected formatRow(row: string) { return `<tr><td>${row}</td></tr>`; }",
          "  protected footer() { return '</table>'; }",
          "}",
        ].join('\n'),
        en: [
          "abstract class ReportGenerator {",
          "  // template method: fixes the skeleton of the algorithm",
          "  generate(rows: string[]): string {",
          "    const body = rows.map((r) => this.formatRow(r)).join('\\n');",
          "    return `${this.header()}\\n${body}\\n${this.footer()}`;",
          "  }",
          "  protected abstract header(): string;      // step the subclass must provide",
          "  protected abstract formatRow(row: string): string;",
          "  protected footer(): string { return ''; } // hook: overriding is optional",
          "}",
          "",
          "class CsvReport extends ReportGenerator {",
          "  protected header() { return 'name'; }",
          "  protected formatRow(row: string) { return row; }",
          "}",
          "",
          "class HtmlReport extends ReportGenerator {",
          "  protected header() { return '<table>'; }",
          "  protected formatRow(row: string) { return `<tr><td>${row}</td></tr>`; }",
          "  protected footer() { return '</table>'; }",
          "}",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Инвариантная часть алгоритма написана один раз — устраняет дублирование",
        "Базовый класс жёстко контролирует структуру алгоритма и точки расширения",
        "Инверсия управления: каркас сам вызывает шаги подкласса («принцип Голливуда»)",
        "Хуки позволяют расширяться постепенно: начать с поведения по умолчанию и переопределить только то, что действительно нужно изменить",
      ],
      en: [
        "The invariant part of the algorithm is written once, eliminating duplication",
        "The base class tightly controls the algorithm's structure and its extension points",
        "Inversion of control: the framework calls the subclass's steps itself (the \"Hollywood principle\")",
        "Hooks allow incremental extension: start from the default behavior and override only what genuinely needs to change",
      ],
    },
    cons: {
      ru: [
        "Вариант поведения фиксируется на этапе наследования — нельзя заменить шаг в рантайме",
        "Каждая комбинация шагов требует отдельного подкласса",
        "Подкласс, нарушивший контракт шага, ломает алгоритм базового класса (риск нарушения LSP)",
      ],
      en: [
        "The behavior variant is locked in at inheritance time — a step cannot be swapped at runtime",
        "Every combination of steps requires its own subclass",
        "A subclass that breaks a step's contract breaks the base class's algorithm (risk of violating the Liskov Substitution Principle)",
      ],
    },
    tradeoffs: {
      ru: [
        "Переиспользование через наследование против гибкости композиции: Strategy решает ту же задачу делегированием и позволяет менять поведение в рантайме",
        "Жёсткий каркас упрощает контроль над алгоритмом, но затрудняет изменения самой последовательности шагов — она общая для всех подклассов",
        "Хуки с поведением по умолчанию снижают порог входа для подклассов, но такое неявное поведение по умолчанию не всегда очевидно и может удивить того, кто не читал реализацию базового класса",
      ],
      en: [
        "Reuse through inheritance versus the flexibility of composition: Strategy solves the same problem through delegation and lets you change behavior at runtime",
        "A rigid skeleton makes the algorithm easy to control but hard to change the step sequence itself — it is shared by all subclasses",
        "Hooks with default behavior lower the barrier to entry for subclasses, but that implicit default behavior isn't always obvious and can surprise anyone who hasn't read the base class's implementation",
      ],
    },
    whenToUse: {
      ru: [
        "Несколько классов повторяют один алгоритм, различаясь лишь отдельными шагами",
        "Нужно дать расширять только конкретные точки алгоритма, запретив менять его структуру",
        "Хочется вынести дублирующийся каркас из родственных классов в общего предка",
      ],
      en: [
        "Several classes repeat the same algorithm, differing only in individual steps",
        "You want to allow extension only at specific points of the algorithm while forbidding changes to its structure",
        "You want to pull a duplicated skeleton out of related classes up into a common ancestor",
      ],
    },
    whenNotToUse: {
      ru: [
        "Шаги нужно подменять во время выполнения или комбинировать свободно — лучше Strategy через композицию",
        "Различается сама структура алгоритма, а не отдельные шаги",
      ],
      en: [
        "Steps need to be swapped at runtime or combined freely — Strategy through composition is a better fit",
        "The structure of the algorithm itself differs, not just individual steps",
      ],
    },
    related: [
      "strategy",
      "factory-method",
      "composition-vs-inheritance",
    ],
    diagram: `classDiagram
  class AbstractClass {
    +templateMethod()
    #step1()*
    #hook()
  }
  class ConcreteClassA {
    #step1()
    #hook()
  }
  class ConcreteClassB {
    #step1()
  }
  AbstractClass <|-- ConcreteClassA
  AbstractClass <|-- ConcreteClassB`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
  {
    id: "visitor",
    name: "Visitor",
    category: "behavioral",
    grade: "senior",
    tagline: {
      ru: "Новая операция над структурой объектов без изменения их классов",
      en: "A new operation over an object structure without changing its classes",
    },
    definition: {
      ru: "Представляет операцию, выполняемую над каждым объектом из некоторой структуры объектов. Visitor позволяет определить новую операцию, не изменяя классы объектов, над которыми она выполняется. Механизм — двойная диспетчеризация: элемент в методе accept(visitor) вызывает конкретный метод посетителя (visitX), поэтому выполняемый код выбирается сразу по двум типам — типу элемента и типу посетителя, — а не по одному, как при обычном полиморфизме методов.",
      en: "Represents an operation to be performed on each object in an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates. The mechanism is double dispatch: an element's accept(visitor) method calls a specific method on the visitor (visitX), so the code that runs is selected by two types at once — the element's type and the visitor's type — rather than by one, as with ordinary method polymorphism.",
    },
    problem: {
      ru: "Над устоявшейся иерархией классов (узлы AST, фигуры, элементы документа) нужно выполнять много разнородных операций: экспорт, подсчёт метрик, отрисовку. Добавлять каждую операцию методом в каждый класс — значит засорять классы несвязанной логикой и править всю иерархию при каждой новой операции; каскады instanceof в клиенте — хрупкая альтернатива. Это частный случай так называемой «проблемы выражения» (expression problem): трудно сделать одинаково дешёвым и добавление новых операций, и добавление новых типов данных.",
      en: "You have a stable class hierarchy (AST nodes, shapes, document elements) on which you need to perform many disparate operations: export, metrics collection, rendering. Adding each operation as a method on every class means cluttering the classes with unrelated logic and editing the whole hierarchy for every new operation; cascades of instanceof checks in the client are a brittle alternative. This is a specific instance of the so-called expression problem: it's hard to make adding new operations and adding new data types equally cheap.",
    },
    solution: {
      ru: "Операция выносится в отдельный объект-посетитель с методом visit для каждого конкретного класса элемента. Элементы объявляют единственный метод accept(visitor), в котором вызывают «свой» метод посетителя — двойная диспетчеризация (double dispatch): нужная операция выбирается и по типу элемента, и по типу посетителя. Новая операция — это новый класс посетителя, иерархия элементов не меняется. Сама двойная диспетчеризация — это ровно два обычных виртуальных вызова подряд (accept, затем visit), а не особый языковой механизм; в языках без диспетчеризации по нескольким аргументам сразу (как TypeScript) её реализуют именно так — вручную, парой методов.",
      en: "The operation is extracted into a separate visitor object with a visit method for each concrete element class. Elements declare a single accept(visitor) method in which they call their own method on the visitor — double dispatch: the operation is selected by both the element type and the visitor type. A new operation is just a new visitor class, and the element hierarchy stays untouched. Double dispatch itself is simply two ordinary virtual calls in a row (accept, then visit), not some special language mechanism; in languages without dispatch on more than one argument at once (like TypeScript), it's implemented exactly this way — by hand, via a pair of methods.",
    },
    codeExample: {
      lang: "typescript",
      code: {
        ru: [
          "interface ShapeVisitor<R> { visitCircle(c: Circle): R; visitSquare(s: Square): R; }",
          "",
          "interface Shape { accept<R>(v: ShapeVisitor<R>): R; }",
          "",
          "class Circle implements Shape {",
          "  constructor(public radius: number) {}",
          "  accept<R>(v: ShapeVisitor<R>): R { return v.visitCircle(this); } // double dispatch",
          "}",
          "class Square implements Shape {",
          "  constructor(public side: number) {}",
          "  accept<R>(v: ShapeVisitor<R>): R { return v.visitSquare(this); }",
          "}",
          "",
          "// новая операция — новый посетитель, классы фигур не меняются",
          "class AreaVisitor implements ShapeVisitor<number> {",
          "  visitCircle(c: Circle) { return Math.PI * c.radius ** 2; }",
          "  visitSquare(s: Square) { return s.side ** 2; }",
          "}",
          "class XmlExportVisitor implements ShapeVisitor<string> {",
          "  visitCircle(c: Circle) { return `<circle r=\"${c.radius}\"/>`; }",
          "  visitSquare(s: Square) { return `<square side=\"${s.side}\"/>`; }",
          "}",
          "",
          "const shapes: Shape[] = [new Circle(2), new Square(3)];",
          "const areas = shapes.map((s) => s.accept(new AreaVisitor()));",
        ].join('\n'),
        en: [
          "interface ShapeVisitor<R> { visitCircle(c: Circle): R; visitSquare(s: Square): R; }",
          "",
          "interface Shape { accept<R>(v: ShapeVisitor<R>): R; }",
          "",
          "class Circle implements Shape {",
          "  constructor(public radius: number) {}",
          "  accept<R>(v: ShapeVisitor<R>): R { return v.visitCircle(this); } // double dispatch",
          "}",
          "class Square implements Shape {",
          "  constructor(public side: number) {}",
          "  accept<R>(v: ShapeVisitor<R>): R { return v.visitSquare(this); }",
          "}",
          "",
          "// a new operation is a new visitor; the shape classes don't change",
          "class AreaVisitor implements ShapeVisitor<number> {",
          "  visitCircle(c: Circle) { return Math.PI * c.radius ** 2; }",
          "  visitSquare(s: Square) { return s.side ** 2; }",
          "}",
          "class XmlExportVisitor implements ShapeVisitor<string> {",
          "  visitCircle(c: Circle) { return `<circle r=\"${c.radius}\"/>`; }",
          "  visitSquare(s: Square) { return `<square side=\"${s.side}\"/>`; }",
          "}",
          "",
          "const shapes: Shape[] = [new Circle(2), new Square(3)];",
          "const areas = shapes.map((s) => s.accept(new AreaVisitor()));",
        ].join('\n'),
      },
    },
    pros: {
      ru: [
        "Новая операция добавляется одним классом посетителя, без правки иерархии элементов (соответствует OCP по операциям)",
        "Родственная логика одной операции собрана в одном классе, а не размазана по всем элементам",
        "Посетитель может накапливать состояние при обходе структуры (счётчики, буфер экспорта)",
        "Убирает каскады instanceof: диспетчеризация по конкретному типу происходит через accept/visit",
      ],
      en: [
        "A new operation is added with a single visitor class, without touching the element hierarchy (satisfies the OCP with respect to operations)",
        "Related logic for a single operation is gathered in one class instead of being smeared across all the elements",
        "A visitor can accumulate state while traversing the structure (counters, an export buffer)",
        "Removes instanceof cascades: dispatch on the concrete type happens through accept/visit",
      ],
    },
    cons: {
      ru: [
        "Добавление нового класса элемента требует правки интерфейса посетителя и всех его реализаций",
        "Посетителю часто нужен доступ к внутренностям элементов, что подталкивает к раскрытию инкапсуляции",
        "Двойная диспетчеризация и цикл зависимостей между элементами и посетителем усложняют чтение кода",
      ],
      en: [
        "Adding a new element class requires changing the visitor interface and all of its implementations",
        "A visitor often needs access to the internals of elements, which pushes toward breaking encapsulation",
        "Double dispatch and the dependency cycle between elements and the visitor make the code harder to read",
      ],
    },
    tradeoffs: {
      ru: [
        "Легко добавлять операции, но тяжело добавлять типы элементов — ровно наоборот по сравнению с обычным полиморфизмом методов",
        "Чистота классов элементов против жёсткой связки интерфейса посетителя со всеми конкретными классами",
        "Возможность вести общее состояние обхода в посетителе (например, суммарную метрику) против риска, что сам посетитель незаметно разрастётся в ещё один god object, дублирующий обязанности элементов",
      ],
      en: [
        "Easy to add operations but hard to add element types — exactly the opposite of ordinary method polymorphism",
        "Clean element classes versus a visitor interface tightly coupled to every concrete class",
        "The ability to accumulate shared traversal state in the visitor (say, a running metric) versus the risk that the visitor itself quietly grows into another god object duplicating the elements' responsibilities",
      ],
    },
    whenToUse: {
      ru: [
        "Иерархия классов элементов стабильна, а операции над ней добавляются часто",
        "Над объектами структуры нужно выполнять много несвязанных операций, и не хочется засорять ими классы",
        "Операция зависит от конкретных классов элементов, а не только от общего интерфейса",
      ],
      en: [
        "The element class hierarchy is stable, but operations over it are added frequently",
        "You need to perform many unrelated operations on the objects of a structure and don't want to clutter the classes with them",
        "The operation depends on the concrete element classes, not just on a common interface",
      ],
    },
    whenNotToUse: {
      ru: [
        "Иерархия элементов часто пополняется новыми классами — каждый новый элемент ломает всех посетителей",
        "Операция одна и простая — достаточно обычного полиморфного метода",
      ],
      en: [
        "The element hierarchy frequently gains new classes — every new element breaks all the visitors",
        "There is only one simple operation — an ordinary polymorphic method is enough",
      ],
    },
    related: [
      "composite",
      "iterator",
      "interpreter",
      "ocp",
    ],
    diagram: `classDiagram
  class Visitor {
    <<interface>>
    +visitConcreteElementA(e)
    +visitConcreteElementB(e)
  }
  class Element {
    <<interface>>
    +accept(v: Visitor)
  }
  class ConcreteElementA {
    +accept(v)
  }
  class ConcreteElementB {
    +accept(v)
  }
  class ConcreteVisitor1
  class ConcreteVisitor2
  Element <|.. ConcreteElementA
  Element <|.. ConcreteElementB
  Visitor <|.. ConcreteVisitor1
  Visitor <|.. ConcreteVisitor2
  ConcreteElementA ..> Visitor : accept(v) calls visitConcreteElementA
  ConcreteElementB ..> Visitor : accept(v) calls visitConcreteElementB`,
    tags: [
      "паттерны",
      "поведенческие",
    ],
  },
];

export const behavioralQuestions: Question[] = [
  {
    id: "c-chain-of-responsibility-1",
    type: "concept",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "В чём ключевая идея паттерна Chain of Responsibility?",
      en: "What is the key idea behind the Chain of Responsibility pattern?",
    },
    options: {
      ru: [
        "Запрос передаётся по цепочке связанных обработчиков, пока один из них его не обработает; отправитель не знает конечного получателя",
        "При изменении состояния источника все зарегистрированные получатели автоматически уведомляются",
        "Запрос инкапсулируется в объект, что позволяет ставить его в очередь, логировать и отменять",
        "Взаимодействие множества объектов централизуется в одном посреднике, чтобы они не ссылались друг на друга напрямую",
      ],
      en: [
        "A request is passed along a chain of linked handlers until one of them handles it; the sender does not know the ultimate receiver",
        "When the source's state changes, all registered receivers are automatically notified",
        "A request is encapsulated as an object, which allows it to be queued, logged, and undone",
        "The interaction among many objects is centralized in a single mediator so that they do not reference each other directly",
      ],
    },
    correctIndex: 0,
    explanation: {
      ru: "Chain of Responsibility избавляет отправителя от привязки к получателю: обработчики связаны в цепочку, каждый либо обрабатывает запрос сам, либо передаёт следующему — поэтому верен первый вариант. Второй вариант описывает Observer: там источник вещает всем подписчикам сразу, а не передаёт запрос по очереди до первого обработавшего. Третий — Command: там суть в превращении запроса в самостоятельный объект с execute(), а не в маршрутизации по цепочке. Четвёртый — Mediator: там связи «многие ко многим» заменяются центральным координатором, тогда как в цепочке звенья связаны линейно и знают только следующего.",
      en: "Chain of Responsibility decouples the sender from the receiver: the handlers are linked into a chain, and each one either handles the request itself or passes it to the next — so the first option is correct. The second option describes Observer: there the subject broadcasts to all its subscribers at once, rather than passing a request along until the first one handles it. The third is Command: its essence is turning a request into a standalone object with execute(), not routing it along a chain. The fourth is Mediator: there many-to-many connections are replaced by a central coordinator, whereas in the chain the links are connected linearly and each knows only the next one.",
    },
    conceptId: "chain-of-responsibility",
  },
  {
    id: "ip-chain-of-responsibility-1",
    type: "identify-pattern",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "abstract class CheckHandler {",
          "  private next: CheckHandler | null = null;",
          "  setNext(h: CheckHandler): CheckHandler { this.next = h; return h; }",
          "  check(user: string): string {",
          "    return this.next ? this.next.check(user) : 'доступ разрешён'; // передаём дальше",
          "  }",
          "}",
          "",
          "class AuthCheck extends CheckHandler {",
          "  check(user: string) {",
          "    if (user === '') return 'ошибка: не авторизован'; // обработал сам — цепочка остановлена",
          "    return super.check(user);",
          "  }",
          "}",
          "class RoleCheck extends CheckHandler {",
          "  check(user: string) {",
          "    if (user !== 'admin') return 'ошибка: нет прав';",
          "    return super.check(user);",
          "  }",
          "}",
          "",
          "const chain = new AuthCheck();",
          "chain.setNext(new RoleCheck());",
          "chain.check('admin'); // каждая проверка либо отвечает сама, либо передаёт следующей",
        ].join('\n'),
        en: [
          "abstract class CheckHandler {",
          "  private next: CheckHandler | null = null;",
          "  setNext(h: CheckHandler): CheckHandler { this.next = h; return h; }",
          "  check(user: string): string {",
          "    return this.next ? this.next.check(user) : 'access granted'; // pass it on",
          "  }",
          "}",
          "",
          "class AuthCheck extends CheckHandler {",
          "  check(user: string) {",
          "    if (user === '') return 'error: not authenticated'; // handled it itself — the chain is stopped",
          "    return super.check(user);",
          "  }",
          "}",
          "class RoleCheck extends CheckHandler {",
          "  check(user: string) {",
          "    if (user !== 'admin') return 'error: no permissions';",
          "    return super.check(user);",
          "  }",
          "}",
          "",
          "const chain = new AuthCheck();",
          "chain.setNext(new RoleCheck());",
          "chain.check('admin'); // each check either responds itself or passes it to the next one",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Decorator",
        "Chain of Responsibility",
        "Command",
        "Mediator",
      ],
      en: [
        "Decorator",
        "Chain of Responsibility",
        "Command",
        "Mediator",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Обработчики связаны в цепочку через setNext(), и запрос check() идёт по ней: каждое звено либо отвечает само и останавливает обработку, либо передаёт запрос следующему, а клиент обращается только к первому звену — это Chain of Responsibility. Не Decorator: декоратор оборачивает базовый компонент, всегда делегирует ему и добавляет поведение «вокруг», здесь же нет оборачиваемого ядра, а звено может оборвать обработку, не передавая дальше. Не Command: запрос не превращён в самостоятельный объект с методом execute() — нет инкапсулированного действия, очередей или отмены. Не Mediator: нет центрального посредника, координирующего взаимодействие множества коллег, — звенья связаны линейно и каждое знает только своего преемника.",
      en: "The handlers are linked into a chain via setNext(), and the check() request travels along it: each link either responds itself and stops the processing or passes the request to the next one, while the client interacts only with the first link — this is Chain of Responsibility. Not Decorator: a decorator wraps a base component, always delegates to it, and adds behavior \"around\" it, whereas here there is no wrapped core and a link can terminate the processing without passing it on. Not Command: the request is not turned into a standalone object with an execute() method — there is no encapsulated action, queuing, or undo. Not Mediator: there is no central mediator coordinating the interaction among many colleagues — the links are connected linearly and each one knows only its successor.",
    },
    conceptId: "chain-of-responsibility",
  },
  {
    id: "c-command-1",
    type: "concept",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Какая формулировка точнее всего описывает паттерн Command?",
      en: "Which statement most accurately describes the Command pattern?",
    },
    options: {
      ru: [
        "Определяет семейство взаимозаменяемых алгоритмов, которые клиент подставляет в контекст извне",
        "Инкапсулирует запрос в виде объекта, позволяя ставить запросы в очередь, протоколировать их и поддерживать отмену операций",
        "Сохраняет и восстанавливает внутреннее состояние объекта, не раскрывая деталей его реализации",
        "Заменяет прямые связи между объектами общением через центральный объект-посредник",
      ],
      en: [
        "Defines a family of interchangeable algorithms that the client plugs into a context from the outside",
        "Encapsulates a request as an object, letting you queue requests, log them, and support undoable operations",
        "Captures and restores an object's internal state without exposing the details of its implementation",
        "Replaces direct connections between objects with communication through a central mediator object",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Command по GoF превращает запрос в самостоятельный объект: команда хранит получателя и параметры вызова, поэтому запросы можно передавать, ставить в очередь, логировать и отменять через undo(). Первый вариант — определение Strategy: там подменяется алгоритм решения одной задачи, а не оформляется запрос-действие. Третий вариант — Memento: он про снимки состояния для отката, а не про инкапсуляцию вызова. Четвёртый — Mediator: он централизует взаимодействие множества объектов, а не упаковывает отдельные операции в объекты.",
      en: "In the GoF sense, Command turns a request into a standalone object: the command holds the receiver and the call parameters, so requests can be passed around, queued, logged, and reversed via undo(). The first option is the definition of Strategy: there you swap out the algorithm for solving a single task rather than packaging a request-action. The third option is Memento: it's about state snapshots for rollback, not about encapsulating a call. The fourth is Mediator: it centralizes the interaction of many objects rather than wrapping individual operations into objects.",
    },
    conceptId: "command",
  },
  {
    id: "ip-command-1",
    type: "identify-pattern",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "interface EditorCommand { execute(): void; undo(): void; }",
          "",
          "class TextDocument {",
          "  content = '';",
          "  append(text: string) { this.content += text; }",
          "  cut(len: number) { this.content = this.content.slice(0, -len); }",
          "}",
          "",
          "class AppendCommand implements EditorCommand {",
          "  constructor(private doc: TextDocument, private text: string) {} // получатель + параметры",
          "  execute() { this.doc.append(this.text); }",
          "  undo() { this.doc.cut(this.text.length); }",
          "}",
          "",
          "class Toolbar {",
          "  private history: EditorCommand[] = [];",
          "  run(cmd: EditorCommand) { cmd.execute(); this.history.push(cmd); } // запрос — объект в истории",
          "  undoLast() { this.history.pop()?.undo(); }",
          "}",
        ].join('\n'),
        en: [
          "interface EditorCommand { execute(): void; undo(): void; }",
          "",
          "class TextDocument {",
          "  content = '';",
          "  append(text: string) { this.content += text; }",
          "  cut(len: number) { this.content = this.content.slice(0, -len); }",
          "}",
          "",
          "class AppendCommand implements EditorCommand {",
          "  constructor(private doc: TextDocument, private text: string) {} // receiver + parameters",
          "  execute() { this.doc.append(this.text); }",
          "  undo() { this.doc.cut(this.text.length); }",
          "}",
          "",
          "class Toolbar {",
          "  private history: EditorCommand[] = [];",
          "  run(cmd: EditorCommand) { cmd.execute(); this.history.push(cmd); } // the request is an object in the history",
          "  undoLast() { this.history.pop()?.undo(); }",
          "}",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Memento",
        "Command",
        "Strategy",
        "Mediator",
      ],
      en: [
        "Memento",
        "Command",
        "Strategy",
        "Mediator",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Запрос «добавить текст» оформлен объектом AppendCommand, который хранит получателя (TextDocument) и параметры вызова; инициатор Toolbar выполняет команды через единый интерфейс, копит историю и отменяет их через undo() — это Command. Не Memento: здесь нет снимков состояния документа, которые сохраняются и восстанавливаются, — отмена выполняется обратной операцией cut(), а не откатом к сохранённому состоянию. Не Strategy: команды — это не взаимозаменяемые алгоритмы решения одной задачи, а самостоятельные запросы-действия, которые ставятся в историю и отменяются; у Strategy нет ни undo(), ни журнала. Не Mediator: объекты не общаются через центрального посредника — Toolbar лишь выполняет и хранит команды, а не координирует взаимодействие коллег.",
      en: "The 'append text' request is packaged as an AppendCommand object that holds the receiver (TextDocument) and the call parameters; the Toolbar invoker runs commands through a uniform interface, builds up a history, and undoes them via undo() — this is Command. Not Memento: there are no document state snapshots that get saved and restored — the undo is performed by the inverse cut() operation, not by rolling back to a saved state. Not Strategy: commands aren't interchangeable algorithms for solving a single task but standalone request-actions that are pushed onto a history and undone; Strategy has neither undo() nor a log. Not Mediator: the objects don't communicate through a central intermediary — the Toolbar merely runs and stores commands rather than coordinating the interaction of colleagues.",
    },
    conceptId: "command",
  },
  {
    id: "c-interpreter-1",
    type: "concept",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Как точнее всего описать назначение паттерна Interpreter?",
      en: "Which description most precisely captures the intent of the Interpreter pattern?",
    },
    options: {
      ru: [
        "Позволяет добавлять новые операции над структурой объектов, не меняя классы её элементов",
        "Для заданного языка определяет представление его грамматики и интерпретатор, использующий это представление для интерпретации предложений языка",
        "Инкапсулирует запрос в объект, позволяя ставить операции в очередь, логировать и отменять их",
        "Компонует объекты в древовидные структуры «часть — целое», позволяя клиенту единообразно работать с листьями и контейнерами",
      ],
      en: [
        "Lets you add new operations over an object structure without changing the classes of its elements",
        "Given a language, defines a representation of its grammar and an interpreter that uses that representation to interpret sentences in the language",
        "Encapsulates a request as an object, letting you queue, log, and undo operations",
        "Composes objects into part-whole tree structures, letting clients treat individual leaves and containers uniformly",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Верен второй вариант — это каноническое определение Interpreter по GoF: каждому правилу грамматики соответствует класс, а предложения языка представляются деревом таких объектов и вычисляются рекурсивным методом interpret с контекстом. Первый вариант описывает Visitor — там новые операции добавляются извне, а не грамматика языка. Третий описывает Command — инкапсуляцию действия в объект, без какого-либо языка и грамматики. Четвёртый описывает Composite: Interpreter действительно строит дерево (и часто использует Composite как структуру), но суть Composite — единообразие «часть — целое», а не представление грамматики и интерпретация предложений.",
      en: "The second option is correct — it's the canonical GoF definition of Interpreter: each grammar rule corresponds to a class, and sentences in the language are represented as a tree of such objects and evaluated by a recursive interpret method that takes a context. The first option describes Visitor, where new operations are added from the outside rather than defining a language's grammar. The third describes Command — encapsulating an action as an object, with no language or grammar involved. The fourth describes Composite: Interpreter does build a tree (and often uses Composite as its structure), but the essence of Composite is uniform part-whole treatment, not representing a grammar and interpreting sentences.",
    },
    conceptId: "interpreter",
  },
  {
    id: "ip-interpreter-1",
    type: "identify-pattern",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "interface BoolExp { interpret(ctx: Record<string, boolean>): boolean; }",
          "",
          "// терминальный символ грамматики: переменная из контекста",
          "class VarExp implements BoolExp {",
          "  constructor(private name: string) {}",
          "  interpret(ctx: Record<string, boolean>) { return ctx[this.name] ?? false; }",
          "}",
          "",
          "// нетерминальные правила рекурсивно интерпретируют подвыражения",
          "class AndExp implements BoolExp {",
          "  constructor(private left: BoolExp, private right: BoolExp) {}",
          "  interpret(ctx: Record<string, boolean>) {",
          "    return this.left.interpret(ctx) && this.right.interpret(ctx);",
          "  }",
          "}",
          "class NotExp implements BoolExp {",
          "  constructor(private operand: BoolExp) {}",
          "  interpret(ctx: Record<string, boolean>) { return !this.operand.interpret(ctx); }",
          "}",
          "",
          "// предложение мини-языка правил: isAdmin && !isBanned",
          "const rule = new AndExp(new VarExp('isAdmin'), new NotExp(new VarExp('isBanned')));",
          "rule.interpret({ isAdmin: true, isBanned: false }); // true",
        ].join('\n'),
        en: [
          "interface BoolExp { interpret(ctx: Record<string, boolean>): boolean; }",
          "",
          "// terminal grammar symbol: a variable from the context",
          "class VarExp implements BoolExp {",
          "  constructor(private name: string) {}",
          "  interpret(ctx: Record<string, boolean>) { return ctx[this.name] ?? false; }",
          "}",
          "",
          "// nonterminal rules recursively interpret their subexpressions",
          "class AndExp implements BoolExp {",
          "  constructor(private left: BoolExp, private right: BoolExp) {}",
          "  interpret(ctx: Record<string, boolean>) {",
          "    return this.left.interpret(ctx) && this.right.interpret(ctx);",
          "  }",
          "}",
          "class NotExp implements BoolExp {",
          "  constructor(private operand: BoolExp) {}",
          "  interpret(ctx: Record<string, boolean>) { return !this.operand.interpret(ctx); }",
          "}",
          "",
          "// a sentence in the rules mini-language: isAdmin && !isBanned",
          "const rule = new AndExp(new VarExp('isAdmin'), new NotExp(new VarExp('isBanned')));",
          "rule.interpret({ isAdmin: true, isBanned: false }); // true",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Composite",
        "Interpreter",
        "Visitor",
        "Strategy",
      ],
      en: [
        "Composite",
        "Interpreter",
        "Visitor",
        "Strategy",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Каждое правило грамматики булева мини-языка представлено классом (VarExp — терминальный символ, AndExp и NotExp — нетерминальные), предложение «isAdmin && !isBanned» собрано в дерево, а его вычисление — рекурсивный вызов interpret с передачей контекста — это Interpreter. Не Composite: дерево здесь лишь носитель грамматики, а суть кода — интерпретация предложений языка относительно контекста, а не единообразная работа с иерархией «часть — целое». Не Visitor: операция interpret объявлена внутри самих узлов, нет внешнего объекта-посетителя с двойной диспетчеризацией, добавляющего операции извне. Не Strategy: классы не являются взаимозаменяемыми алгоритмами одного действия, которые клиент подставляет в контекст, — это узлы грамматики, комбинируемые в выражение.",
      en: "Each grammar rule of the boolean mini-language is represented by a class (VarExp is a terminal symbol; AndExp and NotExp are nonterminals), the sentence \"isAdmin && !isBanned\" is assembled into a tree, and evaluating it — a recursive interpret call that threads a context through — is Interpreter. Not Composite: the tree here is merely a carrier for the grammar, and the point of the code is interpreting sentences of a language against a context, not treating a part-whole hierarchy uniformly. Not Visitor: the interpret operation is declared inside the nodes themselves; there's no external visitor object using double dispatch to add operations from the outside. Not Strategy: the classes aren't interchangeable algorithms for a single action that a client plugs into a context — they're grammar nodes combined into an expression.",
    },
    conceptId: "interpreter",
  },
  {
    id: "c-iterator-1",
    type: "concept",
    category: "behavioral",
    grade: "junior",
    prompt: {
      ru: "В чём суть паттерна Iterator?",
      en: "What is the essence of the Iterator pattern?",
    },
    options: {
      ru: [
        "Позволяет добавлять новые операции к классам элементов, не изменяя сами эти классы",
        "Предоставляет способ последовательного доступа к элементам составного объекта, не раскрывая его внутреннего представления",
        "Компонует объекты в древовидную структуру и позволяет работать с группой объектов так же, как с одиночным",
        "Предоставляет единый упрощённый интерфейс к сложной подсистеме классов",
      ],
      en: [
        "Lets you add new operations to element classes without modifying those classes themselves",
        "Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation",
        "Composes objects into a tree structure and lets you treat a group of objects just like a single one",
        "Provides a single simplified interface to a complex subsystem of classes",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Iterator по GoF — это последовательный доступ к элементам агрегата без раскрытия его внутреннего устройства: обход выносится в отдельный объект с собственной позицией. Первый вариант описывает Visitor (новые операции без изменения классов элементов), третий — Composite (дерево «часть — целое» с единообразной работой), четвёртый — Facade (упрощённый вход в подсистему).",
      en: "The GoF Iterator is about sequential access to the elements of an aggregate without exposing its internal structure: traversal is extracted into a separate object with its own position. The first option describes Visitor (new operations without changing the element classes), the third describes Composite (a part-whole tree treated uniformly), and the fourth describes Facade (a simplified entry point into a subsystem).",
    },
    conceptId: "iterator",
  },
  {
    id: "ip-iterator-1",
    type: "identify-pattern",
    category: "behavioral",
    grade: "junior",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "interface BookIterator {",
          "  hasNext(): boolean;",
          "  next(): string;",
          "}",
          "",
          "class Shelf {",
          "  private books: string[] = [];",
          "  add(title: string) { this.books.push(title); }",
          "  createIterator(): BookIterator {",
          "    return new ShelfIterator(this.books); // обход отдан отдельному объекту",
          "  }",
          "}",
          "",
          "class ShelfIterator implements BookIterator {",
          "  private position = 0;",
          "  constructor(private books: string[]) {}",
          "  hasNext() { return this.position < this.books.length; }",
          "  next() { return this.books[this.position++]; }",
          "}",
          "",
          "const shelf = new Shelf();",
          "shelf.add('Design Patterns');",
          "const it = shelf.createIterator();",
          "while (it.hasNext()) console.log(it.next());",
        ].join('\n'),
        en: [
          "interface BookIterator {",
          "  hasNext(): boolean;",
          "  next(): string;",
          "}",
          "",
          "class Shelf {",
          "  private books: string[] = [];",
          "  add(title: string) { this.books.push(title); }",
          "  createIterator(): BookIterator {",
          "    return new ShelfIterator(this.books); // traversal is delegated to a separate object",
          "  }",
          "}",
          "",
          "class ShelfIterator implements BookIterator {",
          "  private position = 0;",
          "  constructor(private books: string[]) {}",
          "  hasNext() { return this.position < this.books.length; }",
          "  next() { return this.books[this.position++]; }",
          "}",
          "",
          "const shelf = new Shelf();",
          "shelf.add('Design Patterns');",
          "const it = shelf.createIterator();",
          "while (it.hasNext()) console.log(it.next());",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Visitor",
        "Iterator",
        "Composite",
        "Facade",
      ],
      en: [
        "Visitor",
        "Iterator",
        "Composite",
        "Facade",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Обход коллекции вынесен в отдельный объект ShelfIterator с интерфейсом hasNext()/next() и собственной позицией; клиент перебирает книги последовательно, не видя внутреннего массива Shelf — это Iterator. Не Visitor: нет пары accept/visit и двойной диспетчеризации, к элементам не добавляются новые операции — их просто перебирают. Не Composite: нет древовидной структуры «часть — целое» с общим интерфейсом для листьев и контейнеров — Shelf хранит плоский список. Не Facade: ShelfIterator не упрощает доступ к сложной подсистеме из многих классов, а решает одну задачу — последовательный обход одной коллекции.",
      en: "The collection's traversal is extracted into a separate ShelfIterator object with a hasNext()/next() interface and its own position; the client iterates over the books sequentially without seeing Shelf's internal array — this is Iterator. Not Visitor: there is no accept/visit pair or double dispatch, and no new operations are added to the elements — they are simply iterated over. Not Composite: there is no part-whole tree structure with a common interface for leaves and containers — Shelf holds a flat list. Not Facade: ShelfIterator does not simplify access to a complex subsystem of many classes; it solves a single task — sequentially traversing one collection.",
    },
    conceptId: "iterator",
  },
  {
    id: "c-mediator-1",
    type: "concept",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "В чём суть паттерна Mediator?",
      en: "What is the essence of the Mediator pattern?",
    },
    options: {
      ru: [
        "Определяет зависимость «один ко многим», при которой все подписчики автоматически уведомляются об изменении состояния источника",
        "Инкапсулирует способ взаимодействия множества объектов в отдельном объекте, чтобы участники не ссылались друг на друга напрямую",
        "Предоставляет единый упрощённый интерфейс к сложной подсистеме, скрывая её внутреннее устройство от клиента",
        "Инкапсулирует запрос в объект, позволяя параметризовать получателей, ставить операции в очередь и отменять их",
      ],
      en: [
        "Defines a one-to-many dependency in which all subscribers are automatically notified when the source's state changes",
        "Encapsulates how a set of objects interact in a separate object so that the participants don't reference one another directly",
        "Provides a single simplified interface to a complex subsystem, hiding its internal structure from the client",
        "Encapsulates a request as an object, letting you parameterize receivers, queue operations, and undo them",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Mediator по GoF определяет объект, инкапсулирующий взаимодействие множества объектов: коллеги знают только посредника, сеть связей «многие ко многим» заменяется «звездой», а схему взаимодействия можно менять независимо от участников. Первый вариант — это Observer: односторонняя рассылка уведомлений от источника подписчикам, а не координация равноправных участников. Третий — Facade: упрощённый фасад для внешнего клиента, при этом подсистема о фасаде не знает, тогда как коллеги Mediator активно общаются с посредником. Четвёртый — Command: превращение запроса в объект ради очередей и отмены, к координации взаимодействия это не относится.",
      en: "In GoF terms, Mediator defines an object that encapsulates how a set of objects interact: colleagues know only the mediator, the many-to-many web of connections is replaced by a star, and the interaction scheme can be changed independently of the participants. The first option is Observer — a one-way broadcast of notifications from a source to its subscribers, not the coordination of peer participants. The third is Facade — a simplified front for an external client, where the subsystem is unaware of the facade, whereas a Mediator's colleagues actively talk to the mediator. The fourth is Command — turning a request into an object for the sake of queuing and undo, which has nothing to do with coordinating interaction.",
    },
    conceptId: "mediator",
  },
  {
    id: "ip-mediator-1",
    type: "identify-pattern",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "interface ChatMediator { send(text: string, from: User, to: string): void; }",
          "",
          "class User {",
          "  constructor(private mediator: ChatMediator, readonly name: string) {}",
          "  say(text: string, to: string) {",
          "    this.mediator.send(text, this, to); // участник знает только посредника",
          "  }",
          "  receive(text: string) { console.log(`${this.name} получил: ${text}`); }",
          "}",
          "",
          "class ChatRoom implements ChatMediator {",
          "  private users = new Map<string, User>();",
          "  register(user: User) { this.users.set(user.name, user); }",
          "  send(text: string, from: User, to: string) {",
          "    // маршрутизацию определяет посредник, а не сами участники",
          "    this.users.get(to)?.receive(`${from.name}: ${text}`);",
          "  }",
          "}",
        ].join('\n'),
        en: [
          "interface ChatMediator { send(text: string, from: User, to: string): void; }",
          "",
          "class User {",
          "  constructor(private mediator: ChatMediator, readonly name: string) {}",
          "  say(text: string, to: string) {",
          "    this.mediator.send(text, this, to); // a participant knows only the mediator",
          "  }",
          "  receive(text: string) { console.log(`${this.name} received: ${text}`); }",
          "}",
          "",
          "class ChatRoom implements ChatMediator {",
          "  private users = new Map<string, User>();",
          "  register(user: User) { this.users.set(user.name, user); }",
          "  send(text: string, from: User, to: string) {",
          "    // the mediator, not the participants, determines routing",
          "    this.users.get(to)?.receive(`${from.name}: ${text}`);",
          "  }",
          "}",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Facade",
        "Mediator",
        "Observer",
        "Command",
      ],
      en: [
        "Facade",
        "Mediator",
        "Observer",
        "Command",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Участники чата не ссылаются друг на друга: любое сообщение идёт через ChatRoom, который сам решает, кому его доставить, — взаимодействие «многие ко многим» инкапсулировано в посреднике, это Mediator. Не Observer: нет подписки на изменения состояния источника и рассылки «один ко многим» — участники равноправны и обмениваются адресными сообщениями через координатора. Не Facade: ChatRoom не упрощает интерфейс к подсистеме для внешнего клиента — сами User знают посредника и активно обращаются к нему, связь двусторонняя. Не Command: запрос не инкапсулируется в отдельный объект с методом выполнения, нет очередей и отмены — передаются обычные аргументы.",
      en: "The chat participants don't reference one another: every message goes through ChatRoom, which itself decides where to deliver it — the many-to-many interaction is encapsulated in a mediator, so this is Mediator. Not Observer: there's no subscription to a source's state changes and no one-to-many broadcast — the participants are peers exchanging targeted messages through a coordinator. Not Facade: ChatRoom doesn't simplify an interface to a subsystem for an external client — the Users themselves know the mediator and actively call into it, and the relationship is two-way. Not Command: the request isn't encapsulated in a separate object with an execute method, and there's no queuing or undo — plain arguments are passed.",
    },
    conceptId: "mediator",
  },
  {
    id: "c-memento-1",
    type: "concept",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "В чём ключевая идея паттерна Memento?",
      en: "What is the key idea of the Memento pattern?",
    },
    options: {
      ru: [
        "Инкапсулировать запрос как объект, чтобы ставить операции в очередь и отменять их",
        "Зафиксировать и вынести вовне внутреннее состояние объекта, не нарушая его инкапсуляцию, чтобы позже восстановить объект в этом состоянии",
        "Позволить объекту менять поведение при изменении его внутреннего состояния",
        "Создавать новые объекты копированием существующего экземпляра вместо вызова конструктора",
      ],
      en: [
        "Encapsulate a request as an object so that operations can be queued and undone",
        "Capture and externalize an object's internal state without violating its encapsulation, so that the object can later be restored to that state",
        "Let an object change its behavior when its internal state changes",
        "Create new objects by copying an existing instance instead of calling a constructor",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Memento по GoF — это снимок внутреннего состояния, вынесенный за пределы объекта без нарушения инкапсуляции: снимок создаёт сам источник, а хранитель держит его как непрозрачный токен для последующего восстановления. Первый вариант описывает Command (объект-операция с очередями и undo через обратные действия), третий — State (смена поведения при переходах состояний), четвёртый — Prototype (порождение объектов клонированием).",
      en: "In GoF terms, Memento is a snapshot of internal state externalized outside the object without breaking encapsulation: the originator creates the snapshot, and the caretaker holds it as an opaque token for later restoration. The first option describes Command (an operation object with queuing and undo via inverse actions), the third describes State (changing behavior across state transitions), and the fourth describes Prototype (creating objects by cloning).",
    },
    conceptId: "memento",
  },
  {
    id: "ip-memento-1",
    type: "identify-pattern",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "class Snapshot {",
          "  constructor(private readonly hp: number, private readonly level: number) {}",
          "  getHp() { return this.hp; }",
          "  getLevel() { return this.level; }",
          "}",
          "",
          "class Hero {",
          "  private hp = 100;",
          "  private level = 1;",
          "  fight() { this.hp -= 30; this.level += 1; }",
          "  save(): Snapshot { return new Snapshot(this.hp, this.level); } // снимок делает сам герой",
          "  restore(s: Snapshot) { this.hp = s.getHp(); this.level = s.getLevel(); }",
          "}",
          "",
          "class SaveSlots { // хранит снимки, не заглядывая внутрь",
          "  private slots: Snapshot[] = [];",
          "  push(s: Snapshot) { this.slots.push(s); }",
          "  pop() { return this.slots.pop(); }",
          "}",
          "",
          "const hero = new Hero();",
          "const slots = new SaveSlots();",
          "slots.push(hero.save()); // сохранение перед боем",
          "hero.fight();",
          "const last = slots.pop();",
          "if (last) hero.restore(last); // откат к сохранённому состоянию",
        ].join('\n'),
        en: [
          "class Snapshot {",
          "  constructor(private readonly hp: number, private readonly level: number) {}",
          "  getHp() { return this.hp; }",
          "  getLevel() { return this.level; }",
          "}",
          "",
          "class Hero {",
          "  private hp = 100;",
          "  private level = 1;",
          "  fight() { this.hp -= 30; this.level += 1; }",
          "  save(): Snapshot { return new Snapshot(this.hp, this.level); } // the hero creates its own snapshot",
          "  restore(s: Snapshot) { this.hp = s.getHp(); this.level = s.getLevel(); }",
          "}",
          "",
          "class SaveSlots { // stores snapshots without looking inside",
          "  private slots: Snapshot[] = [];",
          "  push(s: Snapshot) { this.slots.push(s); }",
          "  pop() { return this.slots.pop(); }",
          "}",
          "",
          "const hero = new Hero();",
          "const slots = new SaveSlots();",
          "slots.push(hero.save()); // save before the fight",
          "hero.fight();",
          "const last = slots.pop();",
          "if (last) hero.restore(last); // undo to the saved state",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Command",
        "Memento",
        "Prototype",
        "State",
      ],
      en: [
        "Command",
        "Memento",
        "Prototype",
        "State",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Hero сам создаёт снимок своего приватного состояния (save) и сам восстанавливается из него (restore), а SaveSlots лишь хранит снимки как непрозрачные объекты — это классическая тройка originator/memento/caretaker паттерна Memento. Не Command: здесь нет объекта-операции с методом execute(), в очередь ставятся снимки состояния, а не запросы, и откат идёт восстановлением состояния, а не выполнением обратного действия. Не Prototype: Snapshot — не клон героя для самостоятельной работы, это пассивный слепок данных, который умеет читать только сам Hero; метода clone(), порождающего новые рабочие объекты, нет. Не State: поведение Hero не меняется при смене внутреннего состояния — нет классов-состояний с общим интерфейсом и переходов между ними.",
      en: "Hero creates a snapshot of its own private state (save) and restores itself from it (restore), while SaveSlots merely stores the snapshots as opaque objects — this is the classic originator/memento/caretaker trio of the Memento pattern. Not Command: there's no operation object with an execute() method; it's state snapshots, not requests, that get queued, and undo works by restoring state rather than executing an inverse action. Not Prototype: Snapshot isn't a clone of the hero meant to work on its own — it's a passive data capture that only Hero itself can read; there's no clone() method producing new working objects. Not State: Hero's behavior doesn't change as its internal state changes — there are no state classes with a shared interface and transitions between them.",
    },
    conceptId: "memento",
  },
  {
    id: "c-template-method-1",
    type: "concept",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Какое утверждение точнее всего описывает паттерн Template Method?",
      en: "Which statement most accurately describes the Template Method pattern?",
    },
    options: {
      ru: [
        "Инкапсулирует семейство взаимозаменяемых алгоритмов, которые клиент подставляет в контекст извне",
        "Определяет скелет алгоритма в базовом классе, позволяя подклассам переопределять отдельные шаги без изменения его структуры",
        "Позволяет объекту менять поведение при смене внутреннего состояния, как будто он сменил класс",
        "Определяет интерфейс создания объекта, оставляя выбор конкретного класса продукта подклассам",
      ],
      en: [
        "Encapsulates a family of interchangeable algorithms that the client plugs into a context from the outside",
        "Defines the skeleton of an algorithm in a base class, letting subclasses redefine individual steps without changing its structure",
        "Lets an object alter its behavior when its internal state changes, as if it had changed its class",
        "Defines an interface for creating an object, letting subclasses decide which concrete product class to instantiate",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Template Method фиксирует инвариантную последовательность шагов в методе базового класса, а изменяемые шаги отдаёт подклассам через переопределение — структура алгоритма при этом неизменна. Первый вариант описывает Strategy: там алгоритм целиком заменяется извне через композицию, а не отдельные шаги через наследование. Третий вариант — определение State: поведение переключается вслед за внутренним состоянием объекта. Четвёртый — Factory Method: он про порождение объекта подклассом, а не про каркас алгоритма с переопределяемыми шагами.",
      en: "Template Method fixes the invariant sequence of steps in a method of the base class and hands the variable steps to subclasses through overriding — the algorithm's structure stays unchanged. The first option describes Strategy: there the whole algorithm is supplied from the outside through composition, rather than individual steps through inheritance. The third option is the definition of State: behavior switches in step with the object's internal state. The fourth is Factory Method: it is about a subclass creating an object, not about an algorithm skeleton with overridable steps.",
    },
    conceptId: "template-method",
  },
  {
    id: "ip-template-method-1",
    type: "identify-pattern",
    category: "behavioral",
    grade: "middle",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "abstract class DataImporter {",
          "  // скелет алгоритма зафиксирован в базовом классе",
          "  import(raw: string): string[] {",
          "    const parsed = this.parse(raw);",
          "    const valid = parsed.filter((r) => this.isValid(r));",
          "    return valid.map((r) => r.trim());",
          "  }",
          "  protected abstract parse(raw: string): string[]; // шаг определяет подкласс",
          "  protected isValid(row: string): boolean { return row.length > 0; } // хук",
          "}",
          "",
          "class CsvImporter extends DataImporter {",
          "  protected parse(raw: string) { return raw.split(','); }",
          "}",
          "",
          "class LogImporter extends DataImporter {",
          "  protected parse(raw: string) { return raw.split('\\n'); }",
          "  protected isValid(row: string) { return !row.startsWith('#'); }",
          "}",
        ].join('\n'),
        en: [
          "abstract class DataImporter {",
          "  // the algorithm skeleton is fixed in the base class",
          "  import(raw: string): string[] {",
          "    const parsed = this.parse(raw);",
          "    const valid = parsed.filter((r) => this.isValid(r));",
          "    return valid.map((r) => r.trim());",
          "  }",
          "  protected abstract parse(raw: string): string[]; // step defined by the subclass",
          "  protected isValid(row: string): boolean { return row.length > 0; } // hook",
          "}",
          "",
          "class CsvImporter extends DataImporter {",
          "  protected parse(raw: string) { return raw.split(','); }",
          "}",
          "",
          "class LogImporter extends DataImporter {",
          "  protected parse(raw: string) { return raw.split('\\n'); }",
          "  protected isValid(row: string) { return !row.startsWith('#'); }",
          "}",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Strategy",
        "Template Method",
        "Decorator",
        "Factory Method",
      ],
      en: [
        "Strategy",
        "Template Method",
        "Decorator",
        "Factory Method",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Метод import() в базовом классе фиксирует неизменную последовательность шагов (parse → фильтрация → нормализация), а подклассы переопределяют только отдельные шаги parse() и хук isValid() — это Template Method. Не Strategy: алгоритм не передаётся в контекст извне как отдельный объект — варианты выбираются наследованием, а каркас вызывает шаги сам. Не Factory Method: переопределяемый шаг преобразует данные, а не создаёт объект-продукт, порождения объектов подклассами здесь нет. Не Decorator: никто не оборачивает объект с тем же интерфейсом, добавляя поведение поверх делегирования, — здесь обычная иерархия наследования с переопределением шагов.",
      en: "The import() method in the base class fixes an invariant sequence of steps (parse → filter → normalize), while subclasses override only individual steps — parse() and the isValid() hook. This is Template Method. Not Strategy: the algorithm is not passed into a context from the outside as a separate object — the variants are chosen through inheritance, and the skeleton calls the steps itself. Not Factory Method: the overridable step transforms data rather than creating a product object; there is no subclass-driven object creation here. Not Decorator: nothing wraps an object of the same interface to add behavior on top of delegation — this is a plain inheritance hierarchy with overridden steps.",
    },
    conceptId: "template-method",
  },
  {
    id: "c-visitor-1",
    type: "concept",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Какое утверждение точнее всего описывает паттерн Visitor?",
      en: "Which statement most accurately describes the Visitor pattern?",
    },
    options: {
      ru: [
        "Позволяет определить новую операцию над объектами структуры, не изменяя их классы: операция выносится в объект-посетитель, а выбор нужного метода происходит через двойную диспетчеризацию accept/visit",
        "Даёт способ последовательного доступа к элементам составного объекта, не раскрывая его внутреннего устройства",
        "Компонует объекты в древовидные структуры и позволяет клиенту единообразно работать с отдельными объектами и их группами",
        "Инкапсулирует запрос в виде объекта, позволяя ставить операции в очередь, логировать и отменять их",
      ],
      en: [
        "Lets you define a new operation over the objects of a structure without changing their classes: the operation is extracted into a visitor object, and the right method is chosen through double dispatch via accept/visit",
        "Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation",
        "Composes objects into tree structures and lets clients treat individual objects and their compositions uniformly",
        "Encapsulates a request as an object, letting you queue, log, and undo operations",
      ],
    },
    correctIndex: 0,
    explanation: {
      ru: "Верно первое: суть Visitor по GoF — представить операцию над каждым объектом структуры так, чтобы новую операцию можно было определить без изменения классов элементов; механика — двойная диспетчеризация, где элемент в accept() вызывает «свой» метод посетителя. Второй вариант — определение Iterator: он про порядок обхода, а не про вынесение операций. Третий — Composite: он про древовидную композицию «часть—целое», а не про добавление операций извне. Четвёртый — Command: он превращает сам запрос в объект ради очередей и отмены, а не распределяет операцию по типам элементов.",
      en: "The first is correct: the essence of Visitor per GoF is to represent an operation over each object of a structure so that a new operation can be defined without changing the element classes; the mechanism is double dispatch, where an element calls its own method on the visitor inside accept(). The second option is the definition of Iterator: it is about traversal order, not about extracting operations. The third is Composite: it is about tree-shaped part-whole composition, not about adding operations from the outside. The fourth is Command: it turns the request itself into an object for the sake of queuing and undo, rather than distributing an operation across element types.",
    },
    conceptId: "visitor",
  },
  {
    id: "ip-visitor-1",
    type: "identify-pattern",
    category: "behavioral",
    grade: "senior",
    prompt: {
      ru: "Какой паттерн проектирования использован в этом коде?",
      en: "Which design pattern is used in this code?",
    },
    code: {
      lang: "typescript",
      code: {
        ru: [
          "interface NodeVisitor { visitText(n: TextNode): void; visitImage(n: ImageNode): void; }",
          "",
          "interface DocNode { accept(v: NodeVisitor): void; }",
          "",
          "class TextNode implements DocNode {",
          "  constructor(public text: string) {}",
          "  accept(v: NodeVisitor) { v.visitText(this); } // элемент сам выбирает метод посетителя",
          "}",
          "class ImageNode implements DocNode {",
          "  constructor(public src: string) {}",
          "  accept(v: NodeVisitor) { v.visitImage(this); }",
          "}",
          "",
          "class HtmlRenderer implements NodeVisitor {",
          "  html = '';",
          "  visitText(n: TextNode) { this.html += `<p>${n.text}</p>`; }",
          "  visitImage(n: ImageNode) { this.html += `<img src=\"${n.src}\">`; }",
          "}",
          "",
          "const doc: DocNode[] = [new TextNode('Привет'), new ImageNode('logo.png')];",
          "const renderer = new HtmlRenderer();",
          "doc.forEach((node) => node.accept(renderer));",
        ].join('\n'),
        en: [
          "interface NodeVisitor { visitText(n: TextNode): void; visitImage(n: ImageNode): void; }",
          "",
          "interface DocNode { accept(v: NodeVisitor): void; }",
          "",
          "class TextNode implements DocNode {",
          "  constructor(public text: string) {}",
          "  accept(v: NodeVisitor) { v.visitText(this); } // the element itself chooses the visitor's method",
          "}",
          "class ImageNode implements DocNode {",
          "  constructor(public src: string) {}",
          "  accept(v: NodeVisitor) { v.visitImage(this); }",
          "}",
          "",
          "class HtmlRenderer implements NodeVisitor {",
          "  html = '';",
          "  visitText(n: TextNode) { this.html += `<p>${n.text}</p>`; }",
          "  visitImage(n: ImageNode) { this.html += `<img src=\"${n.src}\">`; }",
          "}",
          "",
          "const doc: DocNode[] = [new TextNode('Hello'), new ImageNode('logo.png')];",
          "const renderer = new HtmlRenderer();",
          "doc.forEach((node) => node.accept(renderer));",
        ].join('\n'),
      },
    },
    options: {
      ru: [
        "Composite",
        "Visitor",
        "Strategy",
        "Iterator",
      ],
      en: [
        "Composite",
        "Visitor",
        "Strategy",
        "Iterator",
      ],
    },
    correctIndex: 1,
    explanation: {
      ru: "Операция рендеринга вынесена из классов узлов в отдельный объект HtmlRenderer с методом visit на каждый конкретный тип, а узлы через accept() вызывают «свой» метод посетителя — двойная диспетчеризация, то есть Visitor: новую операцию (например, экспорт в Markdown) можно добавить новым посетителем, не трогая TextNode и ImageNode. Не Composite: узлы не содержат дочерних узлов и не образуют дерево «часть—целое» с единообразной работой с группой как с одним объектом. Не Strategy: HtmlRenderer не является взаимозаменяемым алгоритмом, который контекст хранит и которому делегирует одно поведение, — здесь диспетчеризация по конкретным типам элементов через accept/visit. Не Iterator: способ обхода не инкапсулирован в отдельный объект с последовательным доступом — используется обычный forEach, а суть кода в вынесении операции, а не в порядке обхода.",
      en: "The rendering operation is extracted from the node classes into a separate HtmlRenderer object with a visit method for each concrete type, and the nodes call their own method on the visitor through accept() — double dispatch, i.e. Visitor: a new operation (for example, export to Markdown) can be added with a new visitor without touching TextNode and ImageNode. Not Composite: the nodes contain no child nodes and do not form a part-whole tree in which a group is treated uniformly as a single object. Not Strategy: HtmlRenderer is not an interchangeable algorithm that a context holds and delegates a single behavior to — here dispatch happens on the concrete element types through accept/visit. Not Iterator: the traversal is not encapsulated in a separate object with sequential access — a plain forEach is used, and the point of the code is extracting the operation, not the traversal order.",
    },
    conceptId: "visitor",
  },
];
