package com.specialheaders.conditionalrequest;

import org.junit.jupiter.api.Test;

public class ConditionalTests {

    private final ConditionalRequestClient client = new ConditionalRequestClientBuilder().buildClient();

    @Test
    public void testConditional() {
        client.postIfMatch("\"valid\"");

        client.postIfNoneMatch("\"invalid\"");
    }
}
