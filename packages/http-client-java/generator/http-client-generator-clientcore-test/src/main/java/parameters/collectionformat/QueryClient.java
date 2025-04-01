package parameters.collectionformat;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import java.util.List;
import parameters.collectionformat.implementation.QueriesImpl;

/**
 * Initializes a new instance of the synchronous CollectionFormatClient type.
 */
@ServiceClient(builder = CollectionFormatClientBuilder.class)
public final class QueryClient {
    @Metadata(generated = true)
    private final QueriesImpl serviceClient;

    /**
     * Initializes an instance of QueryClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    QueryClient(QueriesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The multi operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> multiWithResponse(List<String> colors, RequestOptions requestOptions) {
        return this.serviceClient.multiWithResponse(colors, requestOptions);
    }

    /**
     * The ssv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> ssvWithResponse(List<String> colors, RequestOptions requestOptions) {
        return this.serviceClient.ssvWithResponse(colors, requestOptions);
    }

    /**
     * The pipes operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> pipesWithResponse(List<String> colors, RequestOptions requestOptions) {
        return this.serviceClient.pipesWithResponse(colors, requestOptions);
    }

    /**
     * The csv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> csvWithResponse(List<String> colors, RequestOptions requestOptions) {
        return this.serviceClient.csvWithResponse(colors, requestOptions);
    }

    /**
     * The multi operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void multi(List<String> colors) {
        // Generated convenience method for multiWithResponse
        RequestOptions requestOptions = new RequestOptions();
        multiWithResponse(colors, requestOptions).getValue();
    }

    /**
     * The ssv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void ssv(List<String> colors) {
        // Generated convenience method for ssvWithResponse
        RequestOptions requestOptions = new RequestOptions();
        ssvWithResponse(colors, requestOptions).getValue();
    }

    /**
     * The pipes operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void pipes(List<String> colors) {
        // Generated convenience method for pipesWithResponse
        RequestOptions requestOptions = new RequestOptions();
        pipesWithResponse(colors, requestOptions).getValue();
    }

    /**
     * The csv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void csv(List<String> colors) {
        // Generated convenience method for csvWithResponse
        RequestOptions requestOptions = new RequestOptions();
        csvWithResponse(colors, requestOptions).getValue();
    }
}
