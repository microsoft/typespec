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
public final class SeaGull extends Bird {
    /*
     * The kind property.
     */
    @Metadata(generated = true)
    private String kind = "seagull";

    /**
     * Creates an instance of SeaGull class.
     * 
     * @param wingspan the wingspan value to set.
     */
    @Metadata(generated = true)
    public SeaGull(int wingspan) {
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
     * Reads an instance of SeaGull from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of SeaGull if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the SeaGull.
     */
    @Metadata(generated = true)
    public static SeaGull fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int wingspan = 0;
            String kind = "seagull";
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
            SeaGull deserializedSeaGull = new SeaGull(wingspan);
            deserializedSeaGull.kind = kind;

            return deserializedSeaGull;
        });
    }
}
