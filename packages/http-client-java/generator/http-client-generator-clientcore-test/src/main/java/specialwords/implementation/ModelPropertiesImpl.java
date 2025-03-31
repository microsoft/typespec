package specialwords.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * An instance of this class provides access to all the operations defined in ModelProperties.
 */
public final class ModelPropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelPropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * Initializes an instance of ModelPropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelPropertiesImpl(SpecialWordsClientImpl client) {
        this.service = RestProxy.create(ModelPropertiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for SpecialWordsClientModelProperties to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "SpecialWordsClientMo", host = "{endpoint}")
    public interface ModelPropertiesService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-words/model-properties/same-as-model",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sameAsModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);
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
    public Response<Void> sameAsModelWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.sameAsModelSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
