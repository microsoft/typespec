package type.model.inheritance.notdiscriminated.implementation;

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
import type.model.inheritance.notdiscriminated.Siamese;

/**
 * Initializes a new instance of the NotDiscriminatedClient type.
 */
public final class NotDiscriminatedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NotDiscriminatedClientService service;

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
     * Initializes an instance of NotDiscriminatedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public NotDiscriminatedClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = NotDiscriminatedClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The HTTP operations for NotDiscriminatedClient.
     */
    public interface NotDiscriminatedClientService {
        static NotDiscriminatedClientService getNewInstance(HttpPipeline pipeline) {
            return new NotDiscriminatedClientServiceImpl(pipeline);
        }

        Response<Void> postValid(String endpoint, String contentType, Siamese input, RequestContext requestContext);

        Response<Siamese> getValid(String endpoint, String accept, RequestContext requestContext);

        Response<Siamese> putValid(String endpoint, String contentType, String accept, Siamese input,
            RequestContext requestContext);
    }

    private static final class NotDiscriminatedClientServiceImpl implements NotDiscriminatedClientService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(NotDiscriminatedClientService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private NotDiscriminatedClientServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<Void> postValid(String endpoint, String contentType, Siamese input,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/type/model/inheritance/not-discriminated/valid");
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
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
        public Response<Siamese> getValid(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/type/model/inheritance/not-discriminated/valid");
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
                    CoreUtils.createParameterizedType(Response.class, Siamese.class),
                    CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())));
        }

        @Override
        public Response<Siamese> putValid(String endpoint, String contentType, String accept, Siamese input,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/type/model/inheritance/not-discriminated/valid");
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("Accept"), accept);
            }
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
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
                    CoreUtils.createParameterizedType(Response.class, Siamese.class),
                    CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())));
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
     * The postValid operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postValidWithResponse(Siamese input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.NotDiscriminated.postValid",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.postValid(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The getValid operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the third level model in the normal multiple levels inheritance along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Siamese> getValidWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.NotDiscriminated.getValid",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getValid(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The putValid operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the third level model in the normal multiple levels inheritance along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Siamese> putValidWithResponse(Siamese input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.NotDiscriminated.putValid",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.putValid(this.getEndpoint(), contentType, accept, input, updatedContext);
            });
    }
}
