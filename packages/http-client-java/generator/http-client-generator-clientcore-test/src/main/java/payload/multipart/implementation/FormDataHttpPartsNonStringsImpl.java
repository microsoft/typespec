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
 * An instance of this class provides access to all the operations defined in FormDataHttpPartsNonStrings.
 */
public final class FormDataHttpPartsNonStringsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final FormDataHttpPartsNonStringsService service;

    /**
     * The service client containing this operation class.
     */
    private final MultiPartClientImpl client;

    /**
     * Initializes an instance of FormDataHttpPartsNonStringsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    FormDataHttpPartsNonStringsImpl(MultiPartClientImpl client) {
        this.service = RestProxy.create(FormDataHttpPartsNonStringsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for MultiPartClientFormDataHttpPartsNonStrings to be used by the proxy
     * service to perform REST calls.
     */
    @ServiceInterface(name = "MultiPartClientFormD", host = "{endpoint}")
    public interface FormDataHttpPartsNonStringsService {
        // @Multipart not supported by RestProxy
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/multipart/form-data/non-string-float",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> floatMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("multipart/form-data") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for non string.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> floatMethodWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "multipart/form-data";
        return service.floatMethodSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
