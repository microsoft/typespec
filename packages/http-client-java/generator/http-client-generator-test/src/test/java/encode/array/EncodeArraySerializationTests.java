// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package encode.array;

import com.azure.core.util.BinaryData;
import encode.array.models.CommaDelimitedArrayProperty;
import java.util.LinkedList;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class EncodeArraySerializationTests {

    @Test
    public void testNull() {
        CommaDelimitedArrayProperty model = new CommaDelimitedArrayProperty(null);
        Assertions.assertEquals("{}", BinaryData.fromObject(model).toString());

        model = BinaryData.fromString("{}").toObject(CommaDelimitedArrayProperty.class);
        Assertions.assertNull(model.getValue());
    }

    @Test
    public void testEmptyStringOnWire() {
        CommaDelimitedArrayProperty model = new CommaDelimitedArrayProperty(List.of());
        Assertions.assertEquals("{\"value\":\"\"}", BinaryData.fromObject(model).toString());

        model = BinaryData.fromString("{\"value\":\"\"}").toObject(CommaDelimitedArrayProperty.class);
        Assertions.assertEquals(0, model.getValue().size());
    }

    @Test
    public void testEmptyElement() {
        CommaDelimitedArrayProperty model = new CommaDelimitedArrayProperty(List.of("", ""));
        Assertions.assertEquals("{\"value\":\",\"}", BinaryData.fromObject(model).toString());

        model = BinaryData.fromString("{\"value\":\",\"}").toObject(CommaDelimitedArrayProperty.class);
        Assertions.assertEquals(2, model.getValue().size());
    }

    @Test
    public void testNullElement() {
        List<String> list = new LinkedList<>();
        list.add("data1");
        list.add(null);
        list.add("data2");

        CommaDelimitedArrayProperty model = new CommaDelimitedArrayProperty(list);
        Assertions.assertEquals("{\"value\":\"data1,,data2\"}", BinaryData.fromObject(model).toString());
    }
}
