// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.CollectionMethodTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.CollectionMethodTypeConversionTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.ImmutableMethod;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class FluentCollectionMethod {

    private final ClientMethod method;
    private final String methodName;

    private final IType fluentReturnType;

    private final ImmutableMethod immutableMethod;

    public FluentCollectionMethod(ClientMethod method) {
        this(method, method.getName());
    }

    public FluentCollectionMethod(ClientMethod method, String methodName) {
        this.method = method;
        this.methodName = methodName;
        this.fluentReturnType = FluentUtils.getFluentWrapperType(method.getReturnValue().getType());

        this.immutableMethod = this.fluentReturnType == method.getReturnValue().getType()
            ? new CollectionMethodTemplate(this, method.getReturnValue().getType())
            : new CollectionMethodTypeConversionTemplate(this, method.getReturnValue().getType());
    }

    public IType getFluentReturnType() {
        return fluentReturnType;
    }

    // method signature
    public String getMethodSignature() {
        return String.format("%1$s %2$s(%3$s)", this.getFluentReturnType(), getMethodName(),
            method.getParametersDeclaration());
    }

    public String getMethodName() {
        return methodName;
    }

    // method invocation
    public String getMethodInvocation() {
        List<ClientMethodParameter> methodParameters = method.getMethodInputParameters();
        String argumentsLine
            = methodParameters.stream().map(ClientMethodParameter::getName).collect(Collectors.joining(", "));
        return String.format("%1$s(%2$s)", method.getName(), argumentsLine);
    }

    public String getDescription() {
        return method.getDescription();
    }

    public ClientMethod getInnerClientMethod() {
        return method;
    }

    public ProxyMethod getInnerProxyMethod() {
        return method.getProxyMethod();
    }

    public MethodTemplate getImplementationMethodTemplate() {
        return immutableMethod.getMethodTemplate();
    }

    public MethodTemplate getImplementationMethodTemplate(List<FluentCollectionMethod> generatedMethods) {
        if (!JavaSettings.getInstance().isSyncStackEnabled() || method.hasMethodParameterOfType(ClassType.CONTEXT)) {
            return getImplementationMethodTemplate();
        }
        for (FluentCollectionMethod candidate : generatedMethods) {
            ClientMethod target = candidate.getInnerClientMethod();
            if (!target.hasMethodParameterOfType(ClassType.CONTEXT)
                || target.getProxyMethod() != method.getProxyMethod()) {
                continue;
            }
            boolean sameReturnType = method.hasWithContextOverload()
                && target.getType() == method.getType()
                && target.getName().equals(method.getName())
                && candidate.getFluentReturnType().equals(fluentReturnType);
            // Response wrappers can have different null/collection conversion semantics.
            boolean unwrapResponse = method.getType() == ClientMethodType.SimpleSync
                && target.getType() == ClientMethodType.SimpleSyncRestResponse
                && target.getName().equals(method.getProxyMethod().getSimpleRestResponseMethodName())
                && fluentReturnType.equals(method.getReturnValue().getType())
                && !(fluentReturnType instanceof ListType || fluentReturnType instanceof MapType)
                && FluentUtils.isResponseType(candidate.getFluentReturnType())
                && fluentReturnType.asNullable()
                    .equals(FluentUtils.getValueTypeFromResponseType(candidate.getFluentReturnType()).asNullable());
            if (!sameReturnType && !unwrapResponse) {
                continue;
            }
            List<ClientMethodParameter> parameters = new ArrayList<>(method.getMethodInputParameters());
            parameters.add(target.getMethodInputParameters()
                .stream()
                .filter(FluentUtils::isContextParameter)
                .findFirst()
                .orElseThrow());
            String declaration = method.newBuilder()
                .parameters(parameters)
                .onlyRequiredParameters(false)
                .build()
                .getParametersDeclaration();
            if (!declaration.equals(target.getParametersDeclaration())) {
                continue;
            }
            Set<String> imports = new LinkedHashSet<>();
            immutableMethod.getMethodTemplate().addImportsTo(imports);
            ClassType.CONTEXT.addImportsTo(imports, false);
            String arguments = method.getMethodInputParameters()
                .stream()
                .map(ClientMethodParameter::getName)
                .collect(Collectors.joining(", "));
            String invocation = "this." + candidate.getMethodName() + "("
                + (arguments.isEmpty() ? "" : arguments + ", ") + "Context.NONE)";
            boolean returnsVoid
                = fluentReturnType == PrimitiveType.VOID || fluentReturnType == PrimitiveType.VOID.asNullable();
            String expression = invocation + (unwrapResponse && !returnsVoid ? ".getValue()" : "");
            return MethodTemplate.builder().imports(imports).methodSignature(getMethodSignature()).method(block -> {
                if (returnsVoid) {
                    block.line(expression + ";");
                } else {
                    block.methodReturn(expression);
                }
            }).build();
        }
        return getImplementationMethodTemplate();
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        this.getFluentReturnType().addImportsTo(imports, false);
        method.addImportsTo(imports, includeImplementationImports, JavaSettings.getInstance());

        if (includeImplementationImports) {
            immutableMethod.getMethodTemplate().addImportsTo(imports);
        }
    }
}
