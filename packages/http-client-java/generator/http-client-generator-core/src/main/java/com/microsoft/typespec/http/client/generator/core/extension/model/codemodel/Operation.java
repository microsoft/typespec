// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import io.clientcore.core.http.models.HttpMethod;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

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
     * Checks if this operation is pageable.
     *
     * @return true if this operation is pageable, false otherwise.
     */
    public boolean isPageable() {
        final XmsExtensions extensions = super.getExtensions();
        return extensions != null && extensions.getXmsPageable() != null;
    }

    /**
     * Checks if this operation is a long-running operation (LRO).
     *
     * @return true if this operation is a long-running operation, false otherwise.
     */
    public boolean isLro() {
        final XmsExtensions extensions = super.getExtensions();
        return extensions != null && extensions.isXmsLongRunningOperation();
    }

    /**
     * Checks if this operation has response defined with header schema.
     *
     * @return true if this operation has a header schema response, false otherwise.
     */
    public boolean hasHeaderSchemaResponse() {
        return responses.stream()
            .filter(r -> r.getProtocol() != null
                && r.getProtocol().getHttp() != null
                && r.getProtocol().getHttp().getHeaders() != null)
            .flatMap(r -> r.getProtocol().getHttp().getHeaders().stream().map(Header::getSchema))
            .anyMatch(Objects::nonNull);
    }

    /**
     * Gets a stream of schemas defined for this operation responses.
     *
     * @return a stream of response schemas.
     */
    public Stream<Schema> getResponseSchemas() {
        return responses.stream().map(Response::getSchema).filter(Objects::nonNull);
    }

    /**
     * Checks if this operation has a binary response.
     *
     * @return true if this operation has a binary response, false otherwise.
     */
    public boolean hasBinaryResponse() {
        return responses.stream().anyMatch(r -> Boolean.TRUE.equals(r.getBinary()));
    }

    /**
     * Inspects if this operation is to check a resource existence with Http HEAD.
     *
     * @return true if this operation checks resource existence with Http HEAD, false otherwise.
     */
    public boolean checksResourceExistenceWithHead() {
        return requests.stream()
            .anyMatch(req -> HttpMethod.HEAD.name().equalsIgnoreCase(req.getProtocol().getHttp().getMethod()))
            && responses.stream().anyMatch(res -> res.getProtocol().getHttp().getStatusCodes().contains("404"));
    }

    /**
     * Sets whether this is an internal API.
     *
     * @param internalApi Whether this is an internal API.
     */
    public void setInternalApi(Boolean internalApi) {
        this.internalApi = internalApi;
    }
}
