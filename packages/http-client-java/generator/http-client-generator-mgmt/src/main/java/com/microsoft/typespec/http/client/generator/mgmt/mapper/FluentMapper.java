// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Value;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.model.ResourceCollectionAssociation;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentClient;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManager;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManagerProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Queue;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;

public class FluentMapper {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), FluentMapper.class);

    private final FluentJavaSettings fluentJavaSettings;

    public FluentMapper(FluentJavaSettings fluentJavaSettings) {
        this.fluentJavaSettings = fluentJavaSettings;
    }

    public void preModelMap(CodeModel codeModel) {
        processInnerModel(codeModel);
        ((FluentModelMapper) Mappers.getModelMapper())
            .addRemovedModels(fluentJavaSettings.getJavaNamesForRemoveModel());
    }

    public FluentClient map(CodeModel codeModel, Client client) {
        FluentClient fluentClient = basicMap(codeModel, client);

        // parse resource collections to identify create/update/refresh flow on resource instance
        for (ResourceCollectionAssociation overrideAssociation : fluentJavaSettings
            .getResourceCollectionAssociations()) {
            String modelName = overrideAssociation.getResource();
            String collectionName = overrideAssociation.getCollection();
            Optional<FluentResourceModel> modelOpt = fluentClient.getResourceModels()
                .stream()
                .filter(m -> Objects.equals(m.getName(), modelName))
                .findFirst();
            if (modelOpt.isPresent()) {
                FluentResourceModel model = modelOpt.get();
                if (collectionName == null) {
//                    // this resource model does not associate with any collection
//                    // use a dummy ResourceCreate to prevent future parseResourcesCategory invocation from process the model
//                    model.setResourceCreate(ResourceCreate.NO_ASSOCIATION);
                } else {
                    Optional<FluentResourceCollection> collectionOpt = fluentClient.getResourceCollections()
                        .stream()
                        .filter(c -> Objects.equals(c.getInterfaceType().getName(), collectionName))
                        .findFirst();
                    if (collectionOpt.isPresent()) {
                        FluentResourceCollection collection = collectionOpt.get();
                        ResourceParser.parseResourcesCategory(collection, List.of(model),
                            FluentStatic.getClient().getModels());
                    } else {
                        LOGGER.warn("Resource collection '{}' not found in association override '{}' to '{}'.",
                            collectionName, modelName, collectionName);
                    }
                }
            } else {
                LOGGER.warn("Resource model '{}' not found in association override '{}' to '{}'.", modelName, modelName,
                    collectionName);
            }
        }
        fluentClient.getResourceCollections()
            .forEach(c -> ResourceParser.parseResourcesCategory(c, fluentClient.getResourceModels(),
                FluentStatic.getClient().getModels()));
//        // clean up NO_ASSOCIATION
//        for (FluentResourceModel model : fluentClient.getResourceModels()) {
//            if (model.getResourceCreate() == ResourceCreate.NO_ASSOCIATION) {
//                model.setResourceCreate(null);
//            }
//        }
        ResourceParser.processAdditionalMethods(fluentClient);

        // samples
        if (fluentJavaSettings.isGenerateSamples()) {
            ExampleParser exampleParser = new ExampleParser();
            List<FluentExample> examples = fluentClient.getResourceCollections()
                .stream()
                .flatMap(rc -> exampleParser.parseResourceCollection(rc).stream())
                .sorted()
                .collect(Collectors.toList());
            fluentClient.getExamples().addAll(examples);
        }

        if (JavaSettings.getInstance().isGenerateTests()) {
            // live tests
            fluentClient.getLiveTests()
                .addAll(client.getLiveTests()
                    .stream()
                    .map(liveTests -> FluentLiveTestsMapper.getInstance()
                        .map(liveTests, fluentClient, codeModel, fluentJavaSettings))
                    .collect(Collectors.toList()));

            // mock API tests
            MockTestParser mockUnitTestParser = new MockTestParser();
            fluentClient.getMockUnitTests()
                .addAll(fluentClient.getResourceCollections()
                    .stream()
                    .flatMap(rc -> mockUnitTestParser.parseResourceCollectionForUnitTest(rc).stream())
                    .collect(Collectors.toList()));
        }

        return fluentClient;
    }

    FluentClient basicMap(CodeModel codeModel, Client client) {
        FluentClient fluentClient = new FluentClient(client);

        FluentStatic.setFluentClient(fluentClient);

        // manager, service API
        fluentClient.setManager(new FluentManager(client, Utils.getJavaName(codeModel)));

        // wrapper for response objects, potentially as resource instance
        fluentClient.getResourceModels()
            .addAll(codeModel.getSchemas()
                .getObjects()
                .stream()
                .map(o -> FluentResourceModelMapper.getInstance().map(o))
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));

        // resource collection APIs
        fluentClient.getResourceCollections()
            .addAll(codeModel.getOperationGroups()
                .stream()
                .map(og -> FluentResourceCollectionMapper.getInstance().map(og))
                .filter(Objects::nonNull)
                .collect(Collectors.toList()));

        // set resource collection APIs to service API
        fluentClient.getManager()
            .getProperties()
            .addAll(fluentClient.getResourceCollections()
                .stream()
                .map(FluentManagerProperty::new)
                .collect(Collectors.toList()));

        fluentClient.setModuleInfo(getModuleInfo(fluentClient));

        return fluentClient;
    }

    private ModuleInfo getModuleInfo(FluentClient fluentClient) {
        JavaSettings settings = JavaSettings.getInstance();
        ModuleInfo moduleInfo = new ModuleInfo(settings.getPackage());

        Client client = fluentClient.getInnerClient();
        Set<String> modelPackages = new LinkedHashSet<>();
        client.getModels().forEach(model -> modelPackages.add(model.getPackage()));
        client.getEnums()
            .stream()
            .filter(enumType -> !fluentJavaSettings.getJavaNamesForRemoveModel().contains(enumType.getName()))
            .forEach(enumType -> modelPackages.add(enumType.getPackage()));
        client.getResponseModels().forEach(response -> modelPackages.add(response.getPackage()));
        client.getExceptions().forEach(exception -> modelPackages.add(exception.getPackage()));
        client.getXmlSequenceWrappers().forEach(wrapper -> modelPackages.add(wrapper.getPackage()));
        fluentClient.getResourceModels().forEach(model -> modelPackages.add(model.getInterfaceType().getPackage()));
        fluentClient.getResourceCollections()
            .forEach(collection -> modelPackages.add(collection.getInterfaceType().getPackage()));

        List<ModuleInfo.RequireModule> requireModules = moduleInfo.getRequireModules();
        requireModules.add(new ModuleInfo.RequireModule("com.azure.core.management", true));

        List<ModuleInfo.ExportModule> exportModules = moduleInfo.getExportModules();
        exportModules.add(new ModuleInfo.ExportModule(settings.getPackage()));
        exportModules.add(new ModuleInfo.ExportModule(settings.getPackage(settings.getFluentSubpackage())));
        List<String> openToModules = new ArrayList<>();
        openToModules.add("com.azure.core");
        if (!settings.isStreamStyleSerialization()) {
            openToModules.add("com.fasterxml.jackson.databind");
        }
        List<ModuleInfo.OpenModule> openModules = moduleInfo.getOpenModules();
        String implementationModelsPackage
            = settings.getPackage(settings.getImplementationSubpackage(), settings.getModelsSubpackage());
        for (String packageName : List.of(settings.getPackage(settings.getFluentModelsSubpackage()),
            settings.getPackage(settings.getModelsSubpackage()), implementationModelsPackage)) {
            if (modelPackages.contains(packageName)) {
                if (!packageName.equals(implementationModelsPackage)) {
                    exportModules.add(new ModuleInfo.ExportModule(packageName));
                }
                openModules.add(new ModuleInfo.OpenModule(packageName, openToModules));
            }
        }

        return moduleInfo;
    }

    private void processInnerModel(CodeModel codeModel) {
        // Add "Inner" to method response types, then propagate it to models containing them as properties.

        final FluentObjectMapper objectMapper = (FluentObjectMapper) Mappers.getObjectMapper();

        Set<ObjectSchema> compositeTypes = Stream.concat(Stream.concat(Stream.concat(
            // ObjectSchema
            codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .filter(o -> !isPossiblePagedList(o))
                .flatMap(o -> o.getResponses().stream())
                .map(Response::getSchema),
            // Paged list
            codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .filter(FluentMapper::isPossiblePagedList)
                .flatMap(o -> o.getResponses().stream())
                .filter(r -> r.getSchema() instanceof ObjectSchema)
                .map(r -> (ObjectSchema) r.getSchema())
                .flatMap(s -> s.getProperties().stream())
                .filter(p -> p.getSerializedName().equals("value") && p.getSchema() instanceof ArraySchema)
                .map(p -> ((ArraySchema) p.getSchema()).getElementType())),
            // ArraySchema
            codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .flatMap(o -> o.getResponses().stream())
                .map(Response::getSchema)
                .filter(s -> s instanceof ArraySchema)
                .map(s -> ((ArraySchema) s).getElementType())),
            // DictionarySchema
            codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .flatMap(o -> o.getResponses().stream())
                .map(Response::getSchema)
                .filter(s -> s instanceof DictionarySchema)
                .map(s -> ((DictionarySchema) s).getElementType()))
            .filter(s -> s instanceof ObjectSchema)
            .map(s -> (ObjectSchema) s)
            .filter(FluentType::nonResourceType)
            .collect(Collectors.toSet());

        Set<ObjectSchema> errorTypes = codeModel.getOperationGroups()
            .stream()
            .flatMap(og -> og.getOperations().stream())
            .flatMap(o -> o.getExceptions().stream())
            .map(Response::getSchema)
            .filter(s -> s instanceof ObjectSchema)
            .map(s -> (ObjectSchema) s)
            .filter(o -> FluentType.nonManagementError(Utils.getJavaName(o)))
            .collect(Collectors.toSet());

        compositeTypes.removeAll(errorTypes);

        compositeTypes = objectMapper.addInnerModels(compositeTypes);
        // Marking an Inner model changes mapper state, not schema names or property edges. The same index can
        // therefore serve both response-derived seeds and explicitly requested additions below.
        Map<String, Set<ObjectSchema>> reverseReferences
            = compositeTypes.isEmpty() && fluentJavaSettings.getJavaNamesForAddInner().isEmpty()
                ? Map.of()
                : indexInnerModelReferences(codeModel);
        if (LOGGER.isInfoEnabled()) {
            LOGGER.info("Add Inner to response types: {}",
                compositeTypes.stream().map(Utils::getJavaName).collect(Collectors.toList()));
        }
        addInnerModelReferences(objectMapper, reverseReferences, compositeTypes);

        final Set<String> javaNamesForAddInner = fluentJavaSettings.getJavaNamesForAddInner();
        if (!javaNamesForAddInner.isEmpty()) {
            compositeTypes = codeModel.getSchemas()
                .getObjects()
                .stream()
                .filter(s -> javaNamesForAddInner.contains(Utils.getJavaName(s)))
                .collect(Collectors.toSet());

            compositeTypes = objectMapper.addInnerModels(compositeTypes);
            if (LOGGER.isInfoEnabled()) {
                LOGGER.info("Add Inner as requested: {}",
                    compositeTypes.stream().map(Utils::getJavaName).collect(Collectors.toList()));
            }
            addInnerModelReferences(objectMapper, reverseReferences, compositeTypes);
        }

        final Set<String> javaNamesForRemoveInner = fluentJavaSettings.getJavaNamesForRemoveInner();
        if (!javaNamesForRemoveInner.isEmpty()) {
            objectMapper.removeInnerModels(javaNamesForRemoveInner);
        }
    }

    private static boolean isPossiblePagedList(Operation operation) {
        return (operation.getExtensions() != null && operation.getExtensions().getXmsPageable() != null);
//                || (Utils.getJavaName(operation).equals(WellKnownMethodName.LIST) || Utils.getJavaName(operation).equals(WellKnownMethodName.LIST_BY_RESOURCE_GROUP));
    }

    /**
     * Maps a property type's Java name to the models that contain it, so propagation visits owners directly.
     * The original scan compared Java names, not schema identity; distinct schema objects with the same Java name
     * must therefore share a lookup entry. Preserve its search scope: direct object-valued properties on objects,
     * including object elements registered in the array and dictionary schema lists.
     */
    private static Map<String, Set<ObjectSchema>> indexInnerModelReferences(CodeModel codeModel) {
        Map<String, Set<ObjectSchema>> references = new LinkedHashMap<>();
        Stream
            .concat(
                Stream.concat(codeModel.getSchemas().getObjects().stream(),
                    codeModel.getSchemas()
                        .getArrays()
                        .stream()
                        .map(ArraySchema::getElementType)
                        .filter(s -> s instanceof ObjectSchema)
                        .map(s -> (ObjectSchema) s)),
                codeModel.getSchemas()
                    .getDictionaries()
                    .stream()
                    .map(DictionarySchema::getElementType)
                    .filter(s -> s instanceof ObjectSchema)
                    .map(s -> (ObjectSchema) s))
            .distinct()
            .filter(schema -> schema.getProperties() != null)
            .forEach(schema -> schema.getProperties()
                .stream()
                .map(Value::getSchema)
                .filter(type -> type instanceof ObjectSchema)
                .forEach(type -> {
                    String name = Utils.getJavaName(type);
                    if (name != null) {
                        references.computeIfAbsent(name, ignored -> new LinkedHashSet<>()).add(schema);
                    }
                }));
        return references;
    }

    /**
     * Walk reverse edges from each newly marked Inner model to its containing models. An explicit queue avoids
     * recursive stack growth on deep owner chains and repeated full-model searches at each propagation step.
     */
    private static void addInnerModelReferences(FluentObjectMapper objectMapper,
        Map<String, Set<ObjectSchema>> reverseReferences, Collection<ObjectSchema> compositeTypes) {
        Queue<ObjectSchema> pending = new ArrayDeque<>(compositeTypes);
        // Name-based visitation matches the index's equivalence rule, including distinct same-named instances.
        Set<String> visited = new LinkedHashSet<>();
        while (!pending.isEmpty()) {
            String typeName = Utils.getJavaName(pending.remove());
            if (typeName == null || !visited.add(typeName)) {
                continue;
            }
            // The mapper returns only newly marked owners. Requeue those, not every owner, so shared references
            // and cycles do not repeatedly propagate models that have already become Inner.
            Set<ObjectSchema> added = objectMapper.addInnerModels(reverseReferences.getOrDefault(typeName, Set.of()));
            if (added.isEmpty()) {
                continue;
            }
            if (LOGGER.isInfoEnabled()) {
                LOGGER.info("Add Inner for type '{}': {}", typeName,
                    added.stream().map(Utils::getJavaName).collect(Collectors.toList()));
            }
            pending.addAll(added);
        }
    }
}
