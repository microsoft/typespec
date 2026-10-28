// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Objects;
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
        validateSchemaIdentity(operation, id, "the base schema", metadata.getBaseSchema());
        Property eventName = findProperty(metadata.getBaseSchema(), "eventName");
        if (eventName == null) {
            throw invalidSseMetadata(operation, id, "the base schema has no eventName property");
        }
        if (!eventName.isRequired() || !eventName.isReadOnly()) {
            throw invalidSseMetadata(operation, id,
                "the base schema eventName property must be required and read-only");
        }
        if (!(eventName.getSchema() instanceof StringSchema)) {
            throw invalidSseMetadata(operation, id, "the base schema eventName property must be a string");
        }
        if (metadata.getEvents() == null || metadata.getEvents().isEmpty()) {
            throw invalidSseMetadata(operation, id, "the event list is null or empty");
        }
        Set<String> eventNames = new HashSet<>();
        for (SseEventMetadata event : metadata.getEvents()) {
            if (event == null) {
                throw invalidSseMetadata(operation, id, "the event list contains a null event");
            }
            if (event.getName() == null || event.getName().isEmpty()) {
                throw invalidSseMetadata(operation, id, "an event name is missing or empty");
            }
            if (!eventNames.add(event.getName())) {
                throw invalidSseMetadata(operation, id, "event name '" + event.getName() + "' is duplicated");
            }
            validateSchemaIdentity(operation, id, "event '" + event.getName() + "' schema", event.getEventSchema());
            String baseNamespace = effectiveLanguage(metadata.getBaseSchema()).getNamespace();
            String eventNamespace = effectiveLanguage(event.getEventSchema()).getNamespace();
            if (!Objects.equals(baseNamespace, eventNamespace)) {
                throw invalidSseMetadata(operation, id, "event '" + event.getName() + "' schema namespace '"
                    + eventNamespace + "' does not match the stream base schema namespace '" + baseNamespace + "'");
            }
            Property value = findProperty(event.getEventSchema(), "value");
            if (value == null) {
                throw invalidSseMetadata(operation, id, "event '" + event.getName() + "' schema has no value property");
            }
            if (!value.isRequired() || !value.isReadOnly()) {
                throw invalidSseMetadata(operation, id,
                    "event '" + event.getName() + "' value property must be required and read-only");
            }
            if (value.getSchema() == null) {
                throw invalidSseMetadata(operation, id,
                    "event '" + event.getName() + "' value property has no payload schema");
            }
            if (!hasExactlyOneImmediateParent(event.getEventSchema().getParents(), metadata.getBaseSchema())) {
                throw invalidSseMetadata(operation, id, "event '" + event.getName()
                    + "' schema must have exactly one immediate parent matching the stream base schema");
            }
            if (!hasAllParent(event.getEventSchema().getParents(), metadata.getBaseSchema())) {
                throw invalidSseMetadata(operation, id,
                    "event '" + event.getName() + "' schema all-parent list does not contain the stream base schema");
            }
        }
    }

    private static void validateSchemaIdentity(Operation operation, String id, String label, ObjectSchema schema) {
        if (schema == null) {
            throw invalidSseMetadata(operation, id, label + " is missing");
        }
        Language language = effectiveLanguage(schema);
        if (language == null || language.getName() == null || language.getName().isEmpty()) {
            throw invalidSseMetadata(operation, id, label + " has no usable name");
        }
        if (language.getNamespace() == null || language.getNamespace().isEmpty()) {
            throw invalidSseMetadata(operation, id, label + " has no usable namespace");
        }
    }

    private static Property findProperty(ObjectSchema schema, String serializedName) {
        if (schema == null || schema.getProperties() == null) {
            return null;
        }
        return schema.getProperties()
            .stream()
            .filter(Objects::nonNull)
            .filter(property -> serializedName.equals(property.getSerializedName()))
            .findFirst()
            .orElse(null);
    }

    private static boolean hasExactlyOneImmediateParent(Relations relations, ObjectSchema baseSchema) {
        if (relations == null) {
            return false;
        }
        List<Schema> parents = relations.getImmediate();
        return parents != null && parents.size() == 1 && sameSchema(parents.get(0), baseSchema);
    }

    private static boolean hasAllParent(Relations relations, ObjectSchema baseSchema) {
        if (relations == null) {
            return false;
        }
        List<Schema> parents = relations.getAll();
        return parents != null && parents.stream().anyMatch(parent -> sameSchema(parent, baseSchema));
    }

    private static boolean sameSchema(Schema first, ObjectSchema second) {
        if (!(first instanceof ObjectSchema)) {
            return false;
        }
        Language firstLanguage = effectiveLanguage((ObjectSchema) first);
        Language secondLanguage = effectiveLanguage(second);
        return firstLanguage != null
            && secondLanguage != null
            && Objects.equals(firstLanguage.getName(), secondLanguage.getName())
            && Objects.equals(firstLanguage.getNamespace(), secondLanguage.getNamespace());
    }

    private static Language effectiveLanguage(Metadata metadata) {
        if (metadata.getLanguage() == null) {
            return null;
        }
        Language java = metadata.getLanguage().getJava();
        if (java != null && java.getName() != null && !java.getName().isEmpty()) {
            return java;
        }
        return metadata.getLanguage().getDefault();
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
