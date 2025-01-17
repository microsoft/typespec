// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.array;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

public class NullableFloatValueClientTest {

    private final NullableFloatValueClient client = new ArrayClientBuilder().buildNullableFloatValueClient();

    @Test
    public void get() {
        List<Double> response = client.get();
        assertEquals(Arrays.asList(1.25, null, 3), response);
    }

    @Test
    public void put() {
        List<Double> body = Arrays.asList(1.25, null, 3.0);
        client.put(body);
    }
}
