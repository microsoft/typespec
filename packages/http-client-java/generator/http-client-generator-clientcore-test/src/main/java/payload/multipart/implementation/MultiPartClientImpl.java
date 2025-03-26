package payload.multipart.implementation;

import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the MultiPartClient type.
 */
public final class MultiPartClientImpl {
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
     * The FormDatasImpl object to access its operations.
     */
    private final FormDatasImpl formDatas;

    /**
     * Gets the FormDatasImpl object to access its operations.
     * 
     * @return the FormDatasImpl object.
     */
    public FormDatasImpl getFormDatas() {
        return this.formDatas;
    }

    /**
     * The FormDataHttpPartsImpl object to access its operations.
     */
    private final FormDataHttpPartsImpl formDataHttpParts;

    /**
     * Gets the FormDataHttpPartsImpl object to access its operations.
     * 
     * @return the FormDataHttpPartsImpl object.
     */
    public FormDataHttpPartsImpl getFormDataHttpParts() {
        return this.formDataHttpParts;
    }

    /**
     * The FormDataHttpPartsContentTypesImpl object to access its operations.
     */
    private final FormDataHttpPartsContentTypesImpl formDataHttpPartsContentTypes;

    /**
     * Gets the FormDataHttpPartsContentTypesImpl object to access its operations.
     * 
     * @return the FormDataHttpPartsContentTypesImpl object.
     */
    public FormDataHttpPartsContentTypesImpl getFormDataHttpPartsContentTypes() {
        return this.formDataHttpPartsContentTypes;
    }

    /**
     * The FormDataHttpPartsNonStringsImpl object to access its operations.
     */
    private final FormDataHttpPartsNonStringsImpl formDataHttpPartsNonStrings;

    /**
     * Gets the FormDataHttpPartsNonStringsImpl object to access its operations.
     * 
     * @return the FormDataHttpPartsNonStringsImpl object.
     */
    public FormDataHttpPartsNonStringsImpl getFormDataHttpPartsNonStrings() {
        return this.formDataHttpPartsNonStrings;
    }

    /**
     * Initializes an instance of MultiPartClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public MultiPartClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.formDatas = new FormDatasImpl(this);
        this.formDataHttpParts = new FormDataHttpPartsImpl(this);
        this.formDataHttpPartsContentTypes = new FormDataHttpPartsContentTypesImpl(this);
        this.formDataHttpPartsNonStrings = new FormDataHttpPartsNonStringsImpl(this);
    }
}
