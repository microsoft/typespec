package type.union.discriminated.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * An instance of this class provides access to all the operations defined in NoEnvelopeCustomDiscriminators.
 */
public final class NoEnvelopeCustomDiscriminatorsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NoEnvelopeCustomDiscriminatorsService service;

    /**
     * The service client containing this operation class.
     */
    private final DiscriminatedClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NoEnvelopeCustomDiscriminatorsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    NoEnvelopeCustomDiscriminatorsImpl(DiscriminatedClientImpl client) {
        this.service = NoEnvelopeCustomDiscriminatorsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface NoEnvelopeCustomDiscriminatorsService {
        static NoEnvelopeCustomDiscriminatorsService
            getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new NoEnvelopeCustomDiscriminatorsServiceImpl(pipeline);
        }

        Response<BinaryData> get(String endpoint, String type, String accept, RequestContext requestContext);

        Response<BinaryData> put(String endpoint, String contentType, String accept, BinaryData input,
            RequestContext requestContext);
    }

    private static final class NoEnvelopeCustomDiscriminatorsServiceImpl
        implements NoEnvelopeCustomDiscriminatorsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(
                NoEnvelopeCustomDiscriminatorsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private NoEnvelopeCustomDiscriminatorsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<BinaryData> get(String endpoint, String type, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/union/discriminated/no-envelope/custom-discriminator");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "type", true, type, true);
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
                    this.jsonSerializer, this.xmlSerializer, null, null,
                    NoEnvelopeCustomDiscriminatorsServiceImpl.LOGGER);
            }
            return networkResponse;
        }

        @Override
        public Response<BinaryData> put(String endpoint, String contentType, String accept, BinaryData input,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/union/discriminated/no-envelope/custom-discriminator");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (input != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(input);
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
                    this.jsonSerializer, this.xmlSerializer, null, null,
                    NoEnvelopeCustomDiscriminatorsServiceImpl.LOGGER);
            }
            return networkResponse;
        }
    }

    /**
     * The get operation.
     * 
     * @param type The type parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getWithResponse(String type, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Union.Discriminated.NoEnvelope.CustomDiscriminator.get", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.get(this.client.getEndpoint(), type, accept, updatedContext);
            });
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test discriminated union with inline discriminator and custom discriminator property name.
     * The discriminated union should serialize with custom discriminator property
     * injected directly into the variant object along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> putWithResponse(BinaryData input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Union.Discriminated.NoEnvelope.CustomDiscriminator.put", requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.put(this.client.getEndpoint(), contentType, accept, input, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(NoEnvelopeCustomDiscriminatorsImpl.class);
}
