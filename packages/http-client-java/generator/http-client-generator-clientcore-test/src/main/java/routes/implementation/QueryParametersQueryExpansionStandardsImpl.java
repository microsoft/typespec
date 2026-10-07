package routes.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in QueryParametersQueryExpansionStandards.
 */
public final class QueryParametersQueryExpansionStandardsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final QueryParametersQueryExpansionStandardsService service;

    /**
     * The service client containing this operation class.
     */
    private final RoutesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of QueryParametersQueryExpansionStandardsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueryParametersQueryExpansionStandardsImpl(RoutesClientImpl client) {
        this.service = QueryParametersQueryExpansionStandardsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface QueryParametersQueryExpansionStandardsService {
        static QueryParametersQueryExpansionStandardsService
            getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new QueryParametersQueryExpansionStandardsServiceImpl(pipeline);
        }

        Response<Void> primitive(String endpoint, String param, RequestContext requestContext);

        Response<Void> array(String endpoint, String param, RequestContext requestContext);

        Response<Void> record(String endpoint, Map<String, Integer> param, RequestContext requestContext);
    }

    private static final class QueryParametersQueryExpansionStandardsServiceImpl
        implements QueryParametersQueryExpansionStandardsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(
                QueryParametersQueryExpansionStandardsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private QueryParametersQueryExpansionStandardsServiceImpl(
            io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> primitive(String endpoint, String param, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/routes/query/query-expansion/standard/primitive");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "param", true, param, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null,
                    QueryParametersQueryExpansionStandardsServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> array(String endpoint, String param, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/routes/query/query-expansion/standard/array");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "param", true, param, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null,
                    QueryParametersQueryExpansionStandardsServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> record(String endpoint, Map<String, Integer> param, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/routes/query/query-expansion/standard/record");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "param", true, param, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null,
                    QueryParametersQueryExpansionStandardsServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
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
        return this.instrumentation.instrumentWithResponse("Routes.QueryParameters.QueryExpansion.Standard.primitive",
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
        return this.instrumentation.instrumentWithResponse("Routes.QueryParameters.QueryExpansion.Standard.array",
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
        return this.instrumentation.instrumentWithResponse("Routes.QueryParameters.QueryExpansion.Standard.record",
            requestContext, updatedContext -> {
                return service.record(this.client.getEndpoint(), param, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(QueryParametersQueryExpansionStandardsImpl.class);
}
