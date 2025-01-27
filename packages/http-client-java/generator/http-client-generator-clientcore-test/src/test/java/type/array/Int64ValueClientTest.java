// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.array;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class Int64ValueClientTest {

    private final Int64ValueClient client = new ArrayClientBuilder().buildInt64ValueClient();

    @Test
    public void get() {
        List<Long> response = client.get();
        Assertions.assertEquals(2, response.size());
        Assertions.assertEquals(9007199254740991L, response.get(0));
        Assertions.assertEquals(-9007199254740991L, response.get(1));
    }

    @Test
    public void put() {
        client.put(Arrays.asList(9007199254740991L, -9007199254740991L));
    }
}
