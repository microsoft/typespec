# Decorators## `@service`

Mark this namespace as describing a service and configure service properties.

```cadl
dec service(target: Cadl.Reflection.Namespace, options?: Cadl.ServiceOptions)
```

### Target

`model Cadl.Reflection.Namespace`

### Parameters
| Name | Type | Description |
|------|------|-------------|
| options | `model Cadl.ServiceOptions` | Optional configuration for the service. |

### Examples

```cadl
@service
namespace PetStore;
```

#### Setting service title

```cadl
@service({title: "Pet store"})
namespace PetStore;
```

#### Setting service version

```cadl
@service({version: "1.0"})
namespace PetStore;
```


