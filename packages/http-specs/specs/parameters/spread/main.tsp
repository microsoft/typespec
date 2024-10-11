import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for the spread operator.")
@scenarioService("/parameters/spread")
namespace Parameters.Spread;

@route("/model")
namespace Model {
  @doc("This is a simple model.")
  model BodyParameter {
    name: string;
  }

  @scenario
  @scenarioDoc("""
    Test case for spread named model. 
    
    Should not generate request body model named `BodyParameter`.
    Should generate an operation like below:
    ```
    spreadAsRequestBody(name: string)
    ```
    Note the parameter name is guessed from the model name and it may vary by language.
    
    Expected request body:
    ```json
    { "name": "foo" }
    ```
    """)
  @route("/request-body")
  @put
  op spreadAsRequestBody(...BodyParameter): NoContentResponse;

  @doc("This is a model only with `@body` property.")
  model CompositeRequestOnlyWithBody {
    @body body: BodyParameter;
  }

  @scenario
  @scenarioDoc("""
    Test case for spread model only with `@body` property. 
    
    Should generate request body model named `BodyParameter`.
    Should not generate model named `CompositeRequestOnlyWithBody`.
    Should generate an operation like below:
    ```
    spreadCompositeRequestOnlyWithBody(bodyParameter: BodyParameter)
    ```
    Note the parameter name is guessed from the model name and it may vary by language.
    
    Expected request body:
    ```json
    { "name": "foo" }
    ```
    """)
  @route("/composite-request-only-with-body")
  @put
  op spreadCompositeRequestOnlyWithBody(...CompositeRequestOnlyWithBody): NoContentResponse;

  @doc("This is a model without `@body` property.")
  model CompositeRequestWithoutBody {
    @path
    name: string;

    @header
    testHeader: string;
  }

  @scenario
  @scenarioDoc("""
    Test case for spread model without `@body` property. 
    
    Should not generate model named `CompositeRequestOnlyWithBody`.
    Should generate an operation like below:
    ```
    spreadCompositeRequestWithoutBody(name: string, testHeader: string)
    ```
    
    Expected path parameter: name="foo"
    Expected header parameter: testHeader="bar"
    """)
  @route("/composite-request-without-body/{name}")
  @put
  op spreadCompositeRequestWithoutBody(...CompositeRequestWithoutBody): NoContentResponse;

  @doc("This is a model with all http request decorator.")
  model CompositeRequest {
    @path
    name: string;

    @header
    testHeader: string;

    @body
    body: BodyParameter;
  }

  @scenario
  @scenarioDoc("""
    Test case for spread model with all http request decorator. 
    
    Should generate request body model named `BodyParameter`.
    Should not generate model named `CompositeRequest`.
    Should generate an operation like below:
    ```
    spreadCompositeRequest(name: string, testHeader: string, bodyParameter: BodyParameter)
    ```
    Note the parameter name is guessed from the model name and it may vary by language.
    
    Expected path parameter: name="foo"
    Expected header parameter: testHeader="bar"
    Expected request body:
    ```json
    { "name": "foo" }
    ```
    """)
  @route("/composite-request/{name}")
  @put
  op spreadCompositeRequest(...CompositeRequest): NoContentResponse;

  @doc("This is a model with non-body http request decorator.")
  model CompositeRequestMix {
    @path
    name: string;

    @header
    testHeader: string;

    prop: string;
  }

  @scenario
  @scenarioDoc("""
    Test case for spread model with non-body http request decorator. 
    
    Should not generate model named `CompositeRequestMix`.
    Should generate an operation like below:
    ```
    spreadCompositeRequestMix(name: string, testHeader: string, prop: string)
    ```
    Note the parameter name is guessed from the model name and it may vary by language.
    
    Expected path parameter: name="foo"
    Expected header parameter: testHeader="bar"
    Expected request body:
    ```json
    { "prop": "foo" }
    ```
    """)
  @route("/composite-request-mix/{name}")
  @put
  op spreadCompositeRequestMix(...CompositeRequestMix): NoContentResponse;
}

@route("/alias")
namespace Alias {
  alias BodyParameter = {
    name: string;
  };

