package encode.bytes.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the BytesClient type.
 */
public final class BytesClientImpl {
    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * The QueriesImpl object to access its operations.
     */
    private final QueriesImpl queries;

    /**
     * Gets the QueriesImpl object to access its operations.
     * 
     * @return the QueriesImpl object.
     */
    public QueriesImpl getQueries() {
        return this.queries;
    }

    /**
     * The PropertiesImpl object to access its operations.
     */
    private final PropertiesImpl properties;

    /**
     * Gets the PropertiesImpl object to access its operations.
     * 
     * @return the PropertiesImpl object.
     */
    public PropertiesImpl getProperties() {
        return this.properties;
    }

    /**
     * The HeadersImpl object to access its operations.
     */
    private final HeadersImpl headers;

    /**
     * Gets the HeadersImpl object to access its operations.
     * 
     * @return the HeadersImpl object.
     */
    public HeadersImpl getHeaders() {
        return this.headers;
    }

    /**
     * The RequestBodiesImpl object to access its operations.
     */
    private final RequestBodiesImpl requestBodies;

    /**
     * Gets the RequestBodiesImpl object to access its operations.
     * 
     * @return the RequestBodiesImpl object.
     */
    public RequestBodiesImpl getRequestBodies() {
        return this.requestBodies;
    }

    /**
     * The ResponseBodiesImpl object to access its operations.
     */
    private final ResponseBodiesImpl responseBodies;

    /**
     * Gets the ResponseBodiesImpl object to access its operations.
     * 
     * @return the ResponseBodiesImpl object.
     */
    public ResponseBodiesImpl getResponseBodies() {
        return this.responseBodies;
    }

    /**
     * Initializes an instance of BytesClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public BytesClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.queries = new QueriesImpl(this);
        this.properties = new PropertiesImpl(this);
        this.headers = new HeadersImpl(this);
        this.requestBodies = new RequestBodiesImpl(this);
        this.responseBodies = new ResponseBodiesImpl(this);
    }
}
