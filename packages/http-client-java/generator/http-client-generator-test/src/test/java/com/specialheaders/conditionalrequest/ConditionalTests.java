package com.specialheaders.conditionalrequest;

import com.azure.core.util.DateTimeRfc1123;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

public class ConditionalTests {

    private final ConditionalRequestClient client = new ConditionalRequestClientBuilder().buildClient();

    private static final OffsetDateTime DATE_TIME = new DateTimeRfc1123("Fri, 26 Aug 2022 14:38:00 GMT").getDateTime();

    @Test
    public void testConditional() {
        client.postIfMatch("\"valid\"");

        client.postIfNoneMatch("\"invalid\"");

        client.headIfModifiedSince(DATE_TIME);

        client.postIfUnmodifiedSince(DATE_TIME);
    }
}
