// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.optional;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.property.optional.models.PlainTimeProperty;

public class PlainTimeClientTests {
    private final PlainTimeClient client = new OptionalClientBuilder().buildPlainTimeClient();

    @Test
    public void getAll() {
        Assertions.assertEquals("13:06:12", client.getAll().getProperty());
    }

    @Test
    public void getDefault() {
        Assertions.assertNull(client.getDefault().getProperty());
    }

    @Test
    public void putAll() {
        client.putAll(new PlainTimeProperty().setProperty("13:06:12"));
    }

    @Test
    public void putDefault() {
        client.putDefault(new PlainTimeProperty());
    }
}
