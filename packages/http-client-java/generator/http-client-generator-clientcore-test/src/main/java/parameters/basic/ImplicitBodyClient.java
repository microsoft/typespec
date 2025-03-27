package parameters.basic;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import parameters.basic.implementation.ImplicitBodiesImpl;
import parameters.basic.implicitbody.implementation.SimpleRequest;

/**
 * Initializes a new instance of the synchronous BasicClient type.
 */
@ServiceClient(builder = BasicClientBuilder.class)
public final class ImplicitBodyClient {
    @Metadata(generated = true)
    private final ImplicitBodiesImpl serviceClient;

    /**
     * Initializes an instance of ImplicitBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ImplicitBodyClient(ImplicitBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The simple operation.
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
     * @param simpleRequest The simpleRequest parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> simpleWithResponse(BinaryData simpleRequest, RequestOptions requestOptions) {
        return this.serviceClient.simpleWithResponse(simpleRequest, requestOptions);
    }

    /**
     * The simple operation.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void simple(String name) {
        // Generated convenience method for simpleWithResponse
        RequestOptions requestOptions = new RequestOptions();
        SimpleRequest simpleRequestObj = new SimpleRequest(name);
        BinaryData simpleRequest = BinaryData.fromObject(simpleRequestObj);
        simpleWithResponse(simpleRequest, requestOptions).getValue();
    }
}
