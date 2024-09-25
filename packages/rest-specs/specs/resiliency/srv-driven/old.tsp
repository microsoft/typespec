import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;
using TypeSpec.Versioning;

@versioned(Versions)
@doc("""
  Test that we can grow up a service spec and service deployment into a multi-versioned service with full client support.
  """)
@client({
  name: "ResiliencyServiceDrivenClient",
})
@service
@server(
  "{endpoint}/resiliency/service-driven/client:v1/service:{serviceDeploymentVersion}/api-version:{apiVersion}",
  "Testserver endpoint",
  {
    @doc("Need to be set as 'http://localhost:3000' in client.")
    endpoint: url,

    @doc("Pass in either 'v1' or 'v2'. This represents a version of the service deployment in history. 'v1' is for the deployment when the service had only one api version. 'v2' is for the deployment when the service had api-versions 'v1' and 'v2'.")
    serviceDeploymentVersion: string,

    @doc("Pass in 'v1'. This represents the API version of the service. Will grow up in the next deployment to be both 'v1' and 'v2'")
    apiVersion: string,
  }
)
namespace Resiliency.ServiceDriven;

@doc("Service versions.")
enum Versions {
  @doc("Version 1")
  v1,
}

model PostInput {
  url: string;
}

@route("/add-optional-param")
interface AddOptionalParam {
  @scenario
  @scenarioDoc("""
      Need the following two calls:
      - Pass in `serviceDeploymentVersion="v1"` and `apiVersion="v1"` with no parameters.
      - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with no parameters.
    
      There are three concepts that should be clarified:
      1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
      2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
      3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.
    
      With the above two calls, we test the following configurations from this service spec:
      - A client generated from the first service spec can call the first deployment of a service with api version v1
      - A client generated from the first service spec can call the second deployment of a service with api version v1
    
      In the next service spec, we will test that we can grow this operation from accepting no parameters to accepting an optional parameter.
    """)
  @route("/from-none")
  @doc("Test that currently accepts no parameters, will be updated in next spec to accept a new optional parameter as well")
  @head
  fromNone(): NoContentResponse;

  @scenario
  @scenarioDoc("""
      Need the following two calls:
      - Pass in `serviceDeploymentVersion="v1"` and `apiVersion="v1"` with query parameter `parameter="required"`.
      - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with query parameter `parameter="required"`.
    
      There are three concepts that should be clarified:
      1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
      2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
      3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.
    
      With the above two calls, we test the following configurations from this service spec:
      - A client generated from the first service spec can call the first deployment of a service with api version v1
      - A client generated from the first service spec can call the second deployment of a service with api version v1
    
      In the next service spec, we will test that we can grow this operation from accepting one required parameter to accepting both a required and an optional parameter.
    """)
  @route("/from-one-required")
  @doc("Test that currently accepts one required parameter, will be updated in next spec to accept a new optional parameter as well")
  @get
  fromOneRequired(
    @doc("I am a required parameter")
    @query
    parameter: string,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
      Need the following two calls:
      - Pass in `serviceDeploymentVersion="v1"` and `apiVersion="v1"` with query parameter `parameter="optional"`.
      - Pass in `serviceDeploymentVersion="v2"` and `apiVersion="v1"` with query parameter `parameter="optional"`.
    
      There are three concepts that should be clarified:
      1. Client spec version: refers to the spec that the client is generated from. 'v1' is a client generated from old.tsp and 'v2' is a client generated from main.tsp.
      2. Service deployment version: refers to a deployment version of the service. 'v1' represents the initial deployment of the service with a single api version. 'v2' represents the new deployment of a service with multiple api versions
      3. Api version: The initial deployment of the service only supports api version 'v1'. The new deployment of the service supports api versions 'v1' and 'v2'.
    
      With the above two calls, we test the following configurations from this service spec:
      - A client generated from the first service spec can call the first deployment of a service with api version v1
      - A client generated from the first service spec can call the second deployment of a service with api version v1
    
      In the next service spec, we will test that we can grow this operation from accepting one optional parameter to accepting two optional parameters.
    """)
  @route("/from-one-optional")
  @doc("Test that currently accepts one optional parameter, will be updated in next spec to accept a new optional parameter as well")
  @get
  fromOneOptional(
    @doc("I am an optional parameter")
    @query
    parameter?: string,
  ): NoContentResponse;
}
