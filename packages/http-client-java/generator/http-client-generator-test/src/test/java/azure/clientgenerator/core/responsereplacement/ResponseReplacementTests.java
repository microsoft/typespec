// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.responsereplacement;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ResponseReplacementTests {
    @Test
    public void testVoidResponse() {
        new ResponseReplacementClientBuilder().buildClient().voidResponse();
    }

    @Test
    public void testBytesResponse() {
        ResponseReplacementClient client = new ResponseReplacementClientBuilder().buildClient();
        Assertions.assertArrayEquals("{\"name\":\"widget\"}".getBytes(StandardCharsets.UTF_8),
            client.bytesResponse().toBytes());
    }
}
