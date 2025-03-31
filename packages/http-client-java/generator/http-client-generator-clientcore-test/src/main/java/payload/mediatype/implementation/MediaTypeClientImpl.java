package payload.mediatype.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the MediaTypeClient type.
 */
public final class MediaTypeClientImpl {
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
     * The StringBodiesImpl object to access its operations.
     */
    private final StringBodiesImpl stringBodies;

    /**
     * Gets the StringBodiesImpl object to access its operations.
     * 
     * @return the StringBodiesImpl object.
     */
    public StringBodiesImpl getStringBodies() {
        return this.stringBodies;
    }

    /**
     * Initializes an instance of MediaTypeClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public MediaTypeClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.stringBodies = new StringBodiesImpl(this);
    }
}
