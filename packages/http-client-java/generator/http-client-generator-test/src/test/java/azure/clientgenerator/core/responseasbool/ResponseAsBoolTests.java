// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.responseasbool;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ResponseAsBoolTests {

    private final ResponseAsBoolClient client = new ResponseAsBoolClientBuilder().buildClient();

    @Test
    public void testHeadAsBool() {
        Assertions.assertTrue(client.exists());
        Assertions.assertFalse(client.notExists());
    }
}
