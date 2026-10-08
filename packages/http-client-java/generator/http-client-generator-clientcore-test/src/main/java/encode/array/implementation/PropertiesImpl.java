package encode.array.implementation;

import encode.array.CommaDelimitedArrayProperty;
import encode.array.CommaDelimitedEnumArrayProperty;
import encode.array.CommaDelimitedExtensibleEnumArrayProperty;
import encode.array.NewlineDelimitedArrayProperty;
import encode.array.NewlineDelimitedEnumArrayProperty;
import encode.array.NewlineDelimitedExtensibleEnumArrayProperty;
import encode.array.PipeDelimitedArrayProperty;
import encode.array.PipeDelimitedEnumArrayProperty;
import encode.array.PipeDelimitedExtensibleEnumArrayProperty;
import encode.array.SpaceDelimitedArrayProperty;
import encode.array.SpaceDelimitedEnumArrayProperty;
import encode.array.SpaceDelimitedExtensibleEnumArrayProperty;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;

/**
 * An instance of this class provides access to all the operations defined in Properties.
 */
public final class PropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final ArrayClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(ArrayClientImpl client) {
        this.service = PropertiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface PropertiesService {
        static PropertiesService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new PropertiesServiceImpl(pipeline);
        }

        Response<CommaDelimitedArrayProperty> commaDelimited(String endpoint, String contentType, String accept,
            CommaDelimitedArrayProperty body, RequestContext requestContext);

        Response<SpaceDelimitedArrayProperty> spaceDelimited(String endpoint, String contentType, String accept,
            SpaceDelimitedArrayProperty body, RequestContext requestContext);

        Response<PipeDelimitedArrayProperty> pipeDelimited(String endpoint, String contentType, String accept,
            PipeDelimitedArrayProperty body, RequestContext requestContext);

        Response<NewlineDelimitedArrayProperty> newlineDelimited(String endpoint, String contentType, String accept,
            NewlineDelimitedArrayProperty body, RequestContext requestContext);

        Response<CommaDelimitedEnumArrayProperty> enumCommaDelimited(String endpoint, String contentType, String accept,
            CommaDelimitedEnumArrayProperty body, RequestContext requestContext);

        Response<SpaceDelimitedEnumArrayProperty> enumSpaceDelimited(String endpoint, String contentType, String accept,
            SpaceDelimitedEnumArrayProperty body, RequestContext requestContext);

        Response<PipeDelimitedEnumArrayProperty> enumPipeDelimited(String endpoint, String contentType, String accept,
            PipeDelimitedEnumArrayProperty body, RequestContext requestContext);

        Response<NewlineDelimitedEnumArrayProperty> enumNewlineDelimited(String endpoint, String contentType,
            String accept, NewlineDelimitedEnumArrayProperty body, RequestContext requestContext);

        Response<CommaDelimitedExtensibleEnumArrayProperty> extensibleEnumCommaDelimited(String endpoint,
            String contentType, String accept, CommaDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext);

        Response<SpaceDelimitedExtensibleEnumArrayProperty> extensibleEnumSpaceDelimited(String endpoint,
            String contentType, String accept, SpaceDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext);

        Response<PipeDelimitedExtensibleEnumArrayProperty> extensibleEnumPipeDelimited(String endpoint,
            String contentType, String accept, PipeDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext);

