package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;
import java.math.BigDecimal;

/**
 * Model with a decimal128 property.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Decimal128Property implements JsonSerializable<Decimal128Property> {
    /*
     * Property
     */
    @Metadata(generated = true)
    private final BigDecimal property;

    /**
     * Creates an instance of Decimal128Property class.
     * 
     * @param property the property value to set.
     */
    @Metadata(generated = true)
    public Decimal128Property(BigDecimal property) {
        this.property = property;
    }

    /**
     * Get the property property: Property.
     * 
     * @return the property value.
     */
    @Metadata(generated = true)
    public BigDecimal getProperty() {
        return this.property;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeNumberField("property", this.property);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Decimal128Property from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Decimal128Property if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Decimal128Property.
     */
    @Metadata(generated = true)
    public static Decimal128Property fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BigDecimal property = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("property".equals(fieldName)) {
                    property = reader.getNullable(nonNullReader -> new BigDecimal(nonNullReader.getString()));
                } else {
                    reader.skipChildren();
                }
            }
            return new Decimal128Property(property);
        });
    }
}
