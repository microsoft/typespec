// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class BooleanOperationClientTest {

    private final BooleanOperationClient client = new ValueTypesClientBuilder().buildBooleanOperationClient();

    @Test
    public void get() {
        BooleanProperty response = client.get();
        Assertions.assertTrue(response.isProperty());
    }

    @Test
    public void put() {
        BooleanProperty booleanProperty = new BooleanProperty(true);
        client.put(booleanProperty);
    }
}