  @scenario
  @scenarioDoc("""
    Test case for spread alias. 
    
    Should not generate any model named `BodyParameter`.
    Should generate an operation like:
    ```
    spreadAsRequestBody(name: string)
    ```
    
    Expected request body:
    ```json
    { "name": "foo" }
    ```
    """)
  @route("/request-body")
  @put
  op spreadAsRequestBody(...BodyParameter): NoContentResponse;

  model InnerModel {
    name: string;
  }

  alias InnerModelParameter = {
    @path
    id: string;

    ...InnerModel;

    @header
    `x-ms-test-header`: string;
  };

  @scenario
  @scenarioDoc("""
    Test case for spread alias. 
    
    Should not generate any model named `InnerModel`.
    Should not generate any model named `InnerModelParameter`.
    Should generate an operation like:
    ```
    spreadParameterWithInnerModel(id: string, x_ms_test_header: string, name: string)
    ```
    Note the parameter name is guessed from the model name and it may vary by language.
    
    Expected path parameter: id="1"
    Expected header parameter: x-ms-test-header="bar"
    Expected request body:
    ```json
    { "name": "foo" }
    ```
    """)
  @route("/inner-model-parameter/{id}")
  @post
  op spreadParameterWithInnerModel(...InnerModelParameter): NoContentResponse;

  alias RequestParameter = {
    @path
    id: string;

    @header
    `x-ms-test-header`: string;

    name: string;
  };

  @scenario
  @scenarioDoc("""
    Test case for spread alias with path and header parameter. 
    
    Should not generate any model named `RequestParameter`.
    Should generate an operation like below:
    ```
    spreadAsRequestParameter(id: string, x_ms_test_header: string, name: string)
    ```
    Note the parameter name may be normalized and vary by language.
    
    Expected path parameter: id="1"
    Expected header parameter: x-ms-test-header="bar"
    Expected request body:
    ```json
    { "name": "foo" }
    ```
    """)
  @route("/request-parameter/{id}")
  @put
  op spreadAsRequestParameter(...RequestParameter): NoContentResponse;

  alias MultipleRequestParameters = {
    @path
    id: string;

    @header
    `x-ms-test-header`: string;

    /** required string */
    requiredString: string;

    /** optional int */
    optionalInt?: int32;

    /** required int */
    requiredIntList: int32[];

    /** optional string */
    optionalStringList?: string[];
  };

  @scenario
  @scenarioDoc("""
    Test case for spread alias including 6 parameters. May handle as property bag for these parameters.
    
    Should not generate any model named `MultipleRequestParameters`.
    Since it contains both optional properties and required properties, the method signature might vary across different languages.
    Note it's also acceptable if some languages handle it as property bag.
    
    Expected path parameter: id="1"
    Expected header parameter: x-ms-test-header="bar"
    Expected request body:
    ```json
    {
      "requiredString": "foo",
      "optionalInt": 1,
      "requiredIntList": [1, 2],
      "optionalStringList": ["foo", "bar"]
    }
    ```
    """)
  @route("/multiple-parameters/{id}")
  @put
  op spreadWithMultipleParameters(...MultipleRequestParameters): NoContentResponse;

  alias InnerAlias = {
    @doc("name of the Thing")
    name: string;

    @doc("age of the Thing")
    age: int32;
  };

  alias InnerAliasParameter = {
    @path id: string;
    ...InnerAlias;

    @header
    `x-ms-test-header`: string;
  };

  @scenario
  @scenarioDoc("""
    Test case for spread alias with contains another alias property as body.
    
    Should not generate any model named `InnerAlias` and `InnerAliasParameter`.
    Should generate an operation like below:
    ```
    spreadParameterWithInnerAlias(id: string, name: string, age: int32, x_ms_test_header: string)
    ```
    Note the parameter name is guessed from the model name and it may vary by language.
    Expected path parameter: id="1"
    Expected header parameter: x-ms-test-header="bar"
    Expected request body:
    ```json
    {
      "name": "foo",
      "age": 1
    }
    ```
    """)
  @route("/inner-alias-parameter")
  @doc("spread an alias with contains another alias property as body.")
  @post
  op spreadParameterWithInnerAlias(...InnerAliasParameter): NoContentResponse;
}
