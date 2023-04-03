---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.Rest

### `@autoRoute` {#@TypeSpec.Rest.autoRoute}

This interface or operation should resolve its route automatically. To be used with resource types where the route segments area defined on the models.

```typespec
dec TypeSpec.Rest.autoRoute(target: TypeSpec.Reflection.Interface | TypeSpec.Reflection.Operation)
```

#### Target

`union TypeSpec.Reflection.Interface | TypeSpec.Reflection.Operation`

#### Parameters

None

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

| Name | Type                     | Description                                                                                    |
| ---- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| name | `scalar TypeSpec.string` | Segment that will be inserted into the operation route before the path parameter's name field. |

### `@segmentOf` {#@TypeSpec.Rest.segmentOf}

Returns the URL segment of a given model if it has `@segment` and `@key` decorator.

```typespec
dec TypeSpec.Rest.segmentOf(target: TypeSpec.Reflection.Operation, type: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name | Type                    | Description |
| ---- | ----------------------- | ----------- |
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

| Name           | Type                     | Description            |
| -------------- | ------------------------ | ---------------------- |
| collectionName | `scalar TypeSpec.string` | type's collection name |

### `@readsResource` {#@TypeSpec.Rest.readsResource}

Specify that this is a Read operation for a given resource.

```typespec
dec TypeSpec.Rest.readsResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                    | Description |
| ------------ | ----------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@createsResource` {#@TypeSpec.Rest.createsResource}

Specify that this is a Create operation for a given resource.

```typespec
dec TypeSpec.Rest.createsResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                    | Description |
| ------------ | ----------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@createsOrReplacesResource` {#@TypeSpec.Rest.createsOrReplacesResource}

Specify that this is a CreateOrReplace operation for a given resource.

```typespec
dec TypeSpec.Rest.createsOrReplacesResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                    | Description |
| ------------ | ----------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@createsOrUpdatesResource` {#@TypeSpec.Rest.createsOrUpdatesResource}

Specify that this is a CreatesOrUpdate operation for a given resource.

```typespec
dec TypeSpec.Rest.createsOrUpdatesResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                    | Description |
| ------------ | ----------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@updatesResource` {#@TypeSpec.Rest.updatesResource}

Specify that this is a Update operation for a given resource.

```typespec
dec TypeSpec.Rest.updatesResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                    | Description |
| ------------ | ----------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@deletesResource` {#@TypeSpec.Rest.deletesResource}

Specify that this is a Delete operation for a given resource.

```typespec
dec TypeSpec.Rest.deletesResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                    | Description |
| ------------ | ----------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@listsResource` {#@TypeSpec.Rest.listsResource}

Specify that this is a List operation for a given resource.

```typespec
dec TypeSpec.Rest.listsResource(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                    | Description |
| ------------ | ----------------------- | ----------- |
| resourceType | `model TypeSpec.object` |             |

### `@action` {#@TypeSpec.Rest.action}

Specify this operation is an action. (Scopped to a resource item /pets/{petId}/my-action)

```typespec
dec TypeSpec.Rest.action(target: TypeSpec.Reflection.Operation, name?: TypeSpec.string)
```

#### Target

`Operation`

#### Parameters

| Name | Type                     | Description |
| ---- | ------------------------ | ----------- |
| name | `scalar TypeSpec.string` |             |

### `@collectionAction` {#@TypeSpec.Rest.collectionAction}

Specify this operation is a collection action. (Scopped to a resource, /pets/my-action)

```typespec
dec TypeSpec.Rest.collectionAction(target: TypeSpec.Reflection.Operation, resourceType: TypeSpec.object, name?: TypeSpec.string)
```

#### Target

`Operation`

#### Parameters

| Name         | Type                     | Description |
| ------------ | ------------------------ | ----------- |
| resourceType | `model TypeSpec.object`  |             |
| name         | `scalar TypeSpec.string` |             |
