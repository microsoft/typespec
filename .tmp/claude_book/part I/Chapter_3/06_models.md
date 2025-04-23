# 6. Models

Models are the cornerstone of data representation in TypeSpec, allowing you to define structured data types for your API. This section explores how to create and use models effectively to build precise and maintainable API specifications.

## Understanding Models

Models in TypeSpec represent structured data with named properties. They serve as:

1. **Request and response types** - Define the shape of data exchanged in API operations
2. **Resource representations** - Model domain entities in your system
3. **Common data structures** - Create reusable components across your API
4. **Schema definitions** - Transform into schemas in generated specifications (like JSON Schema)

## Basic Model Declaration

A model is declared using the `model` keyword followed by a name and a block of properties:

```typespec
model User {
  id: string;
  name: string;
  email: string;
  createdAt: utcDateTime;
}
```

Each property has a name and a type, with properties separated by semicolons.

## Property Types

Model properties can use any TypeSpec type:

```typespec
model Example {
  // Scalar types
  stringValue: string;

  numberValue: int32;
  booleanValue: boolean;
  dateValue: utcDateTime;

  // Array types
  stringArray: string[];

  numberArray: int32[];

  // Model types (composition)
  address: Address;

  // Array of models
  orders: Order[];

  // Enums
  status: OrderStatus;

  // Union types
  identifier: string | int32;

  // Literal types
  role: "admin" | "user" | "guest";

  // Custom scalar types
  userId: UUID;
}
```

## Optional Properties

Properties can be marked as optional using the `?` suffix:

```typespec
model User {
  id: string;
  name: string;
  email: string;
  phone?: string; // Optional
  address?: Address; // Optional
  preferences?: string[]; // Optional array
}
```

Optional properties may be omitted in API requests and responses.

## Default Values

Properties can have default values that apply when the property is not explicitly set:

```typespec
model Product {
  id: string;
  name: string;
  price: decimal;
  isAvailable: boolean = true; // Default to true
  quantity: int32 = 0; // Default to 0
  category: string = "uncategorized"; // Default string value
  tags: string[] = []; // Default to empty array
}
```

## Property Validation

Properties can have validation constraints using decorators:

```typespec
model User {
  @pattern("[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}")
  id: string;

  @minLength(1)
  @maxLength(100)
  name: string;

  @format("email")
  email: string;

  @minValue(0)
  @maxValue(120)
  age?: int32;

  @minItems(1)
  @maxItems(10)
  roles: string[];
}
```

## Property Documentation

Add documentation to properties using the `@doc` decorator:

```typespec
model User {
  @doc("Unique identifier for the user")
  id: string;

  @doc("User's full name")
  name: string;

  @doc("User's primary email address")
  email: string;

  @doc("User's age in years")
  age?: int32;
}
```

## Model Inheritance

Models can inherit from other models using the `extends` keyword:

```typespec
model Resource {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model User extends Resource {
  name: string;
  email: string;
}

model Product extends Resource {
  name: string;
  price: decimal;
  category: string;
}
```

The derived models (`User` and `Product`) inherit all properties from the base model (`Resource`).

## Multiple Inheritance

TypeSpec supports multiple inheritance for models:

```typespec
model Timestamps {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Auditable {
  createdBy: string;
  updatedBy: string;
}

model User extends Timestamps, Auditable {
  id: string;
  name: string;
  email: string;
}
```

The `User` model inherits properties from both `Timestamps` and `Auditable`.

## Model Composition with Spread

Use the spread operator (`...`) to include all properties from another model:

```typespec
model Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

model User {
  id: string;
  name: string;
  email: string;
  ...Address; // Include all properties from Address
}
```

This is different from inheritance as it embeds the properties directly rather than establishing a type hierarchy.

## Model Templates

Models can be parameterized with templates:

```typespec
model Paginated<T> {
  items: T[];
  totalCount: int32;
  pageNumber: int32;
  pageSize: int32;
}

model PaginatedUsers is Paginated<User>;
model PaginatedProducts is Paginated<Product>;
```

This creates reusable container models that can work with different content types.

## Anonymous Models

TypeSpec allows inline model definitions for one-off structures:

```typespec
model Order {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: {
    productId: string;
    quantity: int32;
    price: decimal;
  }[];
}
```

However, for better reusability, it's usually preferable to define named models.

## Discriminated Unions

Create polymorphic models using discriminated unions:

```typespec
@discriminator("type")
model Shape {
  type: string;
  area: float64;
}

model Circle extends Shape {
  type: "circle";
  radius: float64;
}

model Rectangle extends Shape {
  type: "rectangle";
  width: float64;
  height: float64;
}

model Square extends Shape {
  type: "square";
  sideLength: float64;
}
```

The `@discriminator` decorator specifies which property determines the concrete type.

## Property Modifiers

TypeSpec provides property modifiers to control model behavior:

### Read-Only Properties

```typespec
model User {
  id: string;
  name: string;
  email: string;

  @visibility("read")
  createdAt: utcDateTime; // Read-only property
}
```

### Key Properties

Mark properties that serve as unique identifiers:

