// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents an operation group, a container around set of operations.
 */
public class OperationGroup extends Metadata {
    private String $key;
    private List<Operation> operations = new ArrayList<Operation>();
    private Client codeModel;

    /**
     * Creates a new instance of the OperationGroup class.
     */
    public OperationGroup() {
    }

    /**
     * Gets the key of the operation group. (Required)
     *
     * @return The key of the operation group.
     */
    public String get$key() {
        return $key;
    }

    /**
     * Sets the key of the operation group. (Required)
     *
     * @param $key The key of the operation group.
     */
    public void set$key(String $key) {
        this.$key = $key;
    }

    /**
     * Gets the operations that are in this operation group. (Required)
     *
     * @return The operations that are in this operation group.
     */
    public List<Operation> getOperations() {
        return operations;
    }

    /**
     * Sets the operations that are in this operation group. (Required)
     *
     * @param operations The operations that are in this operation group.
     */
    public void setOperations(List<Operation> operations) {
        this.operations = operations;
    }

    /**
     * Gets the client which contains the operation group.
     *
     * @return The client which contains the operation group.
     */
    public Client getCodeModel() {
        return codeModel;
    }

    /**
     * Sets the client which contains the operation group.
     *
     * @param codeModel The client which contains the operation group.
     */
    public void setCodeModel(Client codeModel) {
        this.codeModel = codeModel;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter.writeStartObject())
            .writeStringField("$key", $key)
            .writeArrayField("operations", operations, JsonWriter::writeJson)
            .writeJsonField("codeModel", codeModel)
            .writeEndObject();
    }

    /**
     * Deserializes an OperationGroup instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An OperationGroup instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static OperationGroup fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, OperationGroup::new, (group, fieldName, reader) -> {
            if (group.tryConsumeParentProperties(group, fieldName, reader)) {
                return;
            }

            if ("$key".equals(fieldName)) {
                group.$key = reader.getString();
            } else if ("operations".equals(fieldName)) {
                group.operations = reader.readArray(Operation::fromJson);
            } else if ("codeModel".equals(fieldName)) {
                group.codeModel = CodeModel.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
