// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.array;

import io.clientcore.core.models.binarydata.BinaryData;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class UnknownValueClientTest {

    private final UnknownValueClient client = new ArrayClientBuilder().buildUnknownValueClient();

    @Disabled("java.lang.ClassCastException: class java.lang.Integer cannot be cast to class io.clientcore.core.models.binarydata.BinaryData")
    @Test
    public void get() throws IOException {
        List<BinaryData> response = client.get();
        Assertions.assertEquals(3, response.size());
        Assertions.assertEquals(1, (int) response.get(0).toObject(Integer.class));
        Assertions.assertEquals("hello", response.get(1).toObject(String.class));
        Assertions.assertEquals(null, response.get(2));
    }

    @Disabled("{\"message\":\"Body provided doesn't match expected body\",\"expected\":[1,\"hello\",null],\"actual\":[\"1\",\"\\\"hello\\\"\",null]}")
    @Test
    public void put() {
        client.put(Arrays.asList(BinaryData.fromObject(1), BinaryData.fromObject("hello"), null));
    }
}
