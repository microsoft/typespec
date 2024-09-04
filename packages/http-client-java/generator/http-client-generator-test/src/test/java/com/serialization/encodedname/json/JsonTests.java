// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.serialization.encodedname.json;

import org.junit.jupiter.api.Test;

public class JsonTests {

    private final JsonClient client = new JsonClientBuilder().buildClient();

    @Test
    public void testJson() {
        client.send(client.get());
    }
}
