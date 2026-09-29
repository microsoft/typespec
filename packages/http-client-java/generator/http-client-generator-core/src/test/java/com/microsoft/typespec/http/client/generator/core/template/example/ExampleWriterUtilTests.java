// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.example;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ExampleWriterUtilTests {
    @Test
    public void typesNullParameterExpression() {
        Assertions.assertEquals("(String) null", ExampleWriterUtil.getParameterExpression(ClassType.STRING, "null"));
    }

    @Test
    public void preservesNonNullParameterExpression() {
        Assertions.assertEquals("\"value\"", ExampleWriterUtil.getParameterExpression(ClassType.STRING, "\"value\""));
    }
}
