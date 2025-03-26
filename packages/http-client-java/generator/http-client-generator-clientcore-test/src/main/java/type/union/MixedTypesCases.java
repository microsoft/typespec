package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.util.List;

/**
 * The MixedTypesCases model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class MixedTypesCases implements JsonSerializable<MixedTypesCases> {
    /*
     * This should be receive/send the Cat variant
     */
    @Metadata(generated = true)
    private final BinaryData model;

    /*
     * This should be receive/send the "a" variant
     */
    @Metadata(generated = true)
    private final BinaryData literal;

    /*
     * This should be receive/send the int variant
     */
    @Metadata(generated = true)
    private final BinaryData intProperty;

    /*
     * This should be receive/send the boolean variant
     */
    @Metadata(generated = true)
    private final BinaryData booleanProperty;

    /*
     * This should be receive/send 4 element with Cat, "a", int, and boolean
     */
    @Metadata(generated = true)
    private final List<BinaryData> array;

    /**
     * Creates an instance of MixedTypesCases class.
     * 
     * @param model the model value to set.
     * @param literal the literal value to set.
     * @param intProperty the intProperty value to set.
     * @param booleanProperty the booleanProperty value to set.
     * @param array the array value to set.
     */
    @Metadata(generated = true)
    public MixedTypesCases(BinaryData model, BinaryData literal, BinaryData intProperty, BinaryData booleanProperty,
        List<BinaryData> array) {
        this.model = model;
        this.literal = literal;
        this.intProperty = intProperty;
        this.booleanProperty = booleanProperty;
        this.array = array;
    }

    /**
     * Get the model property: This should be receive/send the Cat variant.
     * 
     * @return the model value.
     */
    @Metadata(generated = true)
    public BinaryData getModel() {
        return this.model;
    }

    /**
     * Get the literal property: This should be receive/send the "a" variant.
     * 
     * @return the literal value.
     */
    @Metadata(generated = true)
    public BinaryData getLiteral() {
        return this.literal;
    }

    /**
     * Get the intProperty property: This should be receive/send the int variant.
     * 
     * @return the intProperty value.
     */
    @Metadata(generated = true)
    public BinaryData getIntProperty() {
        return this.intProperty;
    }

    /**
     * Get the booleanProperty property: This should be receive/send the boolean variant.
     * 
     * @return the booleanProperty value.
     */
    @Metadata(generated = true)
    public BinaryData getBooleanProperty() {
        return this.booleanProperty;
    }

    /**
     * Get the array property: This should be receive/send 4 element with Cat, "a", int, and boolean.
     * 
     * @return the array value.
     */
    @Metadata(generated = true)
    public List<BinaryData> getArray() {
        return this.array;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeFieldName("model");
        this.model.writeTo(jsonWriter);
        jsonWriter.writeFieldName("literal");
        this.literal.writeTo(jsonWriter);
        jsonWriter.writeFieldName("int");
        this.intProperty.writeTo(jsonWriter);
        jsonWriter.writeFieldName("boolean");
        this.booleanProperty.writeTo(jsonWriter);
        jsonWriter.writeArrayField("array", this.array,
            (writer, element) -> writer.writeUntyped(element == null ? null : element.toObject(Object.class)));
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of MixedTypesCases from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of MixedTypesCases if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the MixedTypesCases.
     */
    @Metadata(generated = true)
    public static MixedTypesCases fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BinaryData model = null;
            BinaryData literal = null;
            BinaryData intProperty = null;
            BinaryData booleanProperty = null;
            List<BinaryData> array = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("model".equals(fieldName)) {
                    model = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("literal".equals(fieldName)) {
                    literal = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("int".equals(fieldName)) {
                    intProperty
                        = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("boolean".equals(fieldName)) {
                    booleanProperty
                        = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("array".equals(fieldName)) {
                    array = reader.readArray(reader1 -> reader1
                        .getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped())));
                } else {
                    reader.skipChildren();
                }
            }
            return new MixedTypesCases(model, literal, intProperty, booleanProperty, array);
        });
    }
}
