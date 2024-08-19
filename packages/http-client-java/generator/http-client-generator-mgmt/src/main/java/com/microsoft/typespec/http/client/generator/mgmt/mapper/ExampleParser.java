// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentClientMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentCollectionMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentMethodExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceCreateExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.FluentResourceUpdateExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel.ParameterExample;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.DefinitionStage;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.DefinitionStageBlank;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.DefinitionStageCreate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.DefinitionStageMisc;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.DefinitionStageParent;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentDefineMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.ResourceUpdate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.UpdateStage;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.UpdateStageApply;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.UpdateStageMisc;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleNode;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.LiteralNode;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.ModelExampleUtil;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

public class ExampleParser {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), ExampleParser.class);

    private final boolean aggregateExamples;

    public ExampleParser() {
        this(true);
    }

    public ExampleParser(boolean aggregateExamples) {
        this.aggregateExamples = aggregateExamples;
    }

    public List<FluentExample> parseMethodGroup(MethodGroupClient methodGroup) {
        List<FluentClientMethodExample> methodExamples = new ArrayList<>();

        methodGroup.getClientMethods().forEach(m -> {
            List<FluentClientMethodExample> examples = ExampleParser.parseMethod(methodGroup, m);
            if (examples != null) {
                methodExamples.addAll(examples);
            }
        });

        Map<String, FluentExample> examples = new HashMap<>();
        methodExamples.forEach(e -> {
            FluentExample example = getExample(examples, e.getMethodGroup(), e.getClientMethod(), e.getName());
            example.getClientMethodExamples().add(e);
        });

        return new ArrayList<>(examples.values());
    }

    public List<FluentExample> parseResourceCollection(FluentResourceCollection resourceCollection) {
        List<FluentCollectionMethodExample> methodExamples = new ArrayList<>();
        List<FluentResourceCreateExample> resourceCreateExamples = new ArrayList<>();
        List<FluentResourceUpdateExample> resourceUpdateExamples = new ArrayList<>();

        resourceCollection.getMethodsForTemplate().forEach(m -> {
            List<FluentCollectionMethodExample> examples = ExampleParser.parseMethod(resourceCollection, m);
            if (examples != null) {
                methodExamples.addAll(examples);
            }
        });
        resourceCollection.getResourceCreates().forEach(rc -> {
            List<FluentResourceCreateExample> examples = ExampleParser.parseResourceCreate(resourceCollection, rc);
            if (examples != null) {
                resourceCreateExamples.addAll(examples);
            }
        });
        resourceCollection.getResourceUpdates().forEach(ru -> {
            List<FluentResourceUpdateExample> examples = ExampleParser.parseResourceUpdate(resourceCollection, ru);
            if (examples != null) {
                resourceUpdateExamples.addAll(examples);
            }
        });

        Map<String, FluentExample> examples = new HashMap<>();
        methodExamples.forEach(e -> {
            FluentExample example = getExample(examples, e.getResourceCollection(), e.getCollectionMethod(), e.getName());
            example.getCollectionMethodExamples().add(e);
        });
        resourceCreateExamples.forEach(e -> {
            FluentExample example = getExample(examples, e.getResourceCollection(), e.getResourceCreate().getMethodReferences().iterator().next(), e.getName());
            example.getResourceCreateExamples().add(e);
        });
        resourceUpdateExamples.forEach(e -> {
            FluentExample example = getExample(examples, e.getResourceCollection(), e.getResourceUpdate().getMethodReferences().iterator().next(), e.getName());
            example.getResourceUpdateExamples().add(e);
        });

        return new ArrayList<>(examples.values());
    }

    private FluentExample getExample(Map<String, FluentExample> examples,
                                     FluentResourceCollection resourceCollection, FluentCollectionMethod collectionMethod,
                                     String exampleName) {
        return getExample(examples, resourceCollection.getInnerGroupClient(), collectionMethod.getInnerClientMethod(), exampleName);
    }

    private FluentExample getExample(Map<String, FluentExample> examples,
                                     MethodGroupClient methodGroup, ClientMethod clientMethod,
                                     String exampleName) {
        String groupName = methodGroup.getClassBaseName();
        String methodName = clientMethod.getProxyMethod().getName();
        String name = CodeNamer.toPascalCase(groupName) + CodeNamer.toPascalCase(methodName);
        if (!this.aggregateExamples) {
            name += com.microsoft.typespec.http.client.generator.core.preprocessor.namer.CodeNamer.getTypeName(exampleName);
        }
        FluentExample example = examples.get(name);
        if (example == null) {
            example = new FluentExample(CodeNamer.toPascalCase(groupName), CodeNamer.toPascalCase(methodName),
                    this.aggregateExamples ? null : exampleName);
            examples.put(name, example);
        }
        return example;
    }

    private static List<FluentCollectionMethodExample> parseMethod(FluentResourceCollection collection, FluentCollectionMethod collectionMethod) {
        List<FluentCollectionMethodExample> ret = null;

        ClientMethod clientMethod = collectionMethod.getInnerClientMethod();
        if (FluentUtils.validRequestContentTypeToGenerateExample(clientMethod)) {
            ret = new ArrayList<>();

            List<MethodParameter> methodParameters = MethodUtil.getParameters(clientMethod);
            for (Map.Entry<String, ProxyMethodExample> entry : collectionMethod.getInnerClientMethod().getProxyMethod().getExamples().entrySet()) {
                LOGGER.info("Parse collection method example '{}'", entry.getKey());

                FluentCollectionMethodExample collectionMethodExample =
                        parseMethodForExample(collection, collectionMethod, methodParameters, entry.getKey(), entry.getValue());
                ret.add(collectionMethodExample);
            }
        }
        return ret;
    }

    private static List<FluentClientMethodExample> parseMethod(MethodGroupClient methodGroup, ClientMethod clientMethod) {
        List<FluentClientMethodExample> ret = null;

        if (FluentUtils.validRequestContentTypeToGenerateExample(clientMethod)) {
            ret = new ArrayList<>();

            List<MethodParameter> methodParameters = MethodUtil.getParameters(clientMethod);
            for (Map.Entry<String, ProxyMethodExample> entry : clientMethod.getProxyMethod().getExamples().entrySet()) {
                LOGGER.info("Parse client method example '{}'", entry.getKey());

                FluentClientMethodExample clientMethodExample =
                        parseMethodForExample(methodGroup, clientMethod, methodParameters, entry.getKey(), entry.getValue());
                ret.add(clientMethodExample);
            }
        }
        return ret;
    }

    protected static FluentCollectionMethodExample parseMethodForExample(FluentResourceCollection collection, FluentCollectionMethod collectionMethod,
                                                                       List<MethodParameter> methodParameters,
                                                                       String exampleName, ProxyMethodExample proxyMethodExample) {
        FluentCollectionMethodExample collectionMethodExample = new FluentCollectionMethodExample(
                exampleName, proxyMethodExample.getRelativeOriginalFileName(),
                FluentStatic.getFluentManager(), collection, collectionMethod);

        addMethodParametersToMethodExample(methodParameters, proxyMethodExample, collectionMethodExample);
        return collectionMethodExample;
    }

    public static FluentCollectionMethodExample parseMethodExample(FluentResourceCollection resourceCollection, Collection<FluentCollectionMethod> collectionMethods, ProxyMethodExample example) {
        FluentCollectionMethod collectionMethod = collectionMethods.stream().filter(method -> FluentUtils.requiresExample(method.getInnerClientMethod())).findFirst().get();
        return parseMethodForExample(resourceCollection, collectionMethod, MethodUtil.getParameters(collectionMethod.getInnerClientMethod()), example.getName(), example);
    }

    private static FluentClientMethodExample parseMethodForExample(
            MethodGroupClient methodGroup, ClientMethod clientMethod, List<MethodParameter> methodParameters,
            String exampleName, ProxyMethodExample proxyMethodExample) {

        FluentClientMethodExample clientMethodExample = new FluentClientMethodExample(
                exampleName, proxyMethodExample.getRelativeOriginalFileName(), methodGroup, clientMethod);

        addMethodParametersToMethodExample(methodParameters, proxyMethodExample, clientMethodExample);
        return clientMethodExample;
    }

    private static void addMethodParametersToMethodExample(List<MethodParameter> methodParameters, ProxyMethodExample proxyMethodExample, FluentMethodExample methodExample) {
        for (MethodParameter methodParameter : methodParameters) {
            ExampleNode node = ModelExampleUtil.parseNodeFromParameter(proxyMethodExample, methodParameter);

            if (node.getObjectValue() == null) {
                if (methodParameter.getClientMethodParameter().isRequired()) {
                    LOGGER.warn("Failed to assign sample value to required parameter '{}'", methodParameter.getClientMethodParameter().getName());
                }
            }

            ParameterExample parameterExample = new ParameterExample(node);
            methodExample.getParameters().add(parameterExample);
        }
    }

    private static List<FluentResourceCreateExample> parseResourceCreate(FluentResourceCollection collection, ResourceCreate resourceCreate) {
        List<FluentResourceCreateExample> ret = null;

        final boolean methodIsCreateOrUpdate = methodIsCreateOrUpdate(resourceCreate.getResourceModel());

        List<FluentCollectionMethod> collectionMethods = resourceCreate.getMethodReferences();
        for (FluentCollectionMethod collectionMethod : collectionMethods) {
            ClientMethod clientMethod = collectionMethod.getInnerClientMethod();
            if (FluentUtils.validRequestContentTypeToGenerateExample(clientMethod)) {
                if (ret == null) {
                    ret = new ArrayList<>();
                }

                List<MethodParameter> methodParameters = MethodUtil.getParameters(clientMethod);
                MethodParameter requestBodyParameter = findRequestBodyParameter(methodParameters);

                for (Map.Entry<String, ProxyMethodExample> entry : collectionMethod.getInnerClientMethod().getProxyMethod().getExamples().entrySet()) {
                    if (methodIsCreateOrUpdate && FluentUtils.exampleIsUpdate(entry.getKey())) {
                        // likely a resource update example
                        LOGGER.info("Skip possible resource update example '{}' in create", entry.getKey());
                        continue;
                    }

                    LOGGER.info("Parse resource create example '{}'", entry.getKey());

                    FluentResourceCreateExample resourceCreateExample = parseResourceCreate(collection, resourceCreate, entry.getValue(), methodParameters, requestBodyParameter);

                    ret.add(resourceCreateExample);
                }
            }
        }
        return ret;
    }

    protected static FluentResourceCreateExample parseResourceCreate(FluentResourceCollection collection, ResourceCreate resourceCreate, ProxyMethodExample example, List<MethodParameter> methodParameters, MethodParameter requestBodyParameter) {
        FluentResourceCreateExample resourceCreateExample = new FluentResourceCreateExample(
                example.getName(), example.getRelativeOriginalFileName(),
                FluentStatic.getFluentManager(), collection, resourceCreate);

        FluentDefineMethod defineMethod = resourceCreate.getDefineMethod();
        ExampleNode defineNode = null;
        if (defineMethod.getMethodParameter() != null) {
            MethodParameter methodParameter = findMethodParameter(methodParameters, defineMethod.getMethodParameter());
            defineNode = ModelExampleUtil.parseNodeFromParameter(example, methodParameter);

            if (defineNode.getObjectValue() == null) {
                LOGGER.warn("Failed to assign sample value to define method '{}'", defineMethod.getName());
            }
        }
        resourceCreateExample.getParameters().add(new ParameterExample(defineMethod, defineNode));

        for (DefinitionStage stage : resourceCreate.getDefinitionStages()) {
            List<FluentMethod> fluentMethods = stage.getMethods();
            if (!fluentMethods.isEmpty()) {
                FluentMethod fluentMethod = fluentMethods.iterator().next();
                List<ExampleNode> exampleNodes = new ArrayList<>();

                if (stage instanceof DefinitionStageBlank || stage instanceof DefinitionStageCreate) {
                    // blank and create stage does not have parameter
                } else if (stage instanceof DefinitionStageParent) {
                    List<MethodParameter> parameters = fluentMethod.getParameters().stream()
                            .map(p -> findMethodParameter(methodParameters, p))
                            .collect(Collectors.toList());
                    exampleNodes.addAll(parameters.stream()
                            .map(p -> ModelExampleUtil.parseNodeFromParameter(example, p))
                            .collect(Collectors.toList()));
                } else if (stage instanceof DefinitionStageMisc) {
                    DefinitionStageMisc miscStage = (DefinitionStageMisc) stage;
                    MethodParameter methodParameter = findMethodParameter(methodParameters, miscStage.getMethodParameter());
                    ExampleNode node = ModelExampleUtil.parseNodeFromParameter(example, methodParameter);

                    if (stage.isMandatoryStage() || !node.isNull()) {
                        exampleNodes.add(node);
                    }
                } else {
                    ModelProperty modelProperty = stage.getModelProperty();
                    if (modelProperty != null) {
                        ExampleNode node = parseNodeFromModelProperty(example, requestBodyParameter, resourceCreate.getRequestBodyParameterModel(), modelProperty);

                        if (stage.isMandatoryStage() || !node.isNull()) {
                            exampleNodes.add(node);
                        }
                    }
                }

                if (exampleNodes.stream().anyMatch(ExampleNode::isNull)) {
                    if (stage.isMandatoryStage()) {
                        LOGGER.warn("Failed to assign sample value to required stage '{}'", stage.getName());
                    }
                }

                if (!exampleNodes.isEmpty()) {
                    resourceCreateExample.getParameters().add(new ParameterExample(fluentMethod, exampleNodes));
                }
            }
        }
        return resourceCreateExample;
    }

    public static FluentResourceCreateExample parseResourceCreate(FluentResourceCollection resourceCollection, ResourceCreate create, ProxyMethodExample example) {
        List<MethodParameter> methodParameters = MethodUtil.getParameters(
            create.getMethodReferences()
                .stream()
                .filter(collectionMethod-> FluentUtils.requiresExample(collectionMethod.getInnerClientMethod()))
                .findFirst().get()
                .getInnerClientMethod());
        MethodParameter requestBodyParameter = findRequestBodyParameter(methodParameters);
        return parseResourceCreate(resourceCollection, create, example, methodParameters, requestBodyParameter);
    }

    private static List<FluentResourceUpdateExample> parseResourceUpdate(FluentResourceCollection collection, ResourceUpdate resourceUpdate) {
        List<FluentResourceUpdateExample> ret = null;

        final boolean methodIsCreateOrUpdate = methodIsCreateOrUpdate(resourceUpdate.getResourceModel());
        FluentCollectionMethod resourceGetMethod = findResourceGetMethod(resourceUpdate);
        if (resourceGetMethod == null) {
            // 'get' method not found
            return null;
        }
        List<MethodParameter> resourceGetMethodParameters = MethodUtil.getParameters(resourceGetMethod.getInnerClientMethod());

        List<FluentCollectionMethod> collectionMethods = resourceUpdate.getMethodReferences();
        for (FluentCollectionMethod collectionMethod : collectionMethods) {
            ClientMethod clientMethod = collectionMethod.getInnerClientMethod();
            if (FluentUtils.validRequestContentTypeToGenerateExample(clientMethod)) {
                if (ret == null) {
                    ret = new ArrayList<>();
                }

                List<MethodParameter> methodParameters = MethodUtil.getParameters(clientMethod);
                MethodParameter requestBodyParameter = findRequestBodyParameter(methodParameters);

                for (Map.Entry<String, ProxyMethodExample> entry : collectionMethod.getInnerClientMethod().getProxyMethod().getExamples().entrySet()) {
                    if (methodIsCreateOrUpdate && !FluentUtils.exampleIsUpdate(entry.getKey())) {
                        // likely not a resource update example
                        LOGGER.info("Skip possible resource create example '{}' in update", entry.getKey());
                        continue;
                    }

                    LOGGER.info("Parse resource update example '{}'", entry.getKey());

                    ProxyMethodExample example = entry.getValue();
                    FluentResourceUpdateExample resourceUpdateExample = parseResourceUpdate(collection, resourceUpdate, example, resourceGetMethod, resourceGetMethodParameters, methodParameters, requestBodyParameter);

                    ret.add(resourceUpdateExample);
                }
            }
        }
        return ret;
    }

    private static FluentCollectionMethod findResourceGetMethod(ResourceUpdate resourceUpdate) {
        FluentCollectionMethod resourceGetMethod = null;
        if (resourceUpdate.getResourceModel().getResourceRefresh() != null) {
            resourceGetMethod = resourceUpdate.getResourceModel().getResourceRefresh().getMethodReferences().stream()
                    .filter(m -> m.getInnerClientMethod().getParameters().stream().anyMatch(p -> ClassType.CONTEXT.equals(p.getClientType())))
                    .findFirst().orElse(null);
        }
        return resourceGetMethod;
    }

    private static FluentResourceUpdateExample parseResourceUpdate(FluentResourceCollection collection, ResourceUpdate resourceUpdate, ProxyMethodExample example, FluentCollectionMethod resourceGetMethod, List<MethodParameter> resourceGetMethodParameters, List<MethodParameter> methodParameters, MethodParameter requestBodyParameter) {
        FluentCollectionMethodExample resourceGetExample =
                parseMethodForExample(collection, resourceGetMethod, resourceGetMethodParameters, example.getName(), example);
        FluentResourceUpdateExample resourceUpdateExample = new FluentResourceUpdateExample(
                example.getName(), example.getRelativeOriginalFileName(),
                FluentStatic.getFluentManager(), collection, resourceUpdate, resourceGetExample);

        for (UpdateStage stage : resourceUpdate.getUpdateStages()) {
            List<FluentMethod> fluentMethods = stage.getMethods();
            if (!fluentMethods.isEmpty()) {
                FluentMethod fluentMethod = fluentMethods.iterator().next();
                List<ExampleNode> exampleNodes = new ArrayList<>();

                if (stage instanceof UpdateStageApply) {
                    // apply stage does not have parameter
                } else if (stage instanceof UpdateStageMisc) {
                    UpdateStageMisc miscStage = (UpdateStageMisc) stage;
                    MethodParameter methodParameter = findMethodParameter(methodParameters, miscStage.getMethodParameter());
                    ExampleNode node = ModelExampleUtil.parseNodeFromParameter(example, methodParameter);

                    if (!node.isNull()) {
                        exampleNodes.add(node);
                    }
                } else {
                    ModelProperty modelProperty = stage.getModelProperty();
                    if (modelProperty != null) {
                        ExampleNode node = parseNodeFromModelProperty(example, requestBodyParameter, resourceUpdate.getRequestBodyParameterModel(), modelProperty);

                        if (!node.isNull()) {
                            exampleNodes.add(node);
                        }
                    }
                }

                if (!exampleNodes.isEmpty()) {
                    resourceUpdateExample.getParameters().add(new ParameterExample(fluentMethod, exampleNodes));
                }
            }
        }
        return resourceUpdateExample;
    }

    public static FluentResourceUpdateExample parseResourceUpdate(FluentResourceCollection resourceCollection, ResourceUpdate resourceUpdate, ProxyMethodExample example) {
        FluentCollectionMethod resourceGetMethod = findResourceGetMethod(resourceUpdate);
        if (resourceGetMethod == null) {
            // 'get' method not found
            return null;
        }
        List<MethodParameter> resourceGetMethodParameters = MethodUtil.getParameters(resourceGetMethod.getInnerClientMethod());
        List<MethodParameter> methodParameters = MethodUtil.getParameters(
            resourceUpdate.getMethodReferences()
                .stream()
                .filter(collectionMethod-> FluentUtils.requiresExample(collectionMethod.getInnerClientMethod()))
                .findFirst().get()
                .getInnerClientMethod()
        );
        MethodParameter requestBodyParameter = findRequestBodyParameter(methodParameters);
        return parseResourceUpdate(resourceCollection, resourceUpdate, example, resourceGetMethod, resourceGetMethodParameters, methodParameters, requestBodyParameter);

    }

    protected static MethodParameter findRequestBodyParameter(List<MethodParameter> methodParameters) {
        return methodParameters.stream()
                .filter(p -> p.getProxyMethodParameter().getRequestParameterLocation() == RequestParameterLocation.BODY)
                .findFirst().orElse(null);
    }

    private static MethodParameter findMethodParameter(List<MethodParameter> methodParameters, ClientMethodParameter clientMethodParameter) {
        MethodParameter parameter = methodParameters.stream()
                .filter(p -> p.getClientMethodParameter() == clientMethodParameter)
                .findFirst().orElse(null);
        if (parameter == null) {
            parameter = methodParameters.stream()
                    .filter(p -> p.getClientMethodParameter().getName().equals(clientMethodParameter.getName()))
                    .findFirst().orElse(null);
        }
        return parameter;
    }

    private static ExampleNode parseNodeFromModelProperty(ProxyMethodExample example, MethodParameter methodParameter,
                                                          ClientModel clientModel, ModelProperty modelProperty) {
        String serializedName = methodParameter.getProxyMethodParameter().getName();

        ProxyMethodExample.ParameterValue parameterValue = ModelExampleUtil.findParameter(example, serializedName);
        ExampleNode node;
        if (parameterValue == null) {
            node = new LiteralNode(modelProperty.getClientType(), null);
        } else {
            List<String> jsonPropertyNames = modelProperty.getSerializedNames();

            Object childObjectValue = ModelExampleUtil.getChildObjectValue(jsonPropertyNames, parameterValue.getObjectValue());
            if (childObjectValue != null) {
                node = ModelExampleUtil.parseNode(modelProperty.getClientType(), modelProperty.getWireType(), childObjectValue);
            } else {
                node = new LiteralNode(modelProperty.getClientType(), null);
            }
        }
        return node;
    }

    private static boolean methodIsCreateOrUpdate(FluentResourceModel resourceModel) {
        return resourceModel.getResourceCreate() != null && resourceModel.getResourceUpdate() != null
                && Objects.equals(resourceModel.getResourceCreate().getMethodReferences().iterator().next().getMethodName(), resourceModel.getResourceUpdate().getMethodReferences().iterator().next().getMethodName());
    }
}
