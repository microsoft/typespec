# TypeSpec REST Library

This package provides [TypeSpec](https://github.com/microsoft/TypeSpec) decorators, models, and interfaces to describe APIs using the [REST style](https://en.wikipedia.org/wiki/Representational_state_transfer). These building blocks make defining REST resources and operations based on standard patterns extremely simple.

## Install

In your TypeSpec project root

```bash
npm install @typespec/rest
```

## Usage

```TypeSpec
import "@typespec/rest";

using TypeSpec.Rest;
```

See [Http and rest](https://microsoft.github.io/typespec/docs/standard-library/rest/).

## Library Tour

`@typespec/rest` library defines of the following artifacts:

- [TypeSpec HTTP/Rest Library](#typespec-httprest-library)
  - [Install](#install)
  - [Usage](#usage)
  - [Library Tour](#library-tour)
  - [Models](#models)
  - [Decorators](#decorators)
  - [Interfaces](#interfaces)
  - [See also](#see-also)

## Models

| Model                                      | Notes                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| KeysOf&lt;T>                               | Dynamically gathers keys of the model type T.                                                               |
| Page&lt;T>                                 | A model defines page of T which includes an array of T and optional next link.                              |
| ParentKeysOf&lt;T>                         | Dynamically gathers parent keys of the model type T, which are referenced with `@parentResource` decorator. |
| ResourceError                              | The default error response for resource operations that includes <br> `code: int32` and `message string`.   |
| ResourceParameters&lt;TResource>           | Represents operation parameters for resource TResource. Default to KeysOf&lt;T>.                            |
| ResourceCollectionParameters&lt;TResource> | Represents collection operation parameters for resource TResource. Default to ParentKeysOf&lt;T>            |
| ResourceCreatedResponse&lt;T>              | Resource create operation completed successfully.                                                           |
| ResourceDeletedResponse                    | Resource deleted successfully.                                                                              |

## Decorators

The `@typespec/rest` library defines the following decorators in `TypeSpec.Rest` namespace:

| Declarator                | Scope                                                 | Syntax                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| @discriminator            | models                                                | Syntax:<br> `@discriminator(kindString)` <br><br>Note:<br> `@discriminator` allows defining polymorphic models to be used by API as parameters and return types. In many strongly typed languages, they are expressed as inheritance.                                                                                                                                                                                                                        |
| @resource                 | Model                                                 | Syntax:<br> `@resource(collectionName)` <br><br>Note:<br> This decorator is to used to mark a model as a resource type with a name for the type's collection.                                                                                                                                                                                                                                                                                                |
| @readsResource            | operations                                            | Syntax:<br> `@readsResource(modelType)` <br><br>Note:<br> This decorator is to used to signal the operation that is the Read operation for a particular resource.                                                                                                                                                                                                                                                                                            |
| @createsResource          | operations                                            | Syntax:<br> `@createsResource(modelType)` <br><br>Note:<br> This decorator is to used to signal the operation that is the Create operation for a particular resource.                                                                                                                                                                                                                                                                                        |
| @createsOrUpdatesResource | operations                                            | Syntax:<br> `@createsOrUpdatesResource(modelType)` <br><br>Note:<br> This decorator is to used to signal the operation that is the CreatesOrUpdate operation for a particular resource.                                                                                                                                                                                                                                                                      |
| @updatesResource          | operations                                            | Syntax:<br> `@updatesResource(modelType)` <br><br>Note:<br> This decorator is to used to signal the operation that is the Update operation for a particular resource.                                                                                                                                                                                                                                                                                        |
| @deletesResource          | operations                                            | Syntax:<br> `@deletesResource(modelType)` <br><br>Note:<br> This decorator is to used to signal the operation that is the Delete operation for a particular resource.                                                                                                                                                                                                                                                                                        |
| @listsResource            | operations                                            | Syntax:<br> `@listsResource(modelType)` <br><br>Note:<br> This decorator is to used to signal the operation that is the List operation for a particular resource.                                                                                                                                                                                                                                                                                            |
| @parentResource           | models                                                | Syntax:<br> `@parentResource(parentModelTypeReference)` <br><br>Note:<br> `@parentResource` marks a model property with a reference to its parent resource type. The first argument should be a reference to a model type which will be treated as the parent type of the target model type. This will cause the `@key` properties of all parent types of the target type to show up in operations of the `Resource*<T>` interfaces defined in this library. |
| @segment                  | model properties, operation parameters                | Syntax:<br> `@segment(segmentString)` <br><br>Note:<br>`@segment` defines the preceding path segment for a `@path` parameter in auto-generated routes. The first argument should be a string that will be inserted into the operation route before the path parameter's name field. For example: <br> `op getUser(@path @segment("users") userId: string): User` <br> will produce the route `/users/{userId}`.                                              |
| @segmentOf                | models                                                | Syntax:<br> `@segment(segmentString)` <br><br>Note:<br>`@segmentOf` returns the URL segment of a given model if it has `@segment` and `@key` decorator.                                                                                                                                                                                                                                                                                                      |
| @segmentSeparator         | model properties, operation parameters, or operations | Syntax:<br> `@segmentSeparator(separatorString)` <br><br>Note:<br> `@segmentSeparator` defines the separator string that is inserted between the target's `@segment` and the preceding route path in auto-generated routes. <br> The first argument should be a string that will be inserted into the operation route before the target's `@segment` value. Can be a string of any length. Defaults to `/`.                                                  |
| @actionSeparator          | model properties, operation parameters, or operations | Syntax:<br> `@actionSeparator(separatorString)` <br><br>Note:<br> `@actionSeparator` defines the separator string that is inserted before the action name in auto-generated routes for actions.                                                                                                                                                                                                                                                              |
| @autoRoute                | operations                                            | Syntax:<br> `@autoRoute()` <br><br>Note:<br>`@autoRoute` enables automatic route generation for an operation, namespace, or interface. <br> When applied to an operation, it automatically generates the operation's route based on path parameter metadata. When applied to a namespace or interface, it causes all operations under that scope to have auto-generated routes.                                                                              |

## Interfaces

These standard interfaces defines resource operations in basic building blocks that you can expose on the resources. You can use `extends` to compose the operations to meet the exact needs of your resource APIs.

For example, for below `Widget` model

```
@resource("widgets")
model Widget {
  @key id: string;
  name: string;
}
```

- `Widget` resource supports full CRUDL operations.

```TypeSpec
interface WidgetService extends Resource.ResourceOperations<Widget, Error>;
```

- `Widget` resource supports only CRD operations.

```TypeSpec
interface WidgetService
   extends Resource.ResourceRead<Widget, Error>,
    Resource.ResourceCreate<Widget, Error>,
    Resource.ResourceDelete<Widget, Error> {
}
```

-

| Interfaces                                                              | Notes                                                                                                                |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ResourceRead&lt;TResource, TError>                                      | Resource GET operation                                                                                               |
| ResourceCreateOrUpdate&lt;TResource, TError>                            | Resource PUT operation                                                                                               |
| ResourceCreate&lt;TResource, TError>                                    | Resource POST operation                                                                                              |
| ResourceUpdate&lt;TResource, TError>                                    | Resource PATCH operation                                                                                             |
| ResourceDelete&lt;TResource, TError>                                    | Resource DEL operation                                                                                               |
| ResourceList&lt;TResource, TError>                                      | Resource LIST operation which is a GET operation from a parent resource.                                             |
| ResourceInstanceOperations&lt;TResource, TError>                        | Combines resource GET + PATCH + DEL operations                                                                       |
| ResourceCollectionOperations&lt;TResource, TError>                      | Combines resource POST + LIST operations                                                                             |
| ResourceOperations&lt;TResource, TError>                                | Combines resource instance and collection operations. Includes GET + PATCH + DEL + POST + LIST                       |
| SingletonResourceRead&lt;TSingleton, TResource, TError>                 | Singleton resource GET operation.                                                                                    |
| SingletonResourceUpdate&lt;TSingleton, TResource, TError>               | Singleton resource PATCH operation.                                                                                  |
| SingletonResourceOperations&lt;TSingleton, TResource, TError>           | Combines resource GET + PATCH operations                                                                             |
| ExtensionResourceRead&lt;TExtension, TResource, TError>                 | Extension resource GET operation.                                                                                    |
| ExtensionResourceCreateOrUpdate&lt;TExtension, TResource, TError>       | Extension resource PUT operation                                                                                     |
| ExtensionResourceCreate&lt;TExtension, TResource, TError>               | Extension resource POST operation                                                                                    |
| ExtensionResourceUpdate&lt;TExtension, TResource, TError>               | Extension resource PATCH operation                                                                                   |
| ExtensionResourceDelete&lt;TExtension, TResource, TError>               | Extension resource GET operation                                                                                     |
| ExtensionResourceList&lt;TExtension, TResource, TError>                 | Extension resource LIST operation which is a GET operation from a parent resource.                                   |
| ExtensionResourceInstanceOperations&lt;TExtension, TResource, TError>   | Combines extension resource GET + PATCH + DEL operations.                                                            |
| ExtensionResourceCollectionOperations&lt;TExtension, TResource, TError> | Combines extension resource POST + LIST operations.                                                                  |
| ExtensionResourceOperations&lt;TExtension, TResource, TError>           | Combines extension resource instance and collection operations. Includes GET + PATCH + DEL + POST + LIST operations. |

## See also

- [REST example](https://cadlplayground.z22.web.core.windows.net/?c=aW1wb3J0ICJAY2FkbC1sYW5nL3Jlc3QiOwoKQHNlcnZpY2VUaXRsZSgiV2lkZ2V0IFPGFSIpCm5hbWVzcGFjZSBEZW1vxxg7Cgp1c2luZyBDYWRsLkh0dHA7zBFSZXN0OwoKbW9kZWwgx1J7CiAgQGtleSBpZDogc3RyaW5nOwogIHdlaWdodDogaW50MzLEEWNvbG9yOiAicmVkIiB8ICJibHVlIjsKfQoKQGVycm9yx1ZFxAzFVWNvZGXLQG1lc3NhZ2XKZH0KCmludGVyZuQAxOYAjecAxiBleHRlbmRzIFJlc291cmNl5AC5xQlPcGVyYXRpb25zPMYyLMZxPsVyQOQA0EByb3V0ZSgiY3VzdG9tR2V0IikgyQwoKTrHa%2BQAgA%3D%3D):
- [TypeSpec Getting Started](https://github.com/microsoft/typespec#getting-started)
- [TypeSpec Website](https://microsoft.github.io/typespec)

```

```
