package versioning.typechangedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The TestModel model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class TestModel implements JsonSerializable<TestModel> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final String prop;

    /*
     * The changedProp property.
     */
    @Metadata(generated = true)
    private final String changedProp;

    /**
     * Creates an instance of TestModel class.
     * 
     * @param prop the prop value to set.
     * @param changedProp the changedProp value to set.
     */
    @Metadata(generated = true)
    public TestModel(String prop, String changedProp) {
        this.prop = prop;
        this.changedProp = changedProp;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public String getProp() {
        return this.prop;
    }

    /**
     * Get the changedProp property: The changedProp property.
     * 
     * @return the changedProp value.
     */
    @Metadata(generated = true)
    public String getChangedProp() {
        return this.changedProp;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("prop", this.prop);
        jsonWriter.writeStringField("changedProp", this.changedProp);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of TestModel from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of TestModel if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the TestModel.
     */
    @Metadata(generated = true)
    public static TestModel fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String prop = null;
            String changedProp = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = reader.getString();
                } else if ("changedProp".equals(fieldName)) {
                    changedProp = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            return new TestModel(prop, changedProp);
        });
    }
}
