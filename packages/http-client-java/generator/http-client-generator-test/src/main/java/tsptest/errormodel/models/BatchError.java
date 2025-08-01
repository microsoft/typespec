// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.errormodel.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * The BatchError model.
 */
@Immutable
public final class BatchError implements JsonSerializable<BatchError> {
    /*
     * The code property.
     */
    @Generated
    private String code;

    /*
     * The message property.
     */
    @Generated
    private BatchErrorMessage message;

    /**
     * Creates an instance of BatchError class.
     */
    @Generated
    private BatchError() {
    }

    /**
     * Get the code property: The code property.
     * 
     * @return the code value.
     */
    @Generated
    public String getCode() {
        return this.code;
    }

    /**
     * Get the message property: The message property.
     * 
     * @return the message value.
     */
    @Generated
    public BatchErrorMessage getMessage() {
        return this.message;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("code", this.code);
        jsonWriter.writeJsonField("message", this.message);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of BatchError from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of BatchError if the JsonReader was pointing to an instance of it, or null if it was pointing
     * to JSON null.
     * @throws IOException If an error occurs while reading the BatchError.
     */
    @Generated
    public static BatchError fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            BatchError deserializedBatchError = new BatchError();
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("code".equals(fieldName)) {
                    deserializedBatchError.code = reader.getString();
                } else if ("message".equals(fieldName)) {
                    deserializedBatchError.message = BatchErrorMessage.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }

            return deserializedBatchError;
        });
    }
}
