# Advanced Template Patterns

Building on the basic template functionality covered previously, this section explores advanced template patterns in TypeSpec that enable sophisticated type manipulations and abstractions.

## Template Composition

Template composition allows you to build complex types by combining simpler templates:

```typespec
model WithTimestamps<T> {
  ...T;
  createdAt: string;
  updatedAt: string;
}

model WithVersioning<T> {
  ...T;
  version: int32;
  isLatest: boolean;
}

// Compose multiple templates
model AuditedVersionedUser is WithTimestamps<WithVersioning<User>>;
```

TypeSpec evaluates this from the inside out, first applying `WithVersioning` to `User`, then applying `WithTimestamps` to the result.

## Template Specialization

Template specialization allows you to provide different implementations for specific types:

```typespec
// Generic template
model Serializer<T> {
  serialize: (value: T) => string;
  deserialize: (value: string) => T;
}

// Specialization for string
model Serializer<string> {
  serialize: (value: string) => string;
  deserialize: (value: string) => string;
}

// Specialization for int32
model Serializer<int32> {
  serialize: (value: int32) => string;
  deserialize: (value: string) => int32;
}
```

## Type Transformations with Templates

Templates can transform types in various ways:

### Optional Properties

```typespec
// Make all properties optional
model Optional<T> {
  [property in keyof T]?: T[property];
}

model User {
  id: string;
  name: string;
  email: string;
}

model OptionalUser is Optional<User>;
// Equivalent to:
// model OptionalUser {
//   id?: string;
//   name?: string;
//   email?: string;
// }
```

### Required Properties

```typespec
// Make all properties required
model Required<T> {
  [property in keyof T]: T[property];
}

model PartialUser {
  id: string;
  name?: string;
  email?: string;
}

model RequiredUser is Required<PartialUser>;
// Equivalent to:
// model RequiredUser {
//   id: string;
//   name: string;
//   email: string;
// }
```

### Property Omission

```typespec
// Omit specific properties
model Omit<T, K extends keyof T> {
  [property in keyof T as property extends K ? never : property]: T[property];
}

model User {
  id: string;
  name: string;
  email: string;
  password: string;
}

model PublicUser is Omit<User, "password">;
// Equivalent to:
// model PublicUser {
//   id: string;
//   name: string;
//   email: string;
// }
```

### Property Picking

```typespec
// Pick specific properties
model Pick<T, K extends keyof T> {
  [property in K]: T[property];
}

model User {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
}

model UserIdentity is Pick<User, "id" | "name" | "email">;
// Equivalent to:
// model UserIdentity {
//   id: string;
//   name: string;
//   email: string;
// }
```

## Conditional Types

Templates can implement conditional logic for type selection:

```typespec
// A conditional type that selects between two types
model Conditional<T, Condition, TrueType, FalseType> {
  ...T extends Condition ? TrueType : FalseType;
}

model HasId {
  id: string;
}

model User {
  id: string;
  name: string;
}

model Guest {
  sessionId: string;
}

model WithIdHandling<T> is Conditional<T, HasId, { hasId: true }, { hasId: false }>;

// User has an id, so this includes { hasId: true }
model UserWithIdFlag is WithIdHandling<User>;

// Guest doesn't have an id, so this includes { hasId: false }
model GuestWithIdFlag is WithIdHandling<Guest>;
```

## Template Mixins

Templates can be used to create mixins that add functionality to existing types:

```typespec
// A mixin that adds tracking functionality
model TrackableMixin<T> {
  ...T;
  trackingId: string;
  tracked: boolean;
  trackingStarted: string;
}

// A mixin that adds tagging functionality
model TaggableMixin<T> {
  ...T;
  tags: string[];
}

// Apply multiple mixins
model TaggableTrackableUser is TrackableMixin<TaggableMixin<User>>;
```

## Higher-Order Templates

Templates can take other templates as parameters:

```typespec
// A higher-order template that applies a transformation twice
model ApplyTwice<T, Template<U>> {
  ...Template<Template<T>>;
}

model WithId<T> {
  ...T;
  id: string;
}

model WithName<T> {
  ...T;
  name: string;
}

// Apply WithId, then apply WithName
model NamedEntity is ApplyTwice<{}, WithName<WithId>>;
// Equivalent to WithName<WithId<{}>>
```

## Recursive Templates

Templates can be recursive, allowing for nested structures:

```typespec
// A recursive template for tree structures
model TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

// A category tree
model Category {
  name: string;
  description: string;
}

model CategoryTree is TreeNode<Category>;
```

## Template Method Chaining

Templates can simulate method chaining for fluent APIs:

