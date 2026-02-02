package payload.pageable.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

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
     * The ServerDrivenPaginationContinuationTokensImpl object to access its operations.
     */
    private final ServerDrivenPaginationContinuationTokensImpl serverDrivenPaginationContinuationTokens;

    /**
     * Gets the ServerDrivenPaginationContinuationTokensImpl object to access its operations.
     * 
     * @return the ServerDrivenPaginationContinuationTokensImpl object.
     */
    public ServerDrivenPaginationContinuationTokensImpl getServerDrivenPaginationContinuationTokens() {
        return this.serverDrivenPaginationContinuationTokens;
    }

    /**
     * The PageSizesImpl object to access its operations.
     */
    private final PageSizesImpl pageSizes;

    /**
     * Gets the PageSizesImpl object to access its operations.
     * 
     * @return the PageSizesImpl object.
     */
    public PageSizesImpl getPageSizes() {
        return this.pageSizes;
    }

    /**
     * Initializes an instance of PageableClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public PageableClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serverDrivenPaginations = new ServerDrivenPaginationsImpl(this);
        this.serverDrivenPaginationContinuationTokens = new ServerDrivenPaginationContinuationTokensImpl(this);
        this.pageSizes = new PageSizesImpl(this);
    }
}
