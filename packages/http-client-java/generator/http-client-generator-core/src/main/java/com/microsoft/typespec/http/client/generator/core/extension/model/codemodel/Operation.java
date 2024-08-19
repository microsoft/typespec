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
 * Represents a single callable endpoint with a discrete set of inputs, and any number of output possibilities
 * (responses or exceptions).
 */
public class Operation extends Metadata {
    private String operationId;
    private List<Parameter> parameters = new ArrayList<>();
    private List<Parameter> signatureParameters = new ArrayList<>();
    private List<Request> requests;
    private List<Response> responses = new ArrayList<>();
    private List<Response> exceptions = new ArrayList<>();
    private DictionaryApiVersion profile;
    private String $key;
    private String description;
    private String uid;
    private String summary;
    private List<ApiVersion> apiVersions = new ArrayList<>();
    private Deprecation deprecated;
    private ExternalDocumentation externalDocs;
    private List<String> specialHeaders;
    private LongRunningMetadata lroMetadata;
    private ConvenienceApi convenienceApi;
    private Boolean generateProtocolApi;
    private Boolean internalApi;
    private String crossLanguageDefinitionId;
    // internal
    private OperationGroup operationGroup;

    /**
     * Creates a new instance of the Operation class.
     */
    public Operation() {
    }

    /**
     * Gets the operation ID.
     *
     * @return The operation ID.
     */
    public String getOperationId() {
        return operationId;
    }

    /**
     * Sets the operation ID.
     *
     * @param operationId The operation ID.
     */
    public void setOperationId(String operationId) {
        this.operationId = operationId;
    }

    /**
     * Gets the requests for this operation. (Required)
     *
     * @return The requests for this operation.
     */
    public List<Request> getRequests() {
        return requests;
    }

    /**
     * Sets the requests for this operation. (Required)
     *
     * @param requests The requests for this operation.
     */
    public void setRequests(List<Request> requests) {
        this.requests = requests;
    }

    /**
     * Gets the responses that indicate a successful call.
     *
     * @return The responses that indicate a successful call.
     */
    public List<Response> getResponses() {
        return responses;
    }

    /**
     * Sets the responses that indicate a successful call.
     *
     * @param responses The responses that indicate a successful call.
     */
    public void setResponses(List<Response> responses) {
        this.responses = responses;
    }

    /**
     * Gets the responses that indicate a failed call.
     *
     * @return The responses that indicate a failed call.
     */
    public List<Response> getExceptions() {
        return exceptions;
    }

    /**
     * Sets the responses that indicate a failed call.
     *
     * @param exceptions The responses that indicate a failed call.
     */
    public void setExceptions(List<Response> exceptions) {
        this.exceptions = exceptions;
    }

    /**
     * Gets the profile of the operation.
     *
     * @return The profile of the operation.
     */
    public DictionaryApiVersion getProfile() {
        return profile;
    }

    /**
     * Sets the profile of the operation.
     *
     * @param profile The profile of the operation.
     */
    public void setProfile(DictionaryApiVersion profile) {
        this.profile = profile;
    }

    /**
     * Gets the key of the operation. (Required)
     *
     * @return The key of the operation.
     */
    public String get$key() {
        return $key;
    }

    /**
     * Sets the key of the operation. (Required)
     *
     * @param $key The key of the operation.
     */
    public void set$key(String $key) {
        this.$key = $key;
    }

    /**
     * Gets the description of the operation. (Required)
     *
     * @return The description of the operation.
     */
    public String getDescription() {
        return description;
    }

    /**
     * Sets the description of the operation. (Required)
     *
     * @param description The description of the operation.
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * Gets the UID of the operation. (Required)
     *
     * @return The UID of the operation.
     */
    public String getUid() {
        return uid;
    }

    /**
     * Sets the UID of the operation. (Required)
     *
     * @param uid The UID of the operation.
     */
    public void setUid(String uid) {
        this.uid = uid;
    }

    /**
     * Gets the summary of the operation.
     *
     * @return The summary of the operation.
     */
    public String getSummary() {
        return summary;
    }

