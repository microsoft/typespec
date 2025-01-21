// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class EnumClientTest {

    private final EnumClient client = new ValueTypesClientBuilder().buildEnumClient();

    @Test
    public void get() {
        EnumProperty enumProperty = client.get();
        FixedInnerEnum innerEnum = enumProperty.getProperty();
        Assertions.assertEquals("ValueOne", innerEnum.toString());
    }

    @Test
    public void put() {
        FixedInnerEnum innerEnum = FixedInnerEnum.VALUE_ONE;
        EnumProperty enumProperty = new EnumProperty(innerEnum);
        client.put(enumProperty);
    }
}
