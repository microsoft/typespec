package type.union.discriminated.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the DiscriminatedClient type.
 */
public final class DiscriminatedClientImpl {

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * The EnvelopeObjectCustomPropertiesImpl object to access its operations.
     */
    private final EnvelopeObjectCustomPropertiesImpl envelopeObjectCustomProperties;

    /**
     * The EnvelopeObjectDefaultsImpl object to access its operations.
     */
    private final EnvelopeObjectDefaultsImpl envelopeObjectDefaults;

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * The NoEnvelopeCustomDiscriminatorsImpl object to access its operations.
     */
    private final NoEnvelopeCustomDiscriminatorsImpl noEnvelopeCustomDiscriminators;

    /**
     * The NoEnvelopeDefaultsImpl object to access its operations.
     */
    private final NoEnvelopeDefaultsImpl noEnvelopeDefaults;

    /**
     * Initializes an instance of DiscriminatedClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public DiscriminatedClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.envelopeObjectDefaults = new EnvelopeObjectDefaultsImpl(this);
        this.envelopeObjectCustomProperties = new EnvelopeObjectCustomPropertiesImpl(this);
        this.noEnvelopeDefaults = new NoEnvelopeDefaultsImpl(this);
        this.noEnvelopeCustomDiscriminators = new NoEnvelopeCustomDiscriminatorsImpl(this);
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
     * Gets the EnvelopeObjectCustomPropertiesImpl object to access its operations.
     *
     * @return the EnvelopeObjectCustomPropertiesImpl object.
     */
    public EnvelopeObjectCustomPropertiesImpl getEnvelopeObjectCustomProperties() {
        return this.envelopeObjectCustomProperties;
    }

    /**
     * Gets the EnvelopeObjectDefaultsImpl object to access its operations.
     *
     * @return the EnvelopeObjectDefaultsImpl object.
     */
    public EnvelopeObjectDefaultsImpl getEnvelopeObjectDefaults() {
        return this.envelopeObjectDefaults;
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
     * Gets the NoEnvelopeCustomDiscriminatorsImpl object to access its operations.
     *
     * @return the NoEnvelopeCustomDiscriminatorsImpl object.
     */
    public NoEnvelopeCustomDiscriminatorsImpl getNoEnvelopeCustomDiscriminators() {
        return this.noEnvelopeCustomDiscriminators;
    }

    /**
     * Gets the NoEnvelopeDefaultsImpl object to access its operations.
     *
     * @return the NoEnvelopeDefaultsImpl object.
     */
    public NoEnvelopeDefaultsImpl getNoEnvelopeDefaults() {
        return this.noEnvelopeDefaults;
    }
}
