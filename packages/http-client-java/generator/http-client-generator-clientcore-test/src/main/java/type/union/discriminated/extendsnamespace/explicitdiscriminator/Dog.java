package type.union.discriminated.extendsnamespace.explicitdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Dog model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class Dog extends PetBase {
    /*
     * The kind property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String kind = "dog";

    /*
     * The bark property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final boolean bark;

    /**
     * Creates an instance of Dog class.
     * 
     * @param name the name value to set.
     * @param bark the bark value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Dog(String name, boolean bark) {
        super(name);
        this.bark = bark;
    }

    /**
     * Get the kind property: The kind property.
     * 
     * @return the kind value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the bark property: The bark property.
     * 
     * @return the bark value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public boolean isBark() {
        return this.bark;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("name", getName());
        jsonWriter.writeBooleanField("bark", this.bark);
        jsonWriter.writeStringField("kind", this.kind);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    public static Dog fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String name = null;
            boolean bark = false;
            String kind = "dog";
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("name".equals(fieldName)) {
                    name = reader.getString();
                } else if ("bark".equals(fieldName)) {
                    bark = reader.getBoolean();
                } else if ("kind".equals(fieldName)) {
                    kind = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Dog deserializedDog = new Dog(name, bark);
            deserializedDog.kind = kind;

            return deserializedDog;
        });
    }
}
