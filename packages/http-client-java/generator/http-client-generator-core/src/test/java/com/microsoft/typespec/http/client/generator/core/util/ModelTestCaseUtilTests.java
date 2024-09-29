// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import java.util.Arrays;
import java.util.Objects;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ModelTestCaseUtilTests {

    @Test
    public void testJsonFromEnumType() {
        EnumType type = new EnumType.Builder().elementType(ClassType.STRING)
            .values(Arrays.asList(new ClientEnumValue("200", "200"), new ClientEnumValue("404", "404")))
            .build();

        Object jsonObject = ModelTestCaseUtil.jsonFromType(0, type);
        Assertions.assertTrue(jsonObject instanceof String);
        Assertions.assertTrue(Objects.equals("200", jsonObject) || Objects.equals("404", jsonObject));

        type = new EnumType.Builder().elementType(ClassType.INTEGER)
            .values(Arrays.asList(new ClientEnumValue("200", "200"), new ClientEnumValue("404", "404")))
            .build();

        jsonObject = ModelTestCaseUtil.jsonFromType(0, type);
        Assertions.assertTrue(jsonObject instanceof Integer);
        Assertions.assertTrue(Objects.equals(200, jsonObject) || Objects.equals(404, jsonObject));
    }
}
