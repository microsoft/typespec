// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.dictionary;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class Int32ValueClientTest {

    private final Int32ValueClient client = new DictionaryClientBuilder().buildInt32ValueClient();

    @Test
    public void get() {
        Map<String, Integer> response = client.get();
        Assertions.assertTrue(response.containsKey("k1"));
        Assertions.assertEquals(1, response.get("k1"));
        Assertions.assertTrue(response.containsKey("k2"));
        Assertions.assertEquals(2, response.get("k2"));
    }

    @Test
    public void put() {
        Map<String, Integer> map = new HashMap<>();
        map.put("k1", 1);
        map.put("k2", 2);
        client.put(map);
    }
}
