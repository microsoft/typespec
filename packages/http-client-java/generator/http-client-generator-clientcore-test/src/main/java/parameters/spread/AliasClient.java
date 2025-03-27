package parameters.spread;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import java.util.List;
import parameters.spread.alias.implementation.SpreadAsRequestBodyRequest;
import parameters.spread.implementation.AliasImpl;
import parameters.spread.implementation.SpreadAsRequestParameterRequest;
import parameters.spread.implementation.SpreadParameterWithInnerAliasRequest;
import parameters.spread.implementation.SpreadParameterWithInnerModelRequest;
import parameters.spread.implementation.SpreadWithMultipleParametersRequest;

/**
 * Initializes a new instance of the synchronous SpreadClient type.
 */
@ServiceClient(builder = SpreadClientBuilder.class)
public final class AliasClient {
    @Metadata(generated = true)
    private final AliasImpl serviceClient;

    /**
     * Initializes an instance of AliasClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    AliasClient(AliasImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The spreadAsRequestBody operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param spreadAsRequestBodyRequest The spreadAsRequestBodyRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadAsRequestBodyWithResponse(BinaryData spreadAsRequestBodyRequest,
        RequestOptions requestOptions) {
        return this.serviceClient.spreadAsRequestBodyWithResponse(spreadAsRequestBodyRequest, requestOptions);
    }

    /**
     * The spreadParameterWithInnerModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param spreadParameterWithInnerModelRequest The spreadParameterWithInnerModelRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadParameterWithInnerModelWithResponse(String id, String xMsTestHeader,
        BinaryData spreadParameterWithInnerModelRequest, RequestOptions requestOptions) {
        return this.serviceClient.spreadParameterWithInnerModelWithResponse(id, xMsTestHeader,
            spreadParameterWithInnerModelRequest, requestOptions);
    }

    /**
     * The spreadAsRequestParameter operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param spreadAsRequestParameterRequest The spreadAsRequestParameterRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadAsRequestParameterWithResponse(String id, String xMsTestHeader,
        BinaryData spreadAsRequestParameterRequest, RequestOptions requestOptions) {
        return this.serviceClient.spreadAsRequestParameterWithResponse(id, xMsTestHeader,
            spreadAsRequestParameterRequest, requestOptions);
    }

    /**
     * The spreadWithMultipleParameters operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredString: String (Required)
     *     optionalInt: Integer (Optional)
     *     requiredIntList (Required): [
     *         int (Required)
     *     ]
     *     optionalStringList (Optional): [
     *         String (Optional)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param spreadWithMultipleParametersRequest The spreadWithMultipleParametersRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadWithMultipleParametersWithResponse(String id, String xMsTestHeader,
        BinaryData spreadWithMultipleParametersRequest, RequestOptions requestOptions) {
        return this.serviceClient.spreadWithMultipleParametersWithResponse(id, xMsTestHeader,
            spreadWithMultipleParametersRequest, requestOptions);
    }

    /**
     * spread an alias with contains another alias property as body.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param spreadParameterWithInnerAliasRequest The spreadParameterWithInnerAliasRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadParameterWithInnerAliasWithResponse(String id, String xMsTestHeader,
        BinaryData spreadParameterWithInnerAliasRequest, RequestOptions requestOptions) {
        return this.serviceClient.spreadParameterWithInnerAliasWithResponse(id, xMsTestHeader,
            spreadParameterWithInnerAliasRequest, requestOptions);
    }

    /**
     * The spreadAsRequestBody operation.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadAsRequestBody(String name) {
        // Generated convenience method for spreadAsRequestBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SpreadAsRequestBodyRequest spreadAsRequestBodyRequestObj = new SpreadAsRequestBodyRequest(name);
        BinaryData spreadAsRequestBodyRequest = BinaryData.fromObject(spreadAsRequestBodyRequestObj);
        spreadAsRequestBodyWithResponse(spreadAsRequestBodyRequest, requestOptions).getValue();
    }

    /**
     * The spreadParameterWithInnerModel operation.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadParameterWithInnerModel(String id, String xMsTestHeader, String name) {
        // Generated convenience method for spreadParameterWithInnerModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SpreadParameterWithInnerModelRequest spreadParameterWithInnerModelRequestObj
            = new SpreadParameterWithInnerModelRequest(name);
        BinaryData spreadParameterWithInnerModelRequest
            = BinaryData.fromObject(spreadParameterWithInnerModelRequestObj);
        spreadParameterWithInnerModelWithResponse(id, xMsTestHeader, spreadParameterWithInnerModelRequest,
            requestOptions).getValue();
    }

    /**
     * The spreadAsRequestParameter operation.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadAsRequestParameter(String id, String xMsTestHeader, String name) {
        // Generated convenience method for spreadAsRequestParameterWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SpreadAsRequestParameterRequest spreadAsRequestParameterRequestObj = new SpreadAsRequestParameterRequest(name);
        BinaryData spreadAsRequestParameterRequest = BinaryData.fromObject(spreadAsRequestParameterRequestObj);
        spreadAsRequestParameterWithResponse(id, xMsTestHeader, spreadAsRequestParameterRequest, requestOptions)
            .getValue();
    }

    /**
     * The spreadWithMultipleParameters operation.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param requiredString required string.
     * @param requiredIntList required int.
     * @param optionalInt optional int.
     * @param optionalStringList optional string.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadWithMultipleParameters(String id, String xMsTestHeader, String requiredString,
        List<Integer> requiredIntList, Integer optionalInt, List<String> optionalStringList) {
        // Generated convenience method for spreadWithMultipleParametersWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SpreadWithMultipleParametersRequest spreadWithMultipleParametersRequestObj
            = new SpreadWithMultipleParametersRequest(requiredString, requiredIntList).setOptionalInt(optionalInt)
                .setOptionalStringList(optionalStringList);
        BinaryData spreadWithMultipleParametersRequest = BinaryData.fromObject(spreadWithMultipleParametersRequestObj);
        spreadWithMultipleParametersWithResponse(id, xMsTestHeader, spreadWithMultipleParametersRequest, requestOptions)
            .getValue();
    }

    /**
     * The spreadWithMultipleParameters operation.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param requiredString required string.
     * @param requiredIntList required int.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadWithMultipleParameters(String id, String xMsTestHeader, String requiredString,
        List<Integer> requiredIntList) {
        // Generated convenience method for spreadWithMultipleParametersWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SpreadWithMultipleParametersRequest spreadWithMultipleParametersRequestObj
            = new SpreadWithMultipleParametersRequest(requiredString, requiredIntList);
        BinaryData spreadWithMultipleParametersRequest = BinaryData.fromObject(spreadWithMultipleParametersRequestObj);
        spreadWithMultipleParametersWithResponse(id, xMsTestHeader, spreadWithMultipleParametersRequest, requestOptions)
            .getValue();
    }

    /**
     * spread an alias with contains another alias property as body.
     * 
     * @param id The id parameter.
     * @param xMsTestHeader The xMsTestHeader parameter.
     * @param name name of the Thing.
     * @param age age of the Thing.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadParameterWithInnerAlias(String id, String xMsTestHeader, String name, int age) {
        // Generated convenience method for spreadParameterWithInnerAliasWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SpreadParameterWithInnerAliasRequest spreadParameterWithInnerAliasRequestObj
            = new SpreadParameterWithInnerAliasRequest(name, age);
        BinaryData spreadParameterWithInnerAliasRequest
            = BinaryData.fromObject(spreadParameterWithInnerAliasRequestObj);
        spreadParameterWithInnerAliasWithResponse(id, xMsTestHeader, spreadParameterWithInnerAliasRequest,
            requestOptions).getValue();
    }
}
