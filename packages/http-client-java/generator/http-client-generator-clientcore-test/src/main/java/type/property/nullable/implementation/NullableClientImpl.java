package type.property.nullable.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the NullableClient type.
 */
public final class NullableClientImpl {

    /**
     * The BytesImpl object to access its operations.
     */
    private final BytesImpl bytes;

    /**
     * The CollectionsBytesImpl object to access its operations.
     */
    private final CollectionsBytesImpl collectionsBytes;

    /**
     * The CollectionsModelsImpl object to access its operations.
     */
    private final CollectionsModelsImpl collectionsModels;

    /**
     * The CollectionsStringsImpl object to access its operations.
     */
    private final CollectionsStringsImpl collectionsStrings;

    /**
     * The DatetimeOperationsImpl object to access its operations.
     */
    private final DatetimeOperationsImpl datetimeOperations;

    /**
     * The DurationOperationsImpl object to access its operations.
     */
    private final DurationOperationsImpl durationOperations;

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
     * The StringOperationsImpl object to access its operations.
     */
    private final StringOperationsImpl stringOperations;

    /**
     * Initializes an instance of NullableClient client.
     *
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public NullableClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.stringOperations = new StringOperationsImpl(this);
        this.bytes = new BytesImpl(this);
        this.datetimeOperations = new DatetimeOperationsImpl(this);
        this.durationOperations = new DurationOperationsImpl(this);
        this.collectionsBytes = new CollectionsBytesImpl(this);
        this.collectionsModels = new CollectionsModelsImpl(this);
        this.collectionsStrings = new CollectionsStringsImpl(this);
    }

    /**
     * Gets the BytesImpl object to access its operations.
     *
     * @return the BytesImpl object.
     */
    public BytesImpl getBytes() {
        return this.bytes;
    }

    /**
     * Gets the CollectionsBytesImpl object to access its operations.
     *
     * @return the CollectionsBytesImpl object.
     */
    public CollectionsBytesImpl getCollectionsBytes() {
        return this.collectionsBytes;
    }

    /**
     * Gets the CollectionsModelsImpl object to access its operations.
     *
     * @return the CollectionsModelsImpl object.
     */
    public CollectionsModelsImpl getCollectionsModels() {
        return this.collectionsModels;
    }

    /**
     * Gets the CollectionsStringsImpl object to access its operations.
     *
     * @return the CollectionsStringsImpl object.
     */
    public CollectionsStringsImpl getCollectionsStrings() {
        return this.collectionsStrings;
    }

    /**
     * Gets the DatetimeOperationsImpl object to access its operations.
     *
     * @return the DatetimeOperationsImpl object.
     */
    public DatetimeOperationsImpl getDatetimeOperations() {
        return this.datetimeOperations;
    }

    /**
     * Gets the DurationOperationsImpl object to access its operations.
     *
     * @return the DurationOperationsImpl object.
     */
    public DurationOperationsImpl getDurationOperations() {
        return this.durationOperations;
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
     * Gets the StringOperationsImpl object to access its operations.
     *
     * @return the StringOperationsImpl object.
     */
    public StringOperationsImpl getStringOperations() {
        return this.stringOperations;
    }
}
