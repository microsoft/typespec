// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents the sources of the operation ID of a long-running operation.
 * <p>
 * The path parameter in the polling URL is used until the property on the status monitor response is available.
 */
public class LongRunningOperationIdMetadata {
    private String pathTemplate;
    private String pathParameterSerializedName;
    private String propertySerializedName;

    /**
     * Creates a new instance of the LongRunningOperationIdMetadata class.
     */
    public LongRunningOperationIdMetadata() {
    }

    /**
     * Gets the path template of the status monitor operation.
     *
     * @return the path template of the status monitor operation.
     */
    public String getPathTemplate() {
        return pathTemplate;
    }

    /**
     * Sets the path template of the status monitor operation.
     *
     * @param pathTemplate the path template of the status monitor operation.
     */
    public void setPathTemplate(String pathTemplate) {
        this.pathTemplate = pathTemplate;
    }

    /**
     * Gets the name of the path parameter that is the operation ID.
     *
     * @return the name of the path parameter that is the operation ID.
     */
    public String getPathParameterSerializedName() {
        return pathParameterSerializedName;
    }

    /**
     * Sets the name of the path parameter that is the operation ID.
     *
     * @param pathParameterSerializedName the name of the path parameter that is the operation ID.
     */
    public void setPathParameterSerializedName(String pathParameterSerializedName) {
        this.pathParameterSerializedName = pathParameterSerializedName;
    }

    /**
     * Gets the serialized name of the status monitor response property that is the operation ID.
     *
     * @return the serialized name of the status monitor response property that is the operation ID.
     */
    public String getPropertySerializedName() {
        return propertySerializedName;
    }

    /**
     * Sets the serialized name of the status monitor response property that is the operation ID.
     *
     * @param propertySerializedName the serialized name of the status monitor response property.
     */
    public void setPropertySerializedName(String propertySerializedName) {
        this.propertySerializedName = propertySerializedName;
    }

    /**
     * Whether the operation ID is extracted from the path of the polling URL.
     *
     * @return whether the operation ID is extracted from the path of the polling URL.
     */
    public boolean hasPathSource() {
        return pathTemplate != null && pathParameterSerializedName != null;
    }
}
