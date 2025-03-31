package serialization.encodedname.json.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the JsonClient type.
 */
public final class JsonClientImpl {
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
     * Initializes an instance of JsonClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public JsonClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.properties = new PropertiesImpl(this);
    }
}
