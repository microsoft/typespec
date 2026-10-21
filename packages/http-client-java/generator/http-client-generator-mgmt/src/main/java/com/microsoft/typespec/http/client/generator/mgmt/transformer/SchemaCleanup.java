// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Queue;
import java.util.Set;
import org.slf4j.Logger;

/**
 * Cleans up unused flattened types.
 */
public class SchemaCleanup {

    private static final Logger LOGGER = new PluginLogger(FluentNamer.getPluginInstance(), SchemaCleanup.class);

    private final Set<String> javaNamesForPreserveModel;

    public SchemaCleanup(Set<String> javaNamesForPreserveModel) {
        this.javaNamesForPreserveModel = javaNamesForPreserveModel;
    }

    public CodeModel process(CodeModel codeModel) {
        Set<Schema> candidates = new LinkedHashSet<>();
        Map<Schema, Set<Schema>> outgoingReferences = new LinkedHashMap<>();
        Map<Schema, Integer> referenceCounts = new HashMap<>();
        Map<Schema, Set<Schema>> referenceDependencies = new HashMap<>();

        for (ObjectSchema object : codeModel.getSchemas().getObjects()) {
            if (canRemoveObject(object)) {
                candidates.add(object);
            }
            Set<Schema> references = new LinkedHashSet<>();
            String name = Utils.getJavaName(object);
            if (FluentType.nonSystemData(name) && FluentType.nonManagementError(name)) {
                for (Property property : object.getProperties()) {
                    Schema target = schemaOrElementInCollection(property.getSchema());
                    // A property referring to its own model doesn't keep an otherwise unused model alive.
                    if (target != null && !Objects.equals(object, target)) {
                        references.addAll(getReferenceDependencies(target, referenceDependencies));
                    }
                }
            }
            outgoingReferences.put(object, references);
            references.forEach(target -> referenceCounts.merge(target, 1, Integer::sum));
        }
        candidates.addAll(codeModel.getSchemas().getSealedChoices());
        candidates.addAll(codeModel.getSchemas().getChoices());
        candidates.removeIf(schema -> javaNamesForPreserveModel.contains(Utils.getJavaName(schema)));

        Set<Schema> operationReferences = new LinkedHashSet<>();
        for (OperationGroup group : ClientModelUtil.getAllOperationGroups(codeModel)) {
            group.getOperations().forEach(operation -> {
                operation.getRequests()
                    .forEach(request -> request.getParameters()
                        .forEach(parameter -> addReference(operationReferences, parameter.getSchema(),
                            referenceDependencies)));
                if (operation.getLroMetadata() == null) {
                    operation.getResponses()
                        .stream()
                        .map(Response::getSchema)
                        .forEach(schema -> addReference(operationReferences, schema, referenceDependencies));
                } else {
                    // TypeSpec LROs use the final result, not the initial response schema.
                    addReference(operationReferences, operation.getLroMetadata().getFinalResultType(),
                        referenceDependencies);
                }
                operation.getExceptions()
                    .stream()
                    .map(Response::getSchema)
                    .forEach(schema -> addReference(operationReferences, schema, referenceDependencies));
            });
        }
        operationReferences.forEach(target -> referenceCounts.merge(target, 1, Integer::sum));

        Queue<Schema> unused = new ArrayDeque<>();
        candidates.stream().filter(schema -> referenceCounts.getOrDefault(schema, 0) == 0).forEach(unused::add);
        Set<Schema> removed = new LinkedHashSet<>();
        while (!unused.isEmpty()) {
            Schema schema = unused.remove();
            if (!removed.add(schema)) {
                continue;
            }
            for (Schema target : outgoingReferences.getOrDefault(schema, Set.of())) {
                if (referenceCounts.merge(target, -1, Integer::sum) == 0 && candidates.contains(target)) {
                    unused.add(target);
                }
            }
        }

        codeModel.getSchemas().getObjects().removeIf(schema -> removeUnused(schema, removed, "object"));
        codeModel.getSchemas().getSealedChoices().removeIf(schema -> removeUnused(schema, removed, "sealed choice"));
        codeModel.getSchemas().getChoices().removeIf(schema -> removeUnused(schema, removed, "choice"));
        return codeModel;
    }

    private static boolean canRemoveObject(ObjectSchema schema) {
        return (schema.getChildren() == null
            || schema.getChildren().getImmediate() == null
            || schema.getChildren().getImmediate().isEmpty())
            && (schema.getParents() == null
                || schema.getParents().getImmediate() == null
                || schema.getParents()
                    .getImmediate()
                    .stream()
                    .allMatch(parent -> parent instanceof ObjectSchema
                        && !FluentType.nonResourceType((ObjectSchema) parent)));
    }

    private static void addReference(Set<Schema> references, Schema schema, Map<Schema, Set<Schema>> dependencies) {
        Schema target = schemaOrElementInCollection(schema);
        if (target != null) {
            references.addAll(getReferenceDependencies(target, dependencies));
        }
    }

    private static Set<Schema> getReferenceDependencies(Schema schema, Map<Schema, Set<Schema>> dependencies) {
        return dependencies.computeIfAbsent(schema, target -> {
            Set<Schema> result = new LinkedHashSet<>();
            result.add(target);
            if (target instanceof ObjectSchema) {
                ObjectSchema object = (ObjectSchema) target;
                if (object.getParents() != null && object.getParents().getAll() != null) {
                    object.getParents()
                        .getAll()
                        .stream()
                        .filter(parent -> parent instanceof ObjectSchema
                            || parent instanceof ArraySchema
                            || parent instanceof DictionarySchema)
                        .map(SchemaCleanup::schemaOrElementInCollection)
                        .filter(Objects::nonNull)
                        .forEach(result::add);
                }
            }
            // Include discriminator types of the referenced model and its parents, as in the original cleanup pass.
            for (Schema dependency : new ArrayList<>(result)) {
                if (dependency instanceof ObjectSchema && ((ObjectSchema) dependency).getDiscriminator() != null) {
                    Schema discriminator = ((ObjectSchema) dependency).getDiscriminator().getProperty().getSchema();
                    if (discriminator != null) {
                        result.add(discriminator);
                    }
                }
            }
            return result;
        });
    }

    private static boolean removeUnused(Schema schema, Set<Schema> removed, String kind) {
        if (!removed.contains(schema)) {
            return false;
        }
        LOGGER.info("Remove unused {} schema '{}'", kind, Utils.getJavaName(schema));
        return true;
    }

    private static Schema schemaOrElementInCollection(Schema schema) {
        if (schema instanceof ArraySchema) {
            return schemaOrElementInCollection(((ArraySchema) schema).getElementType());
        } else if (schema instanceof DictionarySchema) {
            return schemaOrElementInCollection(((DictionarySchema) schema).getElementType());
        } else if (schema instanceof ObjectSchema || schema instanceof ChoiceSchema) {
            return schema;
        } else {
            return null;
        }
    }
}
