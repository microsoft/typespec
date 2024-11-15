// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.union.models;

import com.azure.core.annotation.Generated;
import com.azure.core.annotation.Immutable;
import com.azure.core.models.ResponseError;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonToken;
import com.azure.json.JsonWriter;
import java.io.IOException;

/**
 * Provides status details for long running operations.
 */
@Immutable
public final class ResourceOperationStatusOperationStatusResultError
    implements JsonSerializable<ResourceOperationStatusOperationStatusResultError> {
    /*
     * The unique ID of the operation.
     */
    @Generated
    private String id;

    /*
     * The status of the operation
     */
    @Generated
    private final OperationState status;

    /*
     * Error object that describes the error when status is "Failed".
     */
    @Generated
    private ResponseError error;

    /*
     * The result of the operation.
     */
    @Generated
    private Result result;

    /**
     * Creates an instance of ResourceOperationStatusOperationStatusResultError class.
     * 
     * @param status the status value to set.
     */
    @Generated
    private ResourceOperationStatusOperationStatusResultError(OperationState status) {
        this.status = status;
    }

    /**
     * Get the id property: The unique ID of the operation.
     * 
     * @return the id value.
     */
    @Generated
    public String getId() {
        return this.id;
    }

    /**
     * Get the status property: The status of the operation.
     * 
     * @return the status value.
     */
    @Generated
    public OperationState getStatus() {
        return this.status;
    }

    /**
     * Get the error property: Error object that describes the error when status is "Failed".
     * 
     * @return the error value.
     */
    @Generated
    public ResponseError getError() {
        return this.error;
    }

    /**
     * Get the result property: The result of the operation.
     * 
     * @return the result value.
     */
    @Generated
    public Result getResult() {
        return this.result;
    }

    /**
     * {@inheritDoc}
     */
    @Generated
    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        jsonWriter.writeStartObject();
        jsonWriter.writeStringField("status", this.status == null ? null : this.status.toString());
        jsonWriter.writeJsonField("error", this.error);
        jsonWriter.writeJsonField("result", this.result);
        return jsonWriter.writeEndObject();
    }

    /**
     * Reads an instance of ResourceOperationStatusOperationStatusResultError from the JsonReader.
     * 
     * @param jsonReader The JsonReader being read.
     * @return An instance of ResourceOperationStatusOperationStatusResultError if the JsonReader was pointing to an
     * instance of it, or null if it was pointing to JSON null.
     * @throws IllegalStateException If the deserialized JSON object was missing any required properties.
     * @throws IOException If an error occurs while reading the ResourceOperationStatusOperationStatusResultError.
     */
    @Generated
    public static ResourceOperationStatusOperationStatusResultError fromJson(JsonReader jsonReader) throws IOException {
        return jsonReader.readObject(reader -> {
            String id = null;
            OperationState status = null;
            ResponseError error = null;
            Result result = null;
            while (reader.nextToken() != JsonToken.END_OBJECT) {
                String fieldName = reader.getFieldName();
                reader.nextToken();

                if ("id".equals(fieldName)) {
                    id = reader.getString();
                } else if ("status".equals(fieldName)) {
                    status = OperationState.fromString(reader.getString());
                } else if ("error".equals(fieldName)) {
                    error = ResponseError.fromJson(reader);
                } else if ("result".equals(fieldName)) {
                    result = Result.fromJson(reader);
                } else {
                    reader.skipChildren();
                }
            }
            ResourceOperationStatusOperationStatusResultError deserializedResourceOperationStatusOperationStatusResultError
                = new ResourceOperationStatusOperationStatusResultError(status);
            deserializedResourceOperationStatusOperationStatusResultError.id = id;
            deserializedResourceOperationStatusOperationStatusResultError.error = error;
            deserializedResourceOperationStatusOperationStatusResultError.result = result;

            return deserializedResourceOperationStatusOperationStatusResultError;
        });
    }
}
