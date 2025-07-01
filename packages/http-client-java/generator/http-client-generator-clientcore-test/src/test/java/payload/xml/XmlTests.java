// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.xml;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

public final class XmlTests {

    @Test
    public void testSimpleModel() {
        SimpleModelValueClient client = new XmlClientBuilder().buildSimpleModelValueClient();

        client.put(new SimpleModel("foo", 123));

//        SimpleModel model = client.get();
//        Assertions.assertEquals("foo", model.getName());
//        Assertions.assertEquals(123, model.getAge());
    }

    @Test
    public void testModelWithSimpleArrays() {
        ModelWithSimpleArraysValueClient client = new XmlClientBuilder().buildModelWithSimpleArraysValueClient();

        client.put(new ModelWithSimpleArrays(List.of("red", "green", "blue"), List.of(1, 2)));
    }

    @Test
    public void testModelWithArrayOfModel() {
        ModelWithArrayOfModelValueClient client = new XmlClientBuilder().buildModelWithArrayOfModelValueClient();

        client.put(new ModelWithArrayOfModel(List.of(new SimpleModel("foo", 123), new SimpleModel("bar", 456))));
    }

    @Test
    public void testModelWithOptionalField() {
        ModelWithOptionalFieldValueClient client = new XmlClientBuilder().buildModelWithOptionalFieldValueClient();

        client.put(new ModelWithOptionalField("widget"));
    }

    @Test
    public void testModelWithAttributes() {
        ModelWithAttributesValueClient client = new XmlClientBuilder().buildModelWithAttributesValueClient();

        client.put(new ModelWithAttributes(123, "foo", true));
    }

    @Test
    public void testModelWithUnwrappedArray() {
        ModelWithUnwrappedArrayValueClient client = new XmlClientBuilder().buildModelWithUnwrappedArrayValueClient();

        client.put(new ModelWithUnwrappedArray(List.of("red", "green", "blue"), List.of(1, 2)));
    }

    @Test
    public void testModelWithRenamedArrays() {
        ModelWithRenamedArraysValueClient client = new XmlClientBuilder().buildModelWithRenamedArraysValueClient();

        client.put(new ModelWithRenamedArrays(List.of("red", "green", "blue"), List.of(1, 2)));
    }

    @Test
    public void testModelWithRenamedFields() {
        ModelWithRenamedFieldsValueClient client = new XmlClientBuilder().buildModelWithRenamedFieldsValueClient();

        client.put(new ModelWithRenamedFields(new SimpleModel("foo", 123), new SimpleModel("bar", 456)));
    }

    @Test
    public void testModelWithEmptyArray() {
        ModelWithEmptyArrayValueClient client = new XmlClientBuilder().buildModelWithEmptyArrayValueClient();

        client.put(new ModelWithEmptyArray(Collections.emptyList()));
    }

    @Test
    public void testModelWithText() {
        ModelWithTextValueClient client = new XmlClientBuilder().buildModelWithTextValueClient();

        client.put(new ModelWithText("foo", "\n  This is some text.\n"));
    }

    @Test
    public void testModelWithDictionary() {
        ModelWithDictionaryValueClient client = new XmlClientBuilder().buildModelWithDictionaryValueClient();

        client.put(new ModelWithDictionary(Map.of("Color", "blue", "Count", "123", "Enabled", "false")));
    }

    @Test
    public void testModelWithEncodedNames() {
        ModelWithEncodedNamesValueClient client = new XmlClientBuilder().buildModelWithEncodedNamesValueClient();

        client.put(new ModelWithEncodedNames(new SimpleModel("foo", 123), List.of("red", "green", "blue")));
    }
}
