// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.property.valuetypes;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class DictionaryStringClientTest {

    private final DictionaryStringClient client = new ValueTypesClientBuilder().buildDictionaryStringClient();

    @Test
    public void get() {
        DictionaryStringProperty dictionaryStringProperty = client.get();
        Map<String, String> property = dictionaryStringProperty.getProperty();
        Assertions.assertEquals("hello", property.get("k1"));
        Assertions.assertEquals("world", property.get("k2"));
    }

    @Test
    public void put() {
        Map<String, String> property = new HashMap<>();
        property.put("k1", "hello");
        property.put("k2", "world");
        DictionaryStringProperty dictionaryStringProperty = new DictionaryStringProperty(property);
        client.put(dictionaryStringProperty);
    }
}
