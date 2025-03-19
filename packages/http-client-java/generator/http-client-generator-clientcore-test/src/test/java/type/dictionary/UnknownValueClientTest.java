// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.dictionary;

import io.clientcore.core.models.binarydata.BinaryData;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class UnknownValueClientTest {

    public final UnknownValueClient client = new DictionaryClientBuilder().buildUnknownValueClient();

    @Disabled("java.lang.ClassCastException: class java.lang.Integer cannot be cast to class io.clientcore.core.models.binarydata.BinaryData")
    @Test
    public void get() throws IOException {
        Map<String, BinaryData> response = client.get();
        Assertions.assertEquals(1, (int) response.get("k1").toObject(Integer.class));
        Assertions.assertEquals("hello", response.get("k2").toObject(String.class));
        Assertions.assertEquals(null, response.get("k3"));
    }

    @Disabled("{\"message\":\"Body provided doesn't match expected body\",\"expected\":{\"k1\":1,\"k2\":\"hello\",\"k3\":null},\"actual\":{\"k1\":\"1\",\"k2\":\"\\\"hello\\\"\",\"k3\":null}}")
    @Test
    public void put() {
        Map<String, BinaryData> map = new HashMap<>();
        map.put("k1", BinaryData.fromObject(1));
        map.put("k2", BinaryData.fromObject("hello"));
        map.put("k3", null);
        client.put(map);
    }
}
