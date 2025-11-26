package type.property.nullable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import type.property.nullable.CollectionsModelProperty;

/**
 * An instance of this class provides access to all the operations defined in CollectionsModels.
 */
public final class CollectionsModelsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final CollectionsModelsService service;

    /**
     * The service client containing this operation class.
     */
    private final NullableClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of CollectionsModelsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    CollectionsModelsImpl(NullableClientImpl client) {
        this.service = CollectionsModelsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for NullableClientCollectionsModels to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "NullableClientCollectionsModels", host = "{endpoint}")
    public interface CollectionsModelsService {
        static CollectionsModelsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.property.nullable.implementation.CollectionsModelsServiceImpl");
                return (CollectionsModelsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/nullable/collections/model/non-null",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<CollectionsModelProperty> getNonNull(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/nullable/collections/model/null",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<CollectionsModelProperty> getNull(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/type/property/nullable/collections/model/non-null",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> patchNonNull(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/merge-patch+json") CollectionsModelProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/type/property/nullable/collections/model/null",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> patchNull(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/merge-patch+json") CollectionsModelProperty body, RequestContext requestContext);
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CollectionsModelProperty> getNonNullWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Nullable.CollectionsModel.getNonNull",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getNonNull(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Get models that will return the default object.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return the default object along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CollectionsModelProperty> getNullWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Nullable.CollectionsModel.getNull",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getNull(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Put a body with all properties present.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> patchNonNullWithResponse(CollectionsModelProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Nullable.CollectionsModel.patchNonNull",
            requestContext, updatedContext -> {
                final String contentType = "application/merge-patch+json";
                return service.patchNonNull(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Put a body with default properties.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> patchNullWithResponse(CollectionsModelProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Nullable.CollectionsModel.patchNull",
            requestContext, updatedContext -> {
                final String contentType = "application/merge-patch+json";
                return service.patchNull(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
