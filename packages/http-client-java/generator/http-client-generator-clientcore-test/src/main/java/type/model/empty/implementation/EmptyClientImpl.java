package type.model.empty.implementation;

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
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import type.model.empty.EmptyInput;
import type.model.empty.EmptyInputOutput;
import type.model.empty.EmptyOutput;

/**
 * Initializes a new instance of the EmptyClient type.
 */
public final class EmptyClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final EmptyClientService service;

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
     * Initializes an instance of EmptyClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public EmptyClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = EmptyClientService.getNewInstance(this.httpPipeline);
    }

    public interface EmptyClientService {
        static EmptyClientService getNewInstance(HttpPipeline pipeline) {
            return new EmptyClientServiceImpl(pipeline);
        }

        Response<Void> putEmpty(String endpoint, String contentType, EmptyInput input, RequestContext requestContext);

        Response<EmptyOutput> getEmpty(String endpoint, String accept, RequestContext requestContext);

        Response<EmptyInputOutput> postRoundTripEmpty(String endpoint, String contentType, String accept,
            EmptyInputOutput body, RequestContext requestContext);
    }

    private static final class EmptyClientServiceImpl implements EmptyClientService {
        private static final ClientLogger LOGGER = new ClientLogger(EmptyClientServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private EmptyClientServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> putEmpty(String endpoint, String contentType, EmptyInput input,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.PUT).setUri(endpoint + "/type/model/empty/alone");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (input != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(input, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, EmptyClientServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<EmptyOutput> getEmpty(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/type/model/empty/alone");
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, EmptyClientServiceImpl.LOGGER);
            }
            try {
                EmptyOutput deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, EmptyOutput.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<EmptyInputOutput> postRoundTripEmpty(String endpoint, String contentType, String accept,
            EmptyInputOutput body, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/type/model/empty/round-trip");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, EmptyClientServiceImpl.LOGGER);
            }
            try {
                EmptyInputOutput deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, EmptyInputOutput.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The putEmpty operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putEmptyWithResponse(EmptyInput input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Empty.putEmpty", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.putEmpty(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The getEmpty operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return empty model used in operation return type along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<EmptyOutput> getEmptyWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Empty.getEmpty", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getEmpty(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The postRoundTripEmpty operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return empty model used in both parameter and return type along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<EmptyInputOutput> postRoundTripEmptyWithResponse(EmptyInputOutput body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Empty.postRoundTripEmpty", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.postRoundTripEmpty(this.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(EmptyClientImpl.class);
}
