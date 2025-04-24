package server.path.multiple;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import server.path.multiple.implementation.MultipleClientImpl;

/**
 * Initializes a new instance of the synchronous MultipleClient type.
 */
@ServiceClient(builder = MultipleClientBuilder.class)
public final class MultipleClient {
    @Metadata(generated = true)
    private final MultipleClientImpl serviceClient;

    /**
     * Initializes an instance of MultipleClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    MultipleClient(MultipleClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The noOperationParams operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> noOperationParamsWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.noOperationParamsWithResponse(requestOptions);
    }

    /**
     * The withOperationPathParam operation.
     * 
     * @param keyword The keyword parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withOperationPathParamWithResponse(String keyword, RequestOptions requestOptions) {
        return this.serviceClient.withOperationPathParamWithResponse(keyword, requestOptions);
    }

    /**
     * The noOperationParams operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void noOperationParams() {
        // Generated convenience method for noOperationParamsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        noOperationParamsWithResponse(requestOptions).getValue();
    }

    /**
     * The withOperationPathParam operation.
     * 
     * @param keyword The keyword parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withOperationPathParam(String keyword) {
        // Generated convenience method for withOperationPathParamWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withOperationPathParamWithResponse(keyword, requestOptions).getValue();
    }
}
