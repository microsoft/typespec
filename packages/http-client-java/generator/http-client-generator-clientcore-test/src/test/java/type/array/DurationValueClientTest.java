// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.array;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class DurationValueClientTest {

    private final DurationValueClient client = new ArrayClientBuilder().buildDurationValueClient();

    @Test
    @Disabled("Response type is not Duration in List")
    public void get() {
        List<Duration> response = client.get();
        Assertions.assertEquals(1, response.size());
        Assertions.assertEquals("P123DT22H14M12.011S", response.get(0));
    }

    @Test
    @Disabled("Body provided doesn't match expected body,\"expected\":[\"P123DT22H14M12.011S\"],\"actual\":[\"PT2974H14M12.011S\"]")
    public void put() {
        Duration duration = Duration.parse("P123DT22H14M12.011S");
        client.put(Arrays.asList(duration));
    }
}
