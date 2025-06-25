// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class BytesClientTest {

    private final BytesClient bytesClient = new OptionalClientBuilder().buildBytesClient();

    @Test
    public void getAll() {
        BytesProperty bytesProperty = bytesClient.getAll();
        Assertions.assertNotNull(bytesProperty.getProperty());
    }

    @Test
    public void putAll() {
        BytesProperty bytesProperty = new BytesProperty();
        bytesProperty.setProperty(new byte[] { 104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33 });
        bytesClient.putAll(bytesProperty);
    }

    @Test
    public void getDefault() {
        BytesProperty bytesProperty = bytesClient.getDefault();
        Assertions.assertNull(bytesProperty.getProperty());
    }

    @Test
    public void putDefault() {
        BytesProperty bytesProperty = new BytesProperty();
        bytesClient.putDefault(bytesProperty);
    }
}
