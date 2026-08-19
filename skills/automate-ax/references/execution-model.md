# Execution model

Use this mental model when authoring or reviewing an automation. The installed SDK's declarations and examples remain authoritative for exact APIs.

## Think of the automation body as a render

Automate.ax is inspired by React's execution model. The automation function is a synchronous, declarative render of durable computation:

- The same bundle may replay during planning and each durable context advance.
- Each event gets a fresh automation context.
- Calls are identified by deterministic slot order, much like hooks. Keep action order and literal call structure stable across replays.
- Ordinary helpers, callbacks, and loops are fine when their structure is deterministic.
- Do not perform network calls, filesystem writes, database writes, random generation, clock reads, or other side effects in the automation body.
- Put external effects in actions. An action call returns immediately during composition; its handler can perform asynchronous work when the runtime executes that action.

Write direct TypeScript. The function itself is the program; do not construct a graph, JSON workflow, or separate intermediate representation.

## Signals are durable single-outcome futures

`Signal<T>` represents a value that may not exist during composition. It is not a `Promise`, collection, or multi-emission observable.

A signal terminates exactly once by:

1. emitting one value,
2. closing without a value, or
3. failing.

Compose signals synchronously instead of awaiting or inspecting them. Pass them into actions and compose them with the installed SDK's signal operations. The runtime records dependencies and materializes values later.

Transforms must be pure and replay-safe. They describe a calculation over materialized dependencies; they do not run when symbolic traversal first encounters them. Closure and failure propagate through dependent computation unless an SDK primitive explicitly handles them.

## Transform and proxy syntax

These forms all create derived signals; none reads a value during composition:

| Form | Meaning |
| --- | --- |
| `transform([a, b], (aValue, bValue) => result)` | Derive a value from multiple signals. |
| `value.transform((resolved) => result)` | Unary convenience form of `transform`. |
| `value.property` | Shorthand for `value.transform((resolved) => resolved.property)`. |
| `value.method(arguments)` | Property projection followed by a function-call transform; the method keeps its receiver. |
| `functionSignal(arguments)` | Shorthand for transforming the eventual function call result. |
| `` t`text ${value}` `` | Create a string signal; only signal interpolations become dependencies. |

Property and call syntax composes through chains. For example, `request.path.trim().toLowerCase()` is a `Signal<string>`, and `names.join(", ")` on a `Signal<string[]>` is semantically equivalent to `names.transform((resolved) => resolved.join(", "))`. Accessing a property on an eventual `null` or `undefined` fails with a `TypeError` during execution.

Prefer the shorthand when it stays readable and preserves useful types. TypeScript cannot retain every arbitrary generic method signature through the proxy; for example, `arraySignal.map(...)` may become `Signal<unknown[]>`. Use an explicit `transform` when exact generic inference matters or when combining multiple signals.

## Control flow and dependencies

| Primitive | Semantics |
| --- | --- |
| `gate(value, condition)` | Emit `value` only when the condition is true; otherwise close without materializing `value`. |
| `filter(value, predicate)` | Evaluate a pure predicate after `value` materializes; preserve the original value when true and close when false. |
| `partition(value, predicate)` | Return `[matched, unmatched]` complementary gates; exactly one side preserves the original value. |
| `fallback(values)` | Select the first declared signal that does not close; an earlier pending signal blocks later inputs. |
| `race(values)` | Persist the earliest emitted or failed input by durable outcome order; closed inputs leave the race. |
| `correlate(streams, options?)` | Eagerly consume one exact-key value from every `keyBy()` signal into a child context with merged parent history. |
| `collect` / `funnel` / `debounce` / `window` | Coordinate a keyed signal per key or an explicitly `globally()` marked signal in one shared partition. |
| `scope(fn, options?)` / `scope(dependencies, fn, options?)` | Traverse `fn` in an isolated durable hook namespace and optionally give every declaration inherited dependencies and UI presentation metadata. |
| `branch(condition, whenTrue, whenFalse?)` | Traverse callbacks under complementary scoped gates so only the selected side's actions execute. |
| `outcome(value)` | Convert success, failure, or closure into an ordinary tagged value. |
| `succeeded(value)` / `failed(value)` / `closed(value)` | Emit a boolean after the source terminates. |
| `onSuccess(value)` / `onFailure(value)` / `onClose(value)` | Emit the selected terminal value and close for the other outcomes. |

Use `scope` to make a section wait for readiness or successful completion that is not otherwise represented in an operation's inputs. A scope gives nested durable declarations their own hook namespace. Pass `{ name, presentation }` last when the section should also appear as a named composition in the execution UI. The callback still runs synchronously during composition.

Correlation key selectors are pure unary transforms, not pairwise predicates. Each selector runs once for its own arriving value; matching uses the encoded key index. A match is one-to-one and creates a child context whose merged parent history can resolve the original indexed streams. The returned `Signal<null>` represents completion of the correlation boundary.

Cross-context aggregators require an explicit partition choice. Use `keyBy()` for independent keyed coordination or `globally()` for one shared partition. Value-preserving routing and timing operators retain that choice.

Every provided `branch` callback is traversed immediately during synchronous composition so its action calls receive deterministic slots. Keep the callbacks pure apart from declaring actions. If both callbacks return signals, `branch` returns a deferred union signal containing the selected result. If either callback returns a signal, both must do so when a false callback is present; a one-sided signal branch closes when false.

## Effects and data flow

An action is the effect boundary:

- Define custom actions at module scope with the installed `defineAction` API.
- Give inputs and outputs explicit schemas.
- Keep account credentials and secrets in runtime-managed account bindings, never in signal values or source code.
- Feed action outputs into downstream work through returned signals.
- Expect a thrown action failure to be retried by the runtime; design external writes to be idempotent where repeated attempts could matter.

The runtime replays the bundle, materializes an action's dependencies and transforms, executes the matching action slot, and records its terminal outcome. Durable action identity includes the context, scope path, and slot; compatibility also depends on the action name, literal input shape, binding, and dependencies. Changing those details can make an in-flight execution incompatible with the new bundle.

## Review checklist

- The automation body finishes synchronously and only composes work.
- No signal is awaited, coerced to a boolean, or read as if its value already exists.
- Future-value conditions use `gate`, `filter`, `partition`, or `branch`, never ordinary JavaScript control flow.
- External effects occur only in actions.
- Transforms and branch callbacks are pure and deterministic.
- Action call order is stable across replays.
- Literal action inputs do not contain per-render time, randomness, or environment-dependent values.
- Installed SDK types and examples confirm every primitive used.
