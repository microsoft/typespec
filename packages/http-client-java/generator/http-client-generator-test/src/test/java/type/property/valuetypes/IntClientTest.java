// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.property.valuetypes.models.IntProperty;

class IntClientTest {

    IntClient client = new ValueTypesClientBuilder().buildIntClient();

    @Test
    void get() {
        IntProperty intProperty = client.get();
        Assertions.assertEquals(42, intProperty.getProperty());
    }

    @Test
    void put() {
        IntProperty intProperty = new IntProperty(42);
        client.put(intProperty);
    }
}
