// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Represents a schema.
 */
public class Schema extends Metadata {
    private Schema.AllSchemaTypes type;
    private String summary;
    private Object example;
    private Object defaultValue;
    private SerializationFormats serialization;
    private Set<String> serializationFormats;
    private Set<SchemaContext> usage;
    private String uid;
    private String $key;
    private String description;
    private List<ApiVersion> apiVersions = new ArrayList<>();
    private Deprecation deprecated;
    private ExternalDocumentation externalDocs;

    /**
     * Creates a new instance of the Schema class.
     */
    public Schema() {
    }

    /**
     * Gets the all schema types. (Required)
     *
     * @return The all schema types.
     */
    public Schema.AllSchemaTypes getType() {
        return type;
    }

    /**
     * Sets the all schema types. (Required)
     *
     * @param type The all schema types.
     */
    public void setType(Schema.AllSchemaTypes type) {
        this.type = type;
    }

    /**
     * Gets a short description.
     *
     * @return The short description.
     */
    public String getSummary() {
        return summary;
    }

    /**
     * Sets a short description.
     *
     * @param summary The short description.
     */
    public void setSummary(String summary) {
        this.summary = summary;
    }

    /**
     * Gets example information.
     *
     * @return The example information.
     */
    public Object getExample() {
        return example;
    }

    /**
     * Sets example information.
     *
     * @param example The example information.
     */
    public void setExample(Object example) {
        this.example = example;
    }

    /**
     * Gets the default value.
     *
     * @return The default value.
     */
    public Object getDefaultValue() {
        return defaultValue;
    }

    /**
     * Sets the default value.
     *
     * @param defaultValue The default value.
     */
    public void setDefaultValue(Object defaultValue) {
        this.defaultValue = defaultValue;
    }

    /**
     * Gets the serialization formats.
     *
     * @return The serialization formats.
     */
    public SerializationFormats getSerialization() {
        return serialization;
    }

    /**
     * Sets the serialization formats.
     *
     * @param serialization The serialization formats.
     */
    public void setSerialization(SerializationFormats serialization) {
        this.serialization = serialization;
    }

    /**
     * Gets the set of serialization formats this Schema is used with, ex. JSON, XML, etc.
     *
     * @return The serialization formats.
     */
    public Set<String> getSerializationFormats() {
        return serializationFormats;
    }

    /**
     * Sets the set of serialization formats this Schema is used with, ex. JSON, XML, etc.
     *
     * @param serializationFormats The serialization formats.
     */
    public void setSerializationFormats(Set<String> serializationFormats) {
        this.serializationFormats = serializationFormats;
    }

    /**
     * Gets the UID of the schema. (Required)
     *
     * @return The UID of the schema.
     */
    public String getUid() {
        return uid;
    }

    /**
     * Sets the UID of the schema. (Required)
     *
     * @param uid The UID of the schema.
     */
    public void setUid(String uid) {
        this.uid = uid;
    }

    /**
     * Gets the key of the schema. (Required)
     *
     * @return The key of the schema.
     */
    public String get$key() {
        return $key;
    }

    /**
     * Sets the key of the schema. (Required)
     *
     * @param $key The key of the schema.
     */
    public void set$key(String $key) {
        this.$key = $key;
    }

    /**
     * Gets the description of the schema. (Required)
     *
     * @return The description of the schema.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of the schema. (Required)
     *
     * @param description The description of the schema.
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the API versions that this applies to. Undefined means all versions.
     *
     * @return The API versions that this applies to. Undefined means all versions.
     */
    public List<ApiVersion> getApiVersions() {
        return apiVersions;
    }

    /**
     * Sets the API versions that this applies to. Undefined means all versions.
     *
     * @param apiVersions The API versions that this applies to. Undefined means all versions.
     */
    public void setApiVersions(List<ApiVersion> apiVersions) {
        this.apiVersions = apiVersions;
    }

    /**
     * Gets the deprecation information for the schema.
     *
     * @return The deprecation information for the schema.
     */
    public Deprecation getDeprecated() {
        return deprecated;
    }

    /**
     * Sets the deprecation information for the schema.
     *
     * @param deprecated The deprecation information for the schema.
     */
    public void setDeprecated(Deprecation deprecated) {
        this.deprecated = deprecated;
    }

    /**
     * Gets a reference to external documentation.
     *
     * @return A reference to external documentation.
     */
    public ExternalDocumentation getExternalDocs() {
        return externalDocs;
    }

    /**
     * Sets a reference to external documentation.
     *
     * @param externalDocs A reference to external documentation.
     */
    public void setExternalDocs(ExternalDocumentation externalDocs) {
        this.externalDocs = externalDocs;
    }

    /**
     * Gets the usage of the schema.
     *
     * @return The usage of the schema.
     */
    public Set<SchemaContext> getUsage() {
        return usage;
    }

    /**
     * Sets the usage of the schema.
     *
     * @param usage The usage of the schema.
     */
    public void setUsage(Set<SchemaContext> usage) {
        this.usage = usage;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return writeParentProperties(jsonWriter.writeStartObject()).writeEndObject();
    }

