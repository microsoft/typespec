package server.versions.versioned;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import server.versions.versioned.implementation.VersionedClientImpl;

/**
 * Initializes a new instance of the synchronous VersionedClient type.
 */
@ServiceClient(builder = VersionedClientBuilder.class)
public final class VersionedClient {
    @Metadata(generated = true)
    private final VersionedClientImpl serviceClient;

    /**
     * Initializes an instance of VersionedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    VersionedClient(VersionedClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withoutApiVersionWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.withoutApiVersionWithResponse(requestOptions);
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withQueryApiVersionWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.withQueryApiVersionWithResponse(requestOptions);
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withPathApiVersionWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.withPathApiVersionWithResponse(requestOptions);
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withQueryOldApiVersionWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.withQueryOldApiVersionWithResponse(requestOptions);
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withoutApiVersion() {
        // Generated convenience method for withoutApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withoutApiVersionWithResponse(requestOptions).getValue();
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withQueryApiVersion() {
        // Generated convenience method for withQueryApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withQueryApiVersionWithResponse(requestOptions).getValue();
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withPathApiVersion() {
        // Generated convenience method for withPathApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withPathApiVersionWithResponse(requestOptions).getValue();
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withQueryOldApiVersion() {
        // Generated convenience method for withQueryOldApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withQueryOldApiVersionWithResponse(requestOptions).getValue();
    }
}
