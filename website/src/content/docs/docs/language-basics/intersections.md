---
id: intersections
title: Intersections
---

Intersections in programming define a type that must encompass all the constituents of the intersection. You can declare an intersection using the `&` operator.

```typespec
alias Dog = Animal & Pet;
```

An intersection is functionally equivalent to [spreading](./models.md#spread) both types.

```typespec
alias Dog = {
  ...Animal;
  ...Pet;
};
```
