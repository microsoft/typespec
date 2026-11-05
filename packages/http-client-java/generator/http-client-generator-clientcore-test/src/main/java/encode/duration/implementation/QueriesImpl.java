package encode.duration.implementation;

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
import java.time.Duration;
import java.util.List;
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
    private final DurationClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of QueriesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueriesImpl(DurationClientImpl client) {
        this.service = QueriesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface QueriesService {
        static QueriesService getNewInstance(HttpPipeline pipeline) {
            return new QueriesServiceImpl(pipeline);
        }

        Response<Void> defaultMethod(String endpoint, Duration input, RequestContext requestContext);

        Response<Void> iso8601(String endpoint, Duration input, RequestContext requestContext);

        Response<Void> int32Seconds(String endpoint, long input, RequestContext requestContext);

        Response<Void> int32SecondsLargerUnit(String endpoint, long input, RequestContext requestContext);

        Response<Void> floatSeconds(String endpoint, double input, RequestContext requestContext);

        Response<Void> floatSecondsLargerUnit(String endpoint, double input, RequestContext requestContext);

        Response<Void> float64Seconds(String endpoint, double input, RequestContext requestContext);

        Response<Void> int32Milliseconds(String endpoint, long input, RequestContext requestContext);

        Response<Void> int32MillisecondsLargerUnit(String endpoint, long input, RequestContext requestContext);

        Response<Void> floatMilliseconds(String endpoint, double input, RequestContext requestContext);

        Response<Void> floatMillisecondsLargerUnit(String endpoint, double input, RequestContext requestContext);

        Response<Void> float64Milliseconds(String endpoint, double input, RequestContext requestContext);

        Response<Void> int32SecondsArray(String endpoint, String input, RequestContext requestContext);

        Response<Void> int32MillisecondsArray(String endpoint, String input, RequestContext requestContext);
    }

    private static final class QueriesServiceImpl implements QueriesService {
        private static final ClientLogger LOGGER = new ClientLogger(QueriesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private QueriesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> defaultMethod(String endpoint, Duration input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/default");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> iso8601(String endpoint, Duration input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/iso8601");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> int32Seconds(String endpoint, long input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/int32-seconds");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> int32SecondsLargerUnit(String endpoint, long input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/int32-seconds-larger-unit");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> floatSeconds(String endpoint, double input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/float-seconds");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> floatSecondsLargerUnit(String endpoint, double input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/float-seconds-larger-unit");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> float64Seconds(String endpoint, double input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/float64-seconds");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> int32Milliseconds(String endpoint, long input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/int32-milliseconds");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> int32MillisecondsLargerUnit(String endpoint, long input, RequestContext requestContext) {
            UriBuilder uriBuilder
                = UriBuilder.parse(endpoint + "/encode/duration/query/int32-milliseconds-larger-unit");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> floatMilliseconds(String endpoint, double input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/float-milliseconds");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> floatMillisecondsLargerUnit(String endpoint, double input,
            RequestContext requestContext) {
            UriBuilder uriBuilder
                = UriBuilder.parse(endpoint + "/encode/duration/query/float-milliseconds-larger-unit");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> float64Milliseconds(String endpoint, double input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/float64-milliseconds");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> int32SecondsArray(String endpoint, String input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/int32-seconds-array");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
        public Response<Void> int32MillisecondsArray(String endpoint, String input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/duration/query/int32-milliseconds-array");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "input", true, input, true);
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
     * The defaultMethod operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.default", requestContext,
            updatedContext -> {
                return service.defaultMethod(this.client.getEndpoint(), input, updatedContext);
            });
    }

    /**
     * The iso8601 operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> iso8601WithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.iso8601", requestContext,
            updatedContext -> {
                return service.iso8601(this.client.getEndpoint(), input, updatedContext);
            });
    }

    /**
     * The int32Seconds operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> int32SecondsWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.int32Seconds", requestContext,
            updatedContext -> {
                long inputConverted = input.getSeconds();
                return service.int32Seconds(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The int32SecondsLargerUnit operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> int32SecondsLargerUnitWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.int32SecondsLargerUnit",
            requestContext, updatedContext -> {
                long inputConverted = input.getSeconds();
                return service.int32SecondsLargerUnit(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The floatSeconds operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> floatSecondsWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.floatSeconds", requestContext,
            updatedContext -> {
                double inputConverted = (double) input.toNanos() / 1000_000_000L;
                return service.floatSeconds(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The floatSecondsLargerUnit operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> floatSecondsLargerUnitWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.floatSecondsLargerUnit",
            requestContext, updatedContext -> {
                double inputConverted = (double) input.toNanos() / 1000_000_000L;
                return service.floatSecondsLargerUnit(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The float64Seconds operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> float64SecondsWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.float64Seconds", requestContext,
            updatedContext -> {
                double inputConverted = (double) input.toNanos() / 1000_000_000L;
                return service.float64Seconds(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The int32Milliseconds operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> int32MillisecondsWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.int32Milliseconds", requestContext,
            updatedContext -> {
                long inputConverted = input.toMillis();
                return service.int32Milliseconds(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The int32MillisecondsLargerUnit operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> int32MillisecondsLargerUnitWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.int32MillisecondsLargerUnit",
            requestContext, updatedContext -> {
                long inputConverted = input.toMillis();
                return service.int32MillisecondsLargerUnit(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The floatMilliseconds operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> floatMillisecondsWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.floatMilliseconds", requestContext,
            updatedContext -> {
                double inputConverted = (double) input.toNanos() / 1000_000L;
                return service.floatMilliseconds(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The floatMillisecondsLargerUnit operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> floatMillisecondsLargerUnitWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.floatMillisecondsLargerUnit",
            requestContext, updatedContext -> {
                double inputConverted = (double) input.toNanos() / 1000_000L;
                return service.floatMillisecondsLargerUnit(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The float64Milliseconds operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> float64MillisecondsWithResponse(Duration input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.float64Milliseconds", requestContext,
            updatedContext -> {
                double inputConverted = (double) input.toNanos() / 1000_000L;
                return service.float64Milliseconds(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The int32SecondsArray operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> int32SecondsArrayWithResponse(List<Duration> input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.int32SecondsArray", requestContext,
            updatedContext -> {
                String inputConverted = input.stream()
                    .map(paramItemValue -> paramItemValue.getSeconds())
                    .collect(Collectors.toList())
                    .stream()
                    .map(paramItemValue -> {
                        if (paramItemValue == null) {
                            return "";
                        } else {
                            String itemValueString = BinaryData.fromObject(paramItemValue).toString();
                            int strLength = itemValueString.length();
                            int startOffset = 0;
                            while (startOffset < strLength) {
                                if (itemValueString.charAt(startOffset) != '"') {
                                    break;
                                }
                                startOffset++;
                            }
                            if (startOffset == strLength) {
                                return "";
                            }
                            int endOffset = strLength - 1;
                            while (endOffset >= 0) {
                                if (itemValueString.charAt(endOffset) != '"') {
                                    break;
                                }

                                endOffset--;
                            }
                            return itemValueString.substring(startOffset, endOffset + 1);
                        }
                    })
                    .collect(Collectors.joining(","));
                return service.int32SecondsArray(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    /**
     * The int32MillisecondsArray operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> int32MillisecondsArrayWithResponse(List<Duration> input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Query.int32MillisecondsArray",
            requestContext, updatedContext -> {
                String inputConverted = input.stream()
                    .map(paramItemValue -> paramItemValue.toMillis())
                    .collect(Collectors.toList())
                    .stream()
                    .map(paramItemValue -> {
                        if (paramItemValue == null) {
                            return "";
                        } else {
                            String itemValueString = BinaryData.fromObject(paramItemValue).toString();
                            int strLength = itemValueString.length();
                            int startOffset = 0;
                            while (startOffset < strLength) {
                                if (itemValueString.charAt(startOffset) != '"') {
                                    break;
                                }
                                startOffset++;
                            }
                            if (startOffset == strLength) {
                                return "";
                            }
                            int endOffset = strLength - 1;
                            while (endOffset >= 0) {
                                if (itemValueString.charAt(endOffset) != '"') {
                                    break;
                                }

                                endOffset--;
                            }
                            return itemValueString.substring(startOffset, endOffset + 1);
                        }
                    })
                    .collect(Collectors.joining(","));
                return service.int32MillisecondsArray(this.client.getEndpoint(), inputConverted, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(QueriesImpl.class);
}
