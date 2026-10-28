---
title: Generated C-Sharp Overview
---

# Generated C-Sharp Overview

## Layout

The code layout inside the 'generated' folder is as follows:

- **generated**

  - **controllers**: A set of ASP.Net core MVC controllers representing the operations in the spec, one for each interface or namespace with operations
  - **lib**: A set of library files used in implementing generated models and controllers
  - **models**: A set of models representing the data in requests and response
  - **operations**: A set of interfaces called by the controllers, that should be implemented with the business logic for each operation.

  You should recompile whenever you make changes in your TypeSpec and these files will be replaced inline to reflect the spec changes, without changing any of your hand-written implementation in the project.

## Scaffolding

If you use the scaffolding cli (hscs) or use the `--emit-mocks "mocks-and-project-files"` option on compilation, a
fully-functional .Net 9 project will be created with mock implementations of your business
logic, ready to compile and run.

The following additional files will be generated. It is expected that you will edit or replace these
files as you implement your service, so you should only regenerate them when needed.
To protect from inadvertently changing any edits you may have made to these files,
these files will be overwritten by the emitter unless you specify the `--overwrite` option.

- **ServiceProject.csproj**: The project file
- **Program.cs**: Entry point that sets up the app
- **appSettings.Development.json**: Configuration settings for the development environment
- **appSettings.json**: Configuration settings for the production environment
- **Properties**
  - **launchSettings.json**: Launch configurations for the service (including local ports)
- **mocks**: Simple implementations of business logic interfaces that return simple responses.
  this allows testing your service out before writing any implementation code.

  - **MockRegistration.cs**: Called from the Program.cs startup, registers each of the business
    logic implementations in the dependency injection container.
  - **IInitializer.cs**: Interface used in the mocks to create responses.
  - **Initializer.cs**: Implementation of the interface to create mock responses.

## SwaggerUI

If you include the `@typespec/openapi3` emitter in your typespec project, you can include a
SwaggerUI endpoint in the generated service using the `--use-swaggerui` option. This endpoint
provides a visual representation of operations and provides a web GUI client connected to the service that you can use right away to try out service operations.

## How Components Work Together

### Controllers

The generated controllers automatically listen at the routes you specified in TypeSpec. Controllers perform validation of input requests, call your implementation of business logic interfaces to perform the operation, and return the appropriate Http response.

### Business Logic Interfaces

You must implement business loginc interfaces to perform the work of each operation. There is one
business logic interface for each `interface` type in your spec, or for each namespace that contain operations. Business logic can assume that input types meet the constraints specified in TypeSpec and are responsible for returning the response type for the operation.

You can use the `--emit-mocks` option to emit mock implementations of your business logic, these mocks demonstrate a simple implementation that returns responses that match the response type in TypeSpec. They also show how to use `IHttpContextAccessor` to access additional details of the Http request and response.

### Discovery using the ASP.Net Core Dependency Injection Container

The Controllers find your business logic implementation through the ASP.Net dependency injection container. At server start, you register each of your implementations with the dependency injection container and they will automatically be instantiated and used by the controllers.

If you use the `--emit-mocks` option, sample code registering mock implementations is emitted to `mocks/MockRegistration.cs`.

### Models

Model classes represent the data passed in Http requests and response and the data that passes from the front end controllers to your business logic.

Models are partial, so you can add additional members for internal usage as needed by putting a partial class definition with additional members outside the `generated` folder in your project.

### Next Steps

After successful generation, you should:

- Use the SwaggerUI endpoint to test out the running service
- Implement the business logic interfaces for your operations
- Update MockRegistration.cs, or register each of your interfaces as part of application startup
- Update configuration to suit your needs
