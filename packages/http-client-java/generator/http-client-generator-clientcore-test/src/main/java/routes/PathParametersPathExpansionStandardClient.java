package routes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import java.util.List;
import java.util.Map;
import routes.implementation.PathParametersPathExpansionStandardsImpl;

/**
 * Initializes a new instance of the synchronous RoutesClient type.
 */
@ServiceClient(builder = RoutesClientBuilder.class)
public final class PathParametersPathExpansionStandardClient {
    @Metadata(generated = true)
    private final PathParametersPathExpansionStandardsImpl serviceClient;

    /**
     * Initializes an instance of PathParametersPathExpansionStandardClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    PathParametersPathExpansionStandardClient(PathParametersPathExpansionStandardsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The primitive operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> primitiveWithResponse(String param, RequestOptions requestOptions) {
        return this.serviceClient.primitiveWithResponse(param, requestOptions);
    }

    /**
     * The array operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> arrayWithResponse(List<String> param, RequestOptions requestOptions) {
        return this.serviceClient.arrayWithResponse(param, requestOptions);
    }

    /**
     * The record operation.
     * 
     * @param param The param parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> recordWithResponse(Map<String, Integer> param, RequestOptions requestOptions) {
        return this.serviceClient.recordWithResponse(param, requestOptions);
    }

    /**
     * The primitive operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void primitive(String param) {
        // Generated convenience method for primitiveWithResponse
        RequestOptions requestOptions = new RequestOptions();
        primitiveWithResponse(param, requestOptions).getValue();
    }

    /**
     * The array operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void array(List<String> param) {
        // Generated convenience method for arrayWithResponse
        RequestOptions requestOptions = new RequestOptions();
        arrayWithResponse(param, requestOptions).getValue();
    }

    /**
     * The record operation.
     * 
     * @param param The param parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void record(Map<String, Integer> param) {
        // Generated convenience method for recordWithResponse
        RequestOptions requestOptions = new RequestOptions();
        recordWithResponse(param, requestOptions).getValue();
    }
}
