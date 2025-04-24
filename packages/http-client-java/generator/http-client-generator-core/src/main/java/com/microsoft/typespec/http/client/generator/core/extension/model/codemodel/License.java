// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents license information.
 */
public class License {
    private String name;
    private String url;
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the License class.
     */
    public License() {
    }

    /**
     * The name of the license. (Required)
     *
     * @return The name of the license.
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the name of the license. (Required)
     *
     * @param name The name of the license.
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * Gets the URL pointing to the full license text.
     *
     * @return The URL pointing to the full license text.
     */
    public String getUrl() {
        return url;
    }

    /**
     * Sets the URL pointing to the full license text.
     *
     * @param url The URL pointing to the full license text.
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * Gets the extensions of the license.
     *
     * @return The extensions of the license.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions of the license.
     *
     * @param extensions The extensions of the license.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return License.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[name="
            + Objects.toString(name, "<null>") + ",url=" + Objects.toString(url, "<null>") + ",extensions="
            + Objects.toString(extensions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, url, extensions);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof License)) {
            return false;
        }

        License rhs = ((License) other);
        return Objects.equals(name, rhs.name)
            && Objects.equals(url, rhs.url)
            && Objects.equals(extensions, rhs.extensions);
    }
}
