---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## Rest

### `@autoRoute` {#@Rest.autoRoute}

This interface or operation should resolve its route automatically. To be used with resource types where the route segments area defined on the models.

```typespec
dec Rest.autoRoute(target: Interface | Operation)
```

#### Target

`union Interface | Operation`

#### Parameters

None

#### Examples

```typespec
@autoRoute
interface Pets {
get(@segment("pets") @path id: string): void; //-> route: /pets/{id}
}
```

### `@segment` {#@Rest.segment}

Defines the preceding path segment for a

```typespec
dec Rest.segment(target: object | ModelProperty | Operation, name: string)
```

#### Target

`union object | ModelProperty | Operation`

#### Parameters

| Name | Type            | Description                                                                                    |
| ---- | --------------- | ---------------------------------------------------------------------------------------------- |
| name | `scalar string` | Segment that will be inserted into the operation route before the path parameter's name field. |

### `@segmentOf` {#@Rest.segmentOf}

Returns the URL segment of a given model if it has `@segment` and `@key` decorator.

```typespec
dec Rest.segmentOf(target: Operation, type: object)
```

#### Target

`Operation`

#### Parameters

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| type | `model object` |             |

### `@actionSeparator` {#@Rest.actionSeparator}

Defines the separator string that is inserted before the action name in auto-generated routes for actions.

```typespec
dec Rest.actionSeparator(target: object | ModelProperty | Operation, seperator: / | : | /:)
```

#### Target

`union object | ModelProperty | Operation`

#### Parameters

| Name      | Type                 | Description                                                      |
| --------- | -------------------- | ---------------------------------------------------------------- |
| seperator | `union / \| : \| /:` | Seperator seperating the action segment from the rest of the url |

### `@resource` {#@Rest.resource}

Mark this model as a resource type with a name.

```typespec
dec Rest.resource(target: object, collectionName: string)
```

#### Target

`model object`

#### Parameters

| Name           | Type            | Description            |
| -------------- | --------------- | ---------------------- |
| collectionName | `scalar string` | type's collection name |

### `@readsResource` {#@Rest.readsResource}

Specify that this is a Read operation for a given resource.

```typespec
dec Rest.readsResource(target: Operation, resourceType: object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type           | Description |
| ------------ | -------------- | ----------- |
| resourceType | `model object` |             |

### `@createsResource` {#@Rest.createsResource}

Specify that this is a Create operation for a given resource.

```typespec
dec Rest.createsResource(target: Operation, resourceType: object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type           | Description |
| ------------ | -------------- | ----------- |
| resourceType | `model object` |             |

### `@createsOrReplacesResource` {#@Rest.createsOrReplacesResource}

Specify that this is a CreateOrReplace operation for a given resource.

```typespec
dec Rest.createsOrReplacesResource(target: Operation, resourceType: object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type           | Description |
| ------------ | -------------- | ----------- |
| resourceType | `model object` |             |

### `@createsOrUpdatesResource` {#@Rest.createsOrUpdatesResource}

Specify that this is a CreatesOrUpdate operation for a given resource.

```typespec
dec Rest.createsOrUpdatesResource(target: Operation, resourceType: object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type           | Description |
| ------------ | -------------- | ----------- |
| resourceType | `model object` |             |

### `@updatesResource` {#@Rest.updatesResource}

Specify that this is a Update operation for a given resource.

```typespec
dec Rest.updatesResource(target: Operation, resourceType: object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type           | Description |
| ------------ | -------------- | ----------- |
| resourceType | `model object` |             |

### `@deletesResource` {#@Rest.deletesResource}

Specify that this is a Delete operation for a given resource.

```typespec
dec Rest.deletesResource(target: Operation, resourceType: object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type           | Description |
| ------------ | -------------- | ----------- |
| resourceType | `model object` |             |

### `@listsResource` {#@Rest.listsResource}

Specify that this is a List operation for a given resource.

```typespec
dec Rest.listsResource(target: Operation, resourceType: object)
```

#### Target

`Operation`

#### Parameters

| Name         | Type           | Description |
| ------------ | -------------- | ----------- |
| resourceType | `model object` |             |

### `@action` {#@Rest.action}

Specify this operation is an action. (Scopped to a resource item /pets/{petId}/my-action)

```typespec
dec Rest.action(target: Operation, name?: string)
```

#### Target

`Operation`

#### Parameters

| Name | Type            | Description |
| ---- | --------------- | ----------- |
| name | `scalar string` |             |

### `@collectionAction` {#@Rest.collectionAction}

Specify this operation is a collection action. (Scopped to a resource, /pets/my-action)

```typespec
dec Rest.collectionAction(target: Operation, resourceType: object, name?: string)
```

#### Target

`Operation`

#### Parameters

| Name         | Type            | Description |
| ------------ | --------------- | ----------- |
| resourceType | `model object`  |             |
| name         | `scalar string` |             |
