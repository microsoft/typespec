---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Improve the name reported for an operation's parameters model expression. Diagnostics now refer to `MyService.test::parameters.param` instead of `MyService.{ param: MyService.Foo }.param`.
