// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package serialization.encodedname.json;

import org.junit.jupiter.api.Test;

public class JsonTests {

    private final JsonClient client = new JsonClientBuilder().buildJsonClient();

    @Test
    public void testJson() {
        client.send(client.get());
    }
}
