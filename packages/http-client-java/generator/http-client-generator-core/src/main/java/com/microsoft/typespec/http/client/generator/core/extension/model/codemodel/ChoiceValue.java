// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents a choice value.
 */
public class ChoiceValue {
    private Languages language;
    private String value;
    private DictionaryAny extensions;

    /**
     * Creates a new instance of the ChoiceValue class.
     */
    public ChoiceValue() {
    }

    /**
     * Gets the language for the choice value. (Required)
     *
     * @return The language for the choice value.
     */
    public Languages getLanguage() {
        return language;
    }

    /**
     * Sets the language for the choice value. (Required)
     *
     * @param language The language for the choice value.
     */
    public void setLanguage(Languages language) {
        this.language = language;
    }

    /**
     * Gets the value of the choice. (Required)
     *
     * @return The value of the choice.
     */
    public String getValue() {
        return value;
    }

    /**
     * Sets the value of the choice. (Required)
     *
     * @param value The value of the choice.
     */
    public void setValue(String value) {
        this.value = value;
    }

    /**
     * Gets the extensions for the choice value.
     *
     * @return The extensions for the choice value.
     */
    public DictionaryAny getExtensions() {
        return extensions;
    }

    /**
     * Sets the extensions for the choice value.
     *
     * @param extensions The extensions for the choice value.
     */
    public void setExtensions(DictionaryAny extensions) {
        this.extensions = extensions;
    }

    @Override
    public String toString() {
        return ChoiceValue.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[language="
            + Objects.toString(language, "<null>") + ",value=" + Objects.toString(value, "<null>") + ",extensions="
            + Objects.toString(extensions, "<null>") + ']';
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof ChoiceValue)) {
            return false;
        }

        ChoiceValue rhs = ((ChoiceValue) other);
        return Objects.equals(this.value, rhs.value);
    }
}
