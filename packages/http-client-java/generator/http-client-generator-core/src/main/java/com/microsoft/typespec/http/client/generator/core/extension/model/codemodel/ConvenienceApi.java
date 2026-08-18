// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.List;

/**
 * Represents a convenience API.
 */
public class ConvenienceApi extends Metadata {
    private List<Request> requests;
    private boolean responseHeadersAsModel;

    /**
     * Creates a new instance of the ConvenienceApi class.
     */
    public ConvenienceApi() {
        super();
    }

    /**
     * Gets the requests of the convenience API.
     *
     * @return The requests of the convenience API.
     */
    public List<Request> getRequests() {
        return requests;
    }

    /**
     * Sets the requests of the convenience API.
     *
     * @param requests The requests of the convenience API.
     */
    public void setRequests(List<Request> requests) {
        this.requests = requests;
    }

    /**
     * Gets whether the convenience method returns the significant response headers as a strongly-typed model.
     *
     * @return whether the convenience method returns the response headers as a strongly-typed model.
     */
    public boolean isResponseHeadersAsModel() {
        return responseHeadersAsModel;
    }

    /**
     * Sets whether the convenience method returns the significant response headers as a strongly-typed model.
     *
     * @param responseHeadersAsModel whether the convenience method returns the response headers as a strongly-typed
     * model.
     */
    public void setResponseHeadersAsModel(boolean responseHeadersAsModel) {
        this.responseHeadersAsModel = responseHeadersAsModel;
    }
}
