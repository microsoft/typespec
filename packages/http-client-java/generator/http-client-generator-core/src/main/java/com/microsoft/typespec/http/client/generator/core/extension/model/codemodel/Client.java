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
 * Represents a client.
 */
public class Client extends Metadata {
    private String summary;
    private List<OperationGroup> operationGroups = new ArrayList<>();
    private List<Parameter> globalParameters = new ArrayList<>();
    private Security security;
    private List<ApiVersion> apiVersions = new ArrayList<>();
    private ServiceVersion serviceVersion;
    private String crossLanguageDefinitionId;

    /**
     * Creates a new instance of the Client class.
     */
    public Client() {
        super();
    }

    /**
     * Gets the summary of the client.
     *
     * @return The summary of the client.
     */
    public String getSummary() {
        return summary;
    }

    /**
     * Sets the summary of the client.
     *
     * @param summary The summary of the client.
     */
    public void setSummary(String summary) {
        this.summary = summary;
    }

    /**
     * Gets the operation groups of the client.
     *
     * @return The operation groups of the client.
     */
    public List<OperationGroup> getOperationGroups() {
        return operationGroups;
    }

    /**
     * Sets the operation groups of the client.
     *
     * @param operationGroups The operation groups of the client.
     */
    public void setOperationGroups(List<OperationGroup> operationGroups) {
        this.operationGroups = operationGroups;
    }

    /**
     * Gets the global parameters of the client.
     *
     * @return The global parameters of the client.
     */
    public List<Parameter> getGlobalParameters() {
        return globalParameters;
    }

    /**
     * Sets the global parameters of the client.
     *
     * @param globalParameters The global parameters of the client.
     */
    public void setGlobalParameters(List<Parameter> globalParameters) {
        this.globalParameters = globalParameters;
    }

    /**
     * Gets the security of the client.
     *
     * @return The security of the client.
     */
    public Security getSecurity() {
        return security;
    }

    /**
     * Sets the security of the client.
     *
     * @param security The security of the client.
     */
    public void setSecurity(Security security) {
        this.security = security;
    }

    /**
     * Gets the API versions of the client.
     *
     * @return The API versions of the client.
     */
    public List<ApiVersion> getApiVersions() {
        return apiVersions;
    }

    /**
     * Sets the API versions of the client.
     *
     * @param apiVersions The API versions of the client.
     */
    public void setApiVersions(List<ApiVersion> apiVersions) {
        this.apiVersions = apiVersions;
    }

    /**
     * Gets the service version of the client.
     *
     * @return The service version of the client.
     */
    public ServiceVersion getServiceVersion() {
        return serviceVersion;
    }

    /**
     * Sets the service version of the client.
     *
     * @param serviceVersion The service version of the client.
     */
    public void setServiceVersion(ServiceVersion serviceVersion) {
        this.serviceVersion = serviceVersion;
    }

    /**
     * Gets the cross-language definition id of the client.
     *
     * @return The cross-language definition id of the client.
     */
    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    /**
     * Sets the cross-language definition id of the client.
     *
     * @param crossLanguageDefinitionId The cross-language definition id of the client.
     */
    public void setCrossLanguageDefinitionId(String crossLanguageDefinitionId) {
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return writeParentProperties(jsonWriter.writeStartObject()).writeEndObject();
    }

    JsonWriter writeParentProperties(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter)
            .writeStringField("summary", summary)
            .writeArrayField("operationGroups", operationGroups, JsonWriter::writeJson)
            .writeArrayField("globalParameters", globalParameters, JsonWriter::writeJson)
            .writeJsonField("security", security)
            .writeArrayField("apiVersions", apiVersions, JsonWriter::writeJson)
            .writeJsonField("serviceVersion", serviceVersion)
            .writeStringField("crossLanguageDefinitionId", crossLanguageDefinitionId);
    }

    /**
     * Deserializes a Client instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return A Client instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Client fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Client::new, (client, fieldName, reader) -> {
            if (!client.tryConsumeParentProperties(client, fieldName, reader)) {
                reader.skipChildren();
            }
        });
    }

    boolean tryConsumeParentProperties(Client client, String fieldName, JsonReader reader) throws IOException {
        if (super.tryConsumeParentProperties(client, fieldName, reader)) {
            return true;
        } else if ("summary".equals(fieldName)) {
            client.summary = reader.getString();
            return true;
        } else if ("operationGroups".equals(fieldName)) {
            client.operationGroups = reader.readArray(OperationGroup::fromJson);
            return true;
        } else if ("globalParameters".equals(fieldName)) {
            client.globalParameters = reader.readArray(Parameter::fromJson);
            return true;
        } else if ("security".equals(fieldName)) {
            client.security = Security.fromJson(reader);
            return true;
        } else if ("apiVersions".equals(fieldName)) {
            client.apiVersions = reader.readArray(ApiVersion::fromJson);
            return true;
        } else if ("serviceVersion".equals(fieldName)) {
            client.serviceVersion = ServiceVersion.fromJson(reader);
            return true;
        } else if ("crossLanguageDefinitionId".equals(fieldName)) {
            client.crossLanguageDefinitionId = reader.getString();
            return true;
        }

        return false;
    }
}
