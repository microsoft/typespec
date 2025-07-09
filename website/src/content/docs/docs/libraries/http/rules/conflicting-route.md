---
title: "conflicting-route"
---

```text title="Id"
@typespec/http/conflicting-route
```

This rule detects when two or more operations with the same HTTP method have URI templates that could match the same request URL. Conflicts occur when:

1. **Parameter vs literal conflict**: A parameter segment could match a literal segment (e.g., `/{id}` vs `/fixed`)
2. **Different parameter names**: Two parameters with different names but the same path structure (e.g., `/{id}` vs `/{userId}`)

The rule only checks operations within the same HTTP method (GET, POST, etc.) since different methods can safely share the same path.

#### ❌ Incorrect

Parameter can match literal segment:

```tsp
@get @route("/users/{id}") op getUser(id: string): User;
@get @route("/users/count") op getUserCount(): number;
```

Multiple operations with identical routes:

```tsp
@get @route("/users/{userId}") op getUser(userId: string): User;
@get @route("/users/{id}") op getUserProfile(id: string): Profile;
```

#### ✅ Correct

Use different path structures to avoid conflicts:

```tsp
@get @route("/users/{id}") op getUser(id: string): User;
@get @route("/users/statistics/count") op getUserCount(): number;
```

Or use `@sharedRoute` decorator when operations should share the exact same route:

```tsp
@sharedRoute
@get
@route("/users/{id}")
op getUser(id: string): User;

@sharedRoute
@get
@route("/users/{id}")
op getUserProfile(id: string): Profile;
```
