package type.model.inheritance.nesteddiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The third level model GoblinShark in polymorphic multiple levels inheritance.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class GoblinShark extends Shark {
    /*
     * Discriminator property for Fish.
     */
    @Metadata(generated = true)
    private String kind = "shark";

    /*
     * The sharktype property.
     */
    @Metadata(generated = true)
    private String sharktype = "goblin";

    /**
     * Creates an instance of GoblinShark class.
     * 
     * @param age the age value to set.
     */
    @Metadata(generated = true)
    public GoblinShark(int age) {
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
    @Override
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
     * Reads an instance of GoblinShark from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of GoblinShark if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the GoblinShark.
     */
    @Metadata(generated = true)
    public static GoblinShark fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            int age = 0;
            String sharktype = "goblin";
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
            GoblinShark deserializedGoblinShark = new GoblinShark(age);
            deserializedGoblinShark.sharktype = sharktype;

            return deserializedGoblinShark;
        });
    }
}
