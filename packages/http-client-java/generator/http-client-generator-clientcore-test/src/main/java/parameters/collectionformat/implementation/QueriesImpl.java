package parameters.collectionformat.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
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
import io.clientcore.core.utils.UriBuilder;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in Queries.
 */
public final class QueriesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final QueriesService service;

    /**
     * The service client containing this operation class.
     */
    private final CollectionFormatClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of QueriesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueriesImpl(CollectionFormatClientImpl client) {
        this.service = QueriesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface QueriesService {
        static QueriesService getNewInstance(HttpPipeline pipeline) {
            return new QueriesServiceImpl(pipeline);
        }

        Response<Void> multi(String endpoint, List<String> colors, RequestContext requestContext);

        Response<Void> ssv(String endpoint, String colors, RequestContext requestContext);

        Response<Void> pipes(String endpoint, String colors, RequestContext requestContext);

        Response<Void> csv(String endpoint, String colors, RequestContext requestContext);
    }

    private static final class QueriesServiceImpl implements QueriesService {
        private static final ClientLogger LOGGER = new ClientLogger(QueriesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private QueriesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> multi(String endpoint, List<String> colors, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/parameters/collection-format/query/multi");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "colors", true, colors, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                    null, null, null, QueriesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> ssv(String endpoint, String colors, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/parameters/collection-format/query/ssv");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "colors", true, colors, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                    null, null, null, QueriesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> pipes(String endpoint, String colors, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/parameters/collection-format/query/pipes");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "colors", true, colors, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                    null, null, null, QueriesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> csv(String endpoint, String colors, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/parameters/collection-format/query/csv");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "colors", true, colors, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                    null, null, null, QueriesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The multi operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> multiWithResponse(List<String> colors, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.CollectionFormat.Query.multi", requestContext,
            updatedContext -> {
                List<String> colorsConverted
                    = colors.stream().map(item -> Objects.toString(item, "")).collect(Collectors.toList());
                return service.multi(this.client.getEndpoint(), colorsConverted, updatedContext);
            });
    }

    /**
     * The ssv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> ssvWithResponse(List<String> colors, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.CollectionFormat.Query.ssv", requestContext,
            updatedContext -> {
                String colorsConverted = colors.stream()
                    .map(paramItemValue -> Objects.toString(paramItemValue, ""))
                    .collect(Collectors.joining(" "));
                return service.ssv(this.client.getEndpoint(), colorsConverted, updatedContext);
            });
    }

    /**
     * The pipes operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> pipesWithResponse(List<String> colors, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.CollectionFormat.Query.pipes", requestContext,
            updatedContext -> {
                String colorsConverted = colors.stream()
                    .map(paramItemValue -> Objects.toString(paramItemValue, ""))
                    .collect(Collectors.joining("|"));
                return service.pipes(this.client.getEndpoint(), colorsConverted, updatedContext);
            });
    }

    /**
     * The csv operation.
     * 
     * @param colors Possible values for colors are [blue,red,green].
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> csvWithResponse(List<String> colors, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.CollectionFormat.Query.csv", requestContext,
            updatedContext -> {
                String colorsConverted = colors.stream()
                    .map(paramItemValue -> Objects.toString(paramItemValue, ""))
                    .collect(Collectors.joining(","));
                return service.csv(this.client.getEndpoint(), colorsConverted, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(QueriesImpl.class);
}
