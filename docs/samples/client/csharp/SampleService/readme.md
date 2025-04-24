# Sample Service

This package represents a sample HTTP service and the generated code produced after compiling with the `@typespec/http-client-csharp` emitter. The package makes use of a logging plugin in order to enrich each method with logs indicating when the method is called and any exceptions thrown from the method. The `logging-plugin` is specified in the `package.json` file. In order to compile this project locally, clone the repo, navigate to the `SampleService` directory and run the following command:
`tsp compile .`
