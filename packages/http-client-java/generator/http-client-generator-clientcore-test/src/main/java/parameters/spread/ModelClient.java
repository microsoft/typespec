package parameters.spread;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import parameters.spread.implementation.ModelsImpl;
import parameters.spread.implementation.SpreadCompositeRequestMixRequest;
import parameters.spread.model.BodyParameter;

/**
 * Initializes a new instance of the synchronous SpreadClient type.
 */
@ServiceClient(builder = SpreadClientBuilder.class)
public final class ModelClient {
    @Metadata(generated = true)
    private final ModelsImpl serviceClient;

    /**
     * Initializes an instance of ModelClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ModelClient(ModelsImpl serviceClient) {
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
     * @param bodyParameter The bodyParameter parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadAsRequestBodyWithResponse(BinaryData bodyParameter, RequestOptions requestOptions) {
        return this.serviceClient.spreadAsRequestBodyWithResponse(bodyParameter, requestOptions);
    }

    /**
     * The spreadCompositeRequestOnlyWithBody operation.
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
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadCompositeRequestOnlyWithBodyWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        return this.serviceClient.spreadCompositeRequestOnlyWithBodyWithResponse(body, requestOptions);
    }

    /**
     * The spreadCompositeRequestWithoutBody operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadCompositeRequestWithoutBodyWithResponse(String name, String testHeader,
        RequestOptions requestOptions) {
        return this.serviceClient.spreadCompositeRequestWithoutBodyWithResponse(name, testHeader, requestOptions);
    }

    /**
     * The spreadCompositeRequest operation.
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
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadCompositeRequestWithResponse(String name, String testHeader, BinaryData body,
        RequestOptions requestOptions) {
        return this.serviceClient.spreadCompositeRequestWithResponse(name, testHeader, body, requestOptions);
    }

    /**
     * The spreadCompositeRequestMix operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     prop: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param spreadCompositeRequestMixRequest The spreadCompositeRequestMixRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> spreadCompositeRequestMixWithResponse(String name, String testHeader,
        BinaryData spreadCompositeRequestMixRequest, RequestOptions requestOptions) {
        return this.serviceClient.spreadCompositeRequestMixWithResponse(name, testHeader,
            spreadCompositeRequestMixRequest, requestOptions);
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
        BodyParameter bodyParameterObj = new BodyParameter(name);
        BinaryData bodyParameter = BinaryData.fromObject(bodyParameterObj);
        spreadAsRequestBodyWithResponse(bodyParameter, requestOptions).getValue();
    }

    /**
     * The spreadCompositeRequestOnlyWithBody operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadCompositeRequestOnlyWithBody(BodyParameter body) {
        // Generated convenience method for spreadCompositeRequestOnlyWithBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        spreadCompositeRequestOnlyWithBodyWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The spreadCompositeRequestWithoutBody operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadCompositeRequestWithoutBody(String name, String testHeader) {
        // Generated convenience method for spreadCompositeRequestWithoutBodyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        spreadCompositeRequestWithoutBodyWithResponse(name, testHeader, requestOptions).getValue();
    }

    /**
     * The spreadCompositeRequest operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadCompositeRequest(String name, String testHeader, BodyParameter body) {
        // Generated convenience method for spreadCompositeRequestWithResponse
        RequestOptions requestOptions = new RequestOptions();
        spreadCompositeRequestWithResponse(name, testHeader, BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The spreadCompositeRequestMix operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param prop The prop parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void spreadCompositeRequestMix(String name, String testHeader, String prop) {
        // Generated convenience method for spreadCompositeRequestMixWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SpreadCompositeRequestMixRequest spreadCompositeRequestMixRequestObj
            = new SpreadCompositeRequestMixRequest(prop);
        BinaryData spreadCompositeRequestMixRequest = BinaryData.fromObject(spreadCompositeRequestMixRequestObj);
        spreadCompositeRequestMixWithResponse(name, testHeader, spreadCompositeRequestMixRequest, requestOptions)
            .getValue();
    }
}
