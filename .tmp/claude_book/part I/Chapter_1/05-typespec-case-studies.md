# Who Uses TypeSpec: Case Studies and Real-World Examples

TypeSpec has been adopted by organizations of various sizes and across different industries. This section explores real-world applications of TypeSpec through case studies and examples that highlight its practical benefits.

## Microsoft Azure: Managing API Complexity at Scale

Microsoft Azure is one of the largest and most complex cloud platforms, with hundreds of services and thousands of API endpoints. This scale creates significant challenges for API consistency, quality, and documentation.

### The Challenge

Azure faced several challenges with their API ecosystem:

- **Consistency**: Ensuring consistent patterns across independently developed services
- **Documentation**: Maintaining accurate documentation for hundreds of APIs
- **Client libraries**: Generating client libraries in multiple languages
- **Evolution**: Safely evolving APIs while maintaining backward compatibility
- **Quality**: Enforcing organizational standards across all services

### TypeSpec Solution

Azure adopted TypeSpec (originally called "Cadl" during its early development) to address these challenges:

```typespec
@service({
  title: "Azure Storage",
  version: "2021-04-01",
})
@versioned(Versions)
namespace Microsoft.Storage;

enum Versions {
  v2020_08_01,
  v2021_04_01,
}

@resource("storageAccounts")
model StorageAccount {
  @key
  @visibility("read")
  id: string;

  @visibility("read")
  name: string;

  @visibility("read")
  type: string;

  @visibility("read")
  location: string;

  @visibility("read", "create", "update")
  tags?: Record<string>;

  @visibility("read", "create", "update")
  sku: Sku;

  @visibility("read")
  @added(Versions.v2021_04_01)
  privateEndpointConnections?: PrivateEndpointConnection[];
}

model Sku {
  name: SkuName;
  tier?: SkuTier;
}

enum SkuName {
  Standard_LRS,
  Standard_GRS,
  Standard_RAGRS,
  Standard_ZRS,
  Premium_LRS,
  Premium_ZRS,
}

// ... additional models
```

### Results

By adopting TypeSpec, Azure achieved:

- **Improved consistency**: Common patterns across services
- **Better documentation**: Automatically generated documentation for all APIs
- **Standardized clients**: Consistent client libraries in multiple languages
- **Safer evolution**: Clear versioning and compatibility tracking
- **Quality enforcement**: Automated validation of API standards
- **Reduced effort**: Less time spent on manual synchronization
- **Better developer experience**: Both for internal developers and API consumers

## Large Financial Institution: API Governance and Standards

A large financial institution with hundreds of internal and external APIs needed to establish consistent standards and governance across their API portfolio.

### The Challenge

The institution struggled with:

- **Fragmented tooling**: Different teams using different API description formats
- **Inconsistent practices**: Varying patterns for authentication, pagination, etc.
- **Duplicate models**: The same concepts defined differently across services
- **Compliance concerns**: Ensuring all APIs met security and compliance requirements
- **Integration difficulties**: Services had incompatible integration patterns

### TypeSpec Solution

The institution created a standard TypeSpec library defining organizational patterns:

```typespec
// Financial Organization's Common Library
namespace Org.Common;

// Standard error model
@error
model Error {
  code: string;
  message: string;
  details?: ErrorDetails[];
  target?: string;
  innerError?: InnerError;
}

model ErrorDetails {
  code: string;
  message: string;
  target?: string;
}

model InnerError {
  code?: string;
  message?: string;
  details?: ErrorDetails[];
  target?: string;
  innerError?: InnerError;
}

// Standard pagination
model PaginatedResult<T> {
  items: T[];
  totalCount: int64;
  continuationToken?: string;
}

// Standard authentication patterns
@doc("Shared authentication models")
namespace Org.Common.Auth {
  enum AuthScheme {
    Bearer,
    OAuth2,
    ApiKey,
  }

  // Authentication configurations
  // ...
}
```

Service teams then built on this foundation:

