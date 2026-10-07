package encode.datetime.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.utils.DateTimeRfc1123;
import java.time.OffsetDateTime;
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
    private final DatetimeClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of QueriesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueriesImpl(DatetimeClientImpl client) {
        this.service = QueriesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface QueriesService {
        static QueriesService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new QueriesServiceImpl(pipeline);
        }

        Response<Void> defaultMethod(String endpoint, OffsetDateTime value, RequestContext requestContext);

        Response<Void> rfc3339(String endpoint, OffsetDateTime value, RequestContext requestContext);

        Response<Void> rfc7231(String endpoint, DateTimeRfc1123 value, RequestContext requestContext);

        Response<Void> unixTimestamp(String endpoint, long value, RequestContext requestContext);

        Response<Void> unixTimestampArray(String endpoint, String value, RequestContext requestContext);
    }

    private static final class QueriesServiceImpl implements QueriesService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(QueriesServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private QueriesServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> defaultMethod(String endpoint, OffsetDateTime value, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/encode/datetime/query/default");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, QueriesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> rfc3339(String endpoint, OffsetDateTime value, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/encode/datetime/query/rfc3339");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, QueriesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> rfc7231(String endpoint, DateTimeRfc1123 value, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/encode/datetime/query/rfc7231");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, QueriesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> unixTimestamp(String endpoint, long value, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/encode/datetime/query/unix-timestamp");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, QueriesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> unixTimestampArray(String endpoint, String value, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/encode/datetime/query/unix-timestamp-array");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, QueriesServiceImpl.LOGGER);
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
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(OffsetDateTime value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Query.default", requestContext,
            updatedContext -> {
                return service.defaultMethod(this.client.getEndpoint(), value, updatedContext);
            });
    }

    /**
     * The rfc3339 operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> rfc3339WithResponse(OffsetDateTime value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Query.rfc3339", requestContext,
            updatedContext -> {
                return service.rfc3339(this.client.getEndpoint(), value, updatedContext);
            });
    }

    /**
     * The rfc7231 operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> rfc7231WithResponse(OffsetDateTime value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Query.rfc7231", requestContext,
            updatedContext -> {
                DateTimeRfc1123 valueConverted = new DateTimeRfc1123(value);
                return service.rfc7231(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> unixTimestampWithResponse(OffsetDateTime value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Query.unixTimestamp", requestContext,
            updatedContext -> {
                long valueConverted = value.toEpochSecond();
                return service.unixTimestamp(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The unixTimestampArray operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> unixTimestampArrayWithResponse(List<OffsetDateTime> value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Query.unixTimestampArray", requestContext,
            updatedContext -> {
                String valueConverted = value.stream()
                    .map(paramItemValue -> paramItemValue.toEpochSecond())
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
                return service.unixTimestampArray(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(QueriesImpl.class);
}
