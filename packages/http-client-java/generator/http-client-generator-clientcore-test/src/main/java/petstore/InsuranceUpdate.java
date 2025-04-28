package petstore;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializable;
import io.clientcore.core.serialization.json.JsonToken;
import io.clientcore.core.serialization.json.JsonWriter;
import java.io.IOException;

/**
 * Resource create or update operation model.
 */
@Metadata(conditions = { TypeConditions.FLUENT })
public final class InsuranceUpdate implements JsonSerializable<InsuranceUpdate> {
    /*
     * The provider property.
     */
    @Metadata(generated = true)
    private String provider;

    /*
     * The premium property.
     */
    @Metadata(generated = true)
    private Integer premium;

    /*
     * The deductible property.
     */
    @Metadata(generated = true)
    private Integer deductible;

    /**
     * Creates an instance of InsuranceUpdate class.
     */
    @Metadata(generated = true)
    public InsuranceUpdate() {
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
     * Set the provider property: The provider property.
     * 
     * @param provider the provider value to set.
     * @return the InsuranceUpdate object itself.
     */
    @Metadata(generated = true)
    public InsuranceUpdate setProvider(String provider) {
        this.provider = provider;
        return this;
    }

    /**
     * Get the premium property: The premium property.
     * 
     * @return the premium value.
     */
    @Metadata(generated = true)
    public Integer getPremium() {
        return this.premium;
    }

    /**
     * Set the premium property: The premium property.
     * 
     * @param premium the premium value to set.
     * @return the InsuranceUpdate object itself.
     */
    @Metadata(generated = true)
    public InsuranceUpdate setPremium(Integer premium) {
        this.premium = premium;
        return this;
    }

    /**
     * Get the deductible property: The deductible property.
     * 
     * @return the deductible value.
     */
    @Metadata(generated = true)
    public Integer getDeductible() {
        return this.deductible;
    }

    /**
     * Set the deductible property: The deductible property.
     * 
     * @param deductible the deductible value to set.
     * @return the InsuranceUpdate object itself.
     */
    @Metadata(generated = true)
    public InsuranceUpdate setDeductible(Integer deductible) {
        this.deductible = deductible;
        return this;
    }

    /**
     * {@inheritDoc}
     */
    @Metadata(generated = true)
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("provider", this.provider);
        jsonWriter.writeNumberField("premium", this.premium);
        jsonWriter.writeNumberField("deductible", this.deductible);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of InsuranceUpdate from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of InsuranceUpdate if the JsonReader was pointing to an instance of it, or null if it was
     * pointing to JSON null.
     * @throws IOException If an error occurs while reading the InsuranceUpdate.
     */
    @Metadata(generated = true)
    public static InsuranceUpdate fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            InsuranceUpdate deserializedInsuranceUpdate = new InsuranceUpdate();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("provider".equals(fieldName)) {
                    deserializedInsuranceUpdate.provider = reader.getString();
                } else if ("premium".equals(fieldName)) {
                    deserializedInsuranceUpdate.premium = reader.getNullable(JsonReader::getInt);
                } else if ("deductible".equals(fieldName)) {
                    deserializedInsuranceUpdate.deductible = reader.getNullable(JsonReader::getInt);
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedInsuranceUpdate;
        });
    }
}
