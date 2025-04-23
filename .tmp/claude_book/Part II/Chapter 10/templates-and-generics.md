# Templates and Generics

Templates (or generics) in TypeSpec allow you to create reusable type definitions that can work with different data types. This powerful feature enables you to build generic patterns, utilities, and abstractions that can be applied across your API design.

## Basic Template Syntax

You can define a template type using angle brackets (`<>`) to specify type parameters:

```typespec
model Container<T> {
  value: T;
}

// Using the template with different types
model StringContainer is Container<string>;
model NumberContainer is Container<int32>;
model UserContainer is Container<User>;
```

In this example, `Container<T>` is a template model that can hold any type. The `T` is a type parameter that gets replaced with a concrete type when the template is used.

## Multiple Type Parameters

Templates can have multiple type parameters:

```typespec
model KeyValuePair<K, V> {
  key: K;
  value: V;
}

// Using multiple type parameters
model StringToNumber is KeyValuePair<string, int32>;
model IdToUser is KeyValuePair<string, User>;
```

## Default Type Parameters

You can provide default types for template parameters:

```typespec
model Optional<T = string> {
  value?: T;
}

// These are equivalent
model OptionalString is Optional<string>;
model DefaultOptional is Optional;
```

## Constraints on Type Parameters

TypeSpec allows you to constrain type parameters to ensure they meet certain requirements:

```typespec
// T must be a model type
model Repository<T extends {}> {
  items: T[];

  op get(id: string): T;
  op list(): T[];
  op create(item: T): T;
}

// This works because User is a model
model UserRepository is Repository<User>;

// This would cause an error because string is not a model
// model StringRepository is Repository<string>;
```

## Nested Templates

Templates can be nested to create more complex structures:

```typespec
model PagedResult<T> {
  items: T[];
  nextLink?: string;
}

model Response<T> {
  data: T;
  metadata: {
    timestamp: string;
    requestId: string;
  };
}

// Combining templates
model PagedResponse<T> is Response<PagedResult<T>>;

// Using the nested template
model UserListResponse is PagedResponse<User>;
```

## Template Interfaces

Interfaces can also be templated:

```typespec
interface CrudOperations<T> {
  create(item: T): T;
  read(id: string): T;
  update(id: string, item: T): T;
  delete(id: string): void;
}

// Using the template interface
interface UserOperations extends CrudOperations<User> {
  // Additional user-specific operations
  resetPassword(id: string): void;
}
```

## Template Operations

Operations can use type parameters as well:

```typespec
op convert<T, U>(source: T): U;

// Using the template operation with specific types
op convertStringToInt is convert<string, int32>;
op convertUserToSummary is convert<User, UserSummary>;
```

## Template Functions

You can create template functions to provide reusable logic:

```typespec
// Define a reusable template function
op Paginate<T>(items: T[]): {
  items: T[];
  totalCount: int32;
  nextLink?: string;
};

// Use the template function
op listUsers(): Paginate<User>;
op listProducts(): Paginate<Product>;
```

## Common Template Patterns

TypeSpec's template system enables several powerful patterns:

### Resource Collections

```typespec
model Resource<T> {
  items: T[];
  totalCount: int32;
  nextLink?: string;
}

op list<T>(): Resource<T>;

// Using resource collections
op listUsers(): Resource<User>;
op listProducts(): Resource<Product>;
```

### CRUD Operations

```typespec
interface CrudOperations<T, IdType = string> {
  create(item: T): T;
  read(id: IdType): T;
  update(id: IdType, item: T): T;
  delete(id: IdType): void;
  list(): T[];
}

// Using CRUD operations for different resources
interface UserOperations extends CrudOperations<User> {}
interface ProductOperations extends CrudOperations<Product, int32> {}
```

### Lifecycle Operations

```typespec
model Entity<T> {
  @key
  id: string;
  ...T; // Spread the properties from T
}

model Create<T> {
  // Omit auto-generated properties for creation
  ...T;
  id?: never;
  createdAt?: never;
  updatedAt?: never;
}

model Update<T> {
  // Make all properties optional for updates
  ...{
    [P in keyof T]?: T[P];
  }
  // Cannot update these fields
  id?: never;
  createdAt?: never;
  updatedAt?: never;
}

// Using lifecycle templates
model User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

model CreateUser is Create<User>;
model UpdateUser is Update<User>;

op createUser(user: CreateUser): User;
op updateUser(id: string, updates: UpdateUser): User;
```