```typespec
model Builder<T> {
  build: () => T;
}

model WithName<T> {
  ...T;
  withName: (name: string) => Builder<T & { name: string }>;
}

model WithAge<T> {
  ...T;
  withAge: (age: int32) => Builder<T & { age: int32 }>;
}

// A fluent builder API
model PersonBuilder is WithName<WithAge<{}>>;
```

## Template for API Versioning

Templates can help manage API versioning:

```typespec
model V1<T> {
  ...T;
  apiVersion: "v1";
}

model V2<T> {
  ...T extends { legacyField: unknown } ? Omit<T, "legacyField"> : T;
  apiVersion: "v2";
  newField?: string;
}

model UserV1 is V1<{
  id: string;
  name: string;
  legacyField: string;
}>;

model UserV2 is V2<UserV1>;
// Equivalent to:
// model UserV2 {
//   id: string;
//   name: string;
//   apiVersion: "v2";
//   newField?: string;
// }
```

## Complex Data Structures with Templates

Templates can represent complex data structures:

### Linked Lists

```typespec
model LinkedListNode<T> {
  value: T;
  next?: LinkedListNode<T>;
}

model LinkedList<T> {
  head?: LinkedListNode<T>;
}
```

### Maps

```typespec
model MapEntry<K, V> {
  key: K;
  value: V;
}

model Map<K, V> {
  entries: MapEntry<K, V>[];
}
```

### Graphs

```typespec
model GraphNode<T> {
  value: T;
  edges: GraphEdge<T>[];
}

model GraphEdge<T> {
  from: GraphNode<T>;
  to: GraphNode<T>;
  weight?: numeric;
}

model Graph<T> {
  nodes: GraphNode<T>[];
}
```

## Templates for API Patterns

### Resource Lifecycle

```typespec
model ResourceState<T> {
  resource: T;
  status: "creating" | "active" | "updating" | "deleting" | "deleted";
  statusMessage?: string;
  lastUpdated: string;
}

// Apply to different resources
model UserState is ResourceState<User>;
model OrderState is ResourceState<Order>;
```

### Batch Operations

```typespec
model BatchRequest<T> {
  items: T[];
  options?: {
    continueOnError?: boolean;
    timeout?: int32;
  };
}

model BatchResponse<T> {
  results: {
    succeeded: T[];
    failed: {
      item: T;
      error: Error;
    }[];
  };
  summary: {
    totalRequested: int32;
    succeeded: int32;
    failed: int32;
  };
}

// Define batch operations
op batchCreateUsers(request: BatchRequest<User>): BatchResponse<User>;
op batchUpdateProducts(request: BatchRequest<Product>): BatchResponse<Product>;
```

### Template for Asynchronous Operations

```typespec
model AsyncOperation<T> {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  percentComplete?: int32;
  createdAt: string;
  lastUpdated: string;
  result?: T;
  error?: Error;
}

op startAsyncOperation<T, R>(input: T): {
  operationId: string;
};

op getAsyncOperation<R>(operationId: string): AsyncOperation<R>;

// Use with specific types
op processLargeFile(file: File): {
  operationId: string;
};

op getFileProcessingStatus(operationId: string): AsyncOperation<ProcessingResult>;
```

## Advanced Template Use Cases

### API Resource Builder

