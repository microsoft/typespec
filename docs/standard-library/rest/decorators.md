---
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## Cadl.Http

### `@statusCode`

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

### `@body`

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

### `@header`

Specify this property is to be sent or received as an http header.

```cadl
dec Cadl.Http.header(target: Cadl.Reflection.ModelProperty, headerName?: Cadl.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name       | Type                 | Description                                      |
| ---------- | -------------------- | ------------------------------------------------ |
| headerName | `scalar Cadl.string` | Optional name of the header when sent over http. |

#### Examples

```cadl
op read(@header accept: string): {@header("E-Tag") eTag: string};
```

### `@query`

Specify this property is to be sent as a query parameter.

```cadl
dec Cadl.Http.query(target: Cadl.Reflection.ModelProperty, queryKey?: Cadl.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name     | Type                 | Description                                          |
| -------- | -------------------- | ---------------------------------------------------- |
| queryKey | `scalar Cadl.string` | Optional name of the query when included in the url. |

#### Examples

```cadl
op read(@query select: string, @query("order-by") orderBy: string): void;
```

### `@path`

Explicitly specify that this property is to be interpolated as a path parameter.

```cadl
dec Cadl.Http.path(target: Cadl.Reflection.ModelProperty, paramName?: Cadl.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name      | Type                 | Description                                         |
| --------- | -------------------- | --------------------------------------------------- |
| paramName | `scalar Cadl.string` | Optional name of the parmaeter in the url template. |

#### Examples

```cadl
@route("/read/{explicit}/things/{implicit}")
op read(@path explicit: string, implicit: string): void;
```

### `@get`

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

### `@put`

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

### `@post`

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

### `@patch`

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

### `@delete`

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

### `@head`

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

### `@server`

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

#### Examples

```cadl
@service
@server("https://example.com", "Single server endpoint")
namespace PetStore;
```

##### parameterized

```cadl
@server("https://{region}.foo.com", "Regional endpoint", {
@doc("Region name")
region?: string = "westus",
})
```

### `@useAuth`

Specify this service authentication. See the [documentation in the Http library][https://microsoft.github.io/cadl/standard-library/rest/authentication] for full details.

```cadl
dec Cadl.Http.useAuth(target: Cadl.Reflection.Namespace, auth: Cadl.object | Cadl.Reflection.Union | Cadl.object[])
```

#### Target

`Namespace`

#### Parameters

| Name | Type               | Description           |
| ---- | ------------------ | --------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth | `union Cadl.object | Cadl.Reflection.Union | Cadl.object[]` | Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple(Must use all authentication together) |

#### Examples

```cadl
@service
@useAuth(BasicAuth)
namespace PetStore;
```

### `@includeInapplicableMetadataInPayload`

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

### `@resourceLocation`

```cadl
dec Cadl.Rest.Private.resourceLocation(target: Cadl.string, resourceType: Cadl.object)
```

#### Target

`scalar Cadl.string`

#### Parameters

| Name         | Type                | Description |
| ------------ | ------------------- | ----------- |
| resourceType | `model Cadl.object` |             |

### `@autoRoute`

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

### `@segment`

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

#### Examples

### `@segmentOf`

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

### `@actionSeparator`

Defines the separator string that is inserted before the action name in auto-generated routes for actions.

```cadl
dec Cadl.Rest.actionSeparator(target: Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation, seperator: / | : | /:)
```

#### Target

`union Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation`

#### Parameters

| Name      | Type     | Description |
| --------- | -------- | ----------- | --- | ---------------------------------------------------------------- |
| seperator | `union / | :           | /:` | Seperator seperating the action segment from the rest of the url |

### `@segmentSeparator`

```cadl
dec Cadl.Rest.segmentSeparator(target: Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation, seperator: Cadl.string)
```

#### Target

`union Cadl.object | Cadl.Reflection.ModelProperty | Cadl.Reflection.Operation`

#### Parameters

| Name      | Type                 | Description |
| --------- | -------------------- | ----------- |
| seperator | `scalar Cadl.string` |             |

### `@resource`

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

### `@readsResource`

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

### `@createsResource`

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

### `@createsOrReplacesResource`

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

### `@createsOrUpdatesResource`

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

### `@updatesResource`

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

### `@deletesResource`

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

### `@listsResource`

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

### `@action`

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

### `@collectionAction`

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
