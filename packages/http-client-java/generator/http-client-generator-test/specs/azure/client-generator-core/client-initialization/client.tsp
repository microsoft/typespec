import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";
import "@typespec/http";

using Spector;
using Http;

@route("/azure/client-generator-core/client-initialization")
namespace _Specs_.Azure.ClientGeneratorCore.ClientInitialization;

@@global.Azure.ClientGenerator.Core.clientNamespace(_Specs_.Azure.ClientGeneratorCore.ClientInitialization,
  "azure.clientgenerator.core.clientinitialization",
  "java"
);
@@global.Azure.ClientGenerator.Core.clientNamespace(Service,
  "azure.clientgenerator.core.clientinitialization",
  "java"
);

model HeaderParamClientOptions {
  @doc("The name of the client. This parameter is used as a header in all operations.")
  name: string;
}

model MultipleParamsClientOptions {
  @doc("The name of the client. This parameter is used as a header in all operations.")
  name: string;

  @doc("The region to use for all operations. This parameter is used as a query parameter.")
  region: string;
}

model MixedParamsClientOptions {
  @doc("The name of the client. This parameter is used as a header in all operations.")
  name: string;
}

model PathParamClientOptions {
  @doc("The name of the blob. This parameter is used as a path parameter in all operations.")
  blobName: string;
}

model ParamAliasClientOptions {
  @doc("Blob name for the client.")
  @global.Azure.ClientGenerator.Core.paramAlias("blob")
  blobName: string;
}

// Scenario 1: Header parameter moved to client level
@scenarioDoc("""
  Client for testing header parameter moved to client level.
  
  Parameters elevated to client level:
  - name: "test-name-value" (header parameter)
  
  Expected client usage:
  ```ts
  const client = new HeaderParamClient({
    name: "test-name-value"
  });
  
  client.withQuery(id: "test-id");  // No need to pass name here
  client.withBody({ name: "test-name" });  // No need to pass name here
  ```
  """)
@scenario
@doc("Client for testing header parameter moved to client level.")
@global.Azure.ClientGenerator.Core.client({
  name: "HeaderParamClient",
  service: Service,
})
@global.Azure.ClientGenerator.Core.clientInitialization(HeaderParamClientOptions)
@route("/header-param")
interface HeaderParam {
  withQuery is Service.HeaderParam.withQuery;
  withBody is Service.HeaderParam.withBody;
}

// Scenario 2: Multiple parameters (header and query) moved to client level
@scenarioDoc("""
  Client for testing multiple parameters (header and query) moved to client level.
  
  Parameters elevated to client level:
  - name: "test-name-value" (header parameter)
  - region: "us-west" (query parameter)
  
  Expected client usage:
  ```ts
  const client = new MultipleParamsClient({
    name: "test-name-value",
    region: "us-west"
  });
  
  client.withQuery(id: "test-id");  // No need to pass name or region here
  client.withBody({ name: "test-name" });  // No need to pass name or region here
  ```
  """)
@scenario
@global.Azure.ClientGenerator.Core.client({
  name: "MultipleParamsClient",
  service: Service,
})
@global.Azure.ClientGenerator.Core.clientInitialization(MultipleParamsClientOptions)
@route("/multiple-params")
interface MultipleParams {
  withQuery is Service.MultipleParams.withQuery;
  withBody is Service.MultipleParams.withBody;
}

// Scenario 3: Mix of client-level and method-level parameters
@scenarioDoc("""
    Client for testing a mix of client-level and method-level parameters.
    
    Parameters elevated to client level:
    - name: "test-name-value" (header parameter)
    
    Parameters remaining at method level:
    - region: "us-west" (query parameter)
    
    Expected client usage:
    ```ts
    const client = new MixedParamsClient({
      name: "test-name-value"
    });
    
    client.withQuery(region: "us-west", id: "test-id");  // region stays as method param
    client.withBody( region: "us-west", body: { name: "test-name" });  // region stays as method param
    ```
  """)
@scenario
@global.Azure.ClientGenerator.Core.client({
  name: "MixedParamsClient",
  service: Service,
})
@global.Azure.ClientGenerator.Core.clientInitialization(MixedParamsClientOptions)
@route("/mixed-params")
interface MixedParams {
  withQuery is Service.MixedParams.withQuery;
  withBody is Service.MixedParams.withBody;
}

// Scenario 4: Path parameter moved to client level
@scenarioDoc("""
  Client for testing a path parameter (blobName) moved to client level.
  
  Parameters elevated to client level:
  - blobName: "sample-blob" (path parameter)
  
  Expected client usage:
  ```ts
  const client = new PathParamClient({
    blobName: "sample-blob"
  });
  
  // No need to pass blobName to any operations
  client.withQuery(format: "text");  
  client.getStandalone();
  client.deleteStandalone();
  ```
  """)
@scenario
@global.Azure.ClientGenerator.Core.client({
  name: "PathParamClient",
  service: Service,
})
@global.Azure.ClientGenerator.Core.clientInitialization(PathParamClientOptions)
@route("/path")
interface PathParam {
  withQuery is Service.PathParam.withQuery;
  getStandalone is Service.PathParam.getStandalone;
  deleteStandalone is Service.PathParam.deleteStandalone;
}

// Scenario 5: Parameter aliases for better client API names
@scenarioDoc("""
  Client for testing the @paramAlias decorator for renaming parameters in client code.
  
  Parameters elevated to client level:
  - blobName: "sample-blob" (path parameter)
  
  Expected client usage:
  ```ts
  // Elevated to client level via alias
  client.withAliasedName();
  
  // Elevated to client level via original name
  client.withOriginalName();
  ```
  """)
@scenario
@global.Azure.ClientGenerator.Core.clientInitialization(ParamAliasClientOptions)
@global.Azure.ClientGenerator.Core.client({
  name: "ParamAliasClient",
  service: Service,
})
@route("/param-alias")
interface ParamAlias {
  withAliasedName is Service.ParamAlias.withAliasedName;
  withOriginalName is Service.ParamAlias.withOriginalName;
}

@global.Azure.ClientGenerator.Core.client({
  name: "ParentClient",
  service: Service,
})
namespace ParentClient {
  @scenarioDoc("""
    Client for testing a path parameter (blobName) moved to client level, in child client.
    
    The child client can be initialized individually, or via its parent client.
    
    Parameters elevated to client level:
    - blobName: "sample-blob" (path parameter)
    
    Expected client usage:
    ```ts
    // via ParentClient
    const client = new ParentClient.getChildClient({
      blobName: "sample-blob"
    });
    
    // directly
    const client = new ChildClient({
      blobName: "sample-blob"
    });
    
    // No need to pass blobName to any operations
    client.withQuery(format: "text");  
    client.getStandalone();
    client.deleteStandalone();
    ```
    """)
  @scenario
  @global.Azure.ClientGenerator.Core.operationGroup
  @global.Azure.ClientGenerator.Core.clientInitialization({
    parameters: PathParamClientOptions,
    initializedBy: global.Azure.ClientGenerator.Core.InitializedBy.individually | global.Azure.ClientGenerator.Core.InitializedBy.parent,
  })
  @route("/child-client")
  interface ChildClient {
    withQuery is Service.ChildClient.withQuery;
    getStandalone is Service.ChildClient.getStandalone;
    deleteStandalone is Service.ChildClient.deleteStandalone;
  }
}
