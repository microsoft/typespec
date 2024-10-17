// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.azure.core.util.BinaryData;
import com.type.property.valuetypes.models.UnknownArrayProperty;
import com.type.property.valuetypes.models.UnknownDictProperty;
import com.type.property.valuetypes.models.UnknownIntProperty;
import com.type.property.valuetypes.models.UnknownStringProperty;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class UnknownTests {

    private final UnknownArrayClient arrayClient = new ValueTypesClientBuilder().buildUnknownArrayClient();
    private final UnknownDictClient dictClient = new ValueTypesClientBuilder().buildUnknownDictClient();
    private final UnknownIntClient intClient = new ValueTypesClientBuilder().buildUnknownIntClient();
    private final UnknownStringClient stringClient = new ValueTypesClientBuilder().buildUnknownStringClient();

    @Test
    public void testUnknownArray() {
        List<String> array = Arrays.asList("hello", "world");

        arrayClient.put(new UnknownArrayProperty(BinaryData.fromObject(array)));

        Assertions.assertEquals(array, arrayClient.get().getProperty().toObject(List.class));
    }

    @Test
    public void testUnknownDict() {
        Map<String, Object> dict = new HashMap<>();
        dict.put("k1", "hello");
        dict.put("k2", 42);

        dictClient.put(new UnknownDictProperty(BinaryData.fromObject(dict)));

        Assertions.assertEquals(dict, dictClient.get().getProperty().toObject(Map.class));
    }

    @Test
    public void testUnknownInt() {
        int integer = 42;

        intClient.put(new UnknownIntProperty(BinaryData.fromObject(integer)));

        Assertions.assertEquals(integer, intClient.get().getProperty().toObject(Integer.class));
    }

    @Test
    public void testUnknownString() {
        String str = "hello";

        stringClient.put(new UnknownStringProperty(BinaryData.fromObject(str)));

        Assertions.assertEquals(str, stringClient.get().getProperty().toObject(String.class));
    }
}
