package type.model.inheritance.singlediscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The second level legacy model in polymorphic single level inheritance.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class TRex extends Dinosaur {
    /*
     * Discriminator property for Dinosaur.
     */
    @Metadata(generated = true)
    private String kind = "t-rex";

    /**
     * Creates an instance of TRex class.
     * 
     * @param size the size value to set.
     */
    @Metadata(generated = true)
    private TRex(int size) {
        super(size);
    }

    /**
     * Get the kind property: Discriminator property for Dinosaur.
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
        jsonWriter.writeIntField("size", getSize());
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of TRex from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of TRex if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the TRex.
     */
    @Metadata(generated = true)
    public static TRex fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int size = 0;
            String kind = "t-rex";
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("size".equals(fieldName)) {
                    size = reader.getInt();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            TRex deserializedTRex = new TRex(size);
            deserializedTRex.kind = kind;

            return deserializedTRex;
        });
    }
}
