package routes.implementation;

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
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in PathParametersPathExpansionExplodes.
 */
public final class PathParametersPathExpansionExplodesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PathParametersPathExpansionExplodesService service;

    /**
     * The service client containing this operation class.
     */
    private final RoutesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PathParametersPathExpansionExplodesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PathParametersPathExpansionExplodesImpl(RoutesClientImpl client) {
        this.service = PathParametersPathExpansionExplodesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface PathParametersPathExpansionExplodesService {
        static PathParametersPathExpansionExplodesService getNewInstance(HttpPipeline pipeline) {
            return new PathParametersPathExpansionExplodesServiceImpl(pipeline);
        }

        Response<Void> primitive(String endpoint, String param, RequestContext requestContext);

        Response<Void> array(String endpoint, String param, RequestContext requestContext);

        Response<Void> record(String endpoint, Map<String, Integer> param, RequestContext requestContext);
    }

    private static final class PathParametersPathExpansionExplodesServiceImpl
        implements PathParametersPathExpansionExplodesService {
        private static final ClientLogger LOGGER
            = new ClientLogger(PathParametersPathExpansionExplodesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private PathParametersPathExpansionExplodesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> primitive(String endpoint, String param, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/routes/path/path/explode/primitive" + UriEscapers.PATH_ESCAPER.escape(param));
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, PathParametersPathExpansionExplodesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> array(String endpoint, String param, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/routes/path/path/explode/array" + UriEscapers.PATH_ESCAPER.escape(param));
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, PathParametersPathExpansionExplodesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> record(String endpoint, Map<String, Integer> param, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/routes/path/path/explode/record"
                    + UriEscapers.PATH_ESCAPER.escape(String.valueOf(param)));
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, PathParametersPathExpansionExplodesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The primitive operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> primitiveWithResponse(String param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Routes.PathParameters.PathExpansion.Explode.primitive",
            requestContext, updatedContext -> {
                return service.primitive(this.client.getEndpoint(), param, updatedContext);
            });
    }

    /**
     * The array operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> arrayWithResponse(List<String> param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Routes.PathParameters.PathExpansion.Explode.array",
            requestContext, updatedContext -> {
                String paramConverted = param.stream()
                    .map(paramItemValue -> Objects.toString(paramItemValue, ""))
                    .collect(Collectors.joining(","));
                return service.array(this.client.getEndpoint(), paramConverted, updatedContext);
            });
    }

    /**
     * The record operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> recordWithResponse(Map<String, Integer> param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Routes.PathParameters.PathExpansion.Explode.record",
            requestContext, updatedContext -> {
                return service.record(this.client.getEndpoint(), param, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(PathParametersPathExpansionExplodesImpl.class);
}
