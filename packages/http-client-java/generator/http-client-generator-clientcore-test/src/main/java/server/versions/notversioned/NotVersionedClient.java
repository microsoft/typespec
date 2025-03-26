package server.versions.notversioned;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import server.versions.notversioned.implementation.NotVersionedClientImpl;

/**
 * Initializes a new instance of the synchronous NotVersionedClient type.
 */
@ServiceClient(builder = NotVersionedClientBuilder.class)
public final class NotVersionedClient {
    @Metadata(generated = true)
    private final NotVersionedClientImpl serviceClient;

    /**
     * Initializes an instance of NotVersionedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    NotVersionedClient(NotVersionedClientImpl serviceClient) {
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
     * @param apiVersion The apiVersion parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withQueryApiVersionWithResponse(String apiVersion, RequestOptions requestOptions) {
        return this.serviceClient.withQueryApiVersionWithResponse(apiVersion, requestOptions);
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> withPathApiVersionWithResponse(String apiVersion, RequestOptions requestOptions) {
        return this.serviceClient.withPathApiVersionWithResponse(apiVersion, requestOptions);
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
     * @param apiVersion The apiVersion parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withQueryApiVersion(String apiVersion) {
        // Generated convenience method for withQueryApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withQueryApiVersionWithResponse(apiVersion, requestOptions).getValue();
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void withPathApiVersion(String apiVersion) {
        // Generated convenience method for withPathApiVersionWithResponse
        RequestOptions requestOptions = new RequestOptions();
        withPathApiVersionWithResponse(apiVersion, requestOptions).getValue();
    }
}