        Response<NewlineDelimitedExtensibleEnumArrayProperty> extensibleEnumNewlineDelimited(String endpoint,
            String contentType, String accept, NewlineDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext);
    }

    private static final class PropertiesServiceImpl implements PropertiesService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(PropertiesServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private PropertiesServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<CommaDelimitedArrayProperty> commaDelimited(String endpoint, String contentType, String accept,
            CommaDelimitedArrayProperty body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/comma-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                CommaDelimitedArrayProperty deserializedResult;
                deserializedResult
                    = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class, CommaDelimitedArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<SpaceDelimitedArrayProperty> spaceDelimited(String endpoint, String contentType, String accept,
            SpaceDelimitedArrayProperty body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/space-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                SpaceDelimitedArrayProperty deserializedResult;
                deserializedResult
                    = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class, SpaceDelimitedArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<PipeDelimitedArrayProperty> pipeDelimited(String endpoint, String contentType, String accept,
            PipeDelimitedArrayProperty body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/pipe-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                PipeDelimitedArrayProperty deserializedResult;
                deserializedResult
                    = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class, PipeDelimitedArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<NewlineDelimitedArrayProperty> newlineDelimited(String endpoint, String contentType,
            String accept, NewlineDelimitedArrayProperty body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/newline-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                NewlineDelimitedArrayProperty deserializedResult;
                deserializedResult
                    = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class, NewlineDelimitedArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<CommaDelimitedEnumArrayProperty> enumCommaDelimited(String endpoint, String contentType,
            String accept, CommaDelimitedEnumArrayProperty body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/enum/comma-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                CommaDelimitedEnumArrayProperty deserializedResult;
                deserializedResult
                    = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class, CommaDelimitedEnumArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<SpaceDelimitedEnumArrayProperty> enumSpaceDelimited(String endpoint, String contentType,
            String accept, SpaceDelimitedEnumArrayProperty body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/enum/space-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                SpaceDelimitedEnumArrayProperty deserializedResult;
                deserializedResult
                    = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class, SpaceDelimitedEnumArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<PipeDelimitedEnumArrayProperty> enumPipeDelimited(String endpoint, String contentType,
            String accept, PipeDelimitedEnumArrayProperty body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/enum/pipe-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                PipeDelimitedEnumArrayProperty deserializedResult;
                deserializedResult
                    = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class, PipeDelimitedEnumArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<NewlineDelimitedEnumArrayProperty> enumNewlineDelimited(String endpoint, String contentType,
            String accept, NewlineDelimitedEnumArrayProperty body, RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/enum/newline-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                NewlineDelimitedEnumArrayProperty deserializedResult;
                deserializedResult
                    = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class, NewlineDelimitedEnumArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<CommaDelimitedExtensibleEnumArrayProperty> extensibleEnumCommaDelimited(String endpoint,
            String contentType, String accept, CommaDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/extensible-enum/comma-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                CommaDelimitedExtensibleEnumArrayProperty deserializedResult;
                deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                    networkResponse.getValue(), this.jsonSerializer,
                    io.clientcore.core.utils.CoreUtils.createParameterizedType(
                        io.clientcore.core.http.models.Response.class,
                        CommaDelimitedExtensibleEnumArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<SpaceDelimitedExtensibleEnumArrayProperty> extensibleEnumSpaceDelimited(String endpoint,
            String contentType, String accept, SpaceDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/extensible-enum/space-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                SpaceDelimitedExtensibleEnumArrayProperty deserializedResult;
                deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                    networkResponse.getValue(), this.jsonSerializer,
                    io.clientcore.core.utils.CoreUtils.createParameterizedType(
                        io.clientcore.core.http.models.Response.class,
                        SpaceDelimitedExtensibleEnumArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<PipeDelimitedExtensibleEnumArrayProperty> extensibleEnumPipeDelimited(String endpoint,
            String contentType, String accept, PipeDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/extensible-enum/pipe-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                PipeDelimitedExtensibleEnumArrayProperty deserializedResult;
                deserializedResult = io.clientcore.core.utils.CoreUtils
                    .decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                        io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class,
                            PipeDelimitedExtensibleEnumArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<NewlineDelimitedExtensibleEnumArrayProperty> extensibleEnumNewlineDelimited(String endpoint,
            String contentType, String accept, NewlineDelimitedExtensibleEnumArrayProperty body,
            RequestContext requestContext) {
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(endpoint + "/encode/array/property/extensible-enum/newline-delimited");
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest
                    .setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == io.clientcore.core.serialization.SerializationFormat.XML) {
                    try {
                        throw new io.clientcore.core.http.models.HttpResponseException("Unexpected XML response.",
                            networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, null, null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                NewlineDelimitedExtensibleEnumArrayProperty deserializedResult;
                deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                    networkResponse.getValue(), this.jsonSerializer,
                    io.clientcore.core.utils.CoreUtils.createParameterizedType(
                        io.clientcore.core.http.models.Response.class,
                        NewlineDelimitedExtensibleEnumArrayProperty.class));
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The commaDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CommaDelimitedArrayProperty> commaDelimitedWithResponse(CommaDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.commaDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.commaDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The spaceDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SpaceDelimitedArrayProperty> spaceDelimitedWithResponse(SpaceDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.spaceDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.spaceDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The pipeDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PipeDelimitedArrayProperty> pipeDelimitedWithResponse(PipeDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.pipeDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.pipeDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The newlineDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewlineDelimitedArrayProperty> newlineDelimitedWithResponse(NewlineDelimitedArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.newlineDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.newlineDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The enumCommaDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CommaDelimitedEnumArrayProperty>
        enumCommaDelimitedWithResponse(CommaDelimitedEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.enumCommaDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.enumCommaDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The enumSpaceDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SpaceDelimitedEnumArrayProperty>
        enumSpaceDelimitedWithResponse(SpaceDelimitedEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.enumSpaceDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.enumSpaceDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The enumPipeDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PipeDelimitedEnumArrayProperty> enumPipeDelimitedWithResponse(PipeDelimitedEnumArrayProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.enumPipeDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.enumPipeDelimited(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The enumNewlineDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewlineDelimitedEnumArrayProperty>
        enumNewlineDelimitedWithResponse(NewlineDelimitedEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.enumNewlineDelimited", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.enumNewlineDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    /**
     * The extensibleEnumCommaDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CommaDelimitedExtensibleEnumArrayProperty> extensibleEnumCommaDelimitedWithResponse(
        CommaDelimitedExtensibleEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.extensibleEnumCommaDelimited",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.extensibleEnumCommaDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    /**
     * The extensibleEnumSpaceDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SpaceDelimitedExtensibleEnumArrayProperty> extensibleEnumSpaceDelimitedWithResponse(
        SpaceDelimitedExtensibleEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.extensibleEnumSpaceDelimited",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.extensibleEnumSpaceDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    /**
     * The extensibleEnumPipeDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PipeDelimitedExtensibleEnumArrayProperty> extensibleEnumPipeDelimitedWithResponse(
        PipeDelimitedExtensibleEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.extensibleEnumPipeDelimited",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.extensibleEnumPipeDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    /**
     * The extensibleEnumNewlineDelimited operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewlineDelimitedExtensibleEnumArrayProperty> extensibleEnumNewlineDelimitedWithResponse(
        NewlineDelimitedExtensibleEnumArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Array.Property.extensibleEnumNewlineDelimited",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.extensibleEnumNewlineDelimited(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(PropertiesImpl.class);
}
