// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.specialheaders.conditionalrequest;

import org.junit.jupiter.api.Test;

public class ConditionalRequestTests {

    private final ConditionalRequestClient client = new ConditionalRequestClientBuilder().buildClient();

    @Test
    public void testConditionalRequestHeaders() {
        client.postIfMatch("\"valid\"");
        client.postIfNoneMatch("\"invalid\"");
        client.postCustomIfMatch("\"valid\"");
        client.postCustomIfNoneMatch("\"invalid\"");
    }
}
