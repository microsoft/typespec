// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.additionalproperties;

import com.type.property.additionalproperties.models.IsStringAdditionalProperties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

public class IsStringClientTest {
    private final IsStringClient client = new AdditionalPropertiesClientBuilder().buildIsStringClient();

    @Test
    public void testPullAndGet() {
        IsStringAdditionalProperties body =
                new IsStringAdditionalProperties("IsStringAdditionalProperties");
        Map<String, String> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", "abc") ;
        body.setAdditionalProperties(propertyMap);
        client.put(body);

        IsStringAdditionalProperties properties = client.get();
        Assertions.assertNotNull(properties);
        Assertions.assertEquals("IsStringAdditionalProperties", properties.getName());
        Assertions.assertNotNull(properties.getAdditionalProperties());
        Assertions.assertIterableEquals(propertyMap.entrySet(), properties.getAdditionalProperties().entrySet());
    }
}
