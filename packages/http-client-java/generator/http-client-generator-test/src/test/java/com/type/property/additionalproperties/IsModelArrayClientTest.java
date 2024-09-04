// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.additionalproperties;

import com.type.property.additionalproperties.models.IsModelArrayAdditionalProperties;
import com.type.property.additionalproperties.models.ModelForRecord;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class IsModelArrayClientTest {
    private final IsModelArrayClient client = new AdditionalPropertiesClientBuilder().buildIsModelArrayClient();

    @Test
    public void testPullAndGet() {
        Map<String, List<ModelForRecord>> propertyMap = new LinkedHashMap<>();
        propertyMap.put("prop", Arrays.asList(new ModelForRecord("ok"), new ModelForRecord("ok")));
        IsModelArrayAdditionalProperties body =
                new IsModelArrayAdditionalProperties(Arrays.asList(new ModelForRecord("ok"), new ModelForRecord("ok")));
        body.setAdditionalProperties(propertyMap);
        client.put(body);

        IsModelArrayAdditionalProperties properties = client.get();
        Assertions.assertNotNull(properties);
        Assertions.assertNotNull(properties.getKnownProp());
        properties.getKnownProp().forEach(modelForRecord ->
                Assertions.assertEquals("ok", modelForRecord.getState()));
        Assertions.assertNotNull(properties.getAdditionalProperties());
        Assertions.assertNotNull(properties.getAdditionalProperties().get("prop"));
        properties.getAdditionalProperties().get("prop").forEach(modelForRecord ->
                Assertions.assertEquals("ok", modelForRecord.getState()));
    }
}
