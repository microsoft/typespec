// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class StringOperationClientTest {

    private final StringOperationClient client = new ValueTypesClientBuilder().buildStringOperationClient();

    @Test
    public void get() {
        StringProperty stringProperty = client.get();
        Assertions.assertEquals("hello", stringProperty.getProperty());
    }

    @Test
    public void put() {
        StringProperty stringProperty = new StringProperty("hello");
        client.put(stringProperty);
    }
}
