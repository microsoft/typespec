---
id: type-literals
title: Type Literals
---

When designing APIs, it's common to define the structure of the API in terms of specific literal values. For instance, an operation might return a specific integer status code, or a model member might be one of a few specific string values. It's also useful to pass specific literal values to decorators. TypeSpec supports string, number, and boolean literal values to cater to these needs.

## String literals

String literals are represented using double quotes `"`.

```typespec
alias Str = "Hello World!";
```

## Multi-line string literals

Multi-line string literals are denoted using three double quotes `"""`.

```typespec
alias Str = """
  This is a multi line string
   - opt 1
   - opt 2
  """;
```

- The opening `"""` must be followed by a new line.
- The closing `"""` must be preceded by a new line.

### Trimming indentation in multi-line strings

Multi-line strings automatically trim leading whitespaces on each line to align with the closing `"""`. This feature is handy for maintaining the indentation of multi-line strings within the code without worrying about undesired indentation.

All the following options will yield the same string value `"one\ntwo"`.

```typespec
model MultiLineContainer {
  prop1: """
one
two
""")

  // Lines are indented at the same level as closing """"
  prop2: """
  one
  two
  """

  prop3: """
      one
      two
      """

  // lines are less indented as the closing """"
  prop4: """
    one
    two
      """
}
```

## String template literal

Both single and multi-line string literals can be interpolated using `${}`.

```typespec
alias hello = "bonjour";
alias Single = "${hello} world!";

alias Multi = """
  ${hello} 
  world!
  """;
```

Any valid expression can be used in the interpolation, but only other literals will result in the template literal being assignable to a `valueof string`. Any other value will depend on the decorator/emitter receiving it for handling.

## Numeric literal

Numeric literals are declared by using the raw number.

```typespec
alias Kilo = 1000;
alias PI = 3.14;
```

## Boolean literal

Boolean literals are declared by using the `true` or `false` keywords.

```typespec
alias InTypeSpec = true;
alias Cheater = false;
```
