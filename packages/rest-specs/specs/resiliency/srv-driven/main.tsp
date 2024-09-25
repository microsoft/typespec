import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Versioning;
using Azure.ClientGenerator.Core;
using TypeSpec.Http;

@versioned(Versions)
@doc("""
  Test that we can grow up a service spec and service deployment into a multi-versioned service with full client support.
  
  There are three concepts that should be clarified:
  1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
  2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
  3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.
  
  We test the following configurations from this service spec:
  - A client generated from the second service spec can call the second deployment of a service with api version v1
  - A client generated from the second service spec can call the second deployment of a service with api version v2
  """)
@client({
  name: "ResiliencyServiceDrivenClient",
})
@service
@server(
  "{endpoint}/resiliency/service-driven/client:v2/service:{serviceDeploymentVersion}/api-version:{apiVersion}",
  "Testserver endpoint",
  {
    @doc("Need to be set as 'http://localhost:3000' in client.")
    endpoint: url,

    @doc("Pass in either 'v1' or 'v2'. This represents a version of the service deployment in history. 'v1' is for the deployment when the service had only one api version. 'v2' is for the deployment when the service had api-versions 'v1' and 'v2'.")
    serviceDeploymentVersion: string,

    @doc("Pass in either 'v1' or 'v2'. This represents the API version of a service.")
    apiVersion: string,
  }
)
namespace Resiliency.ServiceDriven;

@doc("Service versions")
enum Versions {
  @doc("Version 1")
  v1,

  @doc("Version 2")
  v2,
}

model PostInput {
  url: string;
}

@route("/add-optional-param")
interface AddOptionalParam {
  @scenario
  @scenarioDoc("""
    Need the following two calls:
    - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with no parameters.
    - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v2"` with query parameter `new-parameter="new"`.
    
    There are three concepts that should be clarified:
    1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
    2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
    3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.
    
    With the above two calls, we test the following configurations from this service spec:
    - A client generated from the second service spec can call the second deployment of a service with api version v1
    - A client generated from the second service spec can call the second deployment of a service with api version v2 with the updated changes
    
    Tests that we can grow up an operation from accepting no parameters to accepting an optional input parameter.
    """)
  @route("/from-none")
  @doc("Test that grew up from accepting no parameters to an optional input parameter")
  @head
  fromNone(
    @added(Versions.v2)
    @doc("I'm a new input optional parameter")
    @query
    `new-parameter`?: string,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Need the following two calls:
    - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with query parameter `parameter="required"`.
    - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v2"` with query parameter `parameter="required"` and query parameter `new-parameter="new"`.
    
    There are three concepts that should be clarified:
    1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
    2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
    3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.
    
    With the above two calls, we test the following configurations from this service spec:
    - A client generated from the second service spec can call the second deployment of a service with api version v1
    - A client generated from the second service spec can call the second deployment of a service with api version v2 with the updated changes
    
    Tests that we can grow up an operation from accepting one required parameter to accepting a required parameter and an optional parameter.
    """)
  @route("/from-one-required")
  @doc("Operation that grew up from accepting one required parameter to accepting a required parameter and an optional parameter.")
  @get
  fromOneRequired(
    @doc("I am a required parameter")
    @query
    parameter: string,

    @added(Versions.v2)
    @doc("I'm a new input optional parameter")
    @query
    `new-parameter`?: string,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Need the following two calls:
    - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with query parameter `parameter="optional"`.
    - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v2"` with query parameter `parameter="optional"` and query parameter `new-parameter="new"`.
    
    There are three concepts that should be clarified:
    1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
    2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
    3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.
    
    With the above two calls, we test the following configurations from this service spec:
    - A client generated from the second service spec can call the second deployment of a service with api version v1
    - A client generated from the second service spec can call the second deployment of a service with api version v2 with the updated changes
    
    Tests that we can grow up an operation from accepting one optional parameter to accepting two optional parameters.
    """)
  @route("/from-one-optional")
  @doc("Tests that we can grow up an operation from accepting one optional parameter to accepting two optional parameters.")
  @get
  fromOneOptional(
    @doc("I am an optional parameter")
    @query
    parameter?: string,

    @added(Versions.v2)
    @doc("I'm a new input optional parameter")
    @query
    `new-parameter`?: string,
  ): NoContentResponse;
}

@scenario
@scenarioDoc("""
  Need the following two calls:
  - Call with client spec version "v1" with `serviceDeploymentVersion="v2"` and `apiVersion="v2"`
  - Call with client spec version "v2" with `serviceDeploymentVersion="v2"` and `apiVersion="v2"`
  
  There are three concepts that should be clarified:
  1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
  2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
  3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.
  
  With the above two calls, we test the following configurations from this service spec:
  - A client generated from the first service spec can break the glass and call the second deployment of a service with api version v2
  - A client generated from the second service spec can call the second deployment of a service with api version v2 with the updated changes
  
  Tests that we can grow up by adding an operation.
  """)
@added(Versions.v2)
@route("/add-operation")
@doc("Added operation")
@delete
op addOperation(): NoContentResponse;