    /**
     * Sets the summary of the operation.
     *
     * @param summary The summary of the operation.
     */
    public void setSummary(String summary) {
        this.summary = summary;
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
     * Gets the deprecation information for the operation.
     *
     * @return The deprecation information for the operation.
     */
    public Deprecation getDeprecated() {
        return deprecated;
    }

    /**
     * Sets the deprecation information for the operation.
     *
     * @param deprecated The deprecation information for the operation.
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
     * Gets the operation group.
     *
     * @return The operation group.
     */
    public OperationGroup getOperationGroup() {
        return operationGroup;
    }

    /**
     * Sets the operation group.
     *
     * @param operationGroup The operation group.
     */
    public void setOperationGroup(OperationGroup operationGroup) {
        this.operationGroup = operationGroup;
    }

    /**
     * Gets the parameters for this operation.
     *
     * @return The parameters for this operation.
     */
    public List<Parameter> getParameters() {
        return parameters;
    }

    /**
     * Sets the parameters for this operation.
     *
     * @param parameters The parameters for this operation.
     */
    public void setParameters(List<Parameter> parameters) {
        this.parameters = parameters;
    }

    /**
     * Gets the signature parameters for this operation.
     *
     * @return The signature parameters for this operation.
     */
    public List<Parameter> getSignatureParameters() {
        return signatureParameters;
    }

    /**
     * Sets the signature parameters for this operation.
     *
     * @param signatureParameters The signature parameters for this operation.
     */
    public void setSignatureParameters(List<Parameter> signatureParameters) {
        this.signatureParameters = signatureParameters;
    }

    /**
     * Gets headers that require special processing, e.g. Repeatability-Request-ID
     *
     * @return Headers that require special processing, e.g. Repeatability-Request-ID
     */
    public List<String> getSpecialHeaders() {
        return specialHeaders;
    }

    /**
     * Sets headers that require special processing, e.g. Repeatability-Request-ID
     *
     * @param specialHeaders Headers that require special processing, e.g. Repeatability-Request-ID
     */
    public void setSpecialHeaders(List<String> specialHeaders) {
        this.specialHeaders = specialHeaders;
    }

    /**
     * Gets the metadata for long-running operations.
     *
     * @return The metadata for long-running operations.
     */
    public LongRunningMetadata getLroMetadata() {
        return lroMetadata;
    }

    /**
     * Sets the metadata for long-running operations.
     *
     * @param lroMetadata The metadata for long-running operations.
     */
    public void setLroMetadata(LongRunningMetadata lroMetadata) {
        this.lroMetadata = lroMetadata;
    }

    /**
     * Gets the convenience API.
     *
     * @return The convenience API.
     */
    public ConvenienceApi getConvenienceApi() {
        return convenienceApi;
    }

    /**
     * Sets the convenience API.
     *
     * @param convenienceApi The convenience API.
     */
    public void setConvenienceApi(ConvenienceApi convenienceApi) {
        this.convenienceApi = convenienceApi;
    }

    /**
     * Gets whether to generate protocol API.
     *
     * @return Whether to generate protocol API.
     */
    public Boolean getGenerateProtocolApi() {
        return generateProtocolApi;
    }

    /**
     * Sets whether to generate protocol API.
     *
     * @param generateProtocolApi Whether to generate protocol API.
     */
    public void setGenerateProtocolApi(Boolean generateProtocolApi) {
        this.generateProtocolApi = generateProtocolApi;
    }

    /**
     * Gets whether this is an internal API.
     *
     * @return Whether this is an internal API.
     */
    public Boolean getInternalApi() {
        return internalApi;
    }

    /**
     * Sets whether this is an internal API.
     *
     * @param internalApi Whether this is an internal API.
     */
    public void setInternalApi(Boolean internalApi) {
        this.internalApi = internalApi;
    }

    /**
     * Gets the cross-language definition ID.
     *
     * @return The cross-language definition ID.
     */
    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    /**
     * Sets the cross-language definition ID.
     *
     * @param crossLanguageDefinitionId The cross-language definition ID.
     */
    public void setCrossLanguageDefinitionId(String crossLanguageDefinitionId) {
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
    }

    @Override
    public JsonWriter toJson(JsonWriter jsonWriter) throws IOException {
        return super.writeParentProperties(jsonWriter.writeStartObject())
            .writeStringField("operationId", operationId)
            .writeArrayField("parameters", parameters, JsonWriter::writeJson)
            .writeArrayField("signatureParameters", signatureParameters, JsonWriter::writeJson)
            .writeArrayField("requests", requests, JsonWriter::writeJson)
            .writeArrayField("responses", responses, JsonWriter::writeJson)
            .writeArrayField("exceptions", exceptions, JsonWriter::writeJson)
            .writeJsonField("profile", profile)
            .writeStringField("$key", $key)
            .writeStringField("description", description)
            .writeStringField("uid", uid)
            .writeStringField("summary", summary)
            .writeArrayField("apiVersions", apiVersions, JsonWriter::writeJson)
            .writeJsonField("deprecated", deprecated)
            .writeJsonField("externalDocs", externalDocs)
            .writeArrayField("specialHeaders", specialHeaders, JsonWriter::writeString)
            .writeJsonField("lroMetadata", lroMetadata)
            .writeJsonField("convenienceApi", convenienceApi)
            .writeBooleanField("generateProtocolApi", generateProtocolApi)
            .writeBooleanField("internalApi", internalApi)
            .writeStringField("crossLanguageDefinitionId", crossLanguageDefinitionId)
            .writeEndObject();
    }

    /**
     * Deserializes an Operation instance from the JSON data.
     *
     * @param jsonReader The JSON reader to deserialize from.
     * @return An Operation instance deserialized from the JSON data.
     * @throws IOException If an error occurs during deserialization.
     */
    public static Operation fromJson(JsonReader jsonReader) throws IOException {
        return JsonUtils.readObject(jsonReader, Operation::new, (operation, fieldName, reader) -> {
            if (operation.tryConsumeParentProperties(operation, fieldName, reader)) {
                return;
            }

            if ("operationId".equals(fieldName)) {
                operation.operationId = reader.getString();
            } else if ("parameters".equals(fieldName)) {
                operation.parameters = reader.readArray(Parameter::fromJson);
            } else if ("signatureParameters".equals(fieldName)) {
                operation.signatureParameters = reader.readArray(Parameter::fromJson);
            } else if ("requests".equals(fieldName)) {
                operation.requests = reader.readArray(Request::fromJson);
            } else if ("responses".equals(fieldName)) {
                operation.responses = reader.readArray(Response::fromJson);
            } else if ("exceptions".equals(fieldName)) {
                operation.exceptions = reader.readArray(Response::fromJson);
            } else if ("profile".equals(fieldName)) {
                operation.profile = DictionaryApiVersion.fromJson(reader);
            } else if ("$key".equals(fieldName)) {
                operation.$key = reader.getString();
            } else if ("description".equals(fieldName)) {
                operation.description = reader.getString();
            } else if ("uid".equals(fieldName)) {
                operation.uid = reader.getString();
            } else if ("summary".equals(fieldName)) {
                operation.summary = reader.getString();
            } else if ("apiVersions".equals(fieldName)) {
                operation.apiVersions = reader.readArray(ApiVersion::fromJson);
            } else if ("deprecated".equals(fieldName)) {
                operation.deprecated = Deprecation.fromJson(reader);
            } else if ("externalDocs".equals(fieldName)) {
                operation.externalDocs = ExternalDocumentation.fromJson(reader);
            } else if ("specialHeaders".equals(fieldName)) {
                operation.specialHeaders = reader.readArray(JsonReader::getString);
            } else if ("lroMetadata".equals(fieldName)) {
                operation.lroMetadata = LongRunningMetadata.fromJson(reader);
            } else if ("convenienceApi".equals(fieldName)) {
                operation.convenienceApi = ConvenienceApi.fromJson(reader);
            } else if ("generateProtocolApi".equals(fieldName)) {
                operation.generateProtocolApi = reader.getBoolean();
            } else if ("internalApi".equals(fieldName)) {
                operation.internalApi = reader.getBoolean();
            } else if ("crossLanguageDefinitionId".equals(fieldName)) {
                operation.crossLanguageDefinitionId = reader.getString();
            } else {
                reader.skipChildren();
            }
        });
    }
}
