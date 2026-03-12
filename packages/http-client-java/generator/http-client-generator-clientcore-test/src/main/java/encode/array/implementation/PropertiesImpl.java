package encode.array.implementation;

import encode.array.CommaDelimitedArrayProperty;
import encode.array.CommaDelimitedEnumArrayProperty;
import encode.array.CommaDelimitedExtensibleEnumArrayProperty;
import encode.array.NewlineDelimitedArrayProperty;
import encode.array.NewlineDelimitedEnumArrayProperty;
import encode.array.NewlineDelimitedExtensibleEnumArrayProperty;
import encode.array.PipeDelimitedArrayProperty;
import encode.array.PipeDelimitedEnumArrayProperty;
import encode.array.PipeDelimitedExtensibleEnumArrayProperty;
import encode.array.SpaceDelimitedArrayProperty;
import encode.array.SpaceDelimitedEnumArrayProperty;
import encode.array.SpaceDelimitedExtensibleEnumArrayProperty;
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

/**
 * An instance of this class provides access to all the operations defined in Properties.
 */
public final class PropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final ArrayClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(ArrayClientImpl client) {
        this.service = PropertiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for ArrayClientProperties to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "ArrayClientProperties", host = "{endpoint}")
    public interface PropertiesService {
        static PropertiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.array.implementation.PropertiesServiceImpl");
                return (PropertiesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/comma-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<CommaDelimitedArrayProperty> commaDelimited(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") CommaDelimitedArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/space-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<SpaceDelimitedArrayProperty> spaceDelimited(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") SpaceDelimitedArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/pipe-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PipeDelimitedArrayProperty> pipeDelimited(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") PipeDelimitedArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/newline-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<NewlineDelimitedArrayProperty> newlineDelimited(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") NewlineDelimitedArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/enum/comma-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<CommaDelimitedEnumArrayProperty> enumCommaDelimited(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") CommaDelimitedEnumArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/enum/space-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<SpaceDelimitedEnumArrayProperty> enumSpaceDelimited(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") SpaceDelimitedEnumArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/enum/pipe-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PipeDelimitedEnumArrayProperty> enumPipeDelimited(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") PipeDelimitedEnumArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/enum/newline-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<NewlineDelimitedEnumArrayProperty> enumNewlineDelimited(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") NewlineDelimitedEnumArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/extensible-enum/comma-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<CommaDelimitedExtensibleEnumArrayProperty> extensibleEnumCommaDelimited(
            @HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept,
            @BodyParam("application/json") CommaDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/extensible-enum/space-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<SpaceDelimitedExtensibleEnumArrayProperty> extensibleEnumSpaceDelimited(
            @HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept,
            @BodyParam("application/json") SpaceDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/extensible-enum/pipe-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PipeDelimitedExtensibleEnumArrayProperty> extensibleEnumPipeDelimited(
            @HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept,
            @BodyParam("application/json") PipeDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/array/property/extensible-enum/newline-delimited",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<NewlineDelimitedExtensibleEnumArrayProperty> extensibleEnumNewlineDelimited(
            @HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept,
            @BodyParam("application/json") NewlineDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext);
    }

    /**
     * The commaDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CommaDelimitedArrayProperty> commaDelimitedWithResponse(CommaDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.commaDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.commaDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The spaceDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SpaceDelimitedArrayProperty> spaceDelimitedWithResponse(SpaceDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.spaceDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.spaceDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The pipeDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PipeDelimitedArrayProperty> pipeDelimitedWithResponse(PipeDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.pipeDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.pipeDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The newlineDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewlineDelimitedArrayProperty> newlineDelimitedWithResponse(NewlineDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.newlineDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.newlineDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The enumCommaDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CommaDelimitedEnumArrayProperty>
        enumCommaDelimitedWithResponse(CommaDelimitedEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.enumCommaDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.enumCommaDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The enumSpaceDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SpaceDelimitedEnumArrayProperty>
        enumSpaceDelimitedWithResponse(SpaceDelimitedEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.enumSpaceDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.enumSpaceDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The enumPipeDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PipeDelimitedEnumArrayProperty> enumPipeDelimitedWithResponse(PipeDelimitedEnumArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.enumPipeDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.enumPipeDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The enumNewlineDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewlineDelimitedEnumArrayProperty>
        enumNewlineDelimitedWithResponse(NewlineDelimitedEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.enumNewlineDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.enumNewlineDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    /**
     * The extensibleEnumCommaDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CommaDelimitedExtensibleEnumArrayProperty> extensibleEnumCommaDelimitedWithResponse(
        CommaDelimitedExtensibleEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.extensibleEnumCommaDelimited",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.extensibleEnumCommaDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    /**
     * The extensibleEnumSpaceDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SpaceDelimitedExtensibleEnumArrayProperty> extensibleEnumSpaceDelimitedWithResponse(
        SpaceDelimitedExtensibleEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.extensibleEnumSpaceDelimited",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.extensibleEnumSpaceDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    /**
     * The extensibleEnumPipeDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PipeDelimitedExtensibleEnumArrayProperty> extensibleEnumPipeDelimitedWithResponse(
        PipeDelimitedExtensibleEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.extensibleEnumPipeDelimited",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.extensibleEnumPipeDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    /**
     * The extensibleEnumNewlineDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewlineDelimitedExtensibleEnumArrayProperty> extensibleEnumNewlineDelimitedWithResponse(
        NewlineDelimitedExtensibleEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.extensibleEnumNewlineDelimited",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.extensibleEnumNewlineDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }
}
