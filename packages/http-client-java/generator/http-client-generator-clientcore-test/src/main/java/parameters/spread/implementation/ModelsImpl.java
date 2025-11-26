package parameters.spread.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import parameters.spread.model.BodyParameter;

/**
 * An instance of this class provides access to all the operations defined in Models.
 */
public final class ModelsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelsService service;

    /**
     * The service client containing this operation class.
     */
    private final SpreadClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelsImpl(SpreadClientImpl client) {
        this.service = ModelsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for SpreadClientModels to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "SpreadClientModels", host = "{endpoint}")
    public interface ModelsService {
        static ModelsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("parameters.spread.implementation.ModelsServiceImpl");
                return (ModelsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/request-body",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadAsRequestBody(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BodyParameter bodyParameter,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/composite-request-only-with-body",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadCompositeRequestOnlyWithBody(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BodyParameter body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/composite-request-without-body/{name}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadCompositeRequestWithoutBody(@HostParam("endpoint") String endpoint,
            @PathParam("name") String name, @HeaderParam("test-header") String testHeader,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/composite-request/{name}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadCompositeRequest(@HostParam("endpoint") String endpoint, @PathParam("name") String name,
            @HeaderParam("test-header") String testHeader, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") BodyParameter body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/parameters/spread/model/composite-request-mix/{name}",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> spreadCompositeRequestMix(@HostParam("endpoint") String endpoint, @PathParam("name") String name,
            @HeaderParam("test-header") String testHeader, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") SpreadCompositeRequestMixRequest spreadCompositeRequestMixRequest,
            RequestContext requestContext);
    }

    /**
     * The spreadAsRequestBody operation.
     * 
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadAsRequestBodyWithResponse(String name, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadAsRequestBody",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                BodyParameter bodyParameter = new BodyParameter(name);
                return service.spreadAsRequestBody(this.client.getEndpoint(), contentType, bodyParameter,
                    updatedContext);
            });
    }

    /**
     * The spreadCompositeRequestOnlyWithBody operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadCompositeRequestOnlyWithBodyWithResponse(BodyParameter body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadCompositeRequestOnlyWithBody",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.spreadCompositeRequestOnlyWithBody(this.client.getEndpoint(), contentType, body,
                    updatedContext);
            });
    }

    /**
     * The spreadCompositeRequestWithoutBody operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadCompositeRequestWithoutBodyWithResponse(String name, String testHeader,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadCompositeRequestWithoutBody",
            requestContext, updatedContext -> {
                return service.spreadCompositeRequestWithoutBody(this.client.getEndpoint(), name, testHeader,
                    updatedContext);
            });
    }

    /**
     * The spreadCompositeRequest operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadCompositeRequestWithResponse(String name, String testHeader, BodyParameter body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadCompositeRequest",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.spreadCompositeRequest(this.client.getEndpoint(), name, testHeader, contentType, body,
                    updatedContext);
            });
    }

    /**
     * The spreadCompositeRequestMix operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param prop The prop parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadCompositeRequestMixWithResponse(String name, String testHeader, String prop,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadCompositeRequestMix",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                SpreadCompositeRequestMixRequest spreadCompositeRequestMixRequest
                    = new SpreadCompositeRequestMixRequest(prop);
                return service.spreadCompositeRequestMix(this.client.getEndpoint(), name, testHeader, contentType,
                    spreadCompositeRequestMixRequest, updatedContext);
            });
    }
}
