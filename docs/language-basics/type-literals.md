---
id: type-literals
title: Type literals
---

# Type literals

API authors often need to describe API shapes in terms of specific literal values. For example, this operation returns this specific integer status code, or this model member can be one of a few specific string values. It is also often useful to pass specific literal values to decorators. TypeSpec supports string, number, and boolean literal values to support these cases.

## String literals

String literals can be represented using double quotes `"`

```typespec
alias Str = "Hello World!";
```

## Multi line string literals

A multi string literal is represented using a set of 3 double quotes `"""`.

```typespec
alias Str = """
This is a multi line string
 - opt 1
 - opt 2
""";
```

- Opening `"""` must be followed by a new line.
- Closing `"""` must be preceded by a new line.

### Multi line string indentation trimming

Multi lines automatically remove leading whitespaces of each line aligned with the closing `"""`. This is particularly useful to keep multi line string indented with the code and not have to worry about unwanted indentation.

All those options will produce the exact same string value `"one\ntwo"`

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

Single or multi line string literal can be interpolated using `${}`

```typespec
alias hello = "bonjour";
alias Single = "${hello} world!";

alias Multi = """
  ${hello} 
  world!
  """;
```

Any valid expression can be used in the interpolation but only other literals will result in the template literal being assignable to a `valueof string`. Any other value will be dependent on the decorator/emitter receiving it to handle.

## Numeric literal

Numeric literals can be declared by using the raw number

```typespec
alias Kilo = 1000;
alias PI = 3.14;
```

## Boolean literal

Boolean literals can be declare by using `true` or `false` keywords

```typespec
alias InTypeSpec = true;
alias Cheater = false;
```
