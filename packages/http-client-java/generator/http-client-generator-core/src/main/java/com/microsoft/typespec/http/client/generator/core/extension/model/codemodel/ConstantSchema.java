// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

/**
 * Represents a constant schema.
 */
public class ConstantSchema extends Schema {
    private Schema valueType;
    private ConstantValue value;

    /**
     * Creates a new instance of the ConstantSchema class.
     */
    public ConstantSchema() {
        super();
    }

    /**
     * Gets the value type. (Required)
     *
     * @return The value type.
     */
    public Schema getValueType() {
        return valueType;
    }

    /**
     * Sets the value type. (Required)
     *
     * @param valueType The value type.
     */
    public void setValueType(Schema valueType) {
        this.valueType = valueType;
    }

    /**
     * Gets the actual constant value. (Required)
     *
     * @return The actual constant value.
     */
    public ConstantValue getValue() {
        return value;
    }

    /**
     * Sets the actual constant value. (Required)
     *
     * @param value The actual constant value.
     */
    public void setValue(ConstantValue value) {
        this.value = value;
    }
}
