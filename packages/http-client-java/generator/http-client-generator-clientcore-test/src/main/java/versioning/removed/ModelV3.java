package versioning.removed;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The ModelV3 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class ModelV3 implements JsonSerializable<ModelV3> {
    /*
     * The id property.
     */
    @Metadata(generated = true)
    private final String id;

    /*
     * The enumProp property.
     */
    @Metadata(generated = true)
    private final EnumV3 enumProp;

    /**
     * Creates an instance of ModelV3 class.
     * 
     * @param id the id value to set.
     * @param enumProp the enumProp value to set.
     */
    @Metadata(generated = true)
    public ModelV3(String id, EnumV3 enumProp) {
        this.id = id;
        this.enumProp = enumProp;
    }

    /**
     * Get the id property: The id property.
     * 
     * @return the id value.
     */
    @Metadata(generated = true)
    public String getId() {
        return this.id;
    }

    /**
     * Get the enumProp property: The enumProp property.
     * 
     * @return the enumProp value.
     */
    @Metadata(generated = true)
    public EnumV3 getEnumProp() {
        return this.enumProp;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("id", this.id);
        jsonWriter.writeStringField("enumProp", this.enumProp == null ? null : this.enumProp.toString());
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ModelV3 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ModelV3 if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ModelV3.
     */
    @Metadata(generated = true)
    public static ModelV3 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String id = null;
            EnumV3 enumProp = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("id".equals(fieldName)) {
                    id = reader.getString();
                } else if ("enumProp".equals(fieldName)) {
                    enumProp = EnumV3.fromString(reader.getString());
                } else {
                    reader.skipChildren();
                }
            }
            return new ModelV3(id, enumProp);
        });
    }
}
