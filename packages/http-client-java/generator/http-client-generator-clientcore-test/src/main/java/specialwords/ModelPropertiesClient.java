package specialwords;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import specialwords.implementation.ModelPropertiesImpl;
import specialwords.modelproperties.SameAsModel;

/**
 * Initializes a new instance of the synchronous SpecialWordsClient type.
 */
@ServiceClient(builder = SpecialWordsClientBuilder.class)
public final class ModelPropertiesClient {
    @Metadata(generated = true)
    private final ModelPropertiesImpl serviceClient;

    /**
     * Initializes an instance of ModelPropertiesClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ModelPropertiesClient(ModelPropertiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The sameAsModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     SameAsModel: String (Required)
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
    public Response<Void> sameAsModelWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.sameAsModelWithResponse(body, requestOptions);
    }

    /**
     * The sameAsModel operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void sameAsModel(SameAsModel body) {
        // Generated convenience method for sameAsModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        sameAsModelWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
