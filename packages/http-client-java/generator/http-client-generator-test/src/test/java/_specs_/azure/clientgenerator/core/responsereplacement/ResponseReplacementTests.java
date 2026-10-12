// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package _specs_.azure.clientgenerator.core.responsereplacement;

import com.azure.core.util.BinaryData;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;

public class ResponseReplacementTests {
    private static final byte[] EXPECTED_BODY = "{\"name\":\"widget\"}".getBytes(StandardCharsets.UTF_8);
    private final ResponseReplacementClient client = new ResponseReplacementClientBuilder().buildClient();
    private final ResponseReplacementAsyncClient asyncClient
        = new ResponseReplacementClientBuilder().buildAsyncClient();

    @Test
    public void testVoidResponse() throws NoSuchMethodException {
        Assertions.assertEquals(void.class, ResponseReplacementClient.class.getMethod("voidResponse").getReturnType());
        client.voidResponse();
    }

    @Test
    public void testVoidResponseAsync() {
        StepVerifier.create(asyncClient.voidResponse()).verifyComplete();
    }

    @Test
    public void testBytesResponse() {
        BinaryData response = client.bytesResponse();
        Assertions.assertArrayEquals(EXPECTED_BODY, response.toBytes());
    }

    @Test
    public void testBytesResponseAsync() {
        StepVerifier.create(asyncClient.bytesResponse())
            .assertNext(response -> Assertions.assertArrayEquals(EXPECTED_BODY, response.toBytes()))
            .verifyComplete();
    }

    @Test
    public void testProtocolResponsesPreserveBody() {
        var voidResponse = client.voidResponseWithResponse(null);
        Assertions.assertEquals(200, voidResponse.getStatusCode());
        Assertions.assertArrayEquals(EXPECTED_BODY, voidResponse.getValue().toBytes());
        var bytesResponse = client.bytesResponseWithResponse(null);
        Assertions.assertEquals(200, bytesResponse.getStatusCode());
        Assertions.assertArrayEquals(EXPECTED_BODY, bytesResponse.getValue().toBytes());
    }
}
