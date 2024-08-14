// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * An individual value within an enumerated type.
 */
public class ClientEnumValue {
    private final String name;
    private final String value;
    private final String description;

    /**
     * Create a new EnumValue with the provided name and value.
     *
     * @param name The name of this EnumValue.
     * @param value The value of this EnumValue.
     */
    public ClientEnumValue(String name, String value) {
        this(name, value, null);
    }

    /**
     * Create a new EnumValue with the provided name, value, and description.
     *
     * @param name The name of this EnumValue.
     * @param value The value of this EnumValue.
     * @param description The description of this EnumValue.
     */
    public ClientEnumValue(String name, String value, String description) {
        this.name = name;
        this.value = value;
        this.description = description;
    }

    /**
     * Gets the name of this EnumValue.
     *
     * @return The name of this EnumValue.
     */
    public final String getName() {
        return name;
    }

    /**
     * Gets the value of this EnumValue.
     *
     * @return The value of this EnumValue.
     */
    public final String getValue() {
        return value;
    }

    /**
     * Gets the description of this EnumValue.
     *
     * @return The description of this EnumValue.
     */
    public final String getDescription() {
        return description;
    }
}
