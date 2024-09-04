package com.cadl.armstreamstyleserialization;

import com.azure.core.management.serializer.SerializerFactory;
import com.azure.core.util.BinaryData;
import com.azure.core.util.serializer.SerializerAdapter;
import com.azure.core.util.serializer.SerializerEncoding;
import com.azure.json.JsonProviders;
import com.azure.json.JsonWriter;
import com.cadl.armstreamstyleserialization.models.Error;
import com.cadl.armstreamstyleserialization.models.SawShark;
import com.cadl.armstreamstyleserialization.models.Shark;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.StringWriter;

public class StreamStyleSerializationTests {
    @Test
    public void testDuplicatePropertiesSerialization() throws IOException {
        // SawShark has "age" property in both itself, and its parent "Fish".
        int age = 10;
        SawShark model = new SawShark().withAge(age).withDna("upi");
        StringWriter stringWriter = new StringWriter();
        JsonWriter jsonWriter = JsonProviders.createWriter(stringWriter);
        model.toJson(jsonWriter);
        jsonWriter.flush();
        model = BinaryData.fromString(stringWriter.toString())
                .toObject(SawShark.class);
        Assertions.assertEquals(age, model.age());
    }

    @Test
    public void testManagementErrorDeserialization() throws IOException {
        final String errorBodyWithError = "{\"error\":{\"code\":\"WepAppError\",\"message\":\"Web app error.\",\"additionalProperty\":\"Deployment error.\",\"details\":[{\"code\":\"InnerError\", \"additionalProperty\": \"nested\"}]}}";
        final String errorBodyWithoutError = "{\"code\":\"WepAppError\",\"message\":\"Web app error.\",\"additionalProperty\":\"Deployment error.\",\"details\":[{\"code\":\"InnerError\", \"additionalProperty\": \"nested\"}]}";
        SerializerAdapter serializerAdapter = SerializerFactory.createDefaultManagementSerializerAdapter();
        Error error = serializerAdapter.deserialize(errorBodyWithError, Error.class, SerializerEncoding.JSON);
        Assertions.assertEquals("WepAppError", error.getCode());
        Assertions.assertEquals("Deployment error.", error.getAdditionalProperty());
        Assertions.assertEquals("nested", error.getDetails().iterator().next().getAdditionalProperty());

        error = serializerAdapter.deserialize(errorBodyWithoutError, Error.class, SerializerEncoding.JSON);
        Assertions.assertEquals("WepAppError", error.getCode());
        Assertions.assertEquals("Deployment error.", error.getAdditionalProperty());
        Assertions.assertEquals("nested", error.getDetails().iterator().next().getAdditionalProperty());
    }

    @Test
    public void testValidate() {
        Shark shark = new Shark();
        Assertions.assertThrows(IllegalArgumentException.class, shark::validate);

        shark.withAge(1);
        shark.withRequiredString("any");
        Assertions.assertThrows(IllegalArgumentException.class, shark::validate);

        shark.withRequiredStringAnotherPropertiesRequiredString("any");
        shark.validate();
    }
}
