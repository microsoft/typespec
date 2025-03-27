package specialheaders.repeatability;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import specialheaders.repeatability.implementation.RepeatabilityClientImpl;

/**
 * Initializes a new instance of the synchronous RepeatabilityClient type.
 */
@ServiceClient(builder = RepeatabilityClientBuilder.class)
public final class RepeatabilityClient {
    @Metadata(generated = true)
    private final RepeatabilityClientImpl serviceClient;

    /**
     * Initializes an instance of RepeatabilityClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    RepeatabilityClient(RepeatabilityClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>repeatability-request-id</td><td>String</td><td>No</td><td>Repeatability request ID header</td></tr>
     * <tr><td>repeatability-first-sent</td><td>String</td><td>No</td><td>Repeatability first sent header as
     * HTTP-date</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> immediateSuccessWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.immediateSuccessWithResponse(requestOptions);
    }

    /**
     * Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void immediateSuccess() {
        // Generated convenience method for immediateSuccessWithResponse
        RequestOptions requestOptions = new RequestOptions();
        immediateSuccessWithResponse(requestOptions).getValue();
    }
}
