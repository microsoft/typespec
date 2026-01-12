// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

public interface ConvertToJsonTypeTrait {

    /**
     * Gets the expression that convert the variable of this type to the wire type.
     *
     * @param variableName The variable to convert.
     * @return The expression that convert the variable to the wire type.
     */
    String convertToJsonType(String variableName);
}
