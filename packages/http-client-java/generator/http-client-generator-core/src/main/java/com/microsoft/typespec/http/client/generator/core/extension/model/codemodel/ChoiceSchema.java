// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.base.util.JsonUtils;
import com.azure.json.JsonReader;
import com.azure.json.JsonWriter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Represents a choice schema.
 */
public class ChoiceSchema extends ValueSchema {
    private Schema choiceType;
    private List<ChoiceValue> choices = new ArrayList<>();
    private String summary;
    private String crossLanguageDefinitionId;

    /**
     * Creates a new instance of the ChoiceSchema class.
     */
    public ChoiceSchema() {
        super();
    }

    /**
     * Gets the type of the choice. (Required)
     *
     * @return The type of the choice.
     */
    public Schema getChoiceType() {
        return choiceType;
    }

    /**
     * Sets the type of the choice. (Required)
     *
     * @param choiceType The type of the choice.
     */
    public void setChoiceType(Schema choiceType) {
        this.choiceType = choiceType;
    }

    /**
     * Gets the possible choices. (Required)
     *
     * @return The possible choices.
     */
    public List<ChoiceValue> getChoices() {
        return choices;
    }

    /**
     * Sets the possible choices. (Required)
     *
     * @param choices The possible choices.
     */
    public void setChoices(List<ChoiceValue> choices) {
        this.choices = choices;
    }

    @Override
    public String getSummary() {
        return summary;
    }

    @Override
    public void setSummary(String summary) {
        this.summary = summary;
    }

    /**
     * Gets the cross-language definition id.
     *
     * @return The cross-language definition id.
     */
    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    /**
     * Sets the cross-language definition id.
     *
     * @param crossLanguageDefinitionId The cross-language definition id.
     */
    public void setCrossLanguageDefinitionId(String crossLanguageDefinitionId) {
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
    }

    @Override
    public String toString() {
        return sharedToString(this, ChoiceSchema.class.getName());
    }

    static String sharedToString(ChoiceSchema value, String className) {
        return className + "@" + Integer.toHexString(System.identityHashCode(value)) + "[choiceType="
            + Objects.toString(value.choiceType, "<null>") + ",choices=" + Objects.toString(value.choices, "<null>")
            + ']';
    }

    @Override
    public int hashCode() {
        return sharedHashCode(this);
    }

    static int sharedHashCode(ChoiceSchema value) {
        return Objects.hash(value.choiceType, value.choices, value.getLanguage().getJava().getName());
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }
        if (!(other instanceof ChoiceSchema)) {
            return false;
        }

        return sharedEquals(this, (ChoiceSchema) other);
    }

    static boolean sharedEquals(ChoiceSchema lhs, ChoiceSchema rhs) {
        return Objects.equals(lhs.choiceType, rhs.choiceType) && Objects.equals(lhs.choices, rhs.choices)
            && Objects.equals(lhs.getLanguage().getJava().getName(), rhs.getLanguage().getJava().getName());
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return writeParentProperties(jsonWriter.writeStartObject()).writeEndObject();
    }

    JsonWriter writeParentProperties(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter)
            .writeJsonField("choiceType", choiceType)
            .writeArrayField("choices", choices, JsonWriter::writeJson)
            .writeStringField("summary", summary)
            .writeStringField("crossLanguageDefinitionId", crossLanguageDefinitionId);
    }

    /**
     * Deserializes a ChoiceSchema instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A ChoiceSchema instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static ChoiceSchema fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, ChoiceSchema::new, (schema, fieldName, reader) -> {
            if (!schema.tryConsumeParentProperties(schema, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }

    boolean tryConsumeParentProperties(ChoiceSchema schema, String fieldName, JsonReader reader) throws IOException {
        if (super.tryConsumeParentProperties(schema, fieldName, reader)) {
            return true;
        } else if ("choiceType".equals(fieldName)) {
            schema.choiceType = Schema.fromJson(reader);
            return true;
        } else if ("choices".equals(fieldName)) {
            schema.choices = reader.readArray(ChoiceValue::fromJson);
            return true;
        } else if ("summary".equals(fieldName)) {
            schema.summary = reader.getString();
            return true;
        } else if ("crossLanguageDefinitionId".equals(fieldName)) {
            schema.crossLanguageDefinitionId = reader.getString();
            return true;
        }

        return false;
    }
}
