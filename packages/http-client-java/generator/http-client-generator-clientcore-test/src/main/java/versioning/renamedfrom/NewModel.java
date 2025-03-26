package versioning.renamedfrom;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The NewModel model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class NewModel implements JsonSerializable<NewModel> {
    /*
     * The newProp property.
     */
    @Metadata(generated = true)
    private final String newProp;

    /*
     * The enumProp property.
     */
    @Metadata(generated = true)
    private final NewEnum enumProp;

    /*
     * The unionProp property.
     */
    @Metadata(generated = true)
    private final BinaryData unionProp;

    /**
     * Creates an instance of NewModel class.
     * 
     * @param newProp the newProp value to set.
     * @param enumProp the enumProp value to set.
     * @param unionProp the unionProp value to set.
     */
    @Metadata(generated = true)
    public NewModel(String newProp, NewEnum enumProp, BinaryData unionProp) {
        this.newProp = newProp;
        this.enumProp = enumProp;
        this.unionProp = unionProp;
    }

    /**
     * Get the newProp property: The newProp property.
     * 
     * @return the newProp value.
     */
    @Metadata(generated = true)
    public String getNewProp() {
        return this.newProp;
    }

    /**
     * Get the enumProp property: The enumProp property.
     * 
     * @return the enumProp value.
     */
    @Metadata(generated = true)
    public NewEnum getEnumProp() {
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
        jsonWriter.writeStringField("newProp", this.newProp);
        jsonWriter.writeStringField("enumProp", this.enumProp == null ? null : this.enumProp.toString());
        jsonWriter.writeFieldName("unionProp");
        this.unionProp.writeTo(jsonWriter);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of NewModel from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of NewModel if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the NewModel.
     */
    @Metadata(generated = true)
    public static NewModel fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String newProp = null;
            NewEnum enumProp = null;
            BinaryData unionProp = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("newProp".equals(fieldName)) {
                    newProp = reader.getString();
                } else if ("enumProp".equals(fieldName)) {
                    enumProp = NewEnum.fromString(reader.getString());
                } else if ("unionProp".equals(fieldName)) {
                    unionProp = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else {
                    reader.skipChildren();
                }
            }
            return new NewModel(newProp, enumProp, unionProp);
        });
    }
}
