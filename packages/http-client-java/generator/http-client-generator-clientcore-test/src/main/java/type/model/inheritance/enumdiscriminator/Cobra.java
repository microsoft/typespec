package type.model.inheritance.enumdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Cobra model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Cobra extends Snake {
    /*
     * discriminator property
     */
    @Metadata(generated = true)
    private SnakeKind kind = SnakeKind.COBRA;

    /**
     * Creates an instance of Cobra class.
     * 
     * @param length the length value to set.
     */
    @Metadata(generated = true)
    public Cobra(int length) {
        super(length);
    }

    /**
     * Get the kind property: discriminator property.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    @Override
    public SnakeKind getKind() {
        return this.kind;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("length", getLength());
        jsonWriter.writeStringField("kind", this.kind == null ? null : this.kind.toString());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Cobra from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Cobra if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Cobra.
     */
    @Metadata(generated = true)
    public static Cobra fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int length = 0;
            SnakeKind kind = SnakeKind.COBRA;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("length".equals(fieldName)) {
                    length = reader.getInt();
                } else if ("kind".equals(fieldName)) {
                    kind = SnakeKind.fromString(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            Cobra deserializedCobra = new Cobra(length);
            deserializedCobra.kind = kind;

            return deserializedCobra;
        });
    }
}
