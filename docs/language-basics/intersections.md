---
id: intersections
title: Intersections
---

# Intersections

Intersections describe a type that must include all the intersection's constituents. Declare an intersection with the `&` operator.

```cadl
alias Dog = Animal & Pet;
```

An intersection is equivalent to [spreading](./models.md#spread) both types.

```cadl
alias Dog = {
  ...Animal;
  ...Pet;
};
```
