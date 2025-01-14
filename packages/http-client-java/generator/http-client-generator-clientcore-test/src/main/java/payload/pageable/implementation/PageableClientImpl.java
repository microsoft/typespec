// Code generated by Microsoft (R) TypeSpec Code Generator.

package payload.pageable.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the PageableClient type.
 */
public final class PageableClientImpl {
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
     * The ServerDrivenPaginationsImpl object to access its operations.
     */
    private final ServerDrivenPaginationsImpl serverDrivenPaginations;

    /**
     * Gets the ServerDrivenPaginationsImpl object to access its operations.
     * 
     * @return the ServerDrivenPaginationsImpl object.
     */
    public ServerDrivenPaginationsImpl getServerDrivenPaginations() {
        return this.serverDrivenPaginations;
    }

    /**
     * Initializes an instance of PageableClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public PageableClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.endpoint = "http://localhost:3000";
        this.httpPipeline = httpPipeline;
        this.serverDrivenPaginations = new ServerDrivenPaginationsImpl(this);
    }
}
