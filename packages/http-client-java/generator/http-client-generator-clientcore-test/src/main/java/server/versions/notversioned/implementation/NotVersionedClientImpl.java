package server.versions.notversioned.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.implementation.utils.UriEscapers;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;

/**
 * Initializes a new instance of the NotVersionedClient type.
 */
public final class NotVersionedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NotVersionedClientService service;

    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    private final String endpoint;

    /**
     * Gets Need to be set as 'http://localhost:3000' in client.
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
     * Initializes an instance of NotVersionedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     */
    public NotVersionedClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = NotVersionedClientService.getNewInstance(this.httpPipeline);
    }

    public interface NotVersionedClientService {
        static NotVersionedClientService getNewInstance(HttpPipeline pipeline) {
            return new NotVersionedClientServiceImpl(pipeline);
        }

        Response<Void> withoutApiVersion(String endpoint, RequestContext requestContext);

        Response<Void> withQueryApiVersion(String endpoint, String apiVersion, RequestContext requestContext);

        Response<Void> withPathApiVersion(String endpoint, String apiVersion, RequestContext requestContext);
    }

    private static final class NotVersionedClientServiceImpl implements NotVersionedClientService {
        private static final ClientLogger LOGGER = new ClientLogger(NotVersionedClientServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private NotVersionedClientServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> withoutApiVersion(String endpoint, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.HEAD)
                .setUri(endpoint + "/server/versions/not-versioned/without-api-version");
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, NotVersionedClientServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withQueryApiVersion(String endpoint, String apiVersion, RequestContext requestContext) {
            UriBuilder uriBuilder
                = UriBuilder.parse(endpoint + "/server/versions/not-versioned/with-query-api-version");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "api-version", true, apiVersion, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.HEAD).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, NotVersionedClientServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withPathApiVersion(String endpoint, String apiVersion, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.HEAD)
                .setUri(endpoint + "/server/versions/not-versioned/with-path-api-version/"
                    + UriEscapers.PATH_ESCAPER.escape(apiVersion));
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, NotVersionedClientServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withoutApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.NotVersioned.withoutApiVersion",
            requestContext, updatedContext -> {
                return service.withoutApiVersion(this.getEndpoint(), updatedContext);
            });
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryApiVersionWithResponse(String apiVersion, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.NotVersioned.withQueryApiVersion",
            requestContext, updatedContext -> {
                return service.withQueryApiVersion(this.getEndpoint(), apiVersion, updatedContext);
            });
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPathApiVersionWithResponse(String apiVersion, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.NotVersioned.withPathApiVersion",
            requestContext, updatedContext -> {
                return service.withPathApiVersion(this.getEndpoint(), apiVersion, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(NotVersionedClientImpl.class);
}
