// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceOperation;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentApplyMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentConstructorByInner;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethodParameterMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethodType;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentModelPropertyMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentUpdateMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class ResourceUpdate extends ResourceOperation {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), ResourceUpdate.class);

    private List<UpdateStage> updateStages;

    private FluentUpdateMethod updateMethod;
    private List<FluentMethod> applyMethods;

    public ResourceUpdate(FluentResourceModel resourceModel, FluentResourceCollection resourceCollection,
                          UrlPathSegments urlPathSegments, String methodName, ClientModel bodyParameterModel) {
        super(resourceModel, resourceCollection, urlPathSegments, methodName, bodyParameterModel);

        LOGGER.info("ResourceUpdate: Fluent model '{}', method reference '{}', body parameter '{}'",
                resourceModel.getName(), methodName, bodyParameterModel.getName());
    }

    public List<UpdateStage> getUpdateStages() {
        if (updateStages != null) {
            return updateStages;
        }

        updateStages = new ArrayList<>();

        UpdateStage updateStageApply = new UpdateStageApply();
        // updateStageApply does not belong to updateStages

        List<ModelProperty> properties = this.getProperties();
        for (ModelProperty property : properties) {
            UpdateStage stage = new UpdateStage("With" + CodeNamer.toPascalCase(property.getName()), property);
            stage.setNextStage(updateStageApply);

            stage.getMethods().add(this.getPropertyMethod(stage, requestBodyParameterModel, property));

            updateStages.add(stage);
        }
        // header and query parameters
        List<ClientMethodParameter> miscParameters = this.getMiscParameters();
        for (ClientMethodParameter parameter : miscParameters) {
            String parameterNameForMethodSignature = deduplicateParameterNameForMethodSignature(
                    updateStages, parameter.getName());

            UpdateStage stage = new UpdateStageMisc("With" + CodeNamer.toPascalCase(parameterNameForMethodSignature), parameter);
            stage.setNextStage(updateStageApply);

            stage.getMethods().add(this.getParameterSetterMethod(stage, parameter, parameterNameForMethodSignature));

            updateStages.add(stage);
        }

        return updateStages;
    }

    @Override
    public List<FluentMethod> getFluentMethods() {
        List<FluentMethod> methods = this.getUpdateStages().stream()
                .flatMap(s -> s.getMethods().stream())
                .collect(Collectors.toList());
        methods.add(this.getUpdateMethod());
        methods.addAll(this.getApplyMethods());
        methods.add(this.getConstructor());
        return methods;
    }

    @Override
    public String getLocalVariablePrefix() {
        return "update";
    }

    @Override
    protected List<ModelProperty> getProperties() {
        return super.getProperties().stream()
                .filter(p -> !p.isReadOnlyForUpdate())
                .filter(p -> !isIdProperty(p) && !isLocationProperty(p))    // update should not be able to change id or location
                .collect(Collectors.toList());
    }

    private FluentMethod getParameterSetterMethod(UpdateStage stage, ClientMethodParameter parameter,
                                                  String parameterNameForMethodSignature) {
        return new FluentMethodParameterMethod(this.getResourceModel(), FluentMethodType.UPDATE_WITH,
                stage, parameter, this.getLocalVariableByMethodParameter(parameter),
                CodeNamer.getModelNamer().modelPropertySetterName(parameterNameForMethodSignature));
    }

    private String deduplicateParameterNameForMethodSignature(List<UpdateStage> stages, String parameterName) {
        String stageName = "With" + CodeNamer.toPascalCase(parameterName);
        for (UpdateStage stage : stages) {
            if (stageName.equals(stage.getName())) {
                return parameterName + "Parameter";
            }
        }
        return parameterName;
    }

    private FluentMethod getPropertyMethod(UpdateStage stage, ClientModel model, ModelProperty property) {
        if (hasDuplicateWithCreateMethodOnErasure(property)) {
            return new FluentModelPropertyMethod(this.getResourceModel(), FluentMethodType.UPDATE_WITH,
                    stage, model, property,
                    this.getLocalVariableByMethodParameter(this.getBodyParameter()),
                    property.getSetterName() + "ForUpdate",
                    String.format("Specifies the %1$s property: %2$s.", property.getName(), property.getDescription()));
        } else {
            return new FluentModelPropertyMethod(this.getResourceModel(), FluentMethodType.UPDATE_WITH,
                    stage, model, property,
                    this.getLocalVariableByMethodParameter(this.getBodyParameter()));
        }
    }

    private boolean hasDuplicateWithCreateMethodOnErasure(ModelProperty property) {
        // find duplicate on generic type with erasure, e.g. same property of different generic type List<CreateParameter> with List<UpdateParameter>, but the generic type would be same under erasure.
        boolean hasDuplicate = false;
        String methodName = property.getSetterName();
        IType type = property.getClientType();
        if ((type instanceof ListType || type instanceof MapType) && resourceModel.getResourceCreate() != null) {
            IType valueType = null;
            if (type instanceof ListType) {
                valueType = ((ListType) type).getElementType();
            } else if (type instanceof MapType) {
                valueType = ((MapType) type).getValueType();
            }
            IType valueTypeFinal = valueType;

            hasDuplicate = resourceModel.getResourceCreate().getFluentMethods().stream()
                    .filter(m -> m.getType() == FluentMethodType.CREATE_WITH)
                    .filter(m -> methodName.equals(m.getName()))
                    .map(m -> {
                        IType t = null;
                        if (m instanceof FluentModelPropertyMethod) {
                            t = ((FluentModelPropertyMethod) m).getModelProperty().getClientType();
                        } else if (m instanceof FluentMethodParameterMethod) {
                            t = ((FluentMethodParameterMethod) m).getMethodParameter().getClientType();
                        }
                        return t;
                    })
                    .filter(Objects::nonNull)
                    // generic type
                    .map(t -> {
                        IType valueType1 = null;
                        if (t instanceof ListType) {
                            valueType1 = ((ListType) t).getElementType();
                        } else if (type instanceof MapType) {
                            valueType1 = ((MapType) t).getValueType();
                        }
                        return valueType1;
                    })
                    .filter(Objects::nonNull)
                    // different type
                    .anyMatch(v -> !Objects.equals(valueTypeFinal.toString(), v.toString()));
        }
        return hasDuplicate;
    }

    public FluentMethod getUpdateMethod() {
        if (updateMethod == null) {
            updateMethod = new FluentUpdateMethod(resourceModel, FluentMethodType.UPDATE, this.getResourceLocalVariables());
        }
        return updateMethod;
    }

    public List<FluentMethod> getApplyMethods() {
        if (applyMethods == null) {
            applyMethods = new ArrayList<>();

            applyMethods.add(this.getApplyMethod(false));
            applyMethods.add(this.getApplyMethod(true));
        }
        return applyMethods;
    }

    private FluentMethod getConstructor() {
        List<MethodParameter> pathParameters = this.getPathParameters();
        return new FluentConstructorByInner(resourceModel, FluentMethodType.CONSTRUCTOR,
                pathParameters, this.getResourceLocalVariables(),
                FluentStatic.getFluentManager().getType(), urlPathSegments);
    }

    private FluentMethod getApplyMethod(boolean hasContextParameter) {
        List<ClientMethodParameter> parameters = new ArrayList<>();
        Optional<FluentCollectionMethod> methodOpt = this.findMethod(true, parameters);
        if (methodOpt.isPresent()) {
            if (!hasContextParameter) {
                parameters.clear();
            }
            return new FluentApplyMethod(resourceModel, FluentMethodType.APPLY,
                    parameters, this.getResourceLocalVariables(),
                    resourceCollection, methodOpt.get(),
                    resourceModel.getResourceCreate().getResourceLocalVariables());
        } else {
            throw new IllegalStateException("Update method not found on model " + resourceModel.getName());
        }
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        getUpdateStages().forEach(s -> s.addImportsTo(imports, includeImplementationImports));
        if (includeImplementationImports) {
            getConstructor().addImportsTo(imports, true);
            getUpdateMethod().addImportsTo(imports, true);
            getApplyMethods().forEach(m -> m.addImportsTo(imports, true));
        }
    }
}
