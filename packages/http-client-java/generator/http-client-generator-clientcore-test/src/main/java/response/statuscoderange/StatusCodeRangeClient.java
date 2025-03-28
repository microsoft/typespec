package response.statuscoderange;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import response.statuscoderange.implementation.StatusCodeRangeClientImpl;

/**
 * Initializes a new instance of the synchronous StatusCodeRangeClient type.
 */
@ServiceClient(builder = StatusCodeRangeClientBuilder.class)
public final class StatusCodeRangeClient {
    @Metadata(generated = true)
    private final StatusCodeRangeClientImpl serviceClient;

    /**
     * Initializes an instance of StatusCodeRangeClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    StatusCodeRangeClient(StatusCodeRangeClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The errorResponseStatusCodeInRange operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> errorResponseStatusCodeInRangeWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.errorResponseStatusCodeInRangeWithResponse(requestOptions);
    }

    /**
     * The errorResponseStatusCode404 operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> errorResponseStatusCode404WithResponse(RequestOptions requestOptions) {
        return this.serviceClient.errorResponseStatusCode404WithResponse(requestOptions);
    }

    /**
     * The errorResponseStatusCodeInRange operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void errorResponseStatusCodeInRange() {
        // Generated convenience method for errorResponseStatusCodeInRangeWithResponse
        RequestOptions requestOptions = new RequestOptions();
        errorResponseStatusCodeInRangeWithResponse(requestOptions).getValue();
    }

    /**
     * The errorResponseStatusCode404 operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void errorResponseStatusCode404() {
        // Generated convenience method for errorResponseStatusCode404WithResponse
        RequestOptions requestOptions = new RequestOptions();
        errorResponseStatusCode404WithResponse(requestOptions).getValue();
    }
}
