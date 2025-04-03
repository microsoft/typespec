package type.model.empty;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.empty.implementation.EmptyClientImpl;

/**
 * Initializes a new instance of the synchronous EmptyClient type.
 */
@ServiceClient(builder = EmptyClientBuilder.class)
public final class EmptyClient {
    @Metadata(generated = true)
    private final EmptyClientImpl serviceClient;

    /**
     * Initializes an instance of EmptyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    EmptyClient(EmptyClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The putEmpty operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> putEmptyWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putEmptyWithResponse(input, requestOptions);
    }

    /**
     * The getEmpty operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return empty model used in operation return type.
     */
    @Metadata(generated = true)
    public Response<EmptyOutput> getEmptyWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getEmptyWithResponse(requestOptions);
    }

    /**
     * The postRoundTripEmpty operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return empty model used in both parameter and return type.
     */
    @Metadata(generated = true)
    public Response<EmptyInputOutput> postRoundTripEmptyWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.postRoundTripEmptyWithResponse(body, requestOptions);
    }

    /**
     * The putEmpty operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putEmpty(EmptyInput input) {
        // Generated convenience method for putEmptyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putEmptyWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The getEmpty operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return empty model used in operation return type.
     */
    @Metadata(generated = true)
    public EmptyOutput getEmpty() {
        // Generated convenience method for getEmptyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getEmptyWithResponse(requestOptions).getValue();
    }

    /**
     * The postRoundTripEmpty operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return empty model used in both parameter and return type.
     */
    @Metadata(generated = true)
    public EmptyInputOutput postRoundTripEmpty(EmptyInputOutput body) {
        // Generated convenience method for postRoundTripEmptyWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return postRoundTripEmptyWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
