// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Collection of parameters that need to be provided during create/update flow, and hence need to be provided as class variable or local variable.
 *
 * E.g. resourceGroupName, resourceName, createParameters from ResourceCreate; resourceGroupName, resourceName, updateParameters from ResourceUpdate.
 */
public class ResourceLocalVariables {

    private final Map<ClientMethodParameter, LocalVariable> localVariablesMap = new LinkedHashMap<>();

    public ResourceLocalVariables(ResourceOperation resourceOperation) {
        String prefix = resourceOperation.getLocalVariablePrefix();

        List<ClientMethodParameter> pathParameters = resourceOperation.getPathParameters().stream().map(MethodParameter::getClientMethodParameter).collect(Collectors.toList());
        pathParameters.forEach(p -> localVariablesMap.put(p, new LocalVariable(p.getName(), p.getClientType(), RequestParameterLocation.PATH, p)));

        List<ClientMethodParameter> miscParameters = resourceOperation.getMiscParameters();
        miscParameters.forEach(p -> {
            LocalVariable var = new LocalVariable(prefix + CodeNamer.toPascalCase(p.getName()), p.getClientType(), RequestParameterLocation.QUERY, p);
            var.setInitializeExpression("null");
            localVariablesMap.put(p, var);
        });

        ClientMethodParameter bodyParameter = resourceOperation.getBodyParameter();
        if (bodyParameter != null && !bodyParameter.getClientType().toString().equals(resourceOperation.getResourceModel().getInnerModel().getName())) {
            LocalVariable var = new LocalVariable(prefix + CodeNamer.toPascalCase(bodyParameter.getName()), bodyParameter.getClientType(), RequestParameterLocation.BODY, bodyParameter);
            var.setInitializeExpression(String.format("new %1$s()", bodyParameter.getClientType().toString()));
            localVariablesMap.put(bodyParameter, var);
        }
    }

    public ResourceLocalVariables(ClientMethod clientMethod) {
        Map<String, ProxyMethodParameter> proxyMethodParameterByClientParameterName = clientMethod.getProxyMethod().getParameters().stream()
                .filter(p -> p.getRequestParameterLocation() == RequestParameterLocation.PATH)
                .collect(Collectors.toMap(p -> CodeNamer.getEscapedReservedClientMethodParameterName(p.getName()), Function.identity()));
        List<ClientMethodParameter> pathParameters =  clientMethod.getParameters().stream()
                .filter(p -> proxyMethodParameterByClientParameterName.containsKey(p.getName()))
                .collect(Collectors.toList());
        pathParameters.forEach(p -> localVariablesMap.put(p, new LocalVariable(p.getName(), p.getClientType(), RequestParameterLocation.PATH, p)));
    }

    private ResourceLocalVariables() {
    }

    public Map<ClientMethodParameter, LocalVariable> getLocalVariablesMap() {
        return this.localVariablesMap;
    }

    public LocalVariable getLocalVariableByMethodParameter(ClientMethodParameter methodParameter) {
        return this.localVariablesMap.get(methodParameter);
    }

    public ResourceLocalVariables getDeduplicatedLocalVariables(Set<String> occupiedVariableNames) {
        ResourceLocalVariables newLocalVariables = new ResourceLocalVariables();
        this.localVariablesMap.forEach((parameter, variable) -> {
            if (occupiedVariableNames.contains(variable.getName())) {
                newLocalVariables.localVariablesMap.put(parameter, variable.getRenameLocalVariable("var" + CodeNamer.toPascalCase(variable.getName())));
            } else {
                newLocalVariables.localVariablesMap.put(parameter, variable);
            }
        });
        return newLocalVariables;
    }
}
