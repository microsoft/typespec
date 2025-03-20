// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class IntClientTest {

    private final IntClient client = new ValueTypesClientBuilder().buildIntClient();

    @Test
    public void get() {
        IntProperty intProperty = client.get();
        Assertions.assertEquals(42, intProperty.getProperty());
    }

    @Test
    public void put() {
        IntProperty intProperty = new IntProperty(42);
        client.put(intProperty);
    }
}
