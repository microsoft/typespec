package parameters.query.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the QueryClient type.
 */
public final class QueryClientImpl {

    /**
     * The ConstantsImpl object to access its operations.
     */
    private final ConstantsImpl constants;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The SpecialCharsImpl object to access its operations.
     */
    private final SpecialCharsImpl specialChars;

    /**
     * Initializes an instance of QueryClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public QueryClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.constants = new ConstantsImpl(this);
        this.specialChars = new SpecialCharsImpl(this);
    }

    /**
     * Gets the ConstantsImpl object to access its operations.
     *
     * @return the ConstantsImpl object.
     */
    public ConstantsImpl getConstants() {
        return this.constants;
    }

    /**
     * Gets Service host.
     *
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Gets The HTTP pipeline to send requests through.
     *
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * Gets The instance of instrumentation to report telemetry.
     *
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * Gets the SpecialCharsImpl object to access its operations.
     *
     * @return the SpecialCharsImpl object.
     */
    public SpecialCharsImpl getSpecialChars() {
        return this.specialChars;
    }
}
