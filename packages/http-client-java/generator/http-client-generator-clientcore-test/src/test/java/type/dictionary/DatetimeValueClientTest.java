// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.dictionary;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class DatetimeValueClientTest {

    private final DatetimeValueClient client = new DictionaryClientBuilder().buildDatetimeValueClient();

    @Test
    public void get() {
        Map<String, OffsetDateTime> response = client.get();
        Assertions.assertTrue(response.containsKey("k1"));
        Assertions.assertEquals("2022-08-26T18:38:00Z", response.get("k1"));
    }

    @Test
    @Disabled("Body provided doesn't match expected body,\"expected\":{\"k1\":\"2022-08-26T18:38:00Z\"},\"actual\":{\"k1\":\"2022-08-26T18:38Z\"}")
    public void put() {
        Map<String, OffsetDateTime> map = new HashMap<>();
        map.put("k1", OffsetDateTime.parse("2022-08-26T18:38Z"));
        client.put(map);
    }
}
