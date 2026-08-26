// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a flag value.
 */
public class FlagValue {
    private Languages language;
    private double value;
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the FlagValue class.
     */
    public FlagValue() {
    }

    /**
     * Gets the language of the flag value. (Required)
     *
     * @return The language of the flag value.
     */
    public Languages getLanguage() {
        return language;
    }

    /**
     * Sets the language of the flag value. (Required)
     *
     * @param language The language of the flag value.
     */
    public void setLanguage(Languages language) {
        this.language = language;
    }

    /**
     * Gets the value of the flag. (Required)
     *
     * @return The value of the flag.
     */
    public double getValue() {
        return value;
    }

    /**
     * Sets the value of the flag. (Required)
     *
     * @param value The value of the flag.
     */
    public void setValue(double value) {
        this.value = value;
    }

    /**
     * Gets the extensions of the flag value.
     *
     * @return The extensions of the flag value.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions of the flag value.
     *
     * @param extensions The extensions of the flag value.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return FlagValue.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[language="
            + Objects.toString(language, "<null>") + ",value=" + value + ",extensions="
            + Objects.toString(extensions, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(language, extensions, value);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof FlagValue)) {
            return false;
        }

        FlagValue rhs = ((FlagValue) other);
        return value == rhs.value
            && Objects.equals(language, rhs.language)
            && Objects.equals(extensions, rhs.extensions);
    }
}
