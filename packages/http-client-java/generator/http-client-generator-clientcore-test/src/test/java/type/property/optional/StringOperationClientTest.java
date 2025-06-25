// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class StringOperationClientTest {

    private final StringOperationClient client = new OptionalClientBuilder().buildStringOperationClient();

    @Test
    public void getAll() {
        StringProperty stringProperty = client.getAll();
        Assertions.assertEquals("hello", stringProperty.getProperty());
    }

    @Test
    public void getDefault() {
        StringProperty stringProperty = client.getDefault();
        Assertions.assertNull(stringProperty.getProperty());
    }

    @Test
    public void putAll() {
        StringProperty stringProperty = new StringProperty();
        stringProperty.setProperty("hello");
        client.putAll(stringProperty);
    }

    @Test
    public void putDefault() {
        StringProperty stringProperty = new StringProperty();
        client.putDefault(stringProperty);
    }
}
