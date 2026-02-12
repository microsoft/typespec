// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.xml;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class XmlTests {

    @Test
    public void testSimpleModel() {
        SimpleModelValueClient client = new XmlClientBuilder().buildSimpleModelValueClient();

        client.put(new SimpleModel("foo", 123));

        SimpleModel model = client.get();
        Assertions.assertEquals("foo", model.getName());
        Assertions.assertEquals(123, model.getAge());
    }

    @Test
    public void testModelWithSimpleArrays() {
        ModelWithSimpleArraysValueClient client = new XmlClientBuilder().buildModelWithSimpleArraysValueClient();

        client.put(new ModelWithSimpleArrays(List.of("red", "green", "blue"), List.of(1, 2)));

        ModelWithSimpleArrays model = client.get();
        Assertions.assertEquals(List.of("red", "green", "blue"), model.getColors());
        Assertions.assertEquals(List.of(1, 2), model.getCounts());
    }

    @Test
    public void testModelWithArrayOfModel() {
        ModelWithArrayOfModelValueClient client = new XmlClientBuilder().buildModelWithArrayOfModelValueClient();

        client.put(new ModelWithArrayOfModel(List.of(new SimpleModel("foo", 123), new SimpleModel("bar", 456))));

        ModelWithArrayOfModel model = client.get();
        Assertions.assertEquals(2, model.getItems().size());
        Assertions.assertEquals("foo", model.getItems().get(0).getName());
        Assertions.assertEquals(123, model.getItems().get(0).getAge());
        Assertions.assertEquals("bar", model.getItems().get(1).getName());
        Assertions.assertEquals(456, model.getItems().get(1).getAge());
    }

    @Test
    public void testModelWithOptionalField() {
        ModelWithOptionalFieldValueClient client = new XmlClientBuilder().buildModelWithOptionalFieldValueClient();

        client.put(new ModelWithOptionalField("widget"));

        ModelWithOptionalField model = client.get();
        Assertions.assertEquals("widget", model.getItem());
    }

    @Test
    public void testModelWithAttributes() {
        ModelWithAttributesValueClient client = new XmlClientBuilder().buildModelWithAttributesValueClient();

        client.put(new ModelWithAttributes(123, "foo", true));

        ModelWithAttributes model = client.get();
        Assertions.assertEquals(123, model.getId1());
        Assertions.assertEquals("foo", model.getId2());
        Assertions.assertEquals(true, model.isEnabled());
    }

    @Test
    public void testModelWithUnwrappedArray() {
        ModelWithUnwrappedArrayValueClient client = new XmlClientBuilder().buildModelWithUnwrappedArrayValueClient();

        client.put(new ModelWithUnwrappedArray(List.of("red", "green", "blue"), List.of(1, 2)));

        ModelWithUnwrappedArray model = client.get();
        Assertions.assertEquals(List.of("red", "green", "blue"), model.getColors());
        Assertions.assertEquals(List.of(1, 2), model.getCounts());
    }

    @Test
    public void testModelWithRenamedArrays() {
        ModelWithRenamedArraysValueClient client = new XmlClientBuilder().buildModelWithRenamedArraysValueClient();

        client.put(new ModelWithRenamedArrays(List.of("red", "green", "blue"), List.of(1, 2)));

        ModelWithRenamedArrays model = client.get();
        Assertions.assertEquals(List.of("red", "green", "blue"), model.getColors());
        Assertions.assertEquals(List.of(1, 2), model.getCounts());
    }

    @Test
    public void testModelWithRenamedFields() {
        ModelWithRenamedFieldsValueClient client = new XmlClientBuilder().buildModelWithRenamedFieldsValueClient();

        client.put(new ModelWithRenamedFields(new SimpleModel("foo", 123), new SimpleModel("bar", 456)));

        ModelWithRenamedFields model = client.get();
        Assertions.assertEquals("foo", model.getInputData().getName());
        Assertions.assertEquals(123, model.getInputData().getAge());
        Assertions.assertEquals("bar", model.getOutputData().getName());
        Assertions.assertEquals(456, model.getOutputData().getAge());
    }

    @Test
    public void testModelWithEmptyArray() {
        ModelWithEmptyArrayValueClient client = new XmlClientBuilder().buildModelWithEmptyArrayValueClient();

        client.put(new ModelWithEmptyArray(Collections.emptyList()));

        ModelWithEmptyArray model = client.get();
        Assertions.assertTrue(model.getItems() == null || model.getItems().isEmpty());
    }

    @Test
    public void testModelWithText() {
        ModelWithTextValueClient client = new XmlClientBuilder().buildModelWithTextValueClient();

        client.put(new ModelWithText("foo", "\n  This is some text.\n"));

        ModelWithText model = client.get();
        Assertions.assertEquals("foo", model.getLanguage());
        Assertions.assertEquals("\n  This is some text.\n", model.getContent());
    }

    @Test
    public void testModelWithDictionary() {
        ModelWithDictionaryValueClient client = new XmlClientBuilder().buildModelWithDictionaryValueClient();

        client.put(new ModelWithDictionary(Map.of("Color", "blue", "Count", "123", "Enabled", "false")));

        ModelWithDictionary model = client.get();
        Assertions.assertEquals("blue", model.getMetadata().get("Color"));
        Assertions.assertEquals("123", model.getMetadata().get("Count"));
        Assertions.assertEquals("false", model.getMetadata().get("Enabled"));
    }

    @Test
    public void testModelWithEncodedNames() {
        ModelWithEncodedNamesValueClient client = new XmlClientBuilder().buildModelWithEncodedNamesValueClient();

        client.put(new ModelWithEncodedNames(new SimpleModel("foo", 123), List.of("red", "green", "blue")));

        ModelWithEncodedNames model = client.get();
        Assertions.assertEquals("foo", model.getModelData().getName());
        Assertions.assertEquals(123, model.getModelData().getAge());
        Assertions.assertEquals(List.of("red", "green", "blue"), model.getColors());
    }
}
