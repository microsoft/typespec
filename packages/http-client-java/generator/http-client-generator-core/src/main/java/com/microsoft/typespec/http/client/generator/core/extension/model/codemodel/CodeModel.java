// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Set;

/**
 * Represents a code model.
 * <p>
 * A code model contains all the information required to generate a service API.
 */
public class CodeModel extends Client {
    private Info info;
    private Schemas schemas;
    private List<Client> clients = new ArrayList<>();
    private TestModel testModel;

    private String crossLanguagePackageId;
    private String crossLanguageVersion;

    /**
     * Validates inline operation metadata after code-model transformations, before mapping.
     */
    public void validateSseMetadata() {
        Set<Client> visited = Collections.newSetFromMap(new IdentityHashMap<>());
        validateSseMetadata(this, visited);
        clients.forEach(client -> validateSseMetadata(client, visited));
    }

    private void validateSseMetadata(Client client, Set<Client> visited) {
        if (!visited.add(client)) {
            return;
        }
        client.getOperationGroups().forEach(group -> group.getOperations().forEach(operation -> {
            SseMetadata metadata = operation.getSseMetadata();
            if (metadata != null) {
                validateSseMetadata(operation, metadata);
            }
        }));
        client.getSubClients().forEach(child -> validateSseMetadata(child, visited));
    }

    private static void validateSseMetadata(Operation operation, SseMetadata metadata) {
        String id = metadata.getSseStreamId();
        if (id == null || id.isEmpty()) {
            throw invalidSseMetadata(operation, id, "the stream ID is missing or empty");
        }
        if (metadata.getStreamName() == null || metadata.getStreamName().isEmpty()) {
            throw invalidSseMetadata(operation, id, "the stream name is missing or empty");
        }
        if (metadata.getModelNamespace() == null || metadata.getModelNamespace().isEmpty()) {
            throw invalidSseMetadata(operation, id, "the model namespace is missing or empty");
        }
        if (metadata.getEvents() == null || metadata.getEvents().isEmpty()) {
            throw invalidSseMetadata(operation, id, "the event list is null or empty");
        }
        for (SseEventMetadata event : metadata.getEvents()) {
            if (event == null) {
                throw invalidSseMetadata(operation, id, "the event list contains a null event");
            }
            if (event.getName() == null || event.getName().isEmpty()) {
                throw invalidSseMetadata(operation, id, "an event name is missing or empty");
            }
            if (event.getPayload() == null) {
                throw invalidSseMetadata(operation, id, "event '" + event.getName() + "' has no payload schema");
            }
        }
    }

    private static IllegalStateException invalidSseMetadata(Operation operation, String id, String reason) {
        return new IllegalStateException("Invalid SSE metadata for operation '" + operation.getOperationId()
            + "' with stream ID '" + id + "': " + reason + ".");
    }

    /**
     * Creates a new instance of the CodeModel class.
     */
    public CodeModel() {
        super();
    }

    /**
     * Gets the code model information. (Required)
     *
     * @return The code model information.
     */
    public Info getInfo() {
        return info;
    }

    /**
     * Sets the code model information. (Required)
     *
     * @param info The code model information.
     */
    public void setInfo(Info info) {
        this.info = info;
    }

    /**
     * Gets the full set of schemas for a given service, categorized into convenient collections. (Required)
     *
     * @return The full set of schemas for a given service, categorized into convenient collections.
     */
    public Schemas getSchemas() {
        return schemas;
    }

    /**
     * Sets the full set of schemas for a given service, categorized into convenient collections. (Required)
     *
     * @param schemas The full set of schemas for a given service, categorized into convenient collections.
     */
    public void setSchemas(Schemas schemas) {
        this.schemas = schemas;
    }

    /**
     * Gets the clients of the code model.
     *
     * @return The clients of the code model.
     */
    public List<Client> getClients() {
        return clients;
    }

    /**
     * Sets the clients of the code model.
     *
     * @param clients The clients of the code model.
     */
    public void setClients(List<Client> clients) {
        this.clients = clients;
    }

    /**
     * Gets the test model definition.
     *
     * @return The test model definition.
     */
    public TestModel getTestModel() {
        return testModel;
    }

    /**
     * Gets the cross-language package ID.
     *
     * @return The cross-language package ID.
     */
    public String getCrossLanguagePackageId() {
        return crossLanguagePackageId;
    }

    /**
     * Sets the cross-language package ID.
     *
     * @param crossLanguagePackageId The cross-language package ID.
     */
    public void setCrossLanguagePackageId(String crossLanguagePackageId) {
        this.crossLanguagePackageId = crossLanguagePackageId;
    }

    /**
     * Gets the cross-language version.
     *
     * @return The cross-language version.
     */
    public String getCrossLanguageVersion() {
        return crossLanguageVersion;
    }

    /**
     * Sets the cross-language version.
     *
     * @param crossLanguageVersion The cross-language version.
     */
    public void setCrossLanguageVersion(String crossLanguageVersion) {
        this.crossLanguageVersion = crossLanguageVersion;
    }

    /**
     * Sets the test model definition.
     *
     * @param testModel The test model definition.
     */
    public void setTestModel(TestModel testModel) {
        this.testModel = testModel;
    }
}