```typespec
import "@typespec/rest";
import "./common.tsp";

using TypeSpec.Rest;
using Org.Common;
using Org.Common.Auth;

@service({
  title: "Accounts API",
})
@useAuth(AuthScheme.OAuth2)
namespace Accounts;

@resource("accounts")
model Account {
  @key
  id: string;

  customerId: string;
  balance: decimal;
  currency: string;
  status: AccountStatus;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

enum AccountStatus {
  Active,
  Inactive,
  Closed,
  Frozen,
}

@route("/accounts")
interface AccountOperations extends ResourceOperations<Account> {
  @route("/search")
  @get
  search(@query term: string): PaginatedResult<Account> | Error;

  @route("/{id}/transactions")
  @get
  listTransactions(
    @path id: string,
    @query fromDate?: utcDateTime,
    @query toDate?: utcDateTime,
    @query limit: int32 = 50,
    @query continuationToken?: string,
  ): PaginatedResult<Transaction> | Error;
}
```

### Results

The institution achieved:

- **Standardized patterns**: Consistent error handling, pagination, etc.
- **Centralized governance**: Standards encoded in shared TypeSpec libraries
- **Automated validation**: Validation of all APIs against governance requirements
- **Better integration**: Compatible interfaces between services
- **Improved compliance**: Security and compliance requirements built into the type system
- **Reduced duplication**: Shared models across services
- **Faster development**: Teams could focus on domain-specific concerns

## E-commerce Startup: Rapid API Development

A growing e-commerce startup needed to rapidly develop and evolve their API to support mobile and web applications.

### The Challenge

The startup faced these challenges:

- **Limited resources**: Small team needing to move quickly
- **Frequent changes**: Rapidly evolving business requirements
- **Multiple clients**: Supporting both web and mobile applications
- **Documentation needs**: Keeping documentation current for external developers
- **Consistency concerns**: Maintaining consistent API design with a small team

### TypeSpec Solution

The startup adopted TypeSpec to accelerate their API development:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "ShopFast API",
  version: "1.0.0",
})
namespace ShopFast;

// Product catalog
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  description: string;
  price: decimal;
  category: string;
  imageUrl: string;
  inventory: int32;
  featured: boolean;
}

