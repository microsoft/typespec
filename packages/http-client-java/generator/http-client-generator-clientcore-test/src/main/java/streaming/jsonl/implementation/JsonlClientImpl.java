package streaming.jsonl.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the JsonlClient type.
 */
public final class JsonlClientImpl {
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
     * The BasicsImpl object to access its operations.
     */
    private final BasicsImpl basics;

    /**
     * Gets the BasicsImpl object to access its operations.
     * 
     * @return the BasicsImpl object.
     */
    public BasicsImpl getBasics() {
        return this.basics;
    }

    /**
     * Initializes an instance of JsonlClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public JsonlClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.basics = new BasicsImpl(this);
    }
}
