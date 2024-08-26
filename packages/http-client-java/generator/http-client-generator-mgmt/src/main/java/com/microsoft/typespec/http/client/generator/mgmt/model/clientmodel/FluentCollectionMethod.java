// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.CollectionMethodTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.CollectionMethodTypeConversionTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.ImmutableMethod;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

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
        return String.format("%1$s %2$s(%3$s)", this.getFluentReturnType(), getMethodName(), method.getParametersDeclaration());
    }

    public String getMethodName() {
        return methodName;
    }

    // method invocation
    public String getMethodInvocation() {
        List<ClientMethodParameter> methodParameters = method.getMethodInputParameters();
        String argumentsLine = methodParameters.stream().map(ClientMethodParameter::getName).collect(Collectors.joining(", "));
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

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        this.getFluentReturnType().addImportsTo(imports, false);
        method.addImportsTo(imports, includeImplementationImports, JavaSettings.getInstance());

        if (includeImplementationImports) {
            immutableMethod.getMethodTemplate().addImportsTo(imports);
        }
    }
}
