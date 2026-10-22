package routes.implementation;

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

/**
 * An instance of this class provides access to all the operations defined in QueryParameters.
 */
public final class QueryParametersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final QueryParametersService service;

    /**
     * The service client containing this operation class.
     */
    private final RoutesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of QueryParametersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueryParametersImpl(RoutesClientImpl client) {
        this.service = QueryParametersService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface QueryParametersService {
        static QueryParametersService getNewInstance(HttpPipeline pipeline) {
            return new QueryParametersServiceImpl(pipeline);
        }

        Response<Void> templateOnly(String endpoint, String param, RequestContext requestContext);

        Response<Void> explicit(String endpoint, String param, RequestContext requestContext);

        Response<Void> annotationOnly(String endpoint, String param, RequestContext requestContext);
    }

    private static final class QueryParametersServiceImpl implements QueryParametersService {
        private static final ClientLogger LOGGER = new ClientLogger(QueryParametersServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private QueryParametersServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> templateOnly(String endpoint, String param, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/routes/query/template-only");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "param", true, param, true);
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
                    null, null, null, QueryParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> explicit(String endpoint, String param, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/routes/query/explicit");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "param", true, param, true);
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
                    null, null, null, QueryParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> annotationOnly(String endpoint, String param, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/routes/query/annotation-only");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "param", true, param, true);
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
                    null, null, null, QueryParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The templateOnly operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> templateOnlyWithResponse(String param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Routes.QueryParameters.templateOnly", requestContext,
            updatedContext -> {
                return service.templateOnly(this.client.getEndpoint(), param, updatedContext);
            });
    }

    /**
     * The explicit operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> explicitWithResponse(String param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Routes.QueryParameters.explicit", requestContext,
            updatedContext -> {
                return service.explicit(this.client.getEndpoint(), param, updatedContext);
            });
    }

    /**
     * The annotationOnly operation.
     * 
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> annotationOnlyWithResponse(String param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Routes.QueryParameters.annotationOnly", requestContext,
            updatedContext -> {
                return service.annotationOnly(this.client.getEndpoint(), param, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(QueryParametersImpl.class);
}
