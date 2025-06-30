package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import payload.multipart.formdata.httpparts.nonstring.FloatRequest;
import payload.multipart.implementation.FormDataHttpPartsNonStringsImpl;

/**
 * Initializes a new instance of the synchronous MultiPartClient type.
 */
@ServiceClient(builder = MultiPartClientBuilder.class)
public final class FormDataHttpPartsNonStringClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FormDataHttpPartsNonStringsImpl serviceClient;

    /**
     * Initializes an instance of FormDataHttpPartsNonStringClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    FormDataHttpPartsNonStringClient(FormDataHttpPartsNonStringsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Test content-type: multipart/form-data for non string.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> floatMethodWithResponse(FloatRequest body, RequestContext requestContext) {
        // Operation 'float' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not
        // generated.
        return this.serviceClient.floatMethodWithResponse(body, requestContext);
    }

    /**
     * Test content-type: multipart/form-data for non string.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void floatMethod(FloatRequest body) {
        floatMethodWithResponse(body, RequestContext.none());
    }
}