### Response Wrappers

```typespec
model ApiResponse<T> {
  data: T;
  status: "success" | "error";
  message?: string;
}

// Using response wrappers
op getUser(id: string): ApiResponse<User>;
op searchUsers(query: string): ApiResponse<User[]>;
```

### Specialized Collections

```typespec
model PagedCollection<T> {
  items: T[];
  count: int32;
  nextLink?: string;
}

model FilterableCollection<T> {
  items: T[];
  appliedFilters: {
    property: string;
    value: string;
  }[];
}

model SortedCollection<T> {
  items: T[];
  sortedBy: string;
  sortDirection: "asc" | "desc";
}

// Combining template patterns
model AdvancedCollection<T> {
  items: T[];
  count: int32;
  nextLink?: string;
  appliedFilters?: {
    property: string;
    value: string;
  }[];
  sortedBy?: string;
  sortDirection?: "asc" | "desc";
}

// Using specialized collections
op listUsersAdvanced(): AdvancedCollection<User>;
```

## Template Type Inference

TypeSpec can often infer the template parameters from the context:

```typespec
model Wrapper<T> {
  value: T;
}

// TypeSpec infers T = User
op getUserWrapper(id: string): Wrapper<User>;
```

## Adding Properties to Template Types

You can use templates to add properties to existing types:

```typespec
model WithTimestamps<T> {
  ...T;
  createdAt: string;
  updatedAt: string;
}

model User {
  id: string;
  name: string;
  email: string;
}

// User with timestamps
model TimestampedUser is WithTimestamps<User>;
```

## Conditional Properties with Templates

You can use templates to implement conditional properties:

```typespec
model WithOptionalProperty<T, PropertyName extends string, PropertyType> {
  ...T;
  [PropertyName]?: PropertyType;
}

model User {
  id: string;
  name: string;
}

// Add an optional property to User
model UserWithAvatar is WithOptionalProperty<User, "avatar", string>;
```

## Template Decorators

Decorators can be applied to template types and will be applied to instantiated types:

```typespec
@doc("A paginated collection of items")
model PagedResult<T> {
  @doc("The collection of items")
  items: T[];

  @doc("Link to the next page, if available")
  @format("uri")
  nextLink?: string;
}

// The decorators are preserved when the template is used
model PagedUsers is PagedResult<User>;
```

## Best Practices for Templates

### 1. Clear Naming

Use clear, descriptive names for your templates and type parameters:

```typespec
// Good - clear names
model PagedResult<TItem> {
  items: TItem[];
  nextLink?: string;
}

// Avoid - unclear names
model PR<T> {
  items: T[];
  nextLink?: string;
}
```

### 2. Use Constraints Appropriately

Apply constraints to your type parameters when needed:

```typespec
// Constrain T to ensure it has an id property
model Repository<T extends { id: string }> {
  op get(id: string): T;
}
```

### 3. Provide Defaults When Appropriate

Provide default type parameters when it makes sense:

```typespec
model ApiResponse<T, ErrorType = DefaultError> {
  data?: T;
  error?: ErrorType;
}
```

### 4. Document Templates

Document your templates thoroughly:

```typespec
@doc("A paginated collection of items of type T")
model PagedResult<T> {
  @doc("The collection of items")
  items: T[];

  @doc("Link to the next page, if available")
  nextLink?: string;

  @doc("The total number of items available")
  totalCount: int32;
}
```

### 5. Keep Templates Focused

Each template should have a single, clear purpose:

```typespec
// Good - focused template
model WithTimestamps<T> {
  ...T;
  createdAt: string;
  updatedAt: string;
}

// Avoid - template trying to do too much
model EntityExtensions<T> {
  ...T;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata: Record<string, string>;
  version: int32;
}
```

### 6. Compose Templates

Compose smaller templates to build more complex patterns:

```typespec
model WithTimestamps<T> {
  ...T;
  createdAt: string;
  updatedAt: string;
}

model WithSoftDelete<T> {
  ...T;
  isDeleted: boolean;
  deletedAt?: string;
}

model WithAudit<T> {
  ...T;
  createdBy: string;
  updatedBy: string;
}

// Compose templates
model FullAuditedEntity<T> is WithAudit<WithTimestamps<WithSoftDelete<T>>>;

// Use the composed template
model AuditedUser is FullAuditedEntity<User>;
```

By effectively using templates in TypeSpec, you can create reusable components that enhance consistency, reduce duplication, and improve the maintainability of your API definitions.
