---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## Cadl.Http

### `@statusCode` {#@Cadl.Http.statusCode}

```cadl
dec Cadl.Http.statusCode(target: Cadl.Reflection.ModelProperty)
```

#### Target

`ModelProperty`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
op read(): {@statusCode: 200, @body pet: Pet}
op create(): {@statusCode: 201 | 202}
```

### `@body` {#@Cadl.Http.body}

```cadl
dec Cadl.Http.body(target: Cadl.Reflection.ModelProperty)
```

#### Target

`ModelProperty`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
op upload(@body image: bytes): void;
op download(): {@body image: bytes};
```

### `@header` {#@Cadl.Http.header}

```cadl
dec Cadl.Http.header(target: Cadl.Reflection.ModelProperty, headerName?: Cadl.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name       | Type                 | Description                                      |
| ---------- | -------------------- | ------------------------------------------------ |
| headerName | `scalar Cadl.string` | Optional name of the header when sent over http. |

### `@query` {#@Cadl.Http.query}

```cadl
dec Cadl.Http.query(target: Cadl.Reflection.ModelProperty, queryKey?: Cadl.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name     | Type                 | Description                                          |
| -------- | -------------------- | ---------------------------------------------------- |
| queryKey | `scalar Cadl.string` | Optional name of the query when included in the url. |

### `@path` {#@Cadl.Http.path}

```cadl
dec Cadl.Http.path(target: Cadl.Reflection.ModelProperty, paramName?: Cadl.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name      | Type                 | Description                                         |
| --------- | -------------------- | --------------------------------------------------- |
| paramName | `scalar Cadl.string` | Optional name of the parmaeter in the url template. |

### `@get` {#@Cadl.Http.get}

```cadl
dec Cadl.Http.get(target: Cadl.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@get op read(): string
```

### `@put` {#@Cadl.Http.put}

```cadl
dec Cadl.Http.put(target: Cadl.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@put op set(pet: Pet): void
```

### `@post` {#@Cadl.Http.post}

```cadl
dec Cadl.Http.post(target: Cadl.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@post op create(pet: Pet): void
```

### `@patch` {#@Cadl.Http.patch}

```cadl
dec Cadl.Http.patch(target: Cadl.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@patch op update(pet: Pet): void
```

### `@delete` {#@Cadl.Http.delete}

```cadl
dec Cadl.Http.delete(target: Cadl.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@delete op set(petId: string): void
```

### `@head` {#@Cadl.Http.head}

```cadl
dec Cadl.Http.head(target: Cadl.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@head op ping(petId: string): void
```

### `@server` {#@Cadl.Http.server}

```cadl
dec Cadl.Http.server(target: Cadl.Reflection.Namespace, url: Cadl.string, description: Cadl.string, parameters?: Cadl.object)
```

#### Target

`Namespace`

#### Parameters

| Name        | Type                 | Description                                             |
| ----------- | -------------------- | ------------------------------------------------------- |
| url         | `scalar Cadl.string` | Description of the endpoint                             |
| description | `scalar Cadl.string` |                                                         |
| parameters  | `model Cadl.object`  | Optional set of parameters used to interpolate the url. |

### `@useAuth` {#@Cadl.Http.useAuth}

```cadl
dec Cadl.Http.useAuth(target: Cadl.Reflection.Namespace, auth: Cadl.object | Cadl.Reflection.Union | Cadl.object[])
```

#### Target

`Namespace`

#### Parameters

| Name | Type               | Description           |
| ---- | ------------------ | --------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth | `union Cadl.object | Cadl.Reflection.Union | Cadl.object[]` | Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple(Must use all authentication together) |

### `@includeInapplicableMetadataInPayload` {#@Cadl.Http.includeInapplicableMetadataInPayload}

```cadl
dec Cadl.Http.includeInapplicableMetadataInPayload(target: unknown, value: Cadl.boolean)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type                  | Description |
| ----- | --------------------- | ----------- |
| value | `scalar Cadl.boolean` |             |

## Cadl.Rest

### `@autoRoute` {#@Cadl.Rest.autoRoute}

```cadl
dec Cadl.Rest.autoRoute(target: Cadl.Reflection.Namespace | Cadl.Reflection.Interface | Cadl.Reflection.Operation)
```

#### Target

`union Cadl.Reflection.Namespace | Cadl.Reflection.Interface | Cadl.Reflection.Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@autoRoute
interface Pets {
get(@segment("pets") @path id: string): void; //-> route: /pets/{id}
}
```

### `@segment` {#@Cadl.Rest.segment}

```cadl
dec Cadl.Rest.segment(target: Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation, name: Cadl.string)
```

#### Target

`union Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation`

#### Parameters

| Name | Type                 | Description                                                                                    |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------- |
| name | `scalar Cadl.string` | Segment that will be inserted into the operation route before the path parameter's name field. |

### `@segmentOf` {#@Cadl.Rest.segmentOf}

```cadl
dec Cadl.Rest.segmentOf(target: Cadl.Reflection.Operation, type: Cadl.object)
```

#### Target

`Operation`

#### Parameters

| Name | Type                | Description |
| ---- | ------------------- | ----------- |
| type | `model Cadl.object` |             |

### `@actionSeparator` {#@Cadl.Rest.actionSeparator}

```cadl
dec Cadl.Rest.actionSeparator(target: Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation, seperator: / | : | /:)
```

#### Target

`union Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation`

#### Parameters

| Name      | Type     | Description |
| --------- | -------- | ----------- | --- | ---------------------------------------------------------------- |
| seperator | `union / | :           | /:` | Seperator seperating the action segment from the rest of the url |

### `@segmentSeparator` {#@Cadl.Rest.segmentSeparator}

```cadl
dec Cadl.Rest.segmentSeparator(target: Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation, seperator: Cadl.string)
```

#### Target

`union Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation`

#### Parameters

| Name      | Type                 | Description |
| --------- | -------------------- | ----------- |
| seperator | `scalar Cadl.string` |             |

### `@resource` {#@Cadl.Rest.resource}

```cadl
dec Cadl.Rest.resource(target: Cadl.object, collectionName: Cadl.string)
```

#### Target

`model Cadl.object`

#### Parameters

| Name           | Type                 | Description            |
| -------------- | -------------------- | ---------------------- |
| collectionName | `scalar Cadl.string` | type's collection name |

### `@readsResource` {#@Cadl.Rest.readsResource}

```cadl
dec Cadl.Rest.readsResource(target: Cadl.Reflection.Operation, resourceType: Cadl.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model Cadl.object` |             |

### `@createsResource` {#@Cadl.Rest.createsResource}

```cadl
dec Cadl.Rest.createsResource(target: Cadl.Reflection.Operation, resourceType: Cadl.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model Cadl.object` |             |

### `@createsOrReplacesResource` {#@Cadl.Rest.createsOrReplacesResource}

```cadl
dec Cadl.Rest.createsOrReplacesResource(target: Cadl.Reflection.Operation, resourceType: Cadl.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model Cadl.object` |             |

### `@createsOrUpdatesResource` {#@Cadl.Rest.createsOrUpdatesResource}

```cadl
dec Cadl.Rest.createsOrUpdatesResource(target: Cadl.Reflection.Operation, resourceType: Cadl.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model Cadl.object` |             |

### `@updatesResource` {#@Cadl.Rest.updatesResource}

```cadl
dec Cadl.Rest.updatesResource(target: Cadl.Reflection.Operation, resourceType: Cadl.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model Cadl.object` |             |

### `@deletesResource` {#@Cadl.Rest.deletesResource}

```cadl
dec Cadl.Rest.deletesResource(target: Cadl.Reflection.Operation, resourceType: Cadl.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model Cadl.object` |             |

### `@listsResource` {#@Cadl.Rest.listsResource}

```cadl
dec Cadl.Rest.listsResource(target: Cadl.Reflection.Operation, resourceType: Cadl.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model Cadl.object` |             |

### `@action` {#@Cadl.Rest.action}

```cadl
dec Cadl.Rest.action(target: Cadl.Reflection.Operation, name?: Cadl.string)
```

#### Target

`Operation`

#### Parameters

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| name | `scalar Cadl.string` |             |

### `@collectionAction` {#@Cadl.Rest.collectionAction}

```cadl
dec Cadl.Rest.collectionAction(target: Cadl.Reflection.Operation, resourceType: Cadl.object, name?: Cadl.string)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                 | Description |
| ------------ | -------------------- | ----------- |
| resourceType | `model Cadl.object`  |             |
| name         | `scalar Cadl.string` |             |
