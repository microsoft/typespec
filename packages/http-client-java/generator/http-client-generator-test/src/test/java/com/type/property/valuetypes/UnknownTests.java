// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.UnknownArrayProperty;
import com.type.property.valuetypes.models.UnknownDictProperty;
import com.type.property.valuetypes.models.UnknownIntProperty;
import com.type.property.valuetypes.models.UnknownStringProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UnknownTests {

    private final UnknownArrayClient arrayClient = new ValueTypesClientBuilder().buildUnknownArrayClient();
    private final UnknownDictClient dictClient = new ValueTypesClientBuilder().buildUnknownDictClient();
    private final UnknownIntClient intClient = new ValueTypesClientBuilder().buildUnknownIntClient();
    private final UnknownStringClient stringClient = new ValueTypesClientBuilder().buildUnknownStringClient();

    @Test
    public void testUnknownArray() {
        List<String> array = Arrays.asList("hello", "world");

        arrayClient.put(new UnknownArrayProperty(array));

        Assertions.assertEquals(array, arrayClient.get().getProperty());
    }

    @Test
    public void testUnknownDict() {
        Map<String, Object> dict = new HashMap<>();
        dict.put("k1", "hello");
        dict.put("k2", 42);

        dictClient.put(new UnknownDictProperty(dict));

        Assertions.assertEquals(dict, dictClient.get().getProperty());
    }

    @Test
    public void testUnknownInt() {
        int integer = 42;

        intClient.put(new UnknownIntProperty(integer));

        Assertions.assertEquals(integer, intClient.get().getProperty());
    }

    @Test
    public void testUnknownString() {
        String str = "hello";

        stringClient.put(new UnknownStringProperty(str));

        Assertions.assertEquals(str, stringClient.get().getProperty());
    }
}
