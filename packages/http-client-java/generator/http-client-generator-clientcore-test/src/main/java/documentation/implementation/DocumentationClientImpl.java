package documentation.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the DocumentationClient type.
 */
public final class DocumentationClientImpl {
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
     * The ListsImpl object to access its operations.
     */
    private final ListsImpl lists;

    /**
     * Gets the ListsImpl object to access its operations.
     * 
     * @return the ListsImpl object.
     */
    public ListsImpl getLists() {
        return this.lists;
    }

    /**
     * The TextFormattingsImpl object to access its operations.
     */
    private final TextFormattingsImpl textFormattings;

    /**
     * Gets the TextFormattingsImpl object to access its operations.
     * 
     * @return the TextFormattingsImpl object.
     */
    public TextFormattingsImpl getTextFormattings() {
        return this.textFormattings;
    }

    /**
     * Initializes an instance of DocumentationClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public DocumentationClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.lists = new ListsImpl(this);
        this.textFormattings = new TextFormattingsImpl(this);
    }
}
