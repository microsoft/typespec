// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonSerializable;
import com.azure.json.JsonWriter;

import java.io.IOException;

/**
 * Represents the pageable settings of a model.
 */
public class XmsPageable implements JsonSerializable<XmsPageable> {
    private String itemName = "value";
    private String nextLinkName;
    private String operationName;
    private Operation nextOperation;

    /**
     * Creates a new instance of the XmsPageable class.
     */
    public XmsPageable() {
    }

    /**
     * Gets the name of the item in the pageable response.
     *
     * @return The name of the item in the pageable response.
     */
    public String getItemName() {
        return itemName;
    }

    /**
     * Sets the name of the item in the pageable response.
     *
     * @param itemName The name of the item in the pageable response.
     */
    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    /**
     * Gets the name of the next link in the pageable response.
     *
     * @return The name of the next link in the pageable response.
     */
    public String getNextLinkName() {
        return nextLinkName;
    }

    /**
     * Sets the name of the next link in the pageable response.
     *
     * @param nextLinkName The name of the next link in the pageable response.
     */
    public void setNextLinkName(String nextLinkName) {
        this.nextLinkName = nextLinkName;
    }

    /**
     * Gets the name of the operation that retrieves the next page of items.
     *
     * @return The name of the operation that retrieves the next page of items.
     */
    public String getOperationName() {
        return operationName;
    }

    /**
     * Sets the name of the operation that retrieves the next page of items.
     *
     * @param operationName The name of the operation that retrieves the next page of items.
     */
    public void setOperationName(String operationName) {
        this.operationName = operationName;
    }

    /**
     * Gets the operation that retrieves the next page of items.
     *
     * @return The operation that retrieves the next page of items.
     */
    public Operation getNextOperation() {
        return nextOperation;
    }

    /**
     * Sets the operation that retrieves the next page of items.
     *
     * @param nextOperation The operation that retrieves the next page of items.
     */
    public void setNextOperation(Operation nextOperation) {
        this.nextOperation = nextOperation;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeStringField("itemName", itemName)
            .writeStringField("nextLinkName", nextLinkName)
            .writeStringField("operationName", operationName)
            .writeJsonField("nextOperation", nextOperation)
            .writeEndObject();
    }

    /**
     * Deserializes an XmsPageable instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An XmsPageable instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static XmsPageable fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, XmsPageable::new, (pageable, fieldName, reader) -> {
            if ("itemName".equals(fieldName)) {
                pageable.itemName = reader.getString();
            } else if ("nextLinkName".equals(fieldName)) {
                pageable.nextLinkName = reader.getString();
            } else if ("operationName".equals(fieldName)) {
                pageable.operationName = reader.getString();
            } else if ("nextOperation".equals(fieldName)) {
                pageable.nextOperation = Operation.fromJson(reader);
            } else {
                reader.skipChildren();
            }
        });
    }
}
