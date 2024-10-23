// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.EnumProperty;
import com.type.property.valuetypes.models.FixedInnerEnum;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class EnumClientTest {

    EnumClient client = new ValueTypesClientBuilder().buildEnumClient();

    @Test
    void get() {
        EnumProperty enumProperty = client.get();
        FixedInnerEnum innerEnum = enumProperty.getProperty();
        Assertions.assertEquals("ValueOne", innerEnum.toString());
    }

    @Test
    void put() {
        FixedInnerEnum innerEnum = FixedInnerEnum.VALUE_ONE;
        EnumProperty enumProperty = new EnumProperty(innerEnum);
        client.put(enumProperty);
    }
}
