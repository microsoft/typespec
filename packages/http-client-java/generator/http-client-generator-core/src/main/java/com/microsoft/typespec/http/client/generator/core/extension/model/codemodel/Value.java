// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a value.
 */
public class Value extends Metadata {
    private Schema schema;
    private boolean required;
    private boolean nullable;
    private String $key;
    private String description;
    private String uid;
    private String summary;
    private List<ApiVersion> apiVersions = new ArrayList<>();
    private Deprecation deprecated;
    private ExternalDocumentation externalDocs;

    /**
     * Creates a new instance of the Value class.
     */
    public Value() {
    }

    /**
     * Gets the summary of the value.
     *
     * @return The summary of the value.
     */
    public String getSummary() {
        return summary;
    }

    /**
     * Sets the summary of the value.
     *
     * @param summary The summary of the value.
     */
    public void setSummary(String summary) {
        this.summary = summary;
    }

    /**
     * Gets the unique identifier of the value. (Required)
     *
     * @return The unique identifier of the value.
     */
    public String getUid() {
        return uid;
    }

    /**
     * Sets the unique identifier of the value. (Required)
     *
     * @param uid The unique identifier of the value.
     */
    public void setUid(String uid) {
        this.uid = uid;
    }

    /**
     * Gets the key of the value. (Required)
     *
     * @return The key of the value.
     */
    public String get$key() {
        return $key;
    }

    /**
     * Sets the key of the value. (Required)
     *
     * @param $key The key of the value.
     */
    public void set$key(String $key) {
        this.$key = $key;
    }

    /**
     * Gets the description of the value. (Required)
     *
     * @return The description of the value.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of the value. (Required)
     *
     * @param description The description of the value.
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
     * Gets the deprecation information for the value.
     *
     * @return The deprecation information for the value.
     */
    public Deprecation getDeprecated() {
        return deprecated;
    }

    /**
     * Sets the deprecation information for the value.
     *
     * @param deprecated The deprecation information for the value.
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
     * Gets the schema of the value. (Required)
     *
     * @return The schema of the value.
     */
    public Schema getSchema() {
        return schema;
    }

    /**
     * Checks if the value is a constant.
     *
     * @return true if the value is a constant, false otherwise.
     */
    public boolean isConstant() {
        return schema instanceof ConstantSchema;
    }

    /**
     * Sets the schema of the value. (Required)
     *
     * @param schema The schema of the value.
     */
    public void setSchema(Schema schema) {
        // This should ideally be done by the modeler if the header collection prefix is set.
        // The schema should be of type dictionary
        // TODO: remove this when modeler is fixed.
        if (this.getExtensions() != null
            && this.getExtensions().getXmsHeaderCollectionPrefix() != null
            && schema instanceof StringSchema) {
            DictionarySchema dictionarySchema = new DictionarySchema();
            dictionarySchema.setElementType(schema);
            this.schema = dictionarySchema;
            // return;
        }
        this.schema = schema;
    }

    /**
     * Gets whether the value is required.
     *
     * @return Whether the value is required.
     */
    public boolean isRequired() {
        return required;
    }

    /**
     * Sets whether the value is required.
     *
     * @param required Whether the value is required.
     */
    public void setRequired(boolean required) {
        this.required = required;
    }

    /**
     * Gets whether the value is nullable.
     *
     * @return Whether the value is nullable.
     */
    public boolean isNullable() {
        return nullable;
    }

    /**
     * Sets whether the value is nullable.
     *
     * @param nullable Whether the value is nullable.
     */
    public void setNullable(boolean nullable) {
        this.nullable = nullable;
    }
}
