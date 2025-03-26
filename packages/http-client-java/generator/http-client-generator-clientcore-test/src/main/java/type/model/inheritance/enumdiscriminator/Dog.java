package type.model.inheritance.enumdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Test extensible enum type for discriminator.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public class Dog implements JsonSerializable<Dog> {
    /*
     * discriminator property
     */
    @Metadata(generated = true)
    private DogKind kind = DogKind.fromValue("Dog");

    /*
     * Weight of the dog
     */
    @Metadata(generated = true)
    private final int weight;

    /**
     * Creates an instance of Dog class.
     * 
     * @param weight the weight value to set.
     */
    @Metadata(generated = true)
    public Dog(int weight) {
        this.weight = weight;
    }

    /**
     * Get the kind property: discriminator property.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    public DogKind getKind() {
        return this.kind;
    }

    /**
     * Get the weight property: Weight of the dog.
     * 
     * @return the weight value.
     */
    @Metadata(generated = true)
    public int getWeight() {
        return this.weight;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeIntField("weight", this.weight);
        jsonWriter.writeStringField("kind", this.kind == null ? null : this.kind.getValue());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Dog from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Dog if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Dog.
     */
    @Metadata(generated = true)
    public static Dog fromJson(JsonReader jsonReader) throws IOException {
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
                if ("golden".equals(discriminatorValue)) {
                    return Golden.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(generated = true)
    static Dog fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int weight = 0;
            DogKind kind = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("weight".equals(fieldName)) {
                    weight = reader.getInt();
                } else if ("kind".equals(fieldName)) {
                    kind = DogKind.fromValue(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            Dog deserializedDog = new Dog(weight);
            deserializedDog.kind = kind;

            return deserializedDog;
        });
    }
}
