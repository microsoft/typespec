// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.LocalVariable;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.immutablemodel.ImmutableMethod;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class CollectionMethodOperationByIdTemplate implements ImmutableMethod {

    private final MethodTemplate methodTemplate;
    private final String name;

    public CollectionMethodOperationByIdTemplate(FluentResourceModel model, String name,
                                                 List<MethodParameter> pathParameters, UrlPathSegments urlPathSegments, boolean includeContextParameter,
                                                 ResourceLocalVariables resourceLocalVariables,
                                                 FluentCollectionMethod collectionMethod) {
        if (includeContextParameter) {
            name += Utils.METHOD_POSTFIX_WITH_RESPONSE;
        }
        this.name = name;

        final ResourceLocalVariables localVariables = resourceLocalVariables.getDeduplicatedLocalVariables(new HashSet<>(Collections.singleton(ModelNaming.METHOD_PARAMETER_NAME_ID)));
        final boolean removeResponseInReturnType = !includeContextParameter;
        final IType returnType = getReturnType(collectionMethod.getFluentReturnType(), removeResponseInReturnType);
        final boolean responseInReturnTypeRemoved = returnType != collectionMethod.getFluentReturnType() && returnType != PrimitiveType.VOID;

        final List<ClientMethodParameter> parameters = new ArrayList<>();
        // id parameter
        parameters.add(new ClientMethodParameter.Builder()
                .name(ModelNaming.METHOD_PARAMETER_NAME_ID)
                .description("the resource ID.")
                .wireType(ClassType.STRING)
                .annotations(new ArrayList<>())
                .constant(false)
                .defaultValue(null)
                .fromClient(false)
                .finalParameter(false)
                .required(true)
                .build());
        if (includeContextParameter) {
            // optional parameters
            Set<String> pathParameterNames = pathParameters.stream()
                    .map(p -> p.getClientMethodParameter().getName())
                    .collect(Collectors.toSet());
            parameters.addAll(collectionMethod.getInnerClientMethod().getMethodParameters().stream()
                    .filter(p -> !pathParameterNames.contains(p.getName()))
                    .collect(Collectors.toList()));
        }

        // method invocation
        Set<ClientMethodParameter> parametersSet = new HashSet<>(parameters);
        List<ClientMethodParameter> methodParameters = collectionMethod.getInnerClientMethod().getMethodParameters();
        String argumentsLine = methodParameters.stream()
                .map(p -> FluentUtils.getLocalMethodArgument(p, parametersSet, localVariables, model, collectionMethod))
                .collect(Collectors.joining(", "));
        String methodInvocation = String.format("%1$s(%2$s)", collectionMethod.getMethodName(), argumentsLine);

        List<UrlPathSegments.ParameterSegment> segments = urlPathSegments.getReverseParameterSegments();
        Collections.reverse(segments);
        Map<String, String> urlSegmentNameByParameterName = urlPathSegments.getReverseParameterSegments().stream()
                .collect(Collectors.toMap(UrlPathSegments.ParameterSegment::getParameterName, UrlPathSegments.ParameterSegment::getSegmentName));

        String afterInvocationCode = responseInReturnTypeRemoved ? ".getValue()" : "";

        // a dummy client method only for generating javadoc
        ClientMethod dummyClientMethodForJavadoc = new ClientMethod.Builder()
                .proxyMethod(collectionMethod.getInnerProxyMethod())
                .name(name)
                .returnValue(new ReturnValue(returnType == PrimitiveType.VOID
                    ? "" : collectionMethod.getInnerClientMethod().getReturnValue().getDescription(), returnType))
                .parameters(parameters)
                .description(collectionMethod.getInnerClientMethod().getDescription())
                .build();

        methodTemplate = MethodTemplate.builder()
                .comment(commentBlock -> ClientMethodTemplate.generateJavadoc(dummyClientMethodForJavadoc, commentBlock, dummyClientMethodForJavadoc.getProxyMethod(), true))
                .methodSignature(this.getMethodSignature(returnType, parameters))
                .method(block -> {
                    // init path parameters from resource id
                    pathParameters.forEach(p -> {
                        String urlSegmentName = urlSegmentNameByParameterName.get(p.getSerializedName());
                        String valueFromIdText;
                        if (urlPathSegments.hasScope()) {
                            valueFromIdText = String.format("%1$s.getValueFromIdByParameterName(%2$s, \"%3$s\", \"%4$s\")",
                                    ModelNaming.CLASS_RESOURCE_MANAGER_UTILS, ModelNaming.METHOD_PARAMETER_NAME_ID, urlPathSegments.getPath(), p.getSerializedName());
                        } else {
                            valueFromIdText = String.format("%1$s.getValueFromIdByName(%2$s, \"%3$s\")",
                                    ModelNaming.CLASS_RESOURCE_MANAGER_UTILS, ModelNaming.METHOD_PARAMETER_NAME_ID, urlSegmentName);
                        }
                        LocalVariable var = localVariables.getLocalVariableByMethodParameter(p.getClientMethodParameter());
                        // need additional conversion from String to LocalVariable.variableType
                        boolean needsLocalVar = var.getVariableType() != ClassType.STRING;
                        String varName = needsLocalVar ? var.getName() + "Local" : var.getName();
                        block.line(String.format("%1$s %2$s = %3$s;", ClassType.STRING.getName(), varName, valueFromIdText));

                        String segmentNameForErrorPrompt = urlSegmentName.isEmpty() ? p.getSerializedName() : urlSegmentName;
                        block.ifBlock(String.format("%1$s == null", varName), ifBlock -> {
                            String errorMessageExpr = String.format("String.format(\"The resource ID '%%s' is not valid. Missing path segment '%1$s'.\", %2$s)",
                                    segmentNameForErrorPrompt, ModelNaming.METHOD_PARAMETER_NAME_ID);
                            ifBlock.line(String.format(
                                    "throw LOGGER.logExceptionAsError(new IllegalArgumentException(%1$s));",
                                    errorMessageExpr));
                        });
                        if (needsLocalVar) {
                            // currently this works only for UUID or Enum
                            block.line(String.format("%1$s %2$s = %3$s.fromString(%4$s);",
                                    var.getVariableType().toString(),
                                    var.getName(),
                                    var.getVariableType().toString(),
                                    varName));
                        }
                    });

                    if (!includeContextParameter) {
                        // init local variables to default value
                        for (LocalVariable var : localVariables.getLocalVariablesMap().values()) {
                            if (var.getParameterLocation() == RequestParameterLocation.QUERY) {
                                block.line(String.format("%1$s %2$s = %3$s;", var.getVariableType().toString(), var.getName(), var.getInitializeExpression()));
                            }
                        }
                    }

                    if (returnType == PrimitiveType.VOID) {
                        block.line(String.format("this.%1$s%2$s;",
                                methodInvocation,
                                afterInvocationCode));
                    } else {
                        block.methodReturn(String.format("this.%1$s%2$s",
                                methodInvocation,
                                afterInvocationCode));
                    }
                })
                .build();
    }

    @Override
    public MethodTemplate getMethodTemplate() {
        return methodTemplate;
    }

    private static IType getReturnType(IType collectionMethodReturnType, boolean removeResponse) {
        IType returnType;
        if (removeResponse) {
            if (FluentUtils.isResponseType(collectionMethodReturnType)) {
                returnType = FluentUtils.getValueTypeFromResponseType(collectionMethodReturnType);
                if (returnType == ClassType.VOID) {
                    returnType = PrimitiveType.VOID;
                }
            } else {
                // LRO would not have Response<T> for method takes Context, usually happens to delete method
                returnType = collectionMethodReturnType;
            }
        } else {
            returnType = collectionMethodReturnType;
        }
        return returnType;
    }

    private String getMethodSignature(IType returnType, List<ClientMethodParameter> parameters) {
        String parameterText = parameters.stream()
                .map(p -> String.format("%1$s %2$s", p.getClientType().toString(), p.getName()))
                .collect(Collectors.joining(", "));
        return String.format("%1$s %2$s(%3$s)",
                returnType.toString(), this.name, parameterText);
    }
}
