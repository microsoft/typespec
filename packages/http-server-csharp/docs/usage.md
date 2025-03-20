---
title: Overview
sidebar_position: 0
toc_min_heading_level: 2
toc_max_heading_level: 3
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

Generated C-Sharp Overview

## Layout

The generated code layout inside the 'generated' folder is as follows:

- **generated**

  - **controllers**: A set of ASP.Net core MVC controllers representing the operations in the spec, one for each interface or namespace with operations
  - **lib**: A set of library files used in implementing generated models and controllers
  - **models**: A set of models representing the data in requests and response
  - **operations**: A set of interfaces called by the controllers, that should be implemented with the business logic for each operation.

  You should recompile whenever you make changes in your TypeSpec and these files will be replaced inline to reflect the spec changes, without changing any of your hand-written implementation in the project.

## Scaffolding

If you use the scaffolding cli (hscs) or use the `--emit-mocks` option on compilation, a
fully-functional .Net 9 project will be created with mock implementations of your business
logic, ready to compile and run.

The following files will be generated. It is expected that you will edit or replace these
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
  provides a visual representation of operations and provides a GUI client for the service that you can use right away.

  ## Next steps after compilation

  The generated controllers will automatically listen at the routes you specified in TypeSpec.
  Controllers perform validation of input requests and use the dependency injection container to discover and instantiate your implementations of business logic for your operations. The business logic implementations are expected to return the response as specified in your operation, with the controllers adding specified Http metadata (like response status code). Your business logic can use the IHttpContextAccessor to access additional details of requests and responses, as demonstrated in mock implementations. After successful generation, you should:

  - Implement the business logic interfaces for your operations
  - Update MockRegistration.cs, or register each of your interfaces as part of application startup
  - Update configuration to suit your needs
