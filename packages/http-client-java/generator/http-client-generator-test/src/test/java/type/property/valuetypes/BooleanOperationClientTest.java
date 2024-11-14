// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.property.valuetypes.models.BooleanProperty;

class BooleanOperationClientTest {

    BooleanOperationClient client = new ValueTypesClientBuilder().buildBooleanOperationClient();

    @Test
    void get() {
        BooleanProperty response = client.get();
        Assertions.assertTrue(response.isProperty());
    }

    @Test
    void put() {
        BooleanProperty booleanProperty = new BooleanProperty(true);
        client.put(booleanProperty);
    }
}
