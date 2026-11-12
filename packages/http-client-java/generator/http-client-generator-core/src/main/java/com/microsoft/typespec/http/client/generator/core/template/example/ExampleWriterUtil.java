// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.example;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

final class ExampleWriterUtil {
    private ExampleWriterUtil() {
    }

    static String getParameterExpression(IType parameterType, String valueExpression) {
        return "null".equals(valueExpression) ? String.format("(%s) null", parameterType) : valueExpression;
    }
}