// Shopping cart
@resource("carts")
model Cart {
  @key
  id: string;

  customerId?: string;
  items: CartItem[];
  subtotal: decimal;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model CartItem {
  productId: string;
  quantity: int32;
  unitPrice: decimal;
}

// Standard CRUD for products
interface Products extends ResourceOperations<Product> {
  @route("/featured")
  @get
  getFeatured(): Product[];

  @route("/search")
  @get
  search(@query term: string): Product[];
}

// Cart operations
interface Carts extends ResourceOperations<Cart> {
  @route("/{id}/items")
  @post
  addItem(@path id: string, @body item: CartItem): Cart;

  @route("/{id}/items/{productId}")
  @delete
  removeItem(@path id: string, @path productId: string): Cart;

  @route("/{id}/checkout")
  @post
  checkout(@path id: string): Order;
}
```

They integrated TypeSpec into their development workflow:

```bash
# Validate API design
tsp compile main.tsp

# Generate OpenAPI for documentation
tsp compile main.tsp --emit=@typespec/openapi3

# Generate client for web application
tsp compile main.tsp --emit=@typespec/ts

# Generate client for mobile application
tsp compile main.tsp --emit=@typespec/swift
```

### Results

The startup benefited in several ways:

- **Faster development**: Less time spent on boilerplate and documentation
- **Consistent design**: Maintained consistency even with rapid changes
- **Better documentation**: Always up-to-date documentation for API consumers
- **Type safety**: Fewer runtime errors in clients
- **Easier evolution**: Clearer path for API evolution as the business grew
- **Resource efficiency**: Small team able to maintain high-quality API

## Government Agency: API Standardization Initiative

A government agency launched an initiative to standardize APIs across multiple departments to improve interoperability and citizen services.

### The Challenge

The agency struggled with:

- **Siloed systems**: Each department had its own API standards
- **Integration difficulties**: Connecting systems across departments was challenging
- **Developer experience**: Inconsistent APIs made development difficult
- **Documentation quality**: Varying levels of documentation quality
- **Compliance requirements**: Ensuring all APIs met regulatory requirements

### TypeSpec Solution

The agency created a central TypeSpec library defining government-wide standards:

```typespec
// Government Agency Common Library
namespace Gov.Common;

@doc("Standard response formats")
model ApiResponse<T> {
  data: T;
  metadata: ResponseMetadata;
}

model ResponseMetadata {
  requestId: string;
  timestamp: utcDateTime;
  agency: string;
  department: string;
}

@doc("Standard error response")
@error
model ApiError {
  code: string;
  message: string;
  details?: string[];
  requestId: string;
  timestamp: utcDateTime;
  helpUrl?: string;
}

@doc("Standard pagination model")
model PaginatedResponse<T> {
  items: T[];
  totalCount: int64;
  pageSize: int32;
  pageNumber: int32;
  totalPages: int32;
}

@doc("Common audit information")
model AuditInfo {
  createdBy: string;
  createdAt: utcDateTime;
  modifiedBy?: string;
  modifiedAt?: utcDateTime;
}

// Common schemas for addresses, contact information, etc.
// ...
```

Departments then implemented APIs using these standards:

```typespec
import "@typespec/rest";
import "./gov-common.tsp";

using TypeSpec.Rest;
using Gov.Common;

@service({
  title: "Permit Application API",
})
namespace Gov.PermitDepartment;

@resource("permitApplications")
model PermitApplication {
  @key
  id: string;

  applicantId: string;
  permitType: PermitType;
  status: ApplicationStatus;
  submittedDate: utcDateTime;
  ...AuditInfo;
}

enum PermitType {
  Building,
  Business,
  Event,
  Parking,
}

enum ApplicationStatus {
  Draft,
  Submitted,
  UnderReview,
  AdditionalInfoRequested,
  Approved,
  Rejected,
}

@route("/permitApplications")
interface PermitApplications extends ResourceOperations<PermitApplication> {
  @route("/search")
  @get
  search(
    @query applicantId?: string,
    @query permitType?: PermitType,
    @query status?: ApplicationStatus,
    @query fromDate?: utcDateTime,
    @query toDate?: utcDateTime,
    @query pageSize: int32 = 20,
    @query pageNumber: int32 = 1,
  ): ApiResponse<PaginatedResponse<PermitApplication>> | ApiError;

  @route("/{id}/submit")
  @post
  submit(@path id: string): ApiResponse<PermitApplication> | ApiError;

  @route("/{id}/approve")
  @post
  approve(@path id: string, @body comments: string): ApiResponse<PermitApplication> | ApiError;

  @route("/{id}/reject")
  @post
  reject(@path id: string, @body reason: string): ApiResponse<PermitApplication> | ApiError;
}
```

### Results

The agency achieved:

- **Improved interoperability**: Systems could more easily connect across departments
- **Consistent citizen experience**: Common patterns across government services
- **Better developer experience**: Developers could more easily work across departments
- **Higher quality documentation**: Consistent, complete documentation for all APIs
- **Regulatory compliance**: Standards encoded compliance requirements
- **Reduced development costs**: Less duplication of effort across departments
- **Faster digital transformation**: Accelerated modernization initiatives

## Healthcare Provider: Secure and Compliant APIs

A healthcare provider needed to develop APIs for patient data while ensuring security and compliance with regulations like HIPAA.

### The Challenge

The healthcare provider faced unique challenges:

- **Strict regulations**: Compliance with healthcare data regulations
- **Security requirements**: Protecting sensitive patient information
- **Audit needs**: Tracking all access to patient data
- **Integration complexity**: Connecting with various healthcare systems
- **Documentation requirements**: Clear documentation for regulatory review

### TypeSpec Solution

The provider used TypeSpec to model their APIs with security and compliance in mind:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

@service({
  title: "Patient Health API",
  version: "1.0.0"
})
@info({
  termsOfService: "https://example.com/terms",
  contact: {
    name: "API Support",
    email: "support@example.com",
  },
  license: {
    name: "Proprietary",
  }
})
@security("oauth2")
namespace HealthcareAPI;

// Security definitions
@securityDefinitions({
  oauth2: {
    type: "oauth2",
    flows: {
      authorizationCode: {
        authorizationUrl: "https://auth.example.com/authorize",
        tokenUrl: "https://auth.example.com/token",
        scopes: {
          "patient.read": "Read patient data",
          "patient.write": "Write patient data",
          "admin": "Administrative access"
        }
      }
    }
  }
})
namespace Security;

// Data models
@resource("patients")
@doc("Patient health record")
model Patient {
  @key
  @doc("Unique patient identifier")
  id: string;

  @doc("Patient's full name")
  @minLength(1)
  name: string;

  @doc("Date of birth in ISO 8601 format")
  dateOfBirth: plainDate;

  @doc("Patient gender")
  gender?: string;

  @doc("Contact information")
  contact: ContactInfo;

  @doc("Primary care physician ID")
  primaryPhysicianId?: string;

  @doc("Audit trail for record changes")
  audit: AuditTrail;
}

model ContactInfo {
  email?: string;
  phone?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
}

model Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

model EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

model AuditTrail {
  createdBy: string;
  createdAt: utcDateTime;
  modifiedBy?: string;
  modifiedAt?: utcDateTime;
  accessHistory: AccessRecord[];
}

model AccessRecord {
  userId: string;
  action: string;
  timestamp: utcDateTime;
  ipAddress: string;
}

// API operations
@route("/patients")
@tag("Patients")
interface Patients {
  @get
  @security("oauth2", ["patient.read"])
  @doc("Get all patients the current user has access to")
  listPatients(
    @query pageSize: int32 = 20,
    @query pageNumber: int32 = 1
  ): Patient[] | Error;

  @get
  @route("/{id}")
  @security("oauth2", ["patient.read"])
  @doc("Get a single patient by ID")
  getPatient(@path id: string): Patient | Error;

  @post
  @security("oauth2", ["patient.write"])
  @doc("Create a new patient record")
  createPatient(@body patient: Patient): Patient | Error;

  @put
  @route("/{id}")
  @security("oauth2", ["patient.write"])
  @doc("Update an existing patient record")
  updatePatient(
    @path id: string,
    @body patient: Patient,
    @header If-Match: string
  ): Patient | Error;

  @delete
  @route("/{id}")
  @security("oauth2", ["admin"])
  @doc("Delete a patient record (admin only)")
  deletePatient(@path id: string): void | Error;

  @get
  @route("/{id}/audit")
  @security("oauth2", ["admin"])
  @doc("Get audit history for a patient record (admin only)")
  getAuditHistory(@path id: string): AuditTrail | Error;
}
```

### Results

The healthcare provider achieved:

- **Built-in security**: Security requirements enforced at the API design level
- **Compliance documentation**: Clear documentation of security controls
- **Role-based access**: Explicit modeling of permission requirements
- **Audit capabilities**: Built-in audit trails for patient data access
- **Comprehensive documentation**: Well-documented APIs for regulatory review
- **Consistent patterns**: Consistent security patterns across APIs
- **Developer guidance**: Clear guidance for developers on security requirements

## Common Patterns Across Case Studies

Across these diverse case studies, several common patterns emerge:

### 1. Centralized Standards

Organizations often create central TypeSpec libraries defining:

- Common data models
- Standard response formats
- Error handling patterns
- Security requirements
- Pagination approaches

### 2. Streamlined Workflows

TypeSpec is integrated into development workflows:

- Design phase: Collaborative API design
- Review: TypeSpec files reviewed in pull requests
- Validation: Automated checks in CI/CD pipelines
- Generation: Automated artifact generation
- Documentation: Automatic documentation updates

### 3. Versioning Strategies

Organizations implement clear versioning strategies:

- Explicit version markers
- Compatibility checking
- Multi-version support
- Deprecation notices
- Migration guidance

### 4. Reuse and Composition

APIs are built through composition:

- Shared base types
- Model inheritance
- Interface extension
- Common operation patterns
- Cross-service consistency

## Lessons Learned

These case studies reveal important lessons about successful TypeSpec adoption:

### Start with Patterns, Not Just Syntax

The most successful organizations focus on defining patterns and standards, not just learning TypeSpec syntax.

### Invest in Shared Libraries

Creating shared TypeSpec libraries provides significant returns in consistency and productivity.

### Make TypeSpec the Source of Truth

Organizations benefit most when TypeSpec becomes the authoritative definition of their APIs.

### Integrate with Existing Tools

TypeSpec works best when integrated with existing tools and processes through emitters and automation.

### Focus on Developer Experience

TypeSpec should improve developer experience both for API designers and consumers.

## Getting Started with Your Own TypeSpec Journey

Based on these case studies, here are steps for getting started with TypeSpec:

1. **Identify Pain Points**: Understand your specific API design challenges
2. **Define Core Patterns**: Establish key patterns for your APIs
3. **Create Common Library**: Build a shared foundation for your APIs
4. **Start Small**: Begin with a pilot project or service
5. **Automate Generation**: Set up automated artifact generation
6. **Expand Gradually**: Roll out to more services over time
7. **Measure Benefits**: Track improvements in consistency, quality, and productivity

By learning from these real-world examples, you can chart your own successful path with TypeSpec.

In the next section, we'll compare TypeSpec with other API modeling languages to understand its unique advantages and how it fits into the broader API development ecosystem.
