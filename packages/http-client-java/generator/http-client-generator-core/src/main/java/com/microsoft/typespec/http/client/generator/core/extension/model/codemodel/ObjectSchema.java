// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents an object with child properties.
 */
public class ObjectSchema extends ComplexSchema {
    private Discriminator discriminator;
    private List<Property> properties = new ArrayList<>();
    private double maxProperties;
    private double minProperties;
    private Relations parents;
    private Relations children;
    private String discriminatorValue;
    // internal use, not from modelerfour
    private boolean flattenedSchema;
    // internal use, not from modelerfour
    private boolean stronglyTypedHeader;

    /**
     * Creates a new instance of the ObjectSchema class.
     */
    public ObjectSchema() {
    }

    /**
     * Gets the discriminator for this object.
     *
     * @return The discriminator for this object.
     */
    public Discriminator getDiscriminator() {
        return discriminator;
    }

    /**
     * Sets the discriminator for this object.
     *
     * @param discriminator The discriminator for this object.
     */
    public void setDiscriminator(Discriminator discriminator) {
        this.discriminator = discriminator;
    }

    /**
     * Gets the properties that are in this object.
     *
     * @return The properties that are in this object.
     */
    public List<Property> getProperties() {
        return properties;
    }

    /**
     * Sets the properties that are in this object.
     *
     * @param properties The properties that are in this object.
     */
    public void setProperties(List<Property> properties) {
        this.properties = properties;
    }

    /**
     * Gets the maximum number of properties permitted.
     *
     * @return The maximum number of properties permitted.
     */
    public double getMaxProperties() {
        return maxProperties;
    }

    /**
     * Sets the maximum number of properties permitted.
     *
     * @param maxProperties The maximum number of properties permitted.
     */
    public void setMaxProperties(double maxProperties) {
        this.maxProperties = maxProperties;
    }

    /**
     * Gets the minimum number of properties permitted.
     *
     * @return The minimum number of properties permitted.
     */
    public double getMinProperties() {
        return minProperties;
    }

    /**
     * Sets the minimum number of properties permitted.
     *
     * @param minProperties The minimum number of properties permitted.
     */
    public void setMinProperties(double minProperties) {
        this.minProperties = minProperties;
    }

    /**
     * Gets the parents of this object.
     *
     * @return The parents of this object.
     */
    public Relations getParents() {
        return parents;
    }

    /**
     * Sets the parents of this object.
     *
     * @param parents The parents of this object.
     */
    public void setParents(Relations parents) {
        this.parents = parents;
    }

    /**
     * Gets the children of this object.
     *
     * @return The children of this object.
     */
    public Relations getChildren() {
        return children;
    }

    /**
     * Sets the children of this object.
     *
     * @param children The children of this object.
     */
    public void setChildren(Relations children) {
        this.children = children;
    }

    /**
     * Gets the discriminator value for this object.
     *
     * @return The discriminator value for this object.
     */
    public String getDiscriminatorValue() {
        return discriminatorValue;
    }

    /**
     * Sets the discriminator value for this object.
     *
     * @param discriminatorValue The discriminator value for this object.
     */
    public void setDiscriminatorValue(String discriminatorValue) {
        this.discriminatorValue = discriminatorValue;
    }

    /**
     * Gets whether this schema represents a flattened schema.
     *
     * @return Whether this schema represents a flattened schema.
     */
    public boolean isFlattenedSchema() {
        return flattenedSchema;
    }

    /**
     * Sets whether this schema represents a flattened schema.
     *
     * @param flattenedSchema Whether this schema represents a flattened schema.
     */
    public void setFlattenedSchema(boolean flattenedSchema) {
        this.flattenedSchema = flattenedSchema;
    }

    /**
     * Gets whether this schema represents a strongly-typed HTTP headers object.
     *
     * @return Whether this schema represents a strongly-typed HTTP headers object.
     */
    public boolean isStronglyTypedHeader() {
        return stronglyTypedHeader;
    }

    /**
     * Sets whether this schema represents a strongly-typed HTTP headers object.
     *
     * @param stronglyTypedHeader Whether this schema represents a strongly-typed HTTP headers object.
     */
    public void setStronglyTypedHeader(boolean stronglyTypedHeader) {
        this.stronglyTypedHeader = stronglyTypedHeader;
    }
}
