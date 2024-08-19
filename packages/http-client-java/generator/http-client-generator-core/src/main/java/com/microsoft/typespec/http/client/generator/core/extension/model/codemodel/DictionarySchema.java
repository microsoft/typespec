// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.Objects;

/**
 * Represents a key-value collection.
 */
public class DictionarySchema extends ComplexSchema {
    private Schema elementType;
    private Boolean nullableItems;

    /**
     * Creates a new instance of the DictionarySchema class.
     */
    public DictionarySchema() {
        super();
    }

    /**
     * Gets the type of the elements in the dictionary. (Required)
     *
     * @return The type of the elements in the dictionary.
     */
    public Schema getElementType() {
        return elementType;
    }

    /**
     * Sets the type of the elements in the dictionary. (Required)
     *
     * @param elementType The type of the elements in the dictionary.
     */
    public void setElementType(Schema elementType) {
        this.elementType = elementType;
    }

    /**
     * Gets whether the items in the dictionary can be null.
     *
     * @return Whether the items in the dictionary can be null.
     */
    public Boolean getNullableItems() {
        return nullableItems;
    }

    /**
     * Sets whether the items in the dictionary can be null.
     *
     * @param nullableItems Whether the items in the dictionary can be null.
     */
    public void setNullableItems(Boolean nullableItems) {
        this.nullableItems = nullableItems;
    }

    @Override
    public String toString() {
        return DictionarySchema.class.getName() + '@' + Integer.toHexString(System.identityHashCode(this))
            + "[elementType=" + Objects.toString(elementType, "<null>") + ",nullableItems="
            + Objects.toString(nullableItems, "<null>") + "]";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (!(o instanceof DictionarySchema)) {
            return false;
        }

        DictionarySchema that = (DictionarySchema) o;
        return Objects.equals(elementType, that.elementType) && Objects.equals(nullableItems, that.nullableItems);
    }

    @Override
    public int hashCode() {
        return Objects.hash(elementType, nullableItems);
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return jsonWriter.writeStartObject()
            .writeJsonField("elementType", elementType)
            .writeBooleanField("nullableItems", nullableItems)
            .writeEndObject();
    }

    /**
     * Deserializes a DictionarySchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A DictionarySchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static DictionarySchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, DictionarySchema::new, (schema, fieldName, reader) -> {
            if ("elementType".equals(fieldName)) {
                schema.elementType = Schema.fromJson(reader);
            } else if ("nullableItems".equals(fieldName)) {
                schema.nullableItems = reader.getNullable(JsonReader::getBoolean);
            } else {
                reader.skipChildren();
            }
        });
    }
}
