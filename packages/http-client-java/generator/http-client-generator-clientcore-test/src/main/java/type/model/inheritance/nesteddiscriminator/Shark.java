package type.model.inheritance.nesteddiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The second level model in polymorphic multiple levels inheritance and it defines a new discriminator.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public class Shark extends Fish {
    /*
     * Discriminator property for Fish.
     */
    @Metadata(generated = true)
    private String kind = "shark";

    /*
     * The sharktype property.
     */
    @Metadata(generated = true)
    private String sharktype = "shark";

    /**
     * Creates an instance of Shark class.
     * 
     * @param age the age value to set.
     */
    @Metadata(generated = true)
    public Shark(int age) {
        super(age);
    }

    /**
     * Get the kind property: Discriminator property for Fish.
     * 
     * @return the kind value.
     */
    @Metadata(generated = true)
    @Override
    public String getKind() {
        return this.kind;
    }

    /**
     * Get the sharktype property: The sharktype property.
     * 
     * @return the sharktype value.
     */
    @Metadata(generated = true)
    public String getSharktype() {
        return this.sharktype;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("kind", this.kind);
        jsonWriter.writeIntField("age", getAge());
        jsonWriter.writeStringField("sharktype", this.sharktype);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Shark from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Shark if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Shark.
     */
    @Metadata(generated = true)
    public static Shark fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String discriminatorValue = null;
            try (JsonReader readerToUse = reader.bufferObject()) {
                readerToUse.nextToken(); // Prepare for reading
                while (readerToUse.nextToken() != JsonToken.END_OBJECT) {
                    String fieldName = readerToUse.getFieldName();
                    readerToUse.nextToken();
                    if ("sharktype".equals(fieldName)) {
                        discriminatorValue = readerToUse.getString();
                        break;
                    } else {
                        readerToUse.skipChildren();
                    }
                }
                // Use the discriminator value to determine which subtype should be deserialized.
                if ("saw".equals(discriminatorValue)) {
                    return SawShark.fromJson(readerToUse.reset());
                } else if ("goblin".equals(discriminatorValue)) {
                    return GoblinShark.fromJson(readerToUse.reset());
                } else {
                    return fromJsonKnownDiscriminator(readerToUse.reset());
                }
            }
        });
    }

    @Metadata(generated = true)
    static Shark fromJsonKnownDiscriminator(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int age = 0;
            String sharktype = "shark";
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("age".equals(fieldName)) {
                    age = reader.getInt();
                } else if ("sharktype".equals(fieldName)) {
                    sharktype = reader.getString();
                } else {
                    reader.skipChildren();
                }
            }
            Shark deserializedShark = new Shark(age);
            deserializedShark.sharktype = sharktype;

            return deserializedShark;
        });
    }
}
