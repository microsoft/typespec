// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.property.valuetypes.models.FloatProperty;

class FloatOperationClientTest {

    FloatOperationClient client = new ValueTypesClientBuilder().buildFloatOperationClient();

    @Test
    void get() {
        FloatProperty floatProperty = client.get();
        Assertions.assertEquals(43.125, floatProperty.getProperty());
    }

    @Test
    void put() {
        FloatProperty floatProperty = new FloatProperty(43.125);
        client.put(floatProperty);
    }
}
