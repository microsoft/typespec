# Generating server stubs with TypeSpec: a user guide

This guide will walk you through the process of generating server stubs from your TypeSpec API specifications, enabling you to quickly scaffold and develop your backend services.

Think of it like building a house. You could ask a builder to build a house for you without any specific instructions, but the result might not be what you had in mind. However, if you provide the builder with a detailed blueprint, they can create a house that matches your vision. **In this analogy, TypeSpec is the blueprint for your API, and the server stub code is the foundation. With this blueprint and foundation in place, you can more efficiently build the rest of your service.**

TypeSpec plays a vital role in your project. By providing a well-defined blueprint and a solid foundation for your API design, TypeSpec helps make the development process more efficient, consistent, and structured.

**Key benefits:**

- **Accelerated development:** Jumpstart your server implementation with automatically generated models and controllers.
- **API consistency:** Ensure your server implementation adheres precisely to your API specification.
- **Reduced manual effort:** Eliminate repetitive coding tasks, freeing you to focus on business logic.
- **Improved maintainability:** Easily update your server as your API evolves by regenerating the stubs from the updated TypeSpec definition.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js:** (version 20.x or later). Download from [https://nodejs.org/](https://nodejs.org/)
- **npm:** (version 6.x or later). Typically included with Node.js.
- **TypeSpec compiler:** Install the latest `@next` version globally using:

  ```bash
  npm install -g @typespec/compiler@next
  ```

- **Language-specific SDKs (optional):** Depending on the target language of your server, you may need the appropriate SDK. For example, to emit .NET SDKs, install the [.NET SDK](https://dotnet.microsoft.com/download). For Java, install the [JDK](https://www.oracle.com/java/technologies/downloads/).

## Workflow options

You can use the Server Stub Generation feature from TypeSpec in two ways:

1.  **Command-line interface (CLI):** Ideal for automated builds and developers comfortable with the command line.
2.  **Visual studio code (VSCode) IDE with the TypeSpec extension:** Provides a seamless, integrated development experience within VSCode.

## Configuring `tspconfig.yaml` for server stub generation

The `tspconfig.yaml` file is the heart of your TypeSpec project. It defines how your TypeSpec code is compiled and what outputs are generated. To enable server stub generation, you need to configure the `emit` and `options` sections of this file.

Here's an example `tspconfig.yaml` file that enables server stub generation for both C# (ASP.NET Core) and JavaScript (Node.js/Express):

```yaml
emit:
  - "@typespec/openapi3"
  - "@typespec/http-client-csharp"
  - "@typespec/http-client-js"
  - "@typespec/http-server-js"
  - "@typespec/http-server-csharp"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{project-root}/openapi/"
  "@typespec/http-client-csharp":
    emitter-output-dir: "{project-root}/clients/csharp"
  "@typespec/http-client-js":
    emitter-output-dir: "{project-root}/clients/javascript"
  "@typespec/http-server-csharp":
    emitter-output-dir: "{project-root}/servers/aspnet/generated"
  "@typespec/http-server-js":
    emitter-output-dir: "{project-root}/servers/javascript"
```

**Explanation:**

- **`emit` section:** This section lists the _emitters_ that you want to use. An emitter is a plugin that takes your TypeSpec code and generates output in a specific format (e.g., OpenAPI, C# client, JavaScript server).
  - `"@typespec/openapi3"`: Generates an OpenAPI 3.0 specification.
  - `"@typespec/http-client-csharp"`: Generates a C# client SDK.
  - `"@typespec/http-client-js"`: Generates a JavaScript client SDK.
  - `"@typespec/http-server-csharp"`: Generates a C# (ASP.NET Core) server stub.
  - `"@typespec/http-server-js"`: Generates a JavaScript (Node.js/Express) server stub.
- **`options` section:** This section configures the emitters. For each emitter, you can specify options like the output directory.
  - `emitter-output-dir`: This option specifies where the generated code should be placed. The `{project-root}` variable refers to the root directory of your TypeSpec project.

**Important:** Make sure you have installed all the necessary emitters:

```bash
npm install -D @typespec/openapi3 @typespec/http-client-csharp @typespec/http-client-js @typespec/http-server-csharp @typespec/http-server-js
```

## Using the cli to generate server stubs

1.  **Create a TypeSpec project:** If you don't already have one, create a new TypeSpec project using `tsp init`.

    ```bash
    mkdir my-api
    cd my-api
    tsp init
    ```

    During `tsp init`, you will be prompted to select different emitters, including server and client. If you have the necessary dependencies installed, TypeSpec can automatically populate your `tspconfig.yaml` file.

2.  **Define your api:** Write your API specification in a `.tsp` file (e.g., `main.tsp`). This is where you define your models, operations, and routes.

3.  **Compile your TypeSpec:** Use the `tsp compile` command to generate server stubs and other artifacts based on your specification.

    ```bash
    tsp compile .
    ```

    The compiler will output the generated server stubs to the directories specified in your `tspconfig.yaml` file (e.g., `servers/aspnet/generated` for C#).

4.  **Project structure:** After compiling, you will typically see the following structure:

    ```text
    \my-api
        \tsp-output
            \schema                  # Generated OpenAPI 3.0 spec
                openapi.yaml
            \clients                 # Generated Client SDK for selected language(s)
                \dotnet
                \node
                ...
            \servers                 # Generated Server Code
                \aspnet
                    \generated    # Generated code for ASP.NET
                \node
                    \generated   # Generated code for Node.js
        main.tsp
        tspconfig.yaml
        package.json
    ```

## Understanding the generated code structure

The server stub generation process creates a basic code structure for your server application. The specific files and folders generated depend on the target language and the complexity of your API.

**C# (ASP.NET core) example:**

Based on a generic 'todo' style app, the generated code structure for C# will typically include:

```text
servers/
┣ aspnet/
┃ ┗ generated/
┃   ┣ controllers/               # Contains the base controller classes
┃ ┃ ┃ ┣ CommentOpsOperationsControllerBase.cs  # Base class for comment-related API operations
┃ ┃ ┃ ┣ CommentsOperationsControllerBase.cs   # Base class for general comment operations
┃ ┃ ┃ ┣ ... (other controller base classes)
┃   ┣ lib/                     # Utility functions
┃ ┃ ┃ ┣ ArrayConstraintAttribute.cs    # Custom attributes for enforcing array constraints
┃ ┃ ┃ ┣ Base64UrlConverter.cs        # Utility for Base64 URL encoding
┃ ┃ ┃ ┣ ... (other utility files)
┃   ┣ models/                  # Defines the data models (DTOs) used by the API
┃ ┃ ┃ ┣ Attachment.cs              # Data model representing an attachment
┃ ┃ ┃ ┣ Collaborator.cs            # Data model representing a collaborator
┃ ┃ ┃ ┣ ... (other model files)
┃   ┗ operations/              # Defines service interface
┃ ┃ ┃ ┣ ICommentOpsOperations.cs  # Service interface for comment-related operations
┃ ┃ ┃ ┣ ICommentsOperations.cs   # Service interface for general comment operations
┃ ┃ ┃ ┣ ... (other operation interface files)
```

- **`Controllers`**: These folders contain _base classes_ for your API controllers (e.g., `CommentOpsOperationsControllerBase.cs`, `TodoItemsOperationsControllerBase.cs`). These base classes define the API endpoints and handle basic request processing. **You will need to create concrete controller classes that inherit from these base classes and implement your business logic.**

- **`lib`**: This directory contains utility classes such as custom attributes used for server side validation to ensure input data adhere to the spec.

- **`Models`**: These files define the data models (also known as Data Transfer Objects or DTOs) used in your API (e.g., `TodoItem.cs`, `Project.cs`). These classes represent the structure of the data being exchanged between the client and the server.

- **`Operations`**: These files defines the service interface used for API operations.

**Node.js/express example:**

```
node/
┗ tsp-output/
  ┗ @typespec/
┃   ┗ http-server-javascript/
┃ ┃   ┣ helpers/         # Contains helper functions
┃ ┃ ┃ ┃ ┣ header.ts    # Helper for header operations
┃ ┃ ┃ ┃ ┣ multipart.ts # Helper for multipart form data
┃ ┃ ┃ ┃ ┗ router.ts    # Helper for routing
┃ ┃   ┣ http/           # Contains http request related code
┃ ┃ ┃ ┃ ┗ router.ts    # Helper for setting up http router
┃ ┃   ┗ models/         # Contains generated data models
┃ ┃ ┃   ┣ all/         # Contains helper import all the data models
┃ ┃ ┃ ┃ ┃ ┗ getitdone/  # Folder containing data models generated from getitdone namespace
┃ ┃ ┃ ┃ ┃   ┗ index.ts   # Helper to export the data models
┃ ┃ ┃   ┗ synthetic.ts # Type spec synthetic code
```

- **`Helpers`**: This folder contains helper functions to perform common operations such as setting header, and multipart operations.

- **`Http`**: This folder contains code for setting up the http requests.

- **`Models`**: This folder contains code and helper functions for all data models.

## Cli: setting up the project and adding necessary code:

Now that you have the base controller, models and service interface generated, the next step is to implement the code with a service scaffolding and business logic for a runnable server. Please follow the instruction below:

- **ASP.NET webapi example (C#):**

  1.  Create a new ASP.NET Core Web API project:

      ```bash
      cd servers/aspnet
      dotnet new webapi
      dotnet add package Swashbuckle.AspNetCore
      ```

  2.  Replace content of `Program.cs` with code below:

      ```csharp
      var builder = WebApplication.CreateBuilder(args);

      builder.Services.AddControllers();
      builder.Services.AddEndpointsApiExplorer();
      builder.Services.AddSwaggerGen();

      var app = builder.Build();

      // Configure the HTTP request pipeline.
      if (app.Environment.IsDevelopment())
      {
          app.UseSwagger();
          app.UseSwaggerUI();
      }

      app.UseAuthorization();
      app.MapControllers();

      app.Run();
      ```

  3.  **Additional scaffolding command (ASP.NET only)**. Note that you'll have to go up one level to execute the scaffolding command.

      ```bash
      cd ..
      npx hscs scaffold ./generated/ . --use-swaggerui
      ```

      The scaffold command will set up dependency injection for the controllers and interfaces, and also generates a swagger ui for the project.

  4.  The controllers and the models that were created are just service interfaces, so you'll need to add your business logic code here. Follow the examples below:

      ```csharp
      using Microsoft.AspNetCore.Mvc;
      using server.Models;
      using server.Operations;
      using System.ComponentModel.DataAnnotations;

      namespace server.Controllers
      {
          [ApiController]
          public class CommentOpsOperationsController : CommentOpsOperationsControllerBase
          {
              private static List<Comment> _comments = new List<Comment>();

              /// <inheritdoc />
              public override Task<IActionResult> CreateComment([Required] string project, [Required] string todoItem, [Required] CreateCommentRequest body)
              {
                  var newComment = new Comment()
                  {
                      Id = Guid.NewGuid().ToString(),
                      ProjectId = project,
                      TodoItemId = todoItem,
                      Body = body.Body,
                      Created = DateTime.Now
                  };
                  _comments.Add(newComment);
                  return Task.FromResult<IActionResult>(CreatedAtAction(nameof(GetComment), new { id = newComment.Id }, newComment));
              }

              /// <inheritdoc />
              public override Task<IActionResult> GetComment(string id)
              {
                  var comment = _comments.FirstOrDefault(c => c.Id == id);
                  if (comment == null)
                  {
                      return Task.FromResult<IActionResult>(NotFound());
                  }

                  return Task.FromResult<IActionResult>(Ok(comment));
              }
          }
      }
      ```

      **Important**: if your controller file is not automatically generated as `CommentOpsOperationsController.cs`, you will have to manually add in `[ApiController]` and inherit the base class `CommentOpsOperationsControllerBase`.

- **Node.js/express example:**

  [Placeholder: Detailed instructions on setting up a Node.js/Express project, integrating the generated code, and running the server will be added here.]

  1.  **Create a basic express app:** Use the Express generator to create a new project:

      ```bash
      npm install -g express-generator
      express my-express-app
      cd my-express-app
      npm install
      ```

  2.  **Install additional dependencies:** You may need additional dependencies depending on your API requirements (e.g., `body-parser` for parsing request bodies).

      ```bash
      npm install body-parser --save
      ```

  3.  **Integrate generated code:** Copy the contents of the `servers/node/tsp-output/@typespec/http-server-javascript` directory into your Express project. You will likely need to adapt the generated code to fit the Express routing and middleware structure.

  4.  **Configure routes:** Define your API routes in your Express app, mapping them to the generated controller functions.

  5.  **Run the server:** Start the Express server:

      ```bash
      npm start
      ```

## Cli: running the project and adding necessary code:

Now that you have the base controller, models and service interface generated, the next step is to implement the code with a service scaffolding and business logic for a runnable server. Please follow the instruction below:

1.  **ASP.NET webapi server (C#):**

    1.  Navigate to the server directory:

        ```bash
        cd servers/aspnet
        ```

    2.  Run the server:

        ```bash
        dotnet run
        ```

    3.  Open your browser and navigate to `http://localhost:[PORT#]/swagger/index.html` (replace `[PORT#]` with the actual port number shown in the console output). You should see the Swagger UI, allowing you to test your API endpoints.

## Using the vscode extension

The TypeSpec Extension for VSCode offers a convenient way to generate server stubs directly from your IDE.

1.  **Install the extension:** Search for "TypeSpec" in the VSCode Extensions Marketplace and install the official TypeSpec extension.

2.  **Create a TypeSpec project:**

    - Click “Create TypeSpec Project” in the EXPLORE sidebar.
      - `[Placeholder: Screenshot showing "Create TypeSpec Project" in the VSCode Explorer sidebar]`
    - Select a project root folder.
    - Provide the required inputs via Quick Picks, similar to using `tsp init` on the command line.

3.  **Define your api:** Write your API specification in a `.tsp` file.

4.  **Generate the server stub:**

    - Right-click on a `.tsp` file to open the context menu.
    - Select “Generate from TypeSpec”.
      - `[Placeholder: Screenshot showing the "Generate from TypeSpec" option in the context menu]`
    - Select "Server Stub" from the Emitter Types.
      - `[Placeholder: Screenshot showing the "Emitter Types" Quick Pick with "Server Stub" selected]`
    - Choose the desired target language (e.g., ".NET – Generate .Net server stub by @typespec/http-server-csharp").
      - `[Placeholder: Screenshot showing the language selection Quick Pick]`
    - TypeSpec compiler will run in the background, generating a new directory under "servers\<language>".

      - `[Placeholder: Screenshot showing the generated server directory structure in VSCode]`

## Next steps

- **Add business logic:** Implement the core logic for your API endpoints within the generated server stub. **Remember that the generated controllers are base classes; you will need to create concrete classes that inherit from them and implement your business logic.**
- **Configure routes:** Verify and configure the routes defined in your server project. You may need to adjust the routing configuration to match your TypeSpec definitions.
- **Add data persistence:** Integrate your server with a database or other data storage solution.
- **Implement authentication and authorization:** Secure your API by adding appropriate authentication and authorization mechanisms.

## Getting help

If you encounter any issues or have questions about TypeSpec and server stub generation, please consult the following resources:

**TypeSpec documentation:**

[Official TypeSpec documentation](https://typespec.io/docs/)

**TypeSpec community:**

[Join our Discord discussion](https://aka.ms/typespec/discord/)

**GitHub issues:**

[Report bugs and suggest features on the TypeSpec GitHub repository](https://github.com/microsoft/typespec/issues)
