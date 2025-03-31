package type.model.inheritance.singlediscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Define a base class in the legacy way. Discriminator property is not explicitly defined in the model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public class Dinosaur implements JsonSerializable<Dinosaur> {
    /*
     * Discriminator property for Dinosaur.
     */
    @Metadata(generated = true)
    private String kind = "Dinosaur";

    /*
     * The size property.
     */
    @Metadata(generated = true)
    private final int size;

    /**
     * Creates an instance of Dinosaur class.
     * 
     * @param size the size value to set.
     */
    @Metadata(generated = true)
    protected Dinosaur(int size) {
        this.size = size;
    }

    /**
     * Get the kind property: Discriminator property for Dinosaur.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the size property: The size property.
     * 
     * @return the size value.
     */
    @Metadata(generated = true)
    public int getSize() {
        return this.size;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("size", this.size);
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Dinosaur from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Dinosaur if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Dinosaur.
     */
    @Metadata(generated = true)
    public static Dinosaur fromJson(JsonReader jsonReader) throws IOException {
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
                if ("t-rex".equals(discriminatorValue)) {
                    return TRex.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(generated = true)
    static Dinosaur fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int size = 0;
            String kind = null;
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
            Dinosaur deserializedDinosaur = new Dinosaur(size);
            deserializedDinosaur.kind = kind;

            return deserializedDinosaur;
        });
    }
}
