package type.file.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import type.file.body.UploadFileMultipleContentTypesContentType;

/**
 * An instance of this class provides access to all the operations defined in Bodies.
 */
public final class BodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final FileClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    BodiesImpl(FileClientImpl client) {
        this.service = BodiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface BodiesService {
        static BodiesService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new BodiesServiceImpl(pipeline);
        }

        Response<Void> uploadFileSpecificContentType(String endpoint, String contentType, BinaryData file,
            long contentLength, RequestContext requestContext);

        Response<Void> uploadFileJsonContentType(String endpoint, String contentType, BinaryData file,
            long contentLength, RequestContext requestContext);

        Response<BinaryData> downloadFileJsonContentType(String endpoint, String accept, RequestContext requestContext);

        Response<BinaryData> downloadFileSpecificContentType(String endpoint, String accept,
            RequestContext requestContext);

        Response<Void> uploadFileMultipleContentTypes(String endpoint,
            UploadFileMultipleContentTypesContentType contentType, BinaryData file, long contentLength,
            RequestContext requestContext);

        Response<BinaryData> downloadFileMultipleContentTypes(String endpoint, String accept,
            RequestContext requestContext);

        Response<Void> uploadFileDefaultContentType(String endpoint, String contentType, BinaryData file,
            long contentLength, RequestContext requestContext);

        Response<BinaryData> downloadFileDefaultContentType(String endpoint, String accept,
            RequestContext requestContext);
    }

    private static final class BodiesServiceImpl implements BodiesService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(BodiesServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private BodiesServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> uploadFileSpecificContentType(String endpoint, String contentType, BinaryData file,
            long contentLength, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/type/file/body/request/specific-content-type");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            httpRequest.getHeaders()
                .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Length"),
                    String.valueOf(contentLength));
            if (file != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "image/png");
                }
                httpRequest.setBody(file);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, BodiesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> uploadFileJsonContentType(String endpoint, String contentType, BinaryData file,
            long contentLength, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/type/file/body/request/json-content-type");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            httpRequest.getHeaders()
                .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Length"),
                    String.valueOf(contentLength));
            if (file != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(file);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, BodiesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<BinaryData> downloadFileJsonContentType(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/type/file/body/response/json-content-type");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, BodiesServiceImpl.LOGGER);
            }
            return networkResponse;
        }

        @Override
        public Response<BinaryData> downloadFileSpecificContentType(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/file/body/response/specific-content-type");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, BodiesServiceImpl.LOGGER);
            }
            return networkResponse;
        }

        @Override
        public Response<Void> uploadFileMultipleContentTypes(String endpoint,
            UploadFileMultipleContentTypesContentType contentType, BinaryData file, long contentLength,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/file/body/request/multiple-content-types");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"),
                        String.valueOf(contentType));
            }
            httpRequest.getHeaders()
                .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Length"),
                    String.valueOf(contentLength));
            if (file != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(file);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, BodiesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<BinaryData> downloadFileMultipleContentTypes(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/file/body/response/multiple-content-types");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, BodiesServiceImpl.LOGGER);
            }
            return networkResponse;
        }

        @Override
        public Response<Void> uploadFileDefaultContentType(String endpoint, String contentType, BinaryData file,
            long contentLength, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/type/file/body/request/default-content-type");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            httpRequest.getHeaders()
                .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Length"),
                    String.valueOf(contentLength));
            if (file != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "*/*");
                }
                httpRequest.setBody(file);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, BodiesServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<BinaryData> downloadFileDefaultContentType(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/type/file/body/response/default-content-type");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, BodiesServiceImpl.LOGGER);
            }
            return networkResponse;
        }
    }

    /**
     * The uploadFileSpecificContentType operation.
     * 
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileSpecificContentTypeWithResponse(BinaryData file, long contentLength,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileSpecificContentType",
            requestContext, updatedContext -> {
                final String contentType = "image/png";
                return service.uploadFileSpecificContentType(this.client.getEndpoint(), contentType, file,
                    contentLength, updatedContext);
            });
    }

    /**
     * The uploadFileJsonContentType operation.
     * 
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileJsonContentTypeWithResponse(BinaryData file, long contentLength,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileJsonContentType", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.uploadFileJsonContentType(this.client.getEndpoint(), contentType, file, contentLength,
                    updatedContext);
            });
    }

    /**
     * The downloadFileJsonContentType operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileJsonContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileJsonContentType", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.downloadFileJsonContentType(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The downloadFileSpecificContentType operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileSpecificContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileSpecificContentType",
            requestContext, updatedContext -> {
                final String accept = "image/png";
                return service.downloadFileSpecificContentType(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The uploadFileMultipleContentTypes operation.
     * 
     * @param contentType Body parameter's content type. Known values are image/png,image/jpeg.
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileMultipleContentTypesWithResponse(
        UploadFileMultipleContentTypesContentType contentType, BinaryData file, long contentLength,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileMultipleContentTypes",
            requestContext, updatedContext -> {
                return service.uploadFileMultipleContentTypes(this.client.getEndpoint(), contentType, file,
                    contentLength, updatedContext);
            });
    }

    /**
     * The downloadFileMultipleContentTypes operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileMultipleContentTypesWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileMultipleContentTypes",
            requestContext, updatedContext -> {
                final String accept = "image/png, image/jpeg";
                return service.downloadFileMultipleContentTypes(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The uploadFileDefaultContentType operation.
     * 
     * @param file The file parameter.
     * @param contentLength The Content-Length header for the request.
     * @param contentType Body parameter's content type. Known values are *&#47;*.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> uploadFileDefaultContentTypeWithResponse(BinaryData file, long contentLength,
        String contentType, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.uploadFileDefaultContentType",
            requestContext, updatedContext -> {
                return service.uploadFileDefaultContentType(this.client.getEndpoint(), contentType, file, contentLength,
                    updatedContext);
            });
    }

    /**
     * The downloadFileDefaultContentType operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> downloadFileDefaultContentTypeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.File.Body.downloadFileDefaultContentType",
            requestContext, updatedContext -> {
                final String accept = "*/*";
                return service.downloadFileDefaultContentType(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(BodiesImpl.class);
}
