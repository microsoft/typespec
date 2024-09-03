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
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resource action method.
 *
 * E.g. start, stop, regenerateKey, listAccountSas etc.
 */
public class FluentActionMethod extends FluentMethod {

    private final FluentCollectionMethod collectionMethod;
    private final ClientMethod dummyClientMethodForJavadoc;

    public FluentActionMethod(FluentResourceModel model, FluentMethodType type,
                              FluentResourceCollection collection, FluentCollectionMethod collectionMethod,
                              ResourceLocalVariables resourceLocalVariablesDefinedInClass) {
        super(model, type);

        this.collectionMethod = collectionMethod;
        this.name = collectionMethod.getMethodName();
        this.description = collectionMethod.getDescription();

        IType returnType = collectionMethod.getFluentReturnType();
        boolean returnTypeIsVoid = returnType == PrimitiveType.VOID;
        ReturnValue returnValue = new ReturnValue(returnTypeIsVoid ? "" : collectionMethod.getInnerClientMethod().getReturnValue().getDescription(), returnType);
        this.interfaceReturnValue = returnValue;
        this.implementationReturnValue = interfaceReturnValue;

        // remove path parameters from input parameter, as they are provided by the variables of resource model
        ClientMethod method = collectionMethod.getInnerClientMethod();
        List<ClientMethodParameter> parameters = new ArrayList<>(method.getMethodInputParameters());
        ResourceLocalVariables resourceLocalVariables = new ResourceLocalVariables(collectionMethod.getInnerClientMethod());
        parameters.removeAll(resourceLocalVariables.getLocalVariablesMap().entrySet().stream()
                .filter(e -> e.getValue().getParameterLocation() == RequestParameterLocation.PATH)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList()));
        this.parameters = parameters;

        // a dummy client method only for generating javadoc
        this.dummyClientMethodForJavadoc = new ClientMethod.Builder()
                .proxyMethod(collectionMethod.getInnerProxyMethod())
                .name(name)
                .returnValue(returnValue)
                .parameters(parameters)
                .description(collectionMethod.getInnerClientMethod().getDescription())
                .build();

        // resource collection from manager
        String collectionGetMethod = FluentStatic.getFluentManager().getProperties().stream()
                .filter(p -> p.getFluentType().getName().equals(collection.getInterfaceType().getName()))
                .map(FluentManagerProperty::getMethodName)
                .findFirst().get();

        // method invocation
        Set<ClientMethodParameter> parametersSet = new HashSet<>(parameters);
        List<ClientMethodParameter> methodParameters = method.getMethodInputParameters();
        String argumentsLine = methodParameters.stream()
                .map(p -> FluentUtils.getLocalMethodArgument(p, parametersSet, resourceLocalVariables, model, collectionMethod, resourceLocalVariablesDefinedInClass))
                .collect(Collectors.joining(", "));
        String methodInvocation = String.format("%1$s(%2$s)", collectionMethod.getMethodName(), argumentsLine);

        this.implementationMethodTemplate = MethodTemplate.builder()
                .methodSignature(this.getImplementationMethodSignature())
                .method(block -> {
                    String invocation = String.format("%1$s.%2$s().%3$s",
                            ModelNaming.MODEL_PROPERTY_MANAGER,
                            collectionGetMethod,
                            methodInvocation);
                    if (returnTypeIsVoid) {
                        block.line(invocation + ";");
                    } else {
                        block.methodReturn(invocation);
                    }
                })
                .build();
    }

    @Override
    protected String getBaseMethodSignature() {
        String parameterDeclaration = parameters.stream().map(ClientMethodParameter::getDeclaration).collect(Collectors.joining(", "));
        return String.format("%1$s(%2$s)", name, parameterDeclaration);
    }

    @Override
    public void writeJavadoc(JavaJavadocComment commentBlock) {
        ClientMethodTemplate.generateJavadoc(dummyClientMethodForJavadoc, commentBlock, dummyClientMethodForJavadoc.getProxyMethod(), true);
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        collectionMethod.addImportsTo(imports, includeImplementationImports);
    }
}
