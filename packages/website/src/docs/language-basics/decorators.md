---
id: decorators
title: Decorators
---

# Decorators

Decorators enable a developer to attach metadata to types in a Cadl program. They can also be used to calculate types based on their inputs. Decorators are the backbone of Cadl's extensibility and give it the flexibility to describe many different kinds of APIs and associated metadata like documentation, constraints, samples, and the like.

Many Cadl constructs can be decorated, including [namespaces]({%doc "namespaces"%}), [operations]({%doc "operations"%}) and their parameters, and [models]({%doc "models"%}) and their members.

Decorators are defined using JavaScript functions that are exported from a standard ECMAScript module. When you import a JavaScript file, Cadl will look for any exported functions, and make them available as decorators inside the Cadl syntax. When a decorated declaration is evaluated by Cadl, it will invoke the decorator function, passing along a reference to the current compilation, an object representing the type it is attached to, and any arguments the user provided to the decorator.

Decorators are attached by adding the decorator before the element you want to decorate, prefixing the name of the decorator with `@`. Arguments can be provided by using parentheses in a manner similar to many programming languages, e.g. `@dec(1, "hi", { a: string })`. The parentheses can be omitted when no arguments are provided.

The following shows an example of declaring and then using a decorator:

```js
// model.js
export function logType(compilation, targetType, name) {
  console.log(name + ": " + targetType.kind);
}
```

```cadl
// main.cadl
import "./model.js";

@logType("Dog type")
model Dog {
  @logType("Name type")
  name: string;
}
```

After running this Cadl program, the following will be printed to the console:

```
Name type: ModelProperty
Dog type: Model
```
