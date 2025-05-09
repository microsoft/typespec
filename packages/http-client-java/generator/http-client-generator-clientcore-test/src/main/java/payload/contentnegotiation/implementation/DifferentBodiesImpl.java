package payload.contentnegotiation.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.models.binarydata.BinaryData;
import java.lang.reflect.InvocationTargetException;
import payload.contentnegotiation.differentbody.PngImageAsJson;

/**
 * An instance of this class provides access to all the operations defined in DifferentBodies.
 */
public final class DifferentBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final DifferentBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final ContentNegotiationClientImpl client;

    /**
     * Initializes an instance of DifferentBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    DifferentBodiesImpl(ContentNegotiationClientImpl client) {
        this.service = RestProxy.create(DifferentBodiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for ContentNegotiationClientDifferentBodies to be used by the proxy
     * service to perform REST calls.
     */
    @ServiceInterface(name = "ContentNegotiationCl", host = "{endpoint}")
    public interface DifferentBodiesService {
        static DifferentBodiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.contentnegotiation.implementation.DifferentBodiesServiceImpl");
                return (DifferentBodiesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/content-negotiation/different-body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> getAvatarAsPng(@HostParam("endpoint") String endpoint,
            @HeaderParam("accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/content-negotiation/different-body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PngImageAsJson> getAvatarAsJson(@HostParam("endpoint") String endpoint,
            @HeaderParam("accept") String accept, RequestContext requestContext);
    }

    /**
     * The getAvatarAsPng operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getAvatarAsPngWithResponse(RequestContext requestContext) {
        final String accept = "image/png";
        return service.getAvatarAsPng(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * The getAvatarAsPng operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData getAvatarAsPng() {
        return getAvatarAsPngWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The getAvatarAsJson operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PngImageAsJson> getAvatarAsJsonWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getAvatarAsJson(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * The getAvatarAsJson operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PngImageAsJson getAvatarAsJson() {
        return getAvatarAsJsonWithResponse(RequestContext.none()).getValue();
    }
}
