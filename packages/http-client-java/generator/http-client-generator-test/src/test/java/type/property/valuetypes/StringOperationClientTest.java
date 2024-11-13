// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.property.valuetypes.models.StringProperty;

class StringOperationClientTest {

    StringOperationClient client = new ValueTypesClientBuilder().buildStringOperationClient();

    @Test
    void get() {
        StringProperty stringProperty = client.get();
        Assertions.assertEquals("hello", stringProperty.getProperty());
    }

    @Test
    void put() {
        StringProperty stringProperty = new StringProperty("hello");
        client.put(stringProperty);
    }
}
