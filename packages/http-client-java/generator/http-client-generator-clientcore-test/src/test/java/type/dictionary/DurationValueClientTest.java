// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.dictionary;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class DurationValueClientTest {

    private final DurationValueClient client = new DictionaryClientBuilder().buildDurationValueClient();

    @Test
    public void get() {
        Map<String, Duration> response = client.get();
        Assertions.assertTrue(response.containsKey("k1"));
        Assertions.assertEquals("P123DT22H14M12.011S", response.get("k1"));
    }

    @Test
    @Disabled("Body provided doesn't match expected body, \"expected\":{\"k1\":\"P123DT22H14M12.011S\"},\"actual\":{\"k1\":\"PT2974H14M12.011S\"}")
    public void put() {
        Map<String, Duration> map = new HashMap<>();
        map.put("k1", Duration.parse("P123DT22H14M12.011S"));
        client.put(map);
    }
}
