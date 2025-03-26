package parameters.bodyoptionality;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import parameters.bodyoptionality.implementation.OptionalExplicitsImpl;

/**
 * Initializes a new instance of the synchronous BodyOptionalityClient type.
 */
@ServiceClient(builder = BodyOptionalityClientBuilder.class)
public final class OptionalExplicitClient {
    @Metadata(generated = true)
    private final OptionalExplicitsImpl serviceClient;

    /**
     * Initializes an instance of OptionalExplicitClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    OptionalExplicitClient(OptionalExplicitsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The set operation.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>Content-Type</td><td>String</td><td>No</td><td>The content type. Allowed values:
     * "application/json".</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> setWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.setWithResponse(requestOptions);
    }

    /**
     * The omit operation.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>Content-Type</td><td>String</td><td>No</td><td>The content type. Allowed values:
     * "application/json".</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> omitWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.omitWithResponse(requestOptions);
    }

    /**
     * The set operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void set(BodyModel body) {
        // Generated convenience method for setWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (body != null) {
            requestOptions.setBody(BinaryData.fromObject(body));
        }
        setWithResponse(requestOptions).getValue();
    }

    /**
     * The set operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void set() {
        // Generated convenience method for setWithResponse
        RequestOptions requestOptions = new RequestOptions();
        setWithResponse(requestOptions).getValue();
    }

    /**
     * The omit operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void omit(BodyModel body) {
        // Generated convenience method for omitWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (body != null) {
            requestOptions.setBody(BinaryData.fromObject(body));
        }
        omitWithResponse(requestOptions).getValue();
    }

    /**
     * The omit operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void omit() {
        // Generated convenience method for omitWithResponse
        RequestOptions requestOptions = new RequestOptions();
        omitWithResponse(requestOptions).getValue();
    }
}
