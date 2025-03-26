package parameters.collectionformat.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in Queries.
 */
public final class QueriesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final QueriesService service;

    /**
     * The service client containing this operation class.
     */
    private final CollectionFormatClientImpl client;

    /**
     * Initializes an instance of QueriesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueriesImpl(CollectionFormatClientImpl client) {
        this.service = RestProxy.create(QueriesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for CollectionFormatClientQueries to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "CollectionFormatClie", host = "{endpoint}")
    public interface QueriesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/parameters/collection-format/query/multi",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> multiSync(@HostParam("endpoint") String endpoint,
            @QueryParam(value = "colors", multipleQueryParams = true) List<String> colors,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/parameters/collection-format/query/ssv",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> ssvSync(@HostParam("endpoint") String endpoint, @QueryParam("colors") String colors,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/parameters/collection-format/query/pipes",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> pipesSync(@HostParam("endpoint") String endpoint, @QueryParam("colors") String colors,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/parameters/collection-format/query/csv",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> csvSync(@HostParam("endpoint") String endpoint, @QueryParam("colors") String colors,
            RequestOptions requestOptions);
    }

    /**
     * The multi operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> multiWithResponse(List<String> colors, RequestOptions requestOptions) {
        List<String> colorsConverted
            = colors.stream().map(item -> Objects.toString(item, "")).collect(Collectors.toList());
        return service.multiSync(this.client.getEndpoint(), colorsConverted, requestOptions);
    }

    /**
     * The ssv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> ssvWithResponse(List<String> colors, RequestOptions requestOptions) {
        String colorsConverted = colors.stream()
            .map(paramItemValue -> Objects.toString(paramItemValue, ""))
            .collect(Collectors.joining(" "));
        return service.ssvSync(this.client.getEndpoint(), colorsConverted, requestOptions);
    }

    /**
     * The pipes operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> pipesWithResponse(List<String> colors, RequestOptions requestOptions) {
        String colorsConverted = colors.stream()
            .map(paramItemValue -> Objects.toString(paramItemValue, ""))
            .collect(Collectors.joining("|"));
        return service.pipesSync(this.client.getEndpoint(), colorsConverted, requestOptions);
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
