package type.model.inheritance.nesteddiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * This is base model for polymorphic multiple levels inheritance with a discriminator.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public class Fish implements JsonSerializable<Fish> {
    /*
     * Discriminator property for Fish.
     */
    @Metadata(generated = true)
    private String kind = "Fish";

    /*
     * The age property.
     */
    @Metadata(generated = true)
    private final int age;

    /**
     * Creates an instance of Fish class.
     * 
     * @param age the age value to set.
     */
    @Metadata(generated = true)
    public Fish(int age) {
        this.age = age;
    }

    /**
     * Get the kind property: Discriminator property for Fish.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the age property: The age property.
     * 
     * @return the age value.
     */
    @Metadata(generated = true)
    public int getAge() {
        return this.age;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("age", this.age);
        jsonWriter.writeStringField("kind", this.kind);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Fish from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Fish if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Fish.
     */
    @Metadata(generated = true)
    public static Fish fromJson(JsonReader jsonReader) throws IOException {
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
                if ("shark".equals(discriminatorValue)) {
                    return Shark.fromJson(readerToUse.reset());
                } else if ("salmon".equals(discriminatorValue)) {
                    return Salmon.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(generated = true)
    static Fish fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int age = 0;
            String kind = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("age".equals(fieldName)) {
                    age = reader.getInt();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Fish deserializedFish = new Fish(age);
            deserializedFish.kind = kind;

            return deserializedFish;
        });
    }
}
