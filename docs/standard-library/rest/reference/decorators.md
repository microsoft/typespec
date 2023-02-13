---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## Cadl.Http

### `@statusCode` {#@Cadl.Http.statusCode}

Specify the status code for this response. Property type must be a status code integer or a union of status code integer.

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

Explicitly specify that this property is to be set as the body

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

Specify this property is to be sent or received as an http header.

```cadl
dec Cadl.Http.header(target: Cadl.Reflection.ModelProperty, headerNameOrOptions?: Cadl.string | Cadl.Http.HeaderOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name                | Type                                           | Description                                                        |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| headerNameOrOptions | `union Cadl.string \| Cadl.Http.HeaderOptions` | Optional name of the header when sent over http or header options. |

### `@query` {#@Cadl.Http.query}

Specify this property is to be sent as a query parameter.

```cadl
dec Cadl.Http.query(target: Cadl.Reflection.ModelProperty, queryNameOrOptions?: Cadl.string | Cadl.Http.QueryOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name               | Type                                          | Description                                                                     |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------------- |
| queryNameOrOptions | `union Cadl.string \| Cadl.Http.QueryOptions` | Optional name of the query when included in the url or query parameter options. |

### `@path` {#@Cadl.Http.path}

Explicitly specify that this property is to be interpolated as a path parameter.

```cadl
dec Cadl.Http.path(target: Cadl.Reflection.ModelProperty, paramName?: Cadl.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name      | Type                 | Description                                         |
| --------- | -------------------- | --------------------------------------------------- |
| paramName | `scalar Cadl.string` | Optional name of the parameter in the url template. |

### `@get` {#@Cadl.Http.get}

Specify the http verb for the target operation to be `GET`.

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

Specify the http verb for the target operation to be `PUT`.

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

Specify the http verb for the target operation to be `POST`.

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

Specify the http verb for the target operation to be `PATCH`.

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

Specify the http verb for the target operation to be `DELETE`.

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

Specify the http verb for the target operation to be `HEAD`.

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

Specify the endpoint for this service.

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

Specify this service authentication. See the [documentation in the Http library][https://microsoft.github.io/cadl/standard-library/rest/authentication] for full details.

```cadl
dec Cadl.Http.useAuth(target: Cadl.Reflection.Namespace, auth: Cadl.object | Cadl.Reflection.Union | Cadl.object[])
```

#### Target

`Namespace`

#### Parameters

| Name | Type                                                          | Description                                                                                                                                                    |
| ---- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth | `union Cadl.object \| Cadl.Reflection.Union \| Cadl.object[]` | Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple(Must use all authentication together) |

### `@includeInapplicableMetadataInPayload` {#@Cadl.Http.includeInapplicableMetadataInPayload}

Specify if inapplicable metadata should be included in the payload for the given entity.

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

This namespace, interface or operation should resolve its route automatically. To be used with resource types where the route segments area defined on the models.

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

Defines the preceding path segment for a

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

Returns the URL segment of a given model if it has `@segment` and `@key` decorator.

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

Defines the separator string that is inserted before the action name in auto-generated routes for actions.

```cadl
dec Cadl.Rest.actionSeparator(target: Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation, seperator: / | : | /:)
```

#### Target

`union Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation`

#### Parameters

| Name      | Type                 | Description                                                      |
| --------- | -------------------- | ---------------------------------------------------------------- |
| seperator | `union / \| : \| /:` | Seperator seperating the action segment from the rest of the url |

### `@resource` {#@Cadl.Rest.resource}

Mark this model as a resource type with a name.

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

Specify that this is a Read operation for a given resource.

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

Specify that this is a Create operation for a given resource.

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

Specify that this is a CreateOrReplace operation for a given resource.

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

Specify that this is a CreatesOrUpdate operation for a given resource.

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

Specify that this is a Update operation for a given resource.

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

Specify that this is a Delete operation for a given resource.

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

Specify that this is a List operation for a given resource.

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

Specify this operation is an action. (Scopped to a resource item /pets/{petId}/my-action)

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

Specify this operation is a collection action. (Scopped to a resource, /pets/my-action)

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
