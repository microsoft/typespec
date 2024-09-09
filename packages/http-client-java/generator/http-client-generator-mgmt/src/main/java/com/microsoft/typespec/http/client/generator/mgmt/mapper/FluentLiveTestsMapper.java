// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentClient;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExampleLiveTestStep;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentLiveTestCase;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentLiveTestStep;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentLiveTests;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentCollectionMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceCreateExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceUpdateExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.ResourceUpdate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentExampleTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ExampleLiveTestStep;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.LiveTestStep;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.LiveTests;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * A mapper to map vanilla live tests to fluent live tests.
 */
public class FluentLiveTestsMapper {
    private final PluginLogger logger = new PluginLogger(FluentGen.getPluginInstance(), FluentLiveTestsMapper.class);

    private final FluentExampleTemplate fluentExampleTemplate = FluentExampleTemplate.getInstance();

    private static final FluentLiveTestsMapper INSTANCE = new FluentLiveTestsMapper();

    public static FluentLiveTestsMapper getInstance(){
        return INSTANCE;
    }

    public FluentLiveTests map(LiveTests liveTests, FluentClient fluentClient, CodeModel codeModel, FluentJavaSettings fluentJavaSettings) {

        FluentLiveTests.Builder resultBuilder = FluentLiveTests.newBuilder();

        resultBuilder.className(liveTests.getFilename() + "Tests");

        resultBuilder.addTestCases(liveTests.getTestCases().stream().map(liveTestCase -> {
            FluentLiveTestCase.Builder testCaseBuilder = FluentLiveTestCase.newBuilder().methodName(CodeNamer.toCamelCase(liveTestCase.getName()));
            testCaseBuilder.addSteps(
                liveTestCase.getTestSteps()
                    .stream()
                    // future work: support other step types
                    .filter(testStep -> testStep instanceof ExampleLiveTestStep)
                    .map((Function<LiveTestStep, Optional<FluentLiveTestStep>>) step -> {
                        ExampleLiveTestStep exampleStep = (ExampleLiveTestStep) step;
                        String operationId = exampleStep.getOperationId();
                        // operationId is from testModel, if it's null, ignore the step.
                        if (operationId == null) {
                            logger.warn(String.format("null operationId found for example file step : %s", exampleStep.getExample().getName()));
                            return Optional.empty();
                        }
                        OperationGroupPair operationGroupPair = getOperationGroupPair(operationId, codeModel, fluentJavaSettings);
                        String operationGroup = operationGroupPair.operationGroup;
                        String operation = operationGroupPair.operation;
                        ProxyMethodExample example = exampleStep.getExample();
                        FluentResourceCollection resourceCollection = findResourceCollection(fluentClient, operationGroup);

                        FluentExampleTemplate.ExampleMethod exampleMethod = null;
                        // find collectionMethod
                        Optional<FluentCollectionMethod> collectionMethodOptional = findCollectionMethod(resourceCollection, operation);
                        if (collectionMethodOptional.isPresent()) {
                            FluentCollectionMethodExample collectionMethodExample = ExampleParser.parseMethodExample(
                                resourceCollection
                                , resourceCollection.getMethodsForTemplate()
                                    .stream()
                                    .filter(m -> m.getMethodName().contains(CodeNamer.toCamelCase(operation))) // getXxWithResponse
                                    .collect(Collectors.toList())
                                , example
                            );
                            exampleMethod = fluentExampleTemplate.generateExampleMethod(collectionMethodExample);
                            setExampleStepFeatures(resultBuilder, testCaseBuilder, collectionMethodExample, exampleMethod);
                        } else {
                            // find resourceCreate
                            Optional<ResourceCreate> createMethod = findResourceCreate(resourceCollection, operation);
                            if (createMethod.isPresent()) {
                                ResourceCreate create = createMethod.get();
                                FluentResourceCreateExample createExample = ExampleParser.parseResourceCreate(resourceCollection, create, example);
                                exampleMethod = fluentExampleTemplate.generateExampleMethod(createExample);
                                setExampleStepFeatures(resultBuilder, testCaseBuilder, createExample, exampleMethod);
                            } else {
                                // find resourceUpdate
                                Optional<ResourceUpdate> updateMethod = resourceCollection.getResourceUpdates().stream().filter(rc -> FluentUtils.exampleIsUpdate(rc.getMethodName()) && rc.getMethodName().equalsIgnoreCase(operation)).findFirst();
                                if (updateMethod.isPresent()) {
                                    ResourceUpdate update = updateMethod.get();
                                    FluentResourceUpdateExample updateExample = ExampleParser.parseResourceUpdate(resourceCollection, update, example);
                                    if (updateExample == null) {
                                        return Optional.empty();
                                    }
                                    exampleMethod = fluentExampleTemplate.generateExampleMethod(updateExample);
                                    setExampleStepFeatures(resultBuilder, testCaseBuilder, updateExample, exampleMethod);
                                }
                            }
                        }
                        if (exampleMethod != null) {
                            resultBuilder.addHelperFeatures(testCaseBuilder.getHelperFeatures());
                            return Optional.of(FluentExampleLiveTestStep.newBuilder().description(step.getDescription()).exampleMethod(exampleMethod).build());
                        } else {
                            // can't find method, ignore the whole test case altogether
                            logger.warn(String.format("Operation : %s not found, ignore this test case.", operationId));
                            return Optional.empty();
                        }
                    })
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toList()));
            return testCaseBuilder.build();
        }).collect(Collectors.toList()));

        return resultBuilder.build();
    }

    private OperationGroupPair getOperationGroupPair(String operationId, CodeModel codeModel, FluentJavaSettings fluentJavaSettings) {
        if (!operationId.contains("_")){
            return new OperationGroupPair(Utils.getNameForUngroupedOperations(codeModel, fluentJavaSettings), operationId);
        }
        String[] pair = operationId.split("_");
        return new OperationGroupPair(pair[0], pair[1]);
    }

    private void setExampleStepFeatures(FluentLiveTests.Builder resultBuilder, FluentLiveTestCase.Builder testCaseBuilder, FluentExample fluentExample, FluentExampleTemplate.ExampleMethod exampleMethod) {
        testCaseBuilder.addHelperFeatures(exampleMethod.getHelperFeatures());
        resultBuilder.addImports(exampleMethod.getImports())
            .managerName(fluentExample.getEntryName())
            .managerType(fluentExample.getEntryType());
    }

    private FluentResourceCollection findResourceCollection(FluentClient fluentClient, String operationGroup) {
        return fluentClient.getResourceCollections().stream().filter(collection -> collection.getInterfaceType().getName().equalsIgnoreCase(CodeNamer.getPlural(operationGroup))).findFirst().get();
    }

    private Optional<FluentCollectionMethod> findCollectionMethod(FluentResourceCollection resourceCollection, String operation) {
        return resourceCollection.getMethodsForTemplate().stream().filter(m -> m.getMethodName().contains(CodeNamer.toCamelCase(operation))).findFirst();
    }

    private Optional<ResourceCreate> findResourceCreate(FluentResourceCollection resourceCollection, String operation) {
        return resourceCollection.getResourceCreates().stream().filter(rc ->
            !FluentUtils.exampleIsUpdate(rc.getMethodName()) &&
                rc.getMethodName().equalsIgnoreCase(operation)).findFirst();
    }

    private static class OperationGroupPair {
        private final String operationGroup;
        private final String operation;

        public OperationGroupPair(String operationGroup, String operation) {
            this.operationGroup = operationGroup;
            this.operation = operation;
        }
    }


}