    JsonWriter writeParentProperties(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter)
            .writeStringField("type", type == null ? null : type.toString())
            .writeStringField("summary", summary)
            .writeUntypedField("example", example)
            .writeUntypedField("defaultValue", defaultValue)
            .writeJsonField("serialization", serialization)
            .writeArrayField("serializationFormats", serializationFormats, JsonWriter::writeString)
            .writeArrayField("usage", usage, (writer, element) -> writer.writeString(element == null ? null : element.toString()))
            .writeStringField("uid", uid)
            .writeStringField("$key", $key)
            .writeStringField("description", description)
            .writeArrayField("apiVersions", apiVersions, JsonWriter::writeJson)
            .writeJsonField("deprecated", deprecated)
            .writeJsonField("externalDocs", externalDocs);
    }

    /**
     * Deserializes a Schema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Schema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Schema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Schema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }

    boolean tryConsumeParentProperties(Schema schema, String fieldName, JsonReader reader) throws IOException {
        if (super.tryConsumeParentProperties(schema, fieldName, reader)) {
            return true;
        } else if ("type".equals(fieldName)) {
            schema.type = Schema.AllSchemaTypes.fromValue(reader.getString());
            return true;
        } else if ("summary".equals(fieldName)) {
            schema.summary = reader.getString();
            return true;
        } else if ("example".equals(fieldName)) {
            schema.example = reader.readUntyped();
            return true;
        } else if ("defaultValue".equals(fieldName)) {
            schema.defaultValue = reader.readUntyped();
            return true;
        } else if ("serialization".equals(fieldName)) {
            schema.serialization = SerializationFormats.fromJson(reader);
            return true;
        } else if ("serializationFormats".equals(fieldName)) {
            List<String> formats = reader.readArray(JsonReader::getString);
            schema.serializationFormats = formats == null ? null : new HashSet<>(formats);
            return true;
        } else if ("usage".equals(fieldName)) {
            List<SchemaContext> usage = reader.readArray(element -> SchemaContext.fromValue(element.getString()));
            schema.usage = usage == null ? null : new HashSet<>(usage);
            return true;
        } else if ("uid".equals(fieldName)) {
            schema.uid = reader.getString();
            return true;
        } else if ("$key".equals(fieldName)) {
            schema.$key = reader.getString();
            return true;
        } else if ("description".equals(fieldName)) {
            schema.description = reader.getString();
            return true;
        } else if ("apiVersions".equals(fieldName)) {
            schema.apiVersions = reader.readArray(ApiVersion::fromJson);
            return true;
        } else if ("deprecated".equals(fieldName)) {
            schema.deprecated = Deprecation.fromJson(reader);
            return true;
        } else if ("externalDocs".equals(fieldName)) {
            schema.externalDocs = ExternalDocumentation.fromJson(reader);
            return true;
        }

        return false;
    }

    /**
     * Represents all schema types.
     */
    public enum AllSchemaTypes {
        /**
         * Represents any type.
         */
        ANY("any"),

        /**
         * Represents any object.
         */
        ANY_OBJECT("any-object"),

        /**
         * Represents AND logic.
         */
        AND("and"),

        /**
         * Represents arm-id.
         */
        ARM_ID("arm-id"),

        /**
         * Represents array.
         */
        ARRAY("array"),

        /**
         * Represents binary.
         */
        BINARY("binary"),

        /**
         * Represents boolean.
         */
        BOOLEAN("boolean"),

        /**
         * Represents byte array.
         */
        BYTE_ARRAY("byte-array"),

        /**
         * Represents char.
         */
        CHAR("char"),

        /**
         * Represents choice.
         */
        CHOICE("choice"),

        /**
         * Represents constant.
         */
        CONSTANT("constant"),

        /**
         * Represents credential.
         */
        CREDENTIAL("credential"),

        /**
         * Represents date.
         */
        DATE("date"),

        /**
         * Represents date-time.
         */
        DATE_TIME("date-time"),

        /**
         * Represents dictionary.
         */
        DICTIONARY("dictionary"),

        /**
         * Represents duration.
         */
        DURATION("duration"),

        /**
         * Represents flag.
         */
        FLAG("flag"),

        /**
         * Represents float.
         */
        GROUP("group"),

        /**
         * Represents integer.
         */
        INTEGER("integer"),

        /**
         * Represents NOT logic.
         */
        NOT("not"),

        /**
         * Represents number.
         */
        NUMBER("number"),

        /**
         * Represents object.
         */
        OBJECT("object"),

        /**
         * Represents odata-query.
         */
        ODATA_QUERY("odata-query"),

        /**
         * Represents OR logic.
         */
        OR("or"),

        /**
         * Represents parameter-group.
         */
        PARAMETER_GROUP("parameter-group"),

        /**
         * Represents sealed-choice.
         */
        SEALED_CHOICE("sealed-choice"),

        /**
         * Represents string.
         */
        STRING("string"),

        /**
         * Represents time.
         */
        TIME("time"),

        /**
         * Represents unixtime.
         */
        UNIXTIME("unixtime"),

        /**
         * Represents uri.
         */
        URI("uri"),

        /**
         * Represents uuid.
         */
        UUID("uuid"),

        /**
         * Represents XOR logic.
         */
        XOR("xor");
        private final String value;
        private final static Map<String, Schema.AllSchemaTypes> CONSTANTS = new HashMap<>();

        static {
            for (Schema.AllSchemaTypes c : values()) {
                CONSTANTS.put(c.value, c);
            }
        }

        AllSchemaTypes(String value) {
            this.value = value;
        }

        @Override
        public String toString() {
            return this.value;
        }

        /**
         * Gets the value of the schema type.
         *
         * @return The value of the schema type.
         */
        public String value() {
            return this.value;
        }

        /**
         * Returns the enum constant of this type with the specified value.
         *
         * @param value The value of the constant.
         * @return The enum constant of this type with the specified value.
         * @throws IllegalArgumentException If the specified value does not map to one of the constants in the enum.
         */
        public static Schema.AllSchemaTypes fromValue(String value) {
            Schema.AllSchemaTypes constant = CONSTANTS.get(value);
            if (constant == null) {
                throw new IllegalArgumentException(value);
            } else {
                return constant;
            }
        }

    }

}