```typespec
model User {
  @key
  id: string;

  name: string;
  email: string;
}
```

### Required vs. Optional Properties

```typespec
model User {
  id: string; // Required
  name: string; // Required
  email: string; // Required
  phone?: string; // Optional
  address?: Address; // Optional
}

// Alternatively, use @required decorator
model Product {
  @required
  id: string;

  @required
  name: string;

  description: string; // Optional by default
}
```

## Model Interfaces

Models can implement interfaces to ensure they conform to a contract:

```typespec
interface Identifiable {
  id: string;
}

interface Timestamped {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model User implements Identifiable, Timestamped {
  id: string;               // Required by Identifiable
  name: string;
  email: string;
  createdAt: utcDateTime;   // Required by Timestamped
  updatedAt: utcDateTime;   // Required by Timestamped
}
```

## Recursive Models

Models can refer to themselves for hierarchical structures:

```typespec
model Category {
  id: string;
  name: string;
  subcategories: Category[]; // Self-reference
}

model Employee {
  id: string;
  name: string;
  manager?: Employee; // Optional self-reference
}

model Comment {
  id: string;
  text: string;
  author: string;
  replies: Comment[]; // Self-reference
}
```

## Model Intersection

Combine models using the intersection operator (`&`):

```typespec
model User {
  id: string;
  name: string;
  email: string;
}

model AuditInfo {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

// Combine User and AuditInfo
model AuditedUser is User & AuditInfo;
```

This creates a new model with properties from both source models.

## Property Ordering

TypeSpec preserves the order of properties in model definitions:

```typespec
model User {
  id: string; // First property
  name: string; // Second property
  email: string; // Third property
  createdAt: utcDateTime; // Fourth property
}
```

The order is maintained in generated artifacts that support ordering (like OpenAPI specifications).

## Modeling Best Practices

Follow these best practices for effective model design:

### 1. Use Descriptive Names

Choose clear, descriptive names for models and properties:

```typespec
// Good: Descriptive names
model PaymentMethod {
  id: string;
  cardNumber: string;
  expirationDate: string;
  cardholderName: string;
}

// Avoid: Vague names
model Method {
  id: string;
  num: string;
  exp: string;
  name: string;
}
```

### 2. Group Related Models

Keep related models in the same namespace:

```typespec
namespace eCommerce.Products;

model Product {
  id: string;
  name: string;
  price: decimal;
}

model Category {
  id: string;
  name: string;
  products: Product[];
}

model Review {
  id: string;
  productId: string;
  rating: int32;
  comment: string;
}
```

### 3. Create Base Models for Common Properties

Reuse common property sets via base models:

```typespec
model AuditableEntity {
  createdAt: utcDateTime;
  createdBy: string;
  updatedAt: utcDateTime;
  updatedBy: string;
}

model User extends AuditableEntity {
  id: string;
  name: string;
  email: string;
}

model Product extends AuditableEntity {
  id: string;
  name: string;
  price: decimal;
}
```

### 4. Use Consistent Property Naming

Follow consistent naming conventions:

```typespec
// Use consistent casing (e.g., camelCase)
model User {
  userId: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
}

// Use consistent pluralization for arrays
model Order {
  id: string;
  customer: Customer;
  items: OrderItem[]; // Plural for array
  tags: string[]; // Plural for array
}
```

### 5. Document Models and Properties

Add clear documentation:

```typespec
@doc("Represents a user account in the system")
model User {
  @doc("Unique identifier for the user")
  id: string;

  @doc("User's full name")
  name: string;

  @doc("User's primary email address used for authentication")
  email: string;
}
```

## Common Model Patterns

Here are common patterns for modeling in TypeSpec:

### Resource Models

```typespec
@resource
model Product {
  @key
  id: string;

  name: string;
  description: string;
  price: decimal;
  category: string;
  tags: string[];
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}
```

### Request/Response Models

```typespec
model CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

model CreateUserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: utcDateTime;
}

@route("/users")
@post
op createUser(@body body: CreateUserRequest): CreateUserResponse;
```

### Pagination Models

```typespec
model PaginationParams {
  @query
  page?: int32 = 1;

  @query
  pageSize?: int32 = 20;
}

model PaginatedResult<T> {
  items: T[];
  totalCount: int32;
  pageCount: int32;
  currentPage: int32;
  pageSize: int32;
}

@route("/products")
@get
op listProducts(...PaginationParams, @query category?: string): PaginatedResult<Product>;
```

### Error Models

```typespec
@error
model Error {
  @statusCode
  code: int32;

  message: string;
  details?: string[];
  target?: string;
}

@error
model ValidationError extends Error {
  code: 400;
  validationErrors: {
    property: string;
    message: string;
  }[];
}
```

### Versioned Models

```typespec
import "@typespec/versioning";
using TypeSpec.Versioning;

@versioned(Versions)
namespace MyAPI;

enum Versions {
  v1,
  v2,
  v3,
}

model User {
  id: string;
  name: string;
  email: string;

  @added(Versions.v2)
  phoneNumber?: string;

  @removed(Versions.v3, "Use address.country instead")
  country?: string;

  @added(Versions.v3)
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}
```

