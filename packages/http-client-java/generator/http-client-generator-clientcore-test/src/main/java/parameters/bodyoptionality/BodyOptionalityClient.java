package parameters.bodyoptionality;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import parameters.bodyoptionality.implementation.BodyOptionalityClientImpl;

/**
 * Initializes a new instance of the synchronous BodyOptionalityClient type.
 */
@ServiceClient(builder = BodyOptionalityClientBuilder.class)
public final class BodyOptionalityClient {
    @Metadata(generated = true)
    private final BodyOptionalityClientImpl serviceClient;

    /**
     * Initializes an instance of BodyOptionalityClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    BodyOptionalityClient(BodyOptionalityClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The requiredExplicit operation.
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
    public Response<Void> requiredExplicitWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.requiredExplicitWithResponse(body, requestOptions);
    }

    /**
     * The requiredImplicit operation.
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
     * @param bodyModel The bodyModel parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> requiredImplicitWithResponse(BinaryData bodyModel, RequestOptions requestOptions) {
        return this.serviceClient.requiredImplicitWithResponse(bodyModel, requestOptions);
    }

    /**
     * The requiredExplicit operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void requiredExplicit(BodyModel body) {
        // Generated convenience method for requiredExplicitWithResponse
        RequestOptions requestOptions = new RequestOptions();
        requiredExplicitWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The requiredImplicit operation.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void requiredImplicit(String name) {
        // Generated convenience method for requiredImplicitWithResponse
        RequestOptions requestOptions = new RequestOptions();
        BodyModel bodyModelObj = new BodyModel(name);
        BinaryData bodyModel = BinaryData.fromObject(bodyModelObj);
        requiredImplicitWithResponse(bodyModel, requestOptions).getValue();
    }
}
