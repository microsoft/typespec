package parameters.basic;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import parameters.basic.explicitbody.User;
import parameters.basic.implementation.ExplicitBodiesImpl;

/**
 * Initializes a new instance of the synchronous BasicClient type.
 */
@ServiceClient(builder = BasicClientBuilder.class)
public final class ExplicitBodyClient {
    @Metadata(generated = true)
    private final ExplicitBodiesImpl serviceClient;

    /**
     * Initializes an instance of ExplicitBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ExplicitBodyClient(ExplicitBodiesImpl serviceClient) {
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
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> simpleWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.simpleWithResponse(body, requestOptions);
    }

    /**
     * The simple operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void simple(User body) {
        // Generated convenience method for simpleWithResponse
        RequestOptions requestOptions = new RequestOptions();
        simpleWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
