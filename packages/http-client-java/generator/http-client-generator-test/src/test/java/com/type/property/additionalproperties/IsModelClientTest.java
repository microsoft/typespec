// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.additionalproperties;

import com.type.property.additionalproperties.models.IsModelAdditionalProperties;
import com.type.property.additionalproperties.models.ModelForRecord;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

public class IsModelClientTest {
    private final IsModelClient client = new AdditionalPropertiesClientBuilder().buildIsModelClient();

    @Test
    public void testPullAndGet() {
        Map<String, ModelForRecord> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", new ModelForRecord("ok"));
        IsModelAdditionalProperties body = new IsModelAdditionalProperties(new ModelForRecord("ok"));
        body.setAdditionalProperties(propertyMap);
        client.put(body);

        IsModelAdditionalProperties properties = client.get();
        Assertions.assertNotNull(properties);
        Assertions.assertNotNull(properties.getKnownProp());
        Assertions.assertEquals("ok", properties.getKnownProp().getState());
        Assertions.assertNotNull(properties.getAdditionalProperties());
        Assertions.assertNotNull(properties.getAdditionalProperties().get("prop"));
        Assertions.assertEquals("ok", properties.getAdditionalProperties().get("prop").getState());
    }
}
