Enforces calling other TypeSpec decorator using `context.call` instead of calling the decorator function directly.

Calling the decorator function directly can result in diagnostics with incorrect location.

## Rule Details

## How to Use

```jsonc
{
  "@typespec/call-decorator": "warn",
}
```

<!--tabs-->

#### ❌ Incorrect

```ts
function $foo(context: DecoratorContext, target: Type) {}

function $bar(context: DecoratorContext, target: Type) {
  $foo(context, target);
}
```

```ts
function $foo(context: DecoratorContext, target: Type, name: string) {}

function $bar(context: DecoratorContext, target: Type, name: string) {
  $foo(context, target, `bar.${name}`);
}
```

#### ✅ Correct

```ts
function $foo(context: DecoratorContext, target: Type) {}

function $bar(context: DecoratorContext, target: Type) {
  context.call($foo, target);
}
```

```ts
function $foo(context: DecoratorContext, target: Type, name: string) {}

function $bar(context: DecoratorContext, target: Type, name: string) {
  context.call($foo, target, `bar.${name}`);
}
```

## Attributes

- [x] ✅ Recommended
- [x] 🔧 Fixable
- [x] 💭 Requires type information
