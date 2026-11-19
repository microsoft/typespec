package type.union.discriminated.extendsnamespace.implementation;

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
import type.union.discriminated.extendsnamespace.customdiscriminator.PetBase2;

/**
 * An instance of this class provides access to all the operations defined in CustomDiscriminatorOperations.
 */
public final class CustomDiscriminatorOperationsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final CustomDiscriminatorOperationsService service;

    /**
     * The service client containing this operation class.
     */
    private final ExtendsClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of CustomDiscriminatorOperationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    CustomDiscriminatorOperationsImpl(ExtendsClientImpl client) {
        this.service = CustomDiscriminatorOperationsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for ExtendsClientCustomDiscriminatorOperations to be used by the proxy
     * service to perform REST calls.
     */
    @ServiceInterface(name = "ExtendsClientCustomDiscriminatorOperations", host = "{endpoint}")
    public interface CustomDiscriminatorOperationsService {
        static CustomDiscriminatorOperationsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName(
                    "type.union.discriminated.extendsnamespace.implementation.CustomDiscriminatorOperationsServiceImpl");
                return (CustomDiscriminatorOperationsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/discriminated/extends/custom-discriminator/cat",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PetBase2> getCat(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/union/discriminated/extends/custom-discriminator/cat",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putCat(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") PetBase2 input, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/union/discriminated/extends/custom-discriminator/dog",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PetBase2> getDog(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/union/discriminated/extends/custom-discriminator/dog",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putDog(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") PetBase2 input, RequestContext requestContext);
    }

    /**
     * The getCat operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PetBase2> getCatWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Extends.Operations.getCat",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getCat(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The putCat operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putCatWithResponse(PetBase2 input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Extends.Operations.putCat",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putCat(this.client.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The getDog operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PetBase2> getDogWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Extends.Operations.getDog",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getDog(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The putDog operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putDogWithResponse(PetBase2 input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Union.Discriminated.Extends.Operations.putDog",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putDog(this.client.getEndpoint(), contentType, input, updatedContext);
            });
    }
}
