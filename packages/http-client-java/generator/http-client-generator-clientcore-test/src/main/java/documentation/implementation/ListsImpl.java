package documentation.implementation;

import documentation.lists.BulletPointsModel;
import documentation.lists.implementation.BulletPointsModelRequest;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;

/**
 * An instance of this class provides access to all the operations defined in Lists.
 */
public final class ListsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ListsService service;

    /**
     * The service client containing this operation class.
     */
    private final DocumentationClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ListsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ListsImpl(DocumentationClientImpl client) {
        this.service = ListsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ListsService {
        static ListsService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ListsServiceImpl(pipeline);
        }

        Response<Void> bulletPointsOp(String endpoint, RequestContext requestContext);

        Response<Void> bulletPointsModel(String endpoint, String contentType,
            BulletPointsModelRequest bulletPointsModelRequest, RequestContext requestContext);

        Response<Void> numbered(String endpoint, RequestContext requestContext);
    }

    private static final class ListsServiceImpl implements ListsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(ListsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private ListsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> bulletPointsOp(String endpoint, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/documentation/lists/bullet-points/op");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, ListsServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> bulletPointsModel(String endpoint, String contentType,
            BulletPointsModelRequest bulletPointsModelRequest, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/documentation/lists/bullet-points/model");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (bulletPointsModelRequest != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(bulletPointsModelRequest,
                    this.xmlSerializer.supportsFormat(requestSerializationFormat)
                        ? this.xmlSerializer
                        : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, ListsServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> numbered(String endpoint, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/documentation/lists/numbered");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, ListsServiceImpl.LOGGER);
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
     * This tests:
     * - Simple bullet point. This bullet point is going to be very long to test how text wrapping is handled in bullet
     * points within documentation comments. It should properly indent the wrapped lines.
     * - Another bullet point with **bold text**. This bullet point is also intentionally long to see how the formatting
     * is preserved when the text wraps onto multiple lines in the generated documentation.
     * - Third bullet point with *italic text*. Similar to the previous points, this one is extended to ensure that the
     * wrapping and formatting are correctly applied in the output.
     * - Complex bullet point with **bold** and *italic* combined. This bullet point combines both bold and italic
     * formatting and is long enough to test the wrapping behavior in such cases.
     * - **Bold bullet point**: A bullet point that is entirely bolded. This point is also made lengthy to observe how
     * the bold formatting is maintained across wrapped lines.
     * - *Italic bullet point*: A bullet point that is entirely italicized. This final point is extended to verify that
     * italic formatting is correctly applied even when the text spans multiple lines.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> bulletPointsOpWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.bulletPointsOp", requestContext,
            updatedContext -> {
                return service.bulletPointsOp(this.client.getEndpoint(), updatedContext);
            });
    }

    /**
     * The bulletPointsModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> bulletPointsModelWithResponse(BulletPointsModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.bulletPointsModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                BulletPointsModelRequest bulletPointsModelRequest = new BulletPointsModelRequest(input);
                return service.bulletPointsModel(this.client.getEndpoint(), contentType, bulletPointsModelRequest,
                    updatedContext);
            });
    }

    /**
     * Steps to follow:
     * 1. First step with **important** note
     * 2. Second step with *emphasis*
     * 3. Third step combining **bold** and *italic*
     * 4. **Final step**: Review all steps for *accuracy*.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> numberedWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Documentation.Lists.numbered", requestContext,
            updatedContext -> {
                return service.numbered(this.client.getEndpoint(), updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ListsImpl.class);
}
