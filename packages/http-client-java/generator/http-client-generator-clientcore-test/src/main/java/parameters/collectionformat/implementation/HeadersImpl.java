package parameters.collectionformat.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in Headers.
 */
public final class HeadersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final HeadersService service;

    /**
     * The service client containing this operation class.
     */
    private final CollectionFormatClientImpl client;

    /**
     * Initializes an instance of HeadersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    HeadersImpl(CollectionFormatClientImpl client) {
        this.service = RestProxy.create(HeadersService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for CollectionFormatClientHeaders to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "CollectionFormatClie", host = "{endpoint}")
    public interface HeadersService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/parameters/collection-format/header/csv",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> csvSync(@HostParam("endpoint") String endpoint, @HeaderParam("colors") String colors,
            RequestOptions requestOptions);
    }

    /**
     * The csv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> csvWithResponse(List<String> colors, RequestOptions requestOptions) {
        String colorsConverted = colors.stream()
            .map(paramItemValue -> Objects.toString(paramItemValue, ""))
            .collect(Collectors.joining(","));
        return service.csvSync(this.client.getEndpoint(), colorsConverted, requestOptions);
    }
}
