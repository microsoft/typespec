package type.enumnamespace.extensible.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import java.lang.reflect.ParameterizedType;
import type.enumnamespace.extensible.DaysOfWeekExtensibleEnum;

/**
 * An instance of this class provides access to all the operations defined in StringOperations.
 */
public final class StringOperationsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringOperationsService service;

    /**
     * The service client containing this operation class.
     */
    private final ExtensibleClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of StringOperationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringOperationsImpl(ExtensibleClientImpl client) {
        this.service = StringOperationsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The HTTP operations for ExtensibleClientStringOperations.
     */
    public interface StringOperationsService {
        static StringOperationsService getNewInstance(HttpPipeline pipeline) {
            return new StringOperationsServiceImpl(pipeline);
        }

        Response<DaysOfWeekExtensibleEnum> getKnownValue(String endpoint, String accept, RequestContext requestContext);

        Response<DaysOfWeekExtensibleEnum> getUnknownValue(String endpoint, String accept,
            RequestContext requestContext);

        Response<Void> putKnownValue(String endpoint, String contentType, DaysOfWeekExtensibleEnum body,
            RequestContext requestContext);

        Response<Void> putUnknownValue(String endpoint, String contentType, DaysOfWeekExtensibleEnum body,
            RequestContext requestContext);
    }

    private static final class StringOperationsServiceImpl implements StringOperationsService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(StringOperationsService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private StringOperationsServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<DaysOfWeekExtensibleEnum> getKnownValue(String endpoint, String accept,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/type/enum/extensible/string/known-value");
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("Accept"), accept);
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            boolean expectedResponse = responseCode == 200;
            if (!expectedResponse) {
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, null, HTTP_LOG);
            }
            return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                this.decodeResponse(networkResponse.getValue(),
                    CoreUtils.createParameterizedType(Response.class, DaysOfWeekExtensibleEnum.class),
                    CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())));
        }

        @Override
        public Response<DaysOfWeekExtensibleEnum> getUnknownValue(String endpoint, String accept,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/type/enum/extensible/string/unknown-value");
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("Accept"), accept);
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            boolean expectedResponse = responseCode == 200;
            if (!expectedResponse) {
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, null, HTTP_LOG);
            }
            return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                this.decodeResponse(networkResponse.getValue(),
                    CoreUtils.createParameterizedType(Response.class, DaysOfWeekExtensibleEnum.class),
                    CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())));
        }

        @Override
        public Response<Void> putKnownValue(String endpoint, String contentType, DaysOfWeekExtensibleEnum body,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/type/enum/extensible/string/known-value");
            if (body != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(body,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<Void> putUnknownValue(String endpoint, String contentType, DaysOfWeekExtensibleEnum body,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/type/enum/extensible/string/unknown-value");
            if (body != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(body,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        private <T> T decodeResponse(BinaryData value, ParameterizedType type, SerializationFormat format) {
            if (this.jsonSerializer.supportsFormat(format)) {
                return CoreUtils.decodeNetworkResponse(value, this.jsonSerializer, type);
            }
            if (this.xmlSerializer.supportsFormat(format)) {
                return CoreUtils.decodeNetworkResponse(value, this.xmlSerializer, type);
            }
            throw HTTP_LOG.throwableAtError()
                .addKeyValue("serializationFormat", format.name())
                .log("None of the provided serializers support the format.", UnsupportedOperationException::new);
        }
    }

    /**
     * The getKnownValue operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DaysOfWeekExtensibleEnum> getKnownValueWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Extensible.String.getKnownValue", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getKnownValue(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The getUnknownValue operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DaysOfWeekExtensibleEnum> getUnknownValueWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Extensible.String.getUnknownValue",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getUnknownValue(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The putKnownValue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putKnownValueWithResponse(DaysOfWeekExtensibleEnum body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Extensible.String.putKnownValue", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.putKnownValue(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * The putUnknownValue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putUnknownValueWithResponse(DaysOfWeekExtensibleEnum body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Extensible.String.putUnknownValue",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putUnknownValue(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
