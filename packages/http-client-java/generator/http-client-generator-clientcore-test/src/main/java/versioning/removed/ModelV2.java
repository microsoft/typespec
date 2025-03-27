package versioning.removed;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The ModelV2 model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class ModelV2 implements JsonSerializable<ModelV2> {
    /*
     * The prop property.
     */
    @Metadata(generated = true)
    private final String prop;

    /*
     * The enumProp property.
     */
    @Metadata(generated = true)
    private final EnumV2 enumProp;

    /*
     * The unionProp property.
     */
    @Metadata(generated = true)
    private final BinaryData unionProp;

    /**
     * Creates an instance of ModelV2 class.
     * 
     * @param prop the prop value to set.
     * @param enumProp the enumProp value to set.
     * @param unionProp the unionProp value to set.
     */
    @Metadata(generated = true)
    public ModelV2(String prop, EnumV2 enumProp, BinaryData unionProp) {
        this.prop = prop;
        this.enumProp = enumProp;
        this.unionProp = unionProp;
    }

    /**
     * Get the prop property: The prop property.
     * 
     * @return the prop value.
     */
    @Metadata(generated = true)
    public String getProp() {
        return this.prop;
    }

    /**
     * Get the enumProp property: The enumProp property.
     * 
     * @return the enumProp value.
     */
    @Metadata(generated = true)
    public EnumV2 getEnumProp() {
        return this.enumProp;
    }

    /**
     * Get the unionProp property: The unionProp property.
     * 
     * @return the unionProp value.
     */
    @Metadata(generated = true)
    public BinaryData getUnionProp() {
        return this.unionProp;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("prop", this.prop);
        jsonWriter.writeStringField("enumProp", this.enumProp == null ? null : this.enumProp.toString());
        jsonWriter.writeFieldName("unionProp");
        this.unionProp.writeTo(jsonWriter);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ModelV2 from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ModelV2 if the JsonReader was pointing to an instance of it, or null if it was pointing to
     * JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ModelV2.
     */
    @Metadata(generated = true)
    public static ModelV2 fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String prop = null;
            EnumV2 enumProp = null;
            BinaryData unionProp = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("prop".equals(fieldName)) {
                    prop = reader.getString();
                } else if ("enumProp".equals(fieldName)) {
                    enumProp = EnumV2.fromString(reader.getString());
                } else if ("unionProp".equals(fieldName)) {
                    unionProp = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else {
                    reader.skipChildren();
                }
            }
            return new ModelV2(prop, enumProp, unionProp);
        });
    }
}
