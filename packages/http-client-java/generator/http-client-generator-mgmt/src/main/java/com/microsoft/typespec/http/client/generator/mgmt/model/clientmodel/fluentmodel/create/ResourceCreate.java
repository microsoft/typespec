// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.ResourceTypeName;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.ModelCategory;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceOperation;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentConstructorByName;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentCreateMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentDefineMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethodParameterMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethodType;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentModelPropertyMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentModelPropertyRegion;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentParentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ResourceCreate extends ResourceOperation {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), ResourceCreate.class);

    private List<DefinitionStage> definitionStages;

    private FluentDefineMethod defineMethod;

//    public static final ResourceCreate NO_ASSOCIATION = new ResourceCreate(null, null, null, null, null);

    public ResourceCreate(FluentResourceModel resourceModel, FluentResourceCollection resourceCollection,
                          UrlPathSegments urlPathSegments, String methodName, ClientModel bodyParameterModel) {
        super(resourceModel, resourceCollection, urlPathSegments, methodName, bodyParameterModel);

        if (resourceModel != null) {
            LOGGER.info("ResourceCreate: Fluent model '{}', method reference '{}', body parameter '{}'",
                    resourceModel.getName(), methodName, bodyParameterModel.getName());
        }
    }

    public List<DefinitionStage> getDefinitionStages() {
        if (definitionStages != null) {
            return definitionStages;
        }

        definitionStages = new ArrayList<>();

        // blank
        DefinitionStageBlank definitionStageBlank = new DefinitionStageBlank();

        // parent
        DefinitionStageParent definitionStageParent = null;
        switch (this.getResourceModel().getCategory()) {
            case RESOURCE_GROUP_AS_PARENT:
                definitionStageParent = new DefinitionStageParent(deduplicateStageName("WithResourceGroup"));
                break;

            case NESTED_CHILD:
            case SCOPE_NESTED_CHILD:
                definitionStageParent = new DefinitionStageParent(deduplicateStageName("WithParentResource"));
                break;

            case SCOPE_AS_PARENT:
                definitionStageParent = new DefinitionStageParent(deduplicateStageName("WithScope"));
                break;
        }

        // create
        DefinitionStageCreate definitionStageCreate = new DefinitionStageCreate();

        definitionStages.add(definitionStageBlank);

        // required properties
        List<ModelProperty> requiredProperties = this.getRequiredProperties();

        DefinitionStage lastStage = null;
        if (!requiredProperties.isEmpty()) {
            for (ModelProperty property : requiredProperties) {
                DefinitionStage stage = new DefinitionStage("With" + CodeNamer.toPascalCase(property.getName()), property);
                if (lastStage == null) {
                    // first property
                    if (isLocationProperty(property)) {
                        definitionStageBlank.setExtendStages(stage.getName());
                        definitionStageBlank.setNextStage(stage);

                        if (definitionStageParent != null) {
                            // insert parent stage as 2nd stage
                            definitionStages.add(stage);

                            lastStage = stage;
                            stage = definitionStageParent;
                        }
                    } else if (definitionStageParent != null) {
                        // insert parent stage as 1st stage
                        definitionStageBlank.setExtendStages(definitionStageParent.getName());
                        definitionStageBlank.setNextStage(definitionStageParent);

                        definitionStages.add(definitionStageParent);
                        lastStage = definitionStageParent;
                    } else {
                        definitionStageBlank.setExtendStages(stage.getName());
                    }
                }

                if (lastStage != null) {
                    lastStage.setNextStage(stage);
                }

                definitionStages.add(stage);
                lastStage = stage;
            }
        } else {
            if (definitionStageParent == null) {
                definitionStageBlank.setExtendStages(definitionStageCreate.getName());
                lastStage = definitionStageBlank;
            } else {
                definitionStageBlank.setExtendStages(definitionStageParent.getName());
                lastStage = definitionStageParent;
                definitionStages.add(definitionStageParent);
            }
        }

        lastStage.setNextStage(definitionStageCreate);
        definitionStages.add(definitionStageCreate);

        for (DefinitionStage stage : definitionStages) {
            if (stage.getModelProperty() != null) {
                this.generatePropertyMethods(stage, requestBodyParameterModel, stage.getModelProperty());
            }
        }

        // create method
        definitionStageCreate.getMethods().add(this.getCreateMethod(false));
        definitionStageCreate.getMethods().add(this.getCreateMethod(true));

        if (definitionStageParent != null) {
            // existing parent method after all stages is connected.
            definitionStageParent.setExistingParentMethod(this.getExistingParentMethod(definitionStageParent));
        }

        List<DefinitionStage> optionalDefinitionStages = new ArrayList<>();
        // non-required properties
        List<ModelProperty> nonRequiredProperties = this.getNonRequiredProperties();
        for (ModelProperty property : nonRequiredProperties) {
            DefinitionStage stage = new DefinitionStage("With" + CodeNamer.toPascalCase(property.getName()), property);
            stage.setNextStage(definitionStageCreate);

            this.generatePropertyMethods(stage, requestBodyParameterModel, property);

            optionalDefinitionStages.add(stage);
        }
        // header and query parameters
        List<ClientMethodParameter> miscParameters = this.getMiscParameters();
        for (ClientMethodParameter parameter : miscParameters) {
            // it is possible that parameter got same name as one of the model properties
            String parameterNameForMethodSignature = deduplicateParameterNameForMethodSignature(
                    definitionStages, optionalDefinitionStages, parameter.getName());

            DefinitionStage stage = new DefinitionStageMisc("With" + CodeNamer.toPascalCase(parameterNameForMethodSignature), parameter);
            stage.setNextStage(definitionStageCreate);

            stage.getMethods().add(this.getParameterSetterMethod(stage, parameter, parameterNameForMethodSignature));

            optionalDefinitionStages.add(stage);
        }

        if (!optionalDefinitionStages.isEmpty()) {
            definitionStageCreate.setExtendStages(optionalDefinitionStages.stream()
                    .map(s -> String.format("%1$s.%2$s", ModelNaming.MODEL_FLUENT_INTERFACE_DEFINITION_STAGES, s.getName()))
                    .collect(Collectors.joining(", ")));
        }

        definitionStages.addAll(optionalDefinitionStages);

        return definitionStages;
    }

    private String deduplicateStageName(String stageName) {
        Set<String> propertyStageNames = this.getProperties().stream()
                .map(p -> "With" + CodeNamer.toPascalCase(p.getName()))
                .collect(Collectors.toSet());
        Set<String> parameterStageNames = this.getMiscParameters().stream()
                .map(p -> "With" + CodeNamer.toPascalCase(p.getName()))
                .collect(Collectors.toSet());
        if (propertyStageNames.contains(stageName) || parameterStageNames.contains(stageName)) {
            stageName += "Stage";
        }
        return stageName;
    }

    private List<ModelProperty> getRequiredProperties() {
        return this.getProperties().stream()
                .filter(p -> p.isRequired())
                .collect(Collectors.toList());
    }

    private List<ModelProperty> getNonRequiredProperties() {
        return this.getProperties().stream()
                .filter(p -> !p.isRequired())
                .collect(Collectors.toList());
    }

    @Override
    protected List<ModelProperty> getProperties() {
        return super.getProperties().stream()
                .filter(p -> !p.isReadOnlyForCreate())
                .filter(p -> !isIdProperty(p))           // create should not be able to set id
                .collect(Collectors.toList());
    }

    @Override
    public List<FluentMethod> getFluentMethods() {
        List<FluentMethod> methods = this.getDefinitionStages().stream()
                .flatMap(s -> s.getMethods().stream())
                .collect(Collectors.toList());
        methods.add(this.getConstructor());
        return methods;
    }

    @Override
    public String getLocalVariablePrefix() {
        return "create";
    }

    private FluentMethod getParameterSetterMethod(DefinitionStage stage, ClientMethodParameter parameter,
                                                  String parameterNameForMethodSignature) {
        return new FluentMethodParameterMethod(this.getResourceModel(), FluentMethodType.CREATE_WITH,
                stage, parameter, this.getLocalVariableByMethodParameter(parameter),
                CodeNamer.getModelNamer().modelPropertySetterName(parameterNameForMethodSignature));
    }

    private String deduplicateParameterNameForMethodSignature(
            List<DefinitionStage> stages1, List<DefinitionStage> stages2, String parameterName) {
        String stageName = "With" + CodeNamer.toPascalCase(parameterName);
        for (DefinitionStage stage : Stream.concat(stages1.stream(), stages2.stream()).collect(Collectors.toList())) {
            if (stageName.equals(stage.getName())) {
                return parameterName + "Parameter";
            }
        }
        return parameterName;
    }

    public FluentDefineMethod getDefineMethod() {
        if (defineMethod == null) {
            String resourceName = this.getResourceName();
            LOGGER.info("ResourceCreate: Fluent model '{}', resource define method '{}'", resourceModel.getName(), "define" + resourceName);

            if (this.isConstantResourceNamePathParameter()) {
                defineMethod = FluentDefineMethod.defineMethodWithConstantResourceName(this.getResourceModel(), FluentMethodType.DEFINE, resourceName);
            } else {
                ClientMethodParameter clientMethodParameter = this.getResourceNamePathParameter().getClientMethodParameter();
                defineMethod = new FluentDefineMethod(this.getResourceModel(), FluentMethodType.DEFINE,
                        resourceName, clientMethodParameter);
            }
        }
        return defineMethod;
    }

    private String getResourceName() {
        String strCreateOrUpdate = "createOrUpdate";
        String strCreate = "create";
        String resourceName;
        if (methodName.startsWith(strCreateOrUpdate)) {
            resourceName = methodName.substring(strCreateOrUpdate.length());
        } else if (methodName.startsWith(strCreate)) {
            resourceName = methodName.substring(strCreate.length());
        } else {
            resourceName = resourceModel.getName();
        }
        return CodeNamer.toPascalCase(resourceName);
    }

    private FluentMethod getConstructor() {
        if (this.isConstantResourceNamePathParameter()) {
            return FluentConstructorByName.constructorMethodWithConstantResourceName(this.getResourceModel(),
                    FluentMethodType.CONSTRUCTOR, FluentStatic.getFluentManager().getType(),
                    this.getResourceLocalVariables());
        } else {
            ClientMethodParameter resourceNamePathParameter = this.getResourceNamePathParameter().getClientMethodParameter();
            IType resourceNameType = resourceNamePathParameter.getClientType();
            String propertyName = resourceNamePathParameter.getName();
            return new FluentConstructorByName(this.getResourceModel(), FluentMethodType.CONSTRUCTOR,
                    resourceNameType, propertyName, FluentStatic.getFluentManager().getType(),
                    this.getResourceLocalVariables());
        }
    }

    private boolean isConstantResourceNamePathParameter() {
        // check whether the last segment in URL (resource name) is a constant parameter (which does not have a corresponding client method parameter)

        String parameterName = urlPathSegments.getReverseParameterSegments().iterator().next().getParameterName();
        FluentCollectionMethod method = this.getMethodReferencesOfFullParameters().iterator().next();
        ProxyMethod proxyMethod = method.getInnerProxyMethod();
        Optional<ProxyMethodParameter> resourceNamePathParameter = proxyMethod.getParameters().stream()
                .filter(m -> parameterName.equals(m.getRequestParameterName()))
                .findFirst();
        if (resourceNamePathParameter.isPresent()) {
            return resourceNamePathParameter.get().isConstant() || resourceNamePathParameter.get().isFromClient();
        } else {
            throw new IllegalStateException(String.format("Resource name parameter not found in proxy method %1$s, name segment %2$s",
                    proxyMethod.getName(), parameterName));
        }
    }

    private MethodParameter getResourceNamePathParameter() {
        // this only works when isConstantResourceNamePathParameter() == false

        String parameterName = urlPathSegments.getReverseParameterSegments().iterator().next().getParameterName();
        Optional<MethodParameter> pathParameter = this.getPathParameters().stream()
                .filter(m -> parameterName.equals(m.getSerializedName()))
                .findFirst();
        if (pathParameter.isPresent()) {
            return pathParameter.get();
        } else {
            FluentCollectionMethod method = this.getMethodReferencesOfFullParameters().iterator().next();
            throw new IllegalStateException(String.format("Resource name parameter not found in client method %1$s, name segment %2$s",
                    method.getInnerClientMethod().getName(), parameterName));
        }
    }

    private void generatePropertyMethods(DefinitionStage stage, ClientModel model, ModelProperty property) {
        if (FluentUtils.modelHasLocationProperty(getProperties()) && property.getName().equals(ResourceTypeName.FIELD_LOCATION)) {
            String baseName = "region";
            if (getProperties().stream().anyMatch(p -> "region".equals(p.getName()))) {
                baseName = ResourceTypeName.FIELD_LOCATION;
            }

            // location -> region
            stage.getMethods().add(new FluentModelPropertyRegion.FluentModelPropertyRegionMethod(
                    this.getResourceModel(), FluentMethodType.CREATE_WITH,
                    stage, model, property,
                    this.getLocalVariableByMethodParameter(this.getBodyParameter()), baseName));
            stage.getMethods().add(new FluentModelPropertyRegion.FluentModelPropertyRegionNameMethod(
                    this.getResourceModel(), FluentMethodType.CREATE_WITH,
                    stage, model, property,
                    this.getLocalVariableByMethodParameter(this.getBodyParameter()), baseName));
        } else {
            stage.getMethods().add(getPropertyMethod(stage, model, property));
        }
    }

    private FluentMethod getPropertyMethod(DefinitionStage stage, ClientModel model, ModelProperty property) {
        return new FluentModelPropertyMethod(this.getResourceModel(), FluentMethodType.CREATE_WITH,
                stage, model, property,
                this.getLocalVariableByMethodParameter(this.getBodyParameter()));
    }

    private FluentMethod getExistingParentMethod(DefinitionStageParent stage) {
        // parameters for parent method
        List<MethodParameter> parameters = this.getPathParameters();
        if (!this.isConstantResourceNamePathParameter()) {
            MethodParameter resourceNamePathParameter = this.getResourceNamePathParameter();
            String serializedResourceNamePathParameterName = resourceNamePathParameter.getSerializedName();

            parameters = parameters.stream()
                    .filter(p -> !p.getSerializedName().equals(serializedResourceNamePathParameterName))
                    .collect(Collectors.toList());
        }

        // resource name of immediate parent
        Set<String> serializedParameterNames = parameters.stream()
                .map(MethodParameter::getSerializedName)
                .collect(Collectors.toSet());
        String resourceNameOfImmediateParent = null;
        for (UrlPathSegments.ParameterSegment parameterSegment : urlPathSegments.getReverseParameterSegments()) {
            if (serializedParameterNames.contains(parameterSegment.getParameterName())) {
                if (parameterSegment.getSegmentName().isEmpty()) {
                    // segment name is empty for SCOPE_AS_PARENT and SCOPE_NESTED_CHILD
                    resourceNameOfImmediateParent = CodeNamer.toPascalCase(FluentUtils.getSingular(parameterSegment.getParameterName()));
                } else {
                    resourceNameOfImmediateParent = CodeNamer.toPascalCase(FluentUtils.getSingular(parameterSegment.getSegmentName()));
                }
                break;
            }
        }
        if (resourceNameOfImmediateParent == null) {
            throw new IllegalStateException(String.format("Resource name of immediate parent not found for url %1$s, model %2$s, candidate parameter names %3$s",
                    urlPathSegments.getPath(), resourceModel.getName(), serializedParameterNames));
        }
        // if parent is resourceGroup, just set it as such
        if (resourceModel.getCategory() == ModelCategory.RESOURCE_GROUP_AS_PARENT) {
            resourceNameOfImmediateParent = "ResourceGroup";
        }

        return new FluentParentMethod(resourceModel, FluentMethodType.CREATE_PARENT,
                stage, resourceNameOfImmediateParent,
                parameters.stream().map(MethodParameter::getClientMethodParameter).collect(Collectors.toList()),
                this.getResourceLocalVariables());
    }

    private FluentMethod getCreateMethod(boolean hasContextParameter) {
        List<ClientMethodParameter> parameters = new ArrayList<>();
        Optional<FluentCollectionMethod> methodOpt = this.findMethod(true, parameters);
        if (methodOpt.isPresent()) {
            if (!hasContextParameter) {
                parameters.clear();
            }
            return new FluentCreateMethod(resourceModel, FluentMethodType.CREATE,
                    parameters, this.getResourceLocalVariables(),
                    resourceCollection, methodOpt.get());
        } else {
            throw new IllegalStateException("Create method not found on model " + resourceModel.getName());
        }
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        getDefinitionStages().forEach(s -> s.addImportsTo(imports, includeImplementationImports));
    }
}
