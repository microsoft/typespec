// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents the metadata for long-running operations.
 */
public class LongRunningMetadata implements JsonSerializable<LongRunningMetadata> {
    private ObjectSchema pollResultType;
    private ObjectSchema finalResultType;
    private Metadata pollingStrategy;
    private String finalResultPropertySerializedName;

    /**
     * Creates a new instance of the LongRunningMetadata class.
     */
    public LongRunningMetadata() {
    }

    /**
     * Gets the poll result type.
     *
     * @return The poll result type.
     */
    public ObjectSchema getPollResultType() {
        return pollResultType;
    }

    /**
     * Sets the poll result type.
     *
     * @param pollResultType The poll result type.
     */
    public void setPollResultType(ObjectSchema pollResultType) {
        this.pollResultType = pollResultType;
    }

    /**
     * Gets the final result type.
     *
     * @return The final result type.
     */
    public ObjectSchema getFinalResultType() {
        return finalResultType;
    }

    /**
     * Sets the final result type.
     *
     * @param finalResultType The final result type.
     */
    public void setFinalResultType(ObjectSchema finalResultType) {
        this.finalResultType = finalResultType;
    }

    /**
     * Gets the polling strategy.
     *
     * @return The polling strategy.
     */
    public Metadata getPollingStrategy() {
        return pollingStrategy;
    }

    /**
     * Sets the polling strategy.
     *
     * @param pollingStrategy The polling strategy.
     */
    public void setPollingStrategy(Metadata pollingStrategy) {
        this.pollingStrategy = pollingStrategy;
    }

    /**
     * Gets the serialized name for the property of final result.
     *
     * @return the serialized name for the property of final result.
     */
    public String getFinalResultPropertySerializedName() {
        return finalResultPropertySerializedName;
    }

    /**
     * Sets the serialized name for the property of final result.
     *
     * @param finalResultPropertySerializedName the serialized name for the property of final result.
     */
    public void setFinalResultPropertySerializedName(String finalResultPropertySerializedName) {
        this.finalResultPropertySerializedName = finalResultPropertySerializedName;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("pollResultType", pollResultType)
            .writeJsonField("finalResultType", finalResultType)
            .writeJsonField("pollingStrategy", pollingStrategy)
            .writeStringField("finalResultPropertySerializedName", finalResultPropertySerializedName)
            .writeEndObject();
    }

    /**
     * Deserializes a LongRunningMetadata instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A LongRunningMetadata instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static LongRunningMetadata fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, LongRunningMetadata::new, (lroMetadata, fieldName, reader) -> {
            if ("pollResultType".equals(fieldName)) {
                lroMetadata.pollResultType = ObjectSchema.fromJson(reader);
            } else if ("finalResultType".equals(fieldName)) {
                lroMetadata.finalResultType = ObjectSchema.fromJson(reader);
            } else if ("pollingStrategy".equals(fieldName)) {
                lroMetadata.pollingStrategy = Metadata.fromJson(reader);
            } else if ("finalResultPropertySerializedName".equals(fieldName)) {
                lroMetadata.finalResultPropertySerializedName = reader.getFieldName();
            } else {
                reader.skipChildren();
            }
        });
    }
}