## Complete Model Example

Here's a comprehensive example showing various model techniques in an e-commerce API:

```typespec
import "@typespec/http";
import "@typespec/rest";
using TypeSpec.Http;
using TypeSpec.Rest;

namespace ECommerce;

// --- Base models ---

model Timestamps {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model SoftDelete {
  isDeleted: boolean = false;
  deletedAt?: utcDateTime;
}

// --- Scalar types ---

@format("uuid")
scalar UUID extends string;

@minValue(0)
scalar Money extends decimal;

// --- Enums ---

enum OrderStatus {
  Pending,
  Processing,
  Shipped,
  Delivered,
  Cancelled,
}

enum PaymentMethod {
  CreditCard,
  DebitCard,
  PayPal,
  BankTransfer,
}

// --- Entity models ---

@resource
model Product extends Timestamps, SoftDelete {
  @key
  id: UUID;

  @minLength(1)
  @maxLength(100)
  name: string;

  @maxLength(1000)
  description?: string;

  @minValue(0)
  price: Money;

  @minValue(0)
  inventory: int32;

  category: string;

  @maxItems(20)
  images: string[] = [];

  @minValue(0)
  @maxValue(5)
  rating: float32 = 0;

  isAvailable: boolean = true;
}

@resource
model Customer extends Timestamps {
  @key
  id: UUID;

  @minLength(1)
  @maxLength(100)
  name: string;

  @format("email")
  email: string;

  @pattern("^\\+[1-9][0-9]{1,14}$")
  phone?: string;

  addresses: Address[] = [];

  @visibility("read")
  totalOrders: int32 = 0;
}

model Address {
  @minLength(1)
  street: string;

  @minLength(1)
  city: string;

  @minLength(1)
  state: string;

  @minLength(1)
  postalCode: string;

  @minLength(2)
  @maxLength(2)
  @pattern("^[A-Z]{2}$")
  country: string;

  isDefault: boolean = false;
}

@resource
model Order extends Timestamps {
  @key
  id: UUID;

  @reference(Customer)
  customerId: UUID;

  items: OrderItem[];

  @minValue(0)
  subtotal: Money;

  @minValue(0)
  tax: Money;

  @minValue(0)
  shipping: Money;

  @minValue(0)
  total: Money;

  status: OrderStatus = OrderStatus.Pending;

  paymentMethod: PaymentMethod;

  shippingAddress: Address;

  billingAddress: Address;

  @visibility("read")
  trackingNumber?: string;
}

model OrderItem {
  @reference(Product)
  productId: UUID;

  @minLength(1)
  productName: string;

  @minValue(0)
  unitPrice: Money;

  @minValue(1)
  quantity: int32;

  @minValue(0)
  subtotal: Money;
}

// --- Request/response models ---

model ProductListParams {
  @query
  category?: string;

  @query
  @minValue(0)
  minPrice?: Money;

  @query
  @minValue(0)
  maxPrice?: Money;

  @query
  inStock?: boolean;

  @query
  @minValue(1)
  page?: int32 = 1;

  @query
  @minValue(1)
  @maxValue(100)
  pageSize?: int32 = 20;
}

model ProductList {
  items: Product[];
  totalCount: int32;
  pageCount: int32;
  currentPage: int32;
}

model CreateOrderRequest {
  items: {
    productId: UUID;
    quantity: int32;
  }[];

  shippingAddressId: UUID;
  billingAddressId: UUID;
  paymentMethod: PaymentMethod;
}

model OrderDetails is Order & {
  customer: {
    id: UUID;
    name: string;
    email: string;
  };
}

// --- API operations ---

@route("/products")
interface ProductOperations {
  @get
  listProducts(...ProductListParams): ProductList;

  @post
  createProduct(@body product: Product): Product;

  @get
  @route("/{id}")
  getProduct(@path id: UUID): Product;

  @put
  @route("/{id}")
  updateProduct(
    @path id: UUID,
    @body product: Product
  ): Product;

  @delete
  @route("/{id}")
  deleteProduct(@path id: UUID): void;
}

@route("/customers")
interface CustomerOperations {
  @get
  listCustomers(): Customer[];

  @post
  createCustomer(@body customer: Customer): Customer;

  @get
  @route("/{id}")
  getCustomer(@path id: UUID): Customer;

  @put
  @route("/{id}")
  updateCustomer(
    @path id: UUID,
    @body customer: Customer
  ): Customer;
}

@route("/orders")
interface OrderOperations {
  @get
  listOrders(
    @query customerId?: UUID,
    @query status?: OrderStatus,
    @query fromDate?: plainDate,
    @query toDate?: plainDate
  ): Order[];

  @post
  createOrder(@body order: CreateOrderRequest): Order;

  @get
  @route("/{id}")
  getOrder(@path id: UUID): OrderDetails;

  @patch
  @route("/{id}/status")
  updateOrderStatus(
    @path id: UUID,
    @body status: OrderStatus
  ): Order;
}
```

## Next Steps

Now that you understand how to create and use models to define structured data in TypeSpec, we'll explore operations in the next section. Operations define the actions that can be performed in your API, using the models you've created.
