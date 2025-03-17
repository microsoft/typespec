// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * A segment in property reference. It can be chained as a List, if the reference contains multiple model/property.
 * <p>
 * E.g. a reference to "links", "nextLink" in response body would be a List of 2 ModelPropertySegment.
 */
public class ModelPropertySegment {

    private final ClientModel model;
    private final ClientModelProperty property;

    public ModelPropertySegment(ClientModel model, ClientModelProperty property) {
        this.model = model;
        this.property = property;
    }

    /**
     * Gets the model of the property. It is possible that the property is actually specified in its parent model.
     *
     * @return the model of the property
     */
    public ClientModel getModel() {
        return model;
    }

    /**
     * Gets the property.
     *
     * @return the property
     */
    public ClientModelProperty getProperty() {
        return property;
    }
}
