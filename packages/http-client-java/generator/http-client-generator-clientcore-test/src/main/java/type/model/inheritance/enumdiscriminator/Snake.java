package type.model.inheritance.enumdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Test fixed enum type for discriminator.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public class Snake implements JsonSerializable<Snake> {
    /*
     * discriminator property
     */
    @Metadata(generated = true)
    private SnakeKind kind;

    /*
     * Length of the snake
     */
    @Metadata(generated = true)
    private final int length;

    /**
     * Creates an instance of Snake class.
     * 
     * @param length the length value to set.
     */
    @Metadata(generated = true)
    public Snake(int length) {
        this.length = length;
    }

    /**
     * Get the kind property: discriminator property.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    public SnakeKind getKind() {
        return this.kind;
    }

    /**
     * Get the length property: Length of the snake.
     * 
     * @return the length value.
     */
    @Metadata(generated = true)
    public int getLength() {
        return this.length;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("length", this.length);
        jsonWriter.writeStringField("kind", this.kind == null ? null : this.kind.toString());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Snake from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Snake if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Snake.
     */
    @Metadata(generated = true)
    public static Snake fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String discriminatorValue = null;
            try (JsonReader readerToUse = reader.bufferObject()) {
                readerToUse.nextToken(); // Prepare for reading
                while (readerToUse.nextToken() != JsonToken.END_OBJECT) {
                    String fieldName = readerToUse.getFieldName();
                    readerToUse.nextToken();
                    if ("kind".equals(fieldName)) {
                        discriminatorValue = readerToUse.getString();
                        break;
                    } else {
                        readerToUse.skipChildren();
                    }
                }
                // Use the discriminator value to determine which subtype should be deserialized.
                if ("cobra".equals(discriminatorValue)) {
                    return Cobra.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(generated = true)
    static Snake fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int length = 0;
            SnakeKind kind = null;
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
            Snake deserializedSnake = new Snake(length);
            deserializedSnake.kind = kind;

            return deserializedSnake;
        });
    }
}