```typespec
namespace Examples.ResourceBuilder {
  model ResourceOptions {
    prefix?: string;
    singularName: string;
    pluralName: string;
    keyType: "string" | "int32" | "uuid";
    supportsSoftDelete?: boolean;
    supportsVersioning?: boolean;
    supportsETags?: boolean;
    supportsTags?: boolean;
  }

  model ResourceMetadata<T> {
    created: string;
    createdBy: string;
    lastModified: string;
    lastModifiedBy: string;
    etag?: string;
    deleted?: boolean;
    deletedAt?: string;
    version?: int32;
    tags?: Record<string, string>;
  }

  model Resource<T, Options extends ResourceOptions> {
    [Options.keyType extends "string" ? "id" : never]: string;
    [Options.keyType extends "int32" ? "id" : never]: int32;
    [Options.keyType extends "uuid" ? "id" : never]: string;
    ...T;
    ...Options.supportsETags extends true ? { etag: string } : {};
    ...Options.supportsSoftDelete extends true ? {
      deleted: boolean;
      deletedAt?: string;
    } : {};
    ...Options.supportsVersioning extends true ? {
      version: int32;
      isLatest: boolean;
    } : {};
    ...Options.supportsTags extends true ? {
      tags: Record<string, string>;
    } : {};
  }

  interface ResourceOperations<T, Options extends ResourceOptions> {
    @get
    @route(`/${Options.pluralName}`)
    op list(): Resource<T, Options>[];

    @get
    @route(`/${Options.pluralName}/{id}`)
    op get(id: Options.keyType extends "int32" ? int32 : string): Resource<T, Options>;

    @post
    @route(`/${Options.pluralName}`)
    op create(@body item: T): Resource<T, Options>;

    @put
    @route(`/${Options.pluralName}/{id}`)
    op update(
      id: Options.keyType extends "int32" ? int32 : string,
      @body item: T
    ): Resource<T, Options>;

    @delete
    @route(`/${Options.pluralName}/{id}`)
    op delete(id: Options.keyType extends "int32" ? int32 : string): void;

    ...Options.supportsSoftDelete extends true ? {
      @post
      @route(`/${Options.pluralName}/{id}:restore`)
      op restore(id: Options.keyType extends "int32" ? int32 : string): Resource<T, Options>;
    } : {};

    ...Options.supportsVersioning extends true ? {
      @get
      @route(`/${Options.pluralName}/{id}/versions`)
      op listVersions(id: Options.keyType extends "int32" ? int32 : string): Resource<T, Options>[];

      @get
      @route(`/${Options.pluralName}/{id}/versions/{version}`)
      op getVersion(
        id: Options.keyType extends "int32" ? int32 : string,
        version: int32
      ): Resource<T, Options>;
    } : {};
  }

  // Example usage
  model UserData {
    name: string;
    email: string;
  }

  alias UserOptions = ResourceOptions & {
    singularName: "user";
    pluralName: "users";
    keyType: "uuid";
    supportsSoftDelete: true;
    supportsVersioning: true;
    supportsTags: true;
  };

  alias User = Resource<UserData, UserOptions>;

  interface UserService extends ResourceOperations<UserData, UserOptions> {
    // Additional custom operations
    @post
    @route("/users/{id}:resetPassword")
    op resetPassword(id: string): void;
  }
}
```

## Best Practices for Advanced Templates

### 1. Composition Over Complexity

Break complex templates into smaller, composable pieces:

```typespec
// Instead of one complex template
model ComplexEntity<T> {}
// Many complex transformations

// Use composition of simpler templates
model WithMetadata<T> {
  ...T;
  // Metadata fields
}

model WithValidation<T> {
  ...T;
  // Validation fields
}

model ComplexEntity<T> is WithMetadata<WithValidation<T>>;
```

### 2. Document Template Parameters

Clearly document the purpose and expectations of each template parameter:

```typespec
/**
 * Represents a paginated collection of items
 * @param T - The type of items in the collection
 * @param PageSizeType - The type used for page size (default: int32)
 */
model PagedCollection<T, PageSizeType = int32> {
  items: T[];
  count: PageSizeType;
  nextLink?: string;
}
```

### 3. Consistent Naming Conventions

Use consistent naming for similar template patterns:

```typespec
// Model transformations follow a consistent pattern
model Optional<T> {
  [P in keyof T]?: T[P];
}

model Required<T> {
  [P in keyof T]: T[P];
}

model Readonly<T> {
  readonly [P in keyof T]: T[P];
}
```

### 4. Template Libraries

Group related templates into libraries:

```typespec
namespace Utilities.Collections {
  model List<T> {
    items: T[];
  }

  model Map<K, V> {
    entries: { key: K, value: V }[];
  }

  model Set<T> {
    items: T[];
  }
}

namespace Utilities.Transformations {
  model Optional<T> {
    [P in keyof T]?: T[P];
  }

  model Required<T> {
    [P in keyof T]: T[P];
  }
}
```

### 5. Template Constraints

Use constraints to prevent misuse of templates:

```typespec
// Ensure T has an ID property
model Repository<T extends { id: string }> {
  items: T[];
}

// Ensure TKey is a valid key type
model KeyValueStore<TKey extends string | int32, TValue> {
  get(key: TKey): TValue;
  set(key: TKey, value: TValue): void;
}
```

### 6. Recursive Template Depth Limits

Be aware of depth limits when using recursive templates:

```typespec
// May cause issues if deeply nested
model NestedTree<T> {
  value: T;
  children: NestedTree<T>[];
}

// Better approach: add a depth parameter with a default
model NestedTreeWithDepth<T, Depth extends int32 = 10> {
  value: T;
  // Limited recursion
  children: Depth extends 0 ? never : NestedTreeWithDepth<T, SubtractOne<Depth>>[];
}
```

By mastering these advanced template techniques, you can create highly reusable, type-safe abstractions in TypeSpec that reduce duplication and capture complex design patterns in a maintainable way.
