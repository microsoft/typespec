package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * The Insurance model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class Insurance implements JsonSerializable<Insurance> {
    /*
     * The provider property.
     */
    @Metadata(generated = true)
    private final String provider;

    /*
     * The premium property.
     */
    @Metadata(generated = true)
    private final int premium;

    /*
     * The deductible property.
     */
    @Metadata(generated = true)
    private final int deductible;

    /**
     * Creates an instance of Insurance class.
     * 
     * @param provider the provider value to set.
     * @param premium the premium value to set.
     * @param deductible the deductible value to set.
     */
    @Metadata(generated = true)
    private Insurance(String provider, int premium, int deductible) {
        this.provider = provider;
        this.premium = premium;
        this.deductible = deductible;
    }

    /**
     * Get the provider property: The provider property.
     * 
     * @return the provider value.
     */
    @Metadata(generated = true)
    public String getProvider() {
        return this.provider;
    }

    /**
     * Get the premium property: The premium property.
     * 
     * @return the premium value.
     */
    @Metadata(generated = true)
    public int getPremium() {
        return this.premium;
    }

    /**
     * Get the deductible property: The deductible property.
     * 
     * @return the deductible value.
     */
    @Metadata(generated = true)
    public int getDeductible() {
        return this.deductible;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("provider", this.provider);
        jsonWriter.writeIntField("premium", this.premium);
        jsonWriter.writeIntField("deductible", this.deductible);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of Insurance from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of Insurance if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the Insurance.
     */
    @Metadata(generated = true)
    public static Insurance fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String provider = null;
            int premium = 0;
            int deductible = 0;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("provider".equals(fieldName)) {
                    provider = reader.getString();
                } else if ("premium".equals(fieldName)) {
                    premium = reader.getInt();
                } else if ("deductible".equals(fieldName)) {
                    deductible = reader.getInt();
                } else {
                    reader.skipChildren();
                }
            }
            return new Insurance(provider, premium, deductible);
        });
    }
}
