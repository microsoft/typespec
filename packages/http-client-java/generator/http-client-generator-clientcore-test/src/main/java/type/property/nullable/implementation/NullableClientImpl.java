// Code generated by Microsoft (R) TypeSpec Code Generator.

package type.property.nullable.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the NullableClient type.
 */
public final class NullableClientImpl {
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
     * The StringOperationsImpl object to access its operations.
     */
    private final StringOperationsImpl stringOperations;

    /**
     * Gets the StringOperationsImpl object to access its operations.
     * 
     * @return the StringOperationsImpl object.
     */
    public StringOperationsImpl getStringOperations() {
        return this.stringOperations;
    }

    /**
     * The BytesImpl object to access its operations.
     */
    private final BytesImpl bytes;

    /**
     * Gets the BytesImpl object to access its operations.
     * 
     * @return the BytesImpl object.
     */
    public BytesImpl getBytes() {
        return this.bytes;
    }

    /**
     * The DatetimeOperationsImpl object to access its operations.
     */
    private final DatetimeOperationsImpl datetimeOperations;

    /**
     * Gets the DatetimeOperationsImpl object to access its operations.
     * 
     * @return the DatetimeOperationsImpl object.
     */
    public DatetimeOperationsImpl getDatetimeOperations() {
        return this.datetimeOperations;
    }

    /**
     * The DurationOperationsImpl object to access its operations.
     */
    private final DurationOperationsImpl durationOperations;

    /**
     * Gets the DurationOperationsImpl object to access its operations.
     * 
     * @return the DurationOperationsImpl object.
     */
    public DurationOperationsImpl getDurationOperations() {
        return this.durationOperations;
    }

    /**
     * The CollectionsBytesImpl object to access its operations.
     */
    private final CollectionsBytesImpl collectionsBytes;

    /**
     * Gets the CollectionsBytesImpl object to access its operations.
     * 
     * @return the CollectionsBytesImpl object.
     */
    public CollectionsBytesImpl getCollectionsBytes() {
        return this.collectionsBytes;
    }

    /**
     * The CollectionsModelsImpl object to access its operations.
     */
    private final CollectionsModelsImpl collectionsModels;

    /**
     * Gets the CollectionsModelsImpl object to access its operations.
     * 
     * @return the CollectionsModelsImpl object.
     */
    public CollectionsModelsImpl getCollectionsModels() {
        return this.collectionsModels;
    }

    /**
     * The CollectionsStringsImpl object to access its operations.
     */
    private final CollectionsStringsImpl collectionsStrings;

    /**
     * Gets the CollectionsStringsImpl object to access its operations.
     * 
     * @return the CollectionsStringsImpl object.
     */
    public CollectionsStringsImpl getCollectionsStrings() {
        return this.collectionsStrings;
    }

    /**
     * Initializes an instance of NullableClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public NullableClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.endpoint = "http://localhost:3000";
        this.httpPipeline = httpPipeline;
        this.stringOperations = new StringOperationsImpl(this);
        this.bytes = new BytesImpl(this);
        this.datetimeOperations = new DatetimeOperationsImpl(this);
        this.durationOperations = new DurationOperationsImpl(this);
        this.collectionsBytes = new CollectionsBytesImpl(this);
        this.collectionsModels = new CollectionsModelsImpl(this);
        this.collectionsStrings = new CollectionsStringsImpl(this);
    }
}
