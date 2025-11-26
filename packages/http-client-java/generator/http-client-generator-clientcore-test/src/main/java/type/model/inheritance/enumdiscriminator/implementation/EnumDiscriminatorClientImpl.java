package type.model.inheritance.enumdiscriminator.implementation;

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
import type.model.inheritance.enumdiscriminator.Dog;
import type.model.inheritance.enumdiscriminator.Snake;

/**
 * Initializes a new instance of the EnumDiscriminatorClient type.
 */
public final class EnumDiscriminatorClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final EnumDiscriminatorClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * Initializes an instance of EnumDiscriminatorClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public EnumDiscriminatorClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = EnumDiscriminatorClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for EnumDiscriminatorClient to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "EnumDiscriminatorClient", host = "{endpoint}")
    public interface EnumDiscriminatorClientService {
        static EnumDiscriminatorClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName(
                    "type.model.inheritance.enumdiscriminator.implementation.EnumDiscriminatorClientServiceImpl");
                return (EnumDiscriminatorClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/extensible-enum",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Dog> getExtensibleModel(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/enum-discriminator/extensible-enum",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putExtensibleModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Dog input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/extensible-enum/missingdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Dog> getExtensibleModelMissingDiscriminator(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/extensible-enum/wrongdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Dog> getExtensibleModelWrongDiscriminator(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/fixed-enum",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Snake> getFixedModel(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/enum-discriminator/fixed-enum",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putFixedModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Snake input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/fixed-enum/missingdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Snake> getFixedModelMissingDiscriminator(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/fixed-enum/wrongdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Snake> getFixedModelWrongDiscriminator(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);
    }

    /**
     * Receive model with extensible enum discriminator type.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test extensible enum type for discriminator along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getExtensibleModel", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getExtensibleModel(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Send model with extensible enum discriminator type.
     * 
     * @param input Dog to create.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putExtensibleModelWithResponse(Dog input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.putExtensibleModel", requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putExtensibleModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getExtensibleModelMissingDiscriminator", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getExtensibleModelMissingDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getExtensibleModelWrongDiscriminator", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getExtensibleModelWrongDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Receive model with fixed enum discriminator type.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test fixed enum type for discriminator along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.EnumDiscriminator.getFixedModel",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getFixedModel(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Send model with fixed enum discriminator type.
     * 
     * @param input Snake to create.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putFixedModelWithResponse(Snake input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.EnumDiscriminator.putFixedModel",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putFixedModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getFixedModelMissingDiscriminator", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getFixedModelMissingDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getFixedModelWrongDiscriminator", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getFixedModelWrongDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }
}
