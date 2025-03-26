package type.model.inheritance.singlediscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * This is base model for polymorphic single level inheritance with a discriminator.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public class Bird implements JsonSerializable<Bird> {
    /*
     * The kind property.
     */
    @Metadata(generated = true)
    private String kind = "Bird";

    /*
     * The wingspan property.
     */
    @Metadata(generated = true)
    private final int wingspan;

    /**
     * Creates an instance of Bird class.
     * 
     * @param wingspan the wingspan value to set.
     */
    @Metadata(generated = true)
    public Bird(int wingspan) {
        this.wingspan = wingspan;
    }

    /**
     * Get the kind property: The kind property.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the wingspan property: The wingspan property.
     * 
     * @return the wingspan value.
     */
    @Metadata(generated = true)
    public int getWingspan() {
        return this.wingspan;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("wingspan", this.wingspan);
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Bird from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Bird if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Bird.
     */
    @Metadata(generated = true)
    public static Bird fromJson(JsonReader jsonReader) throws IOException {
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
                if ("seagull".equals(discriminatorValue)) {
                    return SeaGull.fromJson(readerToUse.reset());
                } else if ("sparrow".equals(discriminatorValue)) {
                    return Sparrow.fromJson(readerToUse.reset());
                } else if ("goose".equals(discriminatorValue)) {
                    return Goose.fromJson(readerToUse.reset());
                } else if ("eagle".equals(discriminatorValue)) {
                    return Eagle.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(generated = true)
    static Bird fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int wingspan = 0;
            String kind = null;
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
            Bird deserializedBird = new Bird(wingspan);
            deserializedBird.kind = kind;

            return deserializedBird;
        });
    }
}
