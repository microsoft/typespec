---
id: type-literals
title: Type literals
---

# Type literals

API authors often need to describe API shapes in terms of specific literal values. For example, this operation returns this specific integer status code, or this model member can be one of a few specific string values. It is also often useful to pass specific literal values to decorators. Cadl supports string, number, and boolean literal values to support these cases.

## String literals

String literals can be represented using double quotes `"`

```cadl
alias Str = "Hello World!";
```

## Multi line string literals

A multi string literal is represented using a set of 3 double quotes `"""`.

```cadl
alias Str = """
This is a multi line string
 - opt 1
 - opt 2
""";
```

- Opening `"""` must be followed by a new line.
- Closing `"""` must be preceded by a new line.

## Numeric literal

Numeric literals can be declare by using the raw number (`interger` or `float`)

```cadl
alias Kilo = 1000;
alias PI = 3.14;
```

## Boolean literal

Boolean literals can be declare by using `true` or `false` keywords

```cadl
alias InCadl = true;
alias Cheater = false;
```
