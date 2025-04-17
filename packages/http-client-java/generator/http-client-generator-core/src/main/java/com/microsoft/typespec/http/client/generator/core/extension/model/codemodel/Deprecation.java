// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Represents deprecation information.
 */
public class Deprecation {
    private String message;
    private List<ApiVersion> apiVersions = new ArrayList<>();

    /**
     * Creates a new instance of the Deprecation class.
     */
    public Deprecation() {
    }

    /**
     * Gets the deprecated message. (Required)
     *
     * @return The deprecated message.
     */
    public String getMessage() {
        return message;
    }

    /**
     * Sets the deprecated message. (Required)
     *
     * @param message The deprecated message.
     */
    public void setMessage(String message) {
        this.message = message;
    }

    /**
     * Gets the API versions that this deprecation is applicable to. (Required)
     *
     * @return The API versions that this deprecation is applicable to.
     */
    public List<ApiVersion> getApiVersions() {
        return apiVersions;
    }

    /**
     * Sets the API versions that this deprecation is applicable to. (Required)
     *
     * @param apiVersions The API versions that this deprecation is applicable to.
     */
    public void setApiVersions(List<ApiVersion> apiVersions) {
        this.apiVersions = apiVersions;
    }

    @Override
    public String toString() {
        return Deprecation.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[message="
            + Objects.toString(message, "<null>") + ",apiVersions=" + Objects.toString(apiVersions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(message, apiVersions);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof Deprecation)) {
            return false;
        }

        Deprecation rhs = ((Deprecation) other);
        return Objects.equals(message, rhs.message) && Objects.equals(apiVersions, rhs.apiVersions);
    }
}
