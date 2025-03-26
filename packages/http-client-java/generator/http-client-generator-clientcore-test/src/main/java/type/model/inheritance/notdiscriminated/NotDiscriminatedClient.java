package type.model.inheritance.notdiscriminated;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.inheritance.notdiscriminated.implementation.NotDiscriminatedClientImpl;

/**
 * Initializes a new instance of the synchronous NotDiscriminatedClient type.
 */
@ServiceClient(builder = NotDiscriminatedClientBuilder.class)
public final class NotDiscriminatedClient {
    @Metadata(generated = true)
    private final NotDiscriminatedClientImpl serviceClient;

    /**
     * Initializes an instance of NotDiscriminatedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    NotDiscriminatedClient(NotDiscriminatedClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The postValid operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
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
    public Response<Void> postValidWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.postValidWithResponse(input, requestOptions);
    }

    /**
     * The getValid operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the third level model in the normal multiple levels inheritance.
     */
    @Metadata(generated = true)
    public Response<Siamese> getValidWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getValidWithResponse(requestOptions);
    }

    /**
     * The putValid operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     *     smart: boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the third level model in the normal multiple levels inheritance.
     */
    @Metadata(generated = true)
    public Response<Siamese> putValidWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putValidWithResponse(input, requestOptions);
    }

    /**
     * The postValid operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void postValid(Siamese input) {
        // Generated convenience method for postValidWithResponse
        RequestOptions requestOptions = new RequestOptions();
        postValidWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The getValid operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the third level model in the normal multiple levels inheritance.
     */
    @Metadata(generated = true)
    public Siamese getValid() {
        // Generated convenience method for getValidWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getValidWithResponse(requestOptions).getValue();
    }

    /**
     * The putValid operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the third level model in the normal multiple levels inheritance.
     */
    @Metadata(generated = true)
    public Siamese putValid(Siamese input) {
        // Generated convenience method for putValidWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return putValidWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }
}
