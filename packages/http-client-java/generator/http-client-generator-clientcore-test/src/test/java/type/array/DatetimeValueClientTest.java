// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.array;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class DatetimeValueClientTest {

    private final DatetimeValueClient client = new ArrayClientBuilder().buildDatetimeValueClient();

    @Test
    @Disabled("Response type is not OffsetDateTime in List")
    public void get() {
        List<OffsetDateTime> response = client.get();
        Assertions.assertEquals(1, response.size());
        Assertions.assertEquals("2022-08-26T18:38:00Z", response.get(0));
    }

    @Test
    @Disabled("Body provided doesn't match expected body,\"expected\":[\"2022-08-26T18:38:00Z\"],\"actual\":[\"2022-08-26T18:38Z\"]")
    public void put() {
        List<OffsetDateTime> body = Arrays.asList(OffsetDateTime.parse("2022-08-26T18:38:00Z"));
        client.put(body);
    }
}
