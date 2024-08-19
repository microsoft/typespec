// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import org.slf4j.Logger;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
        final int maxTryCount = 5;    // try a few time for recursive removal (e.g., 1st pass model removed, 2nd pass model used as its properties removed)

        boolean codeModelModified = true;
        for (int i = 0; i < maxTryCount && codeModelModified; ++i) {
            codeModelModified = tryCleanup(codeModel, javaNamesForPreserveModel);
        }

        return codeModel;
    }

    private static boolean tryCleanup(CodeModel codeModel, Set<String> javaNamesForPreserveModel) {
        Set<ObjectSchema> schemasNotInUse = codeModel.getSchemas().getObjects().stream()
//                .filter(SchemaCleanup::hasFlattenedExtension)
                .filter(schema -> schema.getChildren() == null || schema.getChildren().getImmediate() == null
                        || schema.getChildren().getImmediate().isEmpty())   // no children
                .filter(schema -> schema.getParents() == null || schema.getParents().getImmediate() == null
                        || schema.getParents().getImmediate().stream().allMatch(s -> {
                            if (s instanceof ObjectSchema) {
                                return !FluentType.nonResourceType((ObjectSchema) s);
                            } else {
                                return false;
                            }
                        }))
                .collect(Collectors.toSet());

        Set<Schema> choicesSchemasNotInUse = new HashSet<>(codeModel.getSchemas().getSealedChoices());
        choicesSchemasNotInUse.addAll(codeModel.getSchemas().getChoices());

        Set<Schema> schemasInUse = new HashSet<>();
        if (!schemasNotInUse.isEmpty() || !choicesSchemasNotInUse.isEmpty()) {
            // properties of object
            Set<Schema> propertiesOfObject = codeModel.getSchemas().getObjects().stream()
                    .filter(o -> {
                        String name = Utils.getJavaName(o);
                        return FluentType.nonSystemData(name) && FluentType.nonManagementError(name);
                    })
                    .flatMap(s -> s.getProperties().stream()
//                                    .filter(Utils::nonFlattenedProperty)
                                    .map(Property::getSchema)
                                    .map(SchemaCleanup::schemaOrElementInCollection)
                                    .filter(Objects::nonNull)
                                    .filter(s1 -> !Objects.equals(s, s1))   // schema of property is not the same of itself, solve the simplest recursive reference case
                    )
                    .collect(Collectors.toSet());
            schemasNotInUse.removeAll(propertiesOfObject);
            choicesSchemasNotInUse.removeAll(propertiesOfObject);
            schemasInUse.addAll(propertiesOfObject);
        }
        if (!schemasNotInUse.isEmpty() || !choicesSchemasNotInUse.isEmpty()) {
            // operation requests
            Set<Schema> requests = codeModel.getOperationGroups().stream()
                    .flatMap(og -> og.getOperations().stream())
                    .flatMap(o -> o.getRequests().stream())
                    .flatMap(r -> r.getParameters().stream())
                    .map(Parameter::getSchema)
                    .map(SchemaCleanup::schemaOrElementInCollection)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            schemasNotInUse.removeAll(requests);
            choicesSchemasNotInUse.removeAll(requests);
            schemasInUse.addAll(requests);
        }
        if (!schemasNotInUse.isEmpty() || !choicesSchemasNotInUse.isEmpty()) {
            // operation responses
            Set<Schema> responses = codeModel.getOperationGroups().stream()
                    .flatMap(og -> og.getOperations().stream())
                    .flatMap(o -> o.getResponses().stream())
                    .map(Response::getSchema)
                    .map(SchemaCleanup::schemaOrElementInCollection)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            schemasNotInUse.removeAll(responses);
            choicesSchemasNotInUse.removeAll(responses);
            schemasInUse.addAll(responses);
        }
        if (!schemasNotInUse.isEmpty() || !choicesSchemasNotInUse.isEmpty()) {
            // operation exception
            Set<Schema> exceptions = codeModel.getOperationGroups().stream()
                    .flatMap(og -> og.getOperations().stream())
                    .flatMap(o -> o.getExceptions().stream())
                    .map(Response::getSchema)
                    .map(SchemaCleanup::schemaOrElementInCollection)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            schemasNotInUse.removeAll(exceptions);
            choicesSchemasNotInUse.removeAll(exceptions);
            schemasInUse.addAll(exceptions);
        }
        if (!schemasNotInUse.isEmpty() || !choicesSchemasNotInUse.isEmpty()) {
            // parent schema as Dictionary or Array
            Set<Schema> elementsInParentCollection = schemasInUse.stream()
                .flatMap(s -> {
                    if (s instanceof ObjectSchema) {
                        ObjectSchema objectSchema = (ObjectSchema) s;
                        if (objectSchema.getParents() == null || objectSchema.getParents().getAll() == null) {
                            return Stream.empty();
                        }
                        return objectSchema.getParents().getAll()
                            .stream()
                            .filter(p -> p instanceof DictionarySchema || p instanceof ArraySchema)
                            .map(SchemaCleanup::schemaOrElementInCollection);
                    }
                    return Stream.empty();
                })
                .collect(Collectors.toSet());
            schemasNotInUse.removeAll(elementsInParentCollection);
            choicesSchemasNotInUse.removeAll(elementsInParentCollection);

            // discriminators
            Set<Schema> discriminators = schemasInUse.stream()
                    .map(s -> {
                        if (s instanceof ObjectSchema && ((ObjectSchema) s).getDiscriminator() != null) {
                            return ((ObjectSchema) s).getDiscriminator().getProperty().getSchema();
                        } else {
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            schemasNotInUse.removeAll(discriminators);
            choicesSchemasNotInUse.removeAll(discriminators);
        }

        AtomicBoolean codeModelModified = new AtomicBoolean(false);

        codeModel.getSchemas().getObjects().removeIf(s -> {
            boolean unused = schemasNotInUse.contains(s) && !javaNamesForPreserveModel.contains(Utils.getJavaName(s));
            if (unused) {
                LOGGER.info("Remove unused object schema '{}'", Utils.getJavaName(s));
                codeModelModified.set(true);
            }
            return unused;
        });

        codeModel.getSchemas().getSealedChoices().removeIf(s -> {
            boolean unused = choicesSchemasNotInUse.contains(s) && !javaNamesForPreserveModel.contains(Utils.getJavaName(s));
            if (unused) {
                LOGGER.info("Remove unused sealed choice schema '{}'", Utils.getJavaName(s));
                codeModelModified.set(true);
            }
            return unused;
        });

        codeModel.getSchemas().getChoices().removeIf(s -> {
            boolean unused = choicesSchemasNotInUse.contains(s) && !javaNamesForPreserveModel.contains(Utils.getJavaName(s));
            if (unused) {
                LOGGER.info("Remove unused choice schema '{}'", Utils.getJavaName(s));
                codeModelModified.set(true);
            }
            return unused;
        });

        return codeModelModified.get();
    }

    private static Schema schemaOrElementInCollection(Schema schema) {
        if (schema instanceof ArraySchema) {
            return schemaOrElementInCollection(((ArraySchema) schema).getElementType());
        } else if (schema instanceof DictionarySchema) {
            return schemaOrElementInCollection(((DictionarySchema) schema).getElementType());
        } else if (schema instanceof ObjectSchema || schema instanceof ChoiceSchema || schema instanceof SealedChoiceSchema) {
            return schema;
        } else {
            return null;
        }
    }

//    private static boolean hasFlattenedExtension(Schema schema) {
//        return schema.getExtensions() != null && schema.getExtensions().isXmsFlattened();
//    }
}
