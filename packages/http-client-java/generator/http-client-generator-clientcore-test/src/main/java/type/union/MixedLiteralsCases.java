package type.union;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The MixedLiteralsCases model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class MixedLiteralsCases implements JsonSerializable<MixedLiteralsCases> {
    /*
     * This should be receive/send the "a" variant
     */
    @Metadata(generated = true)
    private final BinaryData stringLiteral;

    /*
     * This should be receive/send the 2 variant
     */
    @Metadata(generated = true)
    private final BinaryData intLiteral;

    /*
     * This should be receive/send the 3.3 variant
     */
    @Metadata(generated = true)
    private final BinaryData floatLiteral;

    /*
     * This should be receive/send the true variant
     */
    @Metadata(generated = true)
    private final BinaryData booleanLiteral;

    /**
     * Creates an instance of MixedLiteralsCases class.
     * 
     * @param stringLiteral the stringLiteral value to set.
     * @param intLiteral the intLiteral value to set.
     * @param floatLiteral the floatLiteral value to set.
     * @param booleanLiteral the booleanLiteral value to set.
     */
    @Metadata(generated = true)
    public MixedLiteralsCases(BinaryData stringLiteral, BinaryData intLiteral, BinaryData floatLiteral,
        BinaryData booleanLiteral) {
        this.stringLiteral = stringLiteral;
        this.intLiteral = intLiteral;
        this.floatLiteral = floatLiteral;
        this.booleanLiteral = booleanLiteral;
    }

    /**
     * Get the stringLiteral property: This should be receive/send the "a" variant.
     * 
     * @return the stringLiteral value.
     */
    @Metadata(generated = true)
    public BinaryData getStringLiteral() {
        return this.stringLiteral;
    }

    /**
     * Get the intLiteral property: This should be receive/send the 2 variant.
     * 
     * @return the intLiteral value.
     */
    @Metadata(generated = true)
    public BinaryData getIntLiteral() {
        return this.intLiteral;
    }

    /**
     * Get the floatLiteral property: This should be receive/send the 3.3 variant.
     * 
     * @return the floatLiteral value.
     */
    @Metadata(generated = true)
    public BinaryData getFloatLiteral() {
        return this.floatLiteral;
    }

    /**
     * Get the booleanLiteral property: This should be receive/send the true variant.
     * 
     * @return the booleanLiteral value.
     */
    @Metadata(generated = true)
    public BinaryData getBooleanLiteral() {
        return this.booleanLiteral;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeFieldName("stringLiteral");
        this.stringLiteral.writeTo(jsonWriter);
        jsonWriter.writeFieldName("intLiteral");
        this.intLiteral.writeTo(jsonWriter);
        jsonWriter.writeFieldName("floatLiteral");
        this.floatLiteral.writeTo(jsonWriter);
        jsonWriter.writeFieldName("booleanLiteral");
        this.booleanLiteral.writeTo(jsonWriter);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of MixedLiteralsCases from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of MixedLiteralsCases if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the MixedLiteralsCases.
     */
    @Metadata(generated = true)
    public static MixedLiteralsCases fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BinaryData stringLiteral = null;
            BinaryData intLiteral = null;
            BinaryData floatLiteral = null;
            BinaryData booleanLiteral = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("stringLiteral".equals(fieldName)) {
                    stringLiteral
                        = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("intLiteral".equals(fieldName)) {
                    intLiteral
                        = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("floatLiteral".equals(fieldName)) {
                    floatLiteral
                        = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else if ("booleanLiteral".equals(fieldName)) {
                    booleanLiteral
                        = reader.getNullable(nonNullReader -> BinaryData.fromObject(nonNullReader.readUntyped()));
                } else {
                    reader.skipChildren();
                }
            }
            return new MixedLiteralsCases(stringLiteral, intLiteral, floatLiteral, booleanLiteral);
        });
    }
}
