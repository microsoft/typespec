// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

/**
 * Trait for types that can convert a JSON wire value back into the client type.
 */
public interface ConvertFromJsonTypeTrait {

    /**
     * Gets the expression that converts the JSON wire value into this type.
     *
     * @param variableName The variable to convert.
     * @return The expression that converts the variable to this type.
     */
    String convertFromJsonType(String variableName);
}
