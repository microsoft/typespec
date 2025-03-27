package payload.multipart.implementation;

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
 * An instance of this class provides access to all the operations defined in FormDataHttpParts.
 */
public final class FormDataHttpPartsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDataHttpPartsService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * Initializes an instance of FormDataHttpPartsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDataHttpPartsImpl(MultiPartClientImpl client) {
        this.service = RestProxy.create(FormDataHttpPartsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for MultiPartClientFormDataHttpParts to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "MultiPartClientFormD", host = "{endpoint}")
    public interface FormDataHttpPartsService {
        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/complex-parts-with-httppart",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> jsonArrayAndFileArraySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for mixed scenarios.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> jsonArrayAndFileArrayWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.jsonArrayAndFileArraySync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
