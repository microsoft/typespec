// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.List;

/**
 * Represents a convenience API.
 */
public class ConvenienceApi extends Metadata {
    private List<Request> requests;

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
}
