// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Map;

/**
 * Represents a discriminator for polymorphic types.
 */
public class Discriminator {
    private Property property;
    private Map<String, ComplexSchema> immediate;
    private Map<String, ComplexSchema> all;

    /**
     * Creates a new instance of the Discriminator class.
     */
    public Discriminator() {
    }

    /**
     * Gets the property that is used to discriminate between the polymorphic types.
     *
     * @return The property that is used to discriminate between the polymorphic types.
     */
    public Property getProperty() {
        return property;
    }

    /**
     * Sets the property that is used to discriminate between the polymorphic types.
     *
     * @param property The property that is used to discriminate between the polymorphic types.
     */
    public void setProperty(Property property) {
        this.property = property;
    }

    /**
     * Gets the immediate polymorphic types.
     *
     * @return The immediate polymorphic types.
     */
    public Map<String, ComplexSchema> getImmediate() {
        return immediate;
    }

    /**
     * Sets the immediate polymorphic types.
     *
     * @param immediate The immediate polymorphic types.
     */
    public void setImmediate(Map<String, ComplexSchema> immediate) {
        this.immediate = immediate;
    }

    /**
     * Gets all polymorphic types.
     *
     * @return All polymorphic types.
     */
    public Map<String, ComplexSchema> getAll() {
        return all;
    }

    /**
     * Sets all polymorphic types.
     *
     * @param all All polymorphic types.
     */
    public void setAll(Map<String, ComplexSchema> all) {
        this.all = all;
    }
}
