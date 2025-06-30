// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.nullable;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class BytesClientTest {

    private final BytesClient client = new NullableClientBuilder().buildBytesClient();

    @Test
    public void patchNonNullWithResponse() {
        byte[] input = new byte[] { 104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33 };
        BytesProperty bytesProperty = new BytesProperty().setRequiredProperty("foo").setNullableProperty(input);
        client.patchNonNull(bytesProperty);
    }

    @Disabled
    @Test
    public void patchNullWithResponse() {
        client.patchNull(new BytesProperty().setRequiredProperty("foo").setNullableProperty(null));
    }

    @Test
    public void getNonNull() {
        BytesProperty response = client.getNonNull();
        Assertions.assertNotNull(response.getNullableProperty());
    }

    @Test
    public void getNull() {
        BytesProperty response = client.getNull();
        Assertions.assertNull(response.getNullableProperty());
    }
}
