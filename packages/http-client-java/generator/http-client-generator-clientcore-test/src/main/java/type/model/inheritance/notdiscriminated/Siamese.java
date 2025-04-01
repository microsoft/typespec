package type.model.inheritance.notdiscriminated;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The third level model in the normal multiple levels inheritance.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Siamese extends Cat {
    /*
     * The smart property.
     */
    @Metadata(generated = true)
    private final boolean smart;

    /**
     * Creates an instance of Siamese class.
     * 
     * @param name the name value to set.
     * @param age the age value to set.
     * @param smart the smart value to set.
     */
    @Metadata(generated = true)
    public Siamese(String name, int age, boolean smart) {
        super(name, age);
        this.smart = smart;
    }

    /**
     * Get the smart property: The smart property.
     * 
     * @return the smart value.
     */
    @Metadata(generated = true)
    public boolean isSmart() {
        return this.smart;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", getName());
        jsonWriter.writeIntField("age", getAge());
        jsonWriter.writeBooleanField("smart", this.smart);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Siamese from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Siamese if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Siamese.
     */
    @Metadata(generated = true)
    public static Siamese fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            int age = 0;
            boolean smart = false;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("age".equals(fieldName)) {
                    age = reader.getInt();
                } else if ("smart".equals(fieldName)) {
                    smart = reader.getBoolean();
                } else {
                    reader.skipChildren();
                }
            }
            return new Siamese(name, age, smart);
        });
    }
}
