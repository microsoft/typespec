// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.additionalproperties;

import com.azure.core.util.BinaryData;
import com.type.property.additionalproperties.models.IsUnknownAdditionalProperties;
import com.type.property.additionalproperties.models.IsUnknownAdditionalPropertiesDerived;
import com.type.property.additionalproperties.models.IsUnknownAdditionalPropertiesDiscriminated;
import com.type.property.additionalproperties.models.IsUnknownAdditionalPropertiesDiscriminatedDerived;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.BinaryDataUtils;

public class IsUnknownClientTest {
    private final IsUnknownClient client = new AdditionalPropertiesClientBuilder().buildIsUnknownClient();
    private final IsUnknownDerivedClient isUnknownDerivedClient
        = new AdditionalPropertiesClientBuilder().buildIsUnknownDerivedClient();
    private final IsUnknownDiscriminatedClient isUnknownDiscriminatedClient
        = new AdditionalPropertiesClientBuilder().buildIsUnknownDiscriminatedClient();

    @Test
    public void testPullAndGet() {
        IsUnknownAdditionalProperties body = new IsUnknownAdditionalProperties("IsUnknownAdditionalProperties");
        Map<String, BinaryData> additionalProperty = new LinkedHashMap<>();
        additionalProperty.put("prop1", BinaryData.fromObject(32));
        additionalProperty.put("prop2", BinaryData.fromObject(true));
        additionalProperty.put("prop3", BinaryData.fromObject("abc"));
        body.setAdditionalProperties(additionalProperty);
        client.put(body);

        IsUnknownAdditionalProperties properties = client.get();
        Assertions.assertNotNull(properties);
        Assertions.assertNotNull(properties.getAdditionalProperties());
        Assertions.assertEquals("IsUnknownAdditionalProperties", properties.getName());
        BinaryDataUtils.assertMapEquals(additionalProperty, properties.getAdditionalProperties());
    }

    @Test
    public void testIsUnknownDerivedClient() {
        Map<String, BinaryData> additionalProperty = new LinkedHashMap<>();
        additionalProperty.put("prop1", BinaryData.fromObject(32));
        additionalProperty.put("prop2", BinaryData.fromObject(true));
        additionalProperty.put("prop3", BinaryData.fromObject("abc"));

        IsUnknownAdditionalPropertiesDerived body
            = new IsUnknownAdditionalPropertiesDerived("IsUnknownAdditionalProperties", 314).setAge(2.71875);
        body.setAdditionalProperties(additionalProperty);
        isUnknownDerivedClient.put(body);

        IsUnknownAdditionalPropertiesDerived properties = isUnknownDerivedClient.get();
        Assertions.assertNotNull(properties);
        Assertions.assertNotNull(properties.getAdditionalProperties());
        Assertions.assertEquals(2.71875, properties.getAge());
        Assertions.assertEquals(314, properties.getIndex());
        BinaryDataUtils.assertMapEquals(additionalProperty, properties.getAdditionalProperties());
    }

    @Test
    public void testIsUnknownDiscriminatedClient() {
        Map<String, BinaryData> additionalProperty = new LinkedHashMap<>();
        additionalProperty.put("prop1", BinaryData.fromObject(32));
        additionalProperty.put("prop2", BinaryData.fromObject(true));
        additionalProperty.put("prop3", BinaryData.fromObject("abc"));

        IsUnknownAdditionalPropertiesDiscriminatedDerived body
            = new IsUnknownAdditionalPropertiesDiscriminatedDerived("Derived", 314).setAge(2.71875);
        body.setAdditionalProperties(additionalProperty);
        isUnknownDiscriminatedClient.put(body);

        IsUnknownAdditionalPropertiesDiscriminated properties = isUnknownDiscriminatedClient.get();
        Assertions.assertNotNull(properties);
        Assertions.assertNotNull(properties.getAdditionalProperties());
        Assertions.assertEquals("Derived", properties.getName());
        BinaryDataUtils.assertMapEquals(additionalProperty, properties.getAdditionalProperties());
    }
}
