// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.client.structure.service.models;

/**
 * Defines values for ClientType.
 */
public enum ClientType {
    /**
     * Enum value default.
     */
    DEFAULT("default"),

    /**
     * Enum value multi-client.
     */
    MULTI_CLIENT("multi-client"),

    /**
     * Enum value renamed-operation.
     */
    RENAMED_OPERATION("renamed-operation"),

    /**
     * Enum value two-operation-group.
     */
    TWO_OPERATION_GROUP("two-operation-group");

    /**
     * The actual serialized value for a ClientType instance.
     */
    private final String value;

    ClientType(String value) {
        this.value = value;
    }

    /**
     * Parses a serialized value to a ClientType instance.
     * 
     * @param value the serialized value to parse.
     * @return the parsed ClientType object, or null if unable to parse.
     */
    public static ClientType fromString(String value) {
        if (value == null) {
            return null;
        }
        ClientType[] items = ClientType.values();
        for (ClientType item : items) {
            if (item.toString().equalsIgnoreCase(value)) {
                return item;
            }
        }
        return null;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString() {
        return this.value;
    }
}
