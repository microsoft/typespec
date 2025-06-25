// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.array;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class StringValueClientTest {

    private final StringValueClient client = new ArrayClientBuilder().buildStringValueClient();

    @Test
    public void get() {
        List<String> response = client.get();
        Assertions.assertEquals(2, response.size());
        Assertions.assertEquals("hello", response.get(0));
        Assertions.assertEquals("", response.get(1));
    }

    @Test
    public void put() {
        client.put(Arrays.asList("hello", ""));
    }
}
