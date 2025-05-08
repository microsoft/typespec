// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.dictionary;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class NullableFloatValueClientTests {

    private final static ObjectMapper MAPPER = new ObjectMapper();

    private final NullableFloatValueClient client = new DictionaryClientBuilder().buildNullableFloatValueClient();

    @Test
    public void get() {

        Map<String, Double> result = client.get();

        Assertions.assertTrue(result.containsKey("k3"));
        Assertions.assertNull(result.get("k3"));
    }

    @Test
    @Disabled("Cannot parse null string")
    public void put() throws Exception {
        MapModel model = new MapModel();
        model.map = new HashMap<>();
        model.map.put("k1", 1.25);
        model.map.put("k2", 0.5);
        model.map.put("k3", null);

        client.putWithResponse(model.map, null);
    }

    public static class MapModel {
        @JsonInclude(value = JsonInclude.Include.NON_NULL, content = JsonInclude.Include.ALWAYS)
        Map<String, Double> map;
    }
}
