---
changeKind: feature
packages:
  - "@typespec/http-server-csharp"
---

---
changeKind: feature
packages:
  - "@typespec/http-server-csharp"
---

This feature introduces changes to how error models (those using the `@error` decorator) are handled. Error models will now be represented as classes that extend exceptions, and when one of these custom-defined exceptions is thrown, it will produce HTTP errors as a result.

The handling of the returned status code will be resolved in the following ways:

#### If `@statusCode` is defined, the value of the `@statusCode` property will be returned
In this case, 404 will be returned:
```tsp
@error
model NotFoundError{
  @statusCode _: 404
}
```

### If `@statusCode` is not defined, the error `400` will be assigned by default
In this case, 400 will be returned:
```tsp
@error
model NotFoundError{
  statusCode: string;
}
```

### If `@min` and `@max` are defined instead of a specific value, the `@min` value will be returned
In this case, 500 will be returned:

```tsp
model Standard5XXResponse {
  @minValue(500)
  @maxValue(599)
  @statusCode
  statusCode: int32;
}
```

### If `@statusCode` is defined as a union, the first value will be returned
In this case, 402 will be returned:

```tsp
model Standard4XXResponse {
  @statusCode
  statusCode: 400 | 402;
}
```
