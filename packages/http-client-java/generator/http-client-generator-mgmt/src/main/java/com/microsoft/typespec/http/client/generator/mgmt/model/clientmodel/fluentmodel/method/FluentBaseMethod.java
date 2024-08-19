// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManagerProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.LocalVariable;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

abstract public class FluentBaseMethod extends FluentMethod {

    private final List<ClientMethodParameter> parameters;
    private final FluentCollectionMethod collectionMethod;

    public FluentBaseMethod(FluentResourceModel model, FluentMethodType type, String name, String description, String returnValueDescription,
                            List<ClientMethodParameter> parameters, ResourceLocalVariables resourceLocalVariables,
                            FluentResourceCollection collection, FluentCollectionMethod collectionMethod) {
        this(model, type, name, description, returnValueDescription, parameters, resourceLocalVariables, collection, collectionMethod, null, false);
    }

    public FluentBaseMethod(FluentResourceModel model, FluentMethodType type, String name, String description, String returnValueDescription,
                            List<ClientMethodParameter> parameters, ResourceLocalVariables resourceLocalVariables,
                            FluentResourceCollection collection, FluentCollectionMethod collectionMethod,
                            ResourceLocalVariables resourceLocalVariablesDefinedInClass,
                            // below used for refresh method
                            boolean initLocalVariables) {
        super(model, type);

        this.name = name;
        this.description = description;
        this.interfaceReturnValue = new ReturnValue(returnValueDescription, model.getInterfaceType());
        this.implementationReturnValue = interfaceReturnValue;

        this.parameters = parameters;
        this.collectionMethod = collectionMethod;

        IType returnType = collectionMethod.getInnerClientMethod().getReturnValue().getType();
        final boolean returnIsResponseType = FluentUtils.isResponseType(returnType);

        // resource collection from manager
        String innerClientGetMethod = FluentStatic.getFluentManager().getProperties().stream()
                .filter(p -> p.getFluentType().getName().equals(collection.getInterfaceType().getName()))
                .map(FluentManagerProperty::getInnerClientGetMethod)
                .findFirst().get();

        // method invocation
        Set<ClientMethodParameter> parametersSet = new HashSet<>(parameters);
        List<ClientMethodParameter> methodParameters = collectionMethod.getInnerClientMethod().getMethodInputParameters();
        String argumentsLine = methodParameters.stream()
                .map(p -> FluentUtils.getLocalMethodArgument(p, parametersSet, resourceLocalVariables, model, collectionMethod, resourceLocalVariablesDefinedInClass))
                .collect(Collectors.joining(", "));
        String methodInvocation = String.format("%1$s(%2$s)", collectionMethod.getMethodName(), argumentsLine);

        String afterInvocationCode = returnIsResponseType ? ".getValue()" : "";

        this.implementationMethodTemplate = MethodTemplate.builder()
                .methodSignature(this.getImplementationMethodSignature())
                .method(block -> {
                    if (initLocalVariables) {
                        for (LocalVariable var : resourceLocalVariables.getLocalVariablesMap().values()) {
                            if (var.getParameterLocation() == RequestParameterLocation.QUERY) {
                                block.line(String.format("%1$s %2$s = %3$s;", var.getVariableType().toString(), var.getName(), var.getInitializeExpression()));
                            }
                        }
                    }

                    block.line("this.%1$s = %2$s.%3$s().%4$s().%5$s%6$s;",
                            ModelNaming.MODEL_PROPERTY_INNER,
                            ModelNaming.MODEL_PROPERTY_MANAGER,
                            ModelNaming.METHOD_SERVICE_CLIENT,
                            innerClientGetMethod,
                            methodInvocation,
                            afterInvocationCode);
                    block.methodReturn("this");
                })
                .build();
    }

    @Override
    protected String getBaseMethodSignature() {
        String parameterText = parameters.stream()
                .map(p -> String.format("%1$s %2$s", p.getClientType().toString(), p.getName()))
                .collect(Collectors.joining(", "));
        return String.format("%1$s(%2$s)",
                this.name, parameterText);
    }

    @Override
    public void writeJavadoc(JavaJavadocComment commentBlock) {
        commentBlock.description(description);
        parameters.forEach(p -> commentBlock.param(p.getName(), p.getDescription()));
        commentBlock.methodReturns(interfaceReturnValue.getDescription());
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        interfaceReturnValue.addImportsTo(imports, false);
        parameters.forEach(p -> p.addImportsTo(imports, false));
        if (includeImplementationImports) {
            collectionMethod.addImportsTo(imports, false);
        }
    }
}
