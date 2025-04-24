package type.model.inheritance.singlediscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The second level model in polymorphic single level inheritance.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Sparrow extends Bird {
    /*
     * The kind property.
     */
    @Metadata(generated = true)
    private String kind = "sparrow";

    /**
     * Creates an instance of Sparrow class.
     * 
     * @param wingspan the wingspan value to set.
     */
    @Metadata(generated = true)
    public Sparrow(int wingspan) {
        super(wingspan);
    }

    /**
     * Get the kind property: The kind property.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    @Override
    public String getKind() {
        return this.kind;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("wingspan", getWingspan());
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Sparrow from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Sparrow if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Sparrow.
     */
    @Metadata(generated = true)
    public static Sparrow fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int wingspan = 0;
            String kind = "sparrow";
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("wingspan".equals(fieldName)) {
                    wingspan = reader.getInt();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Sparrow deserializedSparrow = new Sparrow(wingspan);
            deserializedSparrow.kind = kind;

            return deserializedSparrow;
        });
    }
}
