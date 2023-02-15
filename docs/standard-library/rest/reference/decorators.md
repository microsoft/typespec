---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.Http

### `@statusCode` {#@TypeSpec.Http.statusCode}

Specify the status code for this response. Property type must be a status code integer or a union of status code integer.

```typespec
dec TypeSpec.Http.statusCode(target: TypeSpec.Reflection.ModelProperty)
```

#### Target

`ModelProperty`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
op read(): {@statusCode: 200, @body pet: Pet}
op create(): {@statusCode: 201 | 202}
```

### `@body` {#@TypeSpec.Http.body}

Explicitly specify that this property is to be set as the body

```typespec
dec TypeSpec.Http.body(target: TypeSpec.Reflection.ModelProperty)
```

#### Target

`ModelProperty`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
op upload(@body image: bytes): void;
op download(): {@body image: bytes};
```

### `@header` {#@TypeSpec.Http.header}

Specify this property is to be sent or received as an http header.

```typespec
dec TypeSpec.Http.header(target: TypeSpec.Reflection.ModelProperty, headerNameOrOptions?: TypeSpec.string | TypeSpec.Http.HeaderOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name                | Type                                           | Description                                                        |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| headerNameOrOptions | `union TypeSpec.string \| TypeSpec.Http.HeaderOptions` | Optional name of the header when sent over http or header options. |

### `@query` {#@TypeSpec.Http.query}

Specify this property is to be sent as a query parameter.

```typespec
dec TypeSpec.Http.query(target: TypeSpec.Reflection.ModelProperty, queryNameOrOptions?: TypeSpec.string | TypeSpec.Http.QueryOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name               | Type                                          | Description                                                                     |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------- |
| queryNameOrOptions | `union TypeSpec.string \| TypeSpec.Http.QueryOptions` | Optional name of the query when included in the url or query parameter options. |

### `@path` {#@TypeSpec.Http.path}

Explicitly specify that this property is to be interpolated as a path parameter.

```typespec
dec TypeSpec.Http.path(target: TypeSpec.Reflection.ModelProperty, paramName?: TypeSpec.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name      | Type                 | Description                                         |
| --------- | -------------------- | --------------------------------------------------- |
| paramName | `scalar TypeSpec.string` | Optional name of the parameter in the url template. |

### `@get` {#@TypeSpec.Http.get}

Specify the http verb for the target operation to be `GET`.

```typespec
dec TypeSpec.Http.get(target: TypeSpec.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
@get op read(): string
```

### `@put` {#@TypeSpec.Http.put}

Specify the http verb for the target operation to be `PUT`.

```typespec
dec TypeSpec.Http.put(target: TypeSpec.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
@put op set(pet: Pet): void
```

### `@post` {#@TypeSpec.Http.post}

Specify the http verb for the target operation to be `POST`.

```typespec
dec TypeSpec.Http.post(target: TypeSpec.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
@post op create(pet: Pet): void
```

### `@patch` {#@TypeSpec.Http.patch}

Specify the http verb for the target operation to be `PATCH`.

```typespec
dec TypeSpec.Http.patch(target: TypeSpec.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
@patch op update(pet: Pet): void
```

### `@delete` {#@TypeSpec.Http.delete}

Specify the http verb for the target operation to be `DELETE`.

```typespec
dec TypeSpec.Http.delete(target: TypeSpec.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
@delete op set(petId: string): void
```

### `@head` {#@TypeSpec.Http.head}

Specify the http verb for the target operation to be `HEAD`.

```typespec
dec TypeSpec.Http.head(target: TypeSpec.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
@head op ping(petId: string): void
```

### `@server` {#@TypeSpec.Http.server}

Specify the endpoint for this service.

```typespec
dec TypeSpec.Http.server(target: TypeSpec.Reflection.Namespace, url: TypeSpec.string, description: TypeSpec.string, parameters?: TypeSpec.object)
```

#### Target

`Namespace`

#### Parameters

| Name        | Type                 | Description                                             |
| ----------- | -------------------- | ------------------------------------------------------- |
| url         | `scalar TypeSpec.string` | Description of the endpoint                             |
| description | `scalar TypeSpec.string` |                                                         |
| parameters  | `model TypeSpec.object`  | Optional set of parameters used to interpolate the url. |

### `@useAuth` {#@TypeSpec.Http.useAuth}

Specify this service authentication. See the [documentation in the Http library][https://microsoft.github.io/typespec/standard-library/rest/authentication] for full details.

```typespec
dec TypeSpec.Http.useAuth(target: TypeSpec.Reflection.Namespace, auth: TypeSpec.object | TypeSpec.Reflection.Union | TypeSpec.object[])
```

#### Target

`Namespace`

#### Parameters

| Name | Type                                                          | Description                                                                                                                                                    |
| ---- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth | `union TypeSpec.object \| TypeSpec.Reflection.Union \| TypeSpec.object[]` | Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple(Must use all authentication together) |

### `@includeInapplicableMetadataInPayload` {#@TypeSpec.Http.includeInapplicableMetadataInPayload}

Specify if inapplicable metadata should be included in the payload for the given entity.

```typespec
dec TypeSpec.Http.includeInapplicableMetadataInPayload(target: unknown, value: TypeSpec.boolean)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type                  | Description |
| ----- | --------------------- | ----------- |
| value | `scalar TypeSpec.boolean` |             |

## TypeSpec.Rest

### `@autoRoute` {#@TypeSpec.Rest.autoRoute}

This namespace, interface or operation should resolve its route automatically. To be used with resource types where the route segments area defined on the models.

```typespec
dec TypeSpec.Rest.autoRoute(target: TypeSpec.Reflection.Namespace | TypeSpec.Reflection.Interface | TypeSpec.Reflection.Operation)
```

#### Target

`union TypeSpec.Reflection.Namespace | TypeSpec.Reflection.Interface | TypeSpec.Reflection.Operation`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
@autoRoute
interface Pets {
get(@segment("pets") @path id: string): void; //-> route: /pets/{id}
}
```

### `@segment` {#@TypeSpec.Rest.segment}

Defines the preceding path segment for a

```typespec
dec TypeSpec.Rest.segment(target: TypeSpec.object | TypeSpec.Reflection.ModelProperty | TypeSpec.Reflection.Operation, name: TypeSpec.string)
```

#### Target

`union TypeSpec.object | TypeSpec.Reflection.ModelProperty | TypeSpec.Reflection.Operation`

#### Parameters

| Name | Type                 | Description                                                                                    |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------- |
| name | `scalar TypeSpec.string` | Segment that will be inserted into the operation route before the path parameter's name field. |

### `@segmentOf` {#@TypeSpec.Rest.segmentOf}

Returns the URL segment of a given model if it has `@segment` and `@key` decorator.

```typespec
dec TypeSpec.Rest.segmentOf(target: TypeSpec.Reflection.Operation, type: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name | Type                | Description |
| ---- | ------------------- | ----------- |
| type | `model TypeSpec.object` |             |

### `@actionSeparator` {#@TypeSpec.Rest.actionSeparator}

Defines the separator string that is inserted before the action name in auto-generated routes for actions.

```typespec
dec TypeSpec.Rest.actionSeparator(target: TypeSpec.object | TypeSpec.Reflection.ModelProperty | TypeSpec.Reflection.Operation, seperator: / | : | /:)
```

#### Target

`union TypeSpec.object | TypeSpec.Reflection.ModelProperty | TypeSpec.Reflection.Operation`

#### Parameters

| Name      | Type                 | Description                                                      |
| --------- | -------------------- | ---------------------------------------------------------------- |
| seperator | `union / \| : \| /:` | Seperator seperating the action segment from the rest of the url |

### `@resource` {#@TypeSpec.Rest.resource}

Mark this model as a resource type with a name.

```typespec
dec TypeSpec.Rest.resource(target: TypeSpec.object, collectionName: TypeSpec.string)
```

#### Target

`model TypeSpec.object`

#### Parameters

| Name           | Type                 | Description            |
| -------------- | -------------------- | ---------------------- |
| collectionName | `scalar TypeSpec.string` | type's collection name |

### `@readsResource` {#@TypeSpec.Rest.readsResource}

Specify that this is a Read operation for a given resource.

```typespec
dec TypeSpec.Rest.readsResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@createsResource` {#@TypeSpec.Rest.createsResource}

Specify that this is a Create operation for a given resource.

```typespec
dec TypeSpec.Rest.createsResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@createsOrReplacesResource` {#@TypeSpec.Rest.createsOrReplacesResource}

Specify that this is a CreateOrReplace operation for a given resource.

```typespec
dec TypeSpec.Rest.createsOrReplacesResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@createsOrUpdatesResource` {#@TypeSpec.Rest.createsOrUpdatesResource}

Specify that this is a CreatesOrUpdate operation for a given resource.

```typespec
dec TypeSpec.Rest.createsOrUpdatesResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@updatesResource` {#@TypeSpec.Rest.updatesResource}

Specify that this is a Update operation for a given resource.

```typespec
dec TypeSpec.Rest.updatesResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@deletesResource` {#@TypeSpec.Rest.deletesResource}

Specify that this is a Delete operation for a given resource.

```typespec
dec TypeSpec.Rest.deletesResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@listsResource` {#@TypeSpec.Rest.listsResource}

Specify that this is a List operation for a given resource.

```typespec
dec TypeSpec.Rest.listsResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@action` {#@TypeSpec.Rest.action}

Specify this operation is an action. (Scopped to a resource item /pets/{petId}/my-action)

```typespec
dec TypeSpec.Rest.action(target: TypeSpec.Reflection.Operation, name?: TypeSpec.string)
```

#### Target

`Operation`

#### Parameters

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| name | `scalar TypeSpec.string` |             |

### `@collectionAction` {#@TypeSpec.Rest.collectionAction}

Specify this operation is a collection action. (Scopped to a resource, /pets/my-action)

```typespec
dec TypeSpec.Rest.collectionAction(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object, name?: TypeSpec.string)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                 | Description |
| ------------ | -------------------- | ----------- |
| resourceType | `model TypeSpec.object`  |             |
| name         | `scalar TypeSpec.string` |             |
