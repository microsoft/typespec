// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ConvenienceMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.core.http.rest.PagedIterable;
import com.azure.core.http.rest.ResponseBase;
import com.azure.core.util.CoreUtils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class ConvenienceSyncMethodTemplate extends ConvenienceMethodTemplateBase {

    private static final ConvenienceSyncMethodTemplate INSTANCE = new ConvenienceSyncMethodTemplate();
    private static final String ASYNC_CLIENT_VAR_NAME = "client";

    protected ConvenienceSyncMethodTemplate() {
    }

    public static ConvenienceSyncMethodTemplate getInstance() {
        return INSTANCE;
    }

    public void addImports(Set<String> imports, List<ConvenienceMethod> convenienceMethods) {
        if (!CoreUtils.isNullOrEmpty(convenienceMethods)) {
            super.addImports(imports, convenienceMethods);
        }

        if (JavaSettings.getInstance().isUseClientLogger()) {
            ClassType.CLIENT_LOGGER.addImportsTo(imports, false);
        }
    }

    @Override
    protected boolean isMethodIncluded(ClientMethod method) {
        return !isMethodAsync(method) && isMethodVisible(method) && !method.isImplementationOnly();
    }

    @Override
    protected boolean isMethodIncluded(ConvenienceMethod method) {
        return !isMethodAsync(method.getProtocolMethod()) && isMethodVisible(method.getProtocolMethod())
                // for LRO, we actually choose the protocol method of "WithModel"
                && (method.getProtocolMethod().getType() != ClientMethodType.LongRunningBeginSync || (method.getProtocolMethod().getImplementationDetails() != null && method.getProtocolMethod().getImplementationDetails().isImplementationOnly()));
    }

    @Override
    protected void writeMethodImplementation(
            ClientMethod protocolMethod,
            ClientMethod convenienceMethod,
            JavaBlock methodBlock,
            Set<GenericType> typeReferenceStaticClasses) {
        if (!JavaSettings.getInstance().isSyncStackEnabled()) {
            if (protocolMethod.getType() == ClientMethodType.PagingSync) {
                // Call the convenience method from async client
                // It would need rework, when underlying sync method in Impl is switched to sync protocol method

                String methodInvoke = "new PagedIterable<>(" + getMethodInvokeViaAsyncClient(convenienceMethod) + ")";

                methodBlock.methodReturn(methodInvoke);
            } else if (protocolMethod.getType() == ClientMethodType.LongRunningBeginSync) {
                // Call the convenience method from async client
                String methodInvoke = getMethodInvokeViaAsyncClient(convenienceMethod) + ".getSyncPoller()";

                methodBlock.methodReturn(methodInvoke);
            } else {
                super.writeMethodImplementation(protocolMethod, convenienceMethod, methodBlock, typeReferenceStaticClasses);
            }
        } else {
            super.writeMethodImplementation(protocolMethod, convenienceMethod, methodBlock, typeReferenceStaticClasses);
        }
    }

    @Override
    protected void writeInvocationAndConversion(
            ClientMethod convenienceMethod,
            ClientMethod protocolMethod,
            String invocationExpression,
            JavaBlock methodBlock,
            Set<GenericType> typeReferenceStaticClasses) {

        IType responseBodyType = getResponseBodyType(convenienceMethod);
        IType protocolResponseBodyType = getResponseBodyType(protocolMethod);
        IType rawResponseBodyType = convenienceMethod.getProxyMethod().getRawResponseBodyType();

        String convertFromResponse = convenienceMethod.getType() == ClientMethodType.SimpleSyncRestResponse
                ? "" : ".getValue()";

        if (convenienceMethod.getType() == ClientMethodType.PagingSync) {
            methodBlock.methodReturn(String.format(
                    "serviceClient.%1$s(%2$s).mapPage(bodyItemValue -> %3$s)",
                    protocolMethod.getName(),
                    invocationExpression,
                    expressionConvertFromBinaryData(
                            responseBodyType, rawResponseBodyType, "bodyItemValue",
                            protocolMethod.getProxyMethod().getResponseContentTypes(),
                            typeReferenceStaticClasses)));
        } else if (convenienceMethod.getType() == ClientMethodType.LongRunningBeginSync){
            String methodName = protocolMethod.getName();
            methodBlock.methodReturn(String.format("serviceClient.%1$s(%2$s)", methodName, invocationExpression));
        } else if (convenienceMethod.getType() == ClientMethodType.SimpleSyncRestResponse
                && !(responseBodyType.asNullable() == ClassType.VOID || responseBodyType == ClassType.BINARY_DATA)) {

            // protocolMethodResponse = ...
            methodBlock.line(getProtocolMethodResponseStatement(protocolMethod, invocationExpression));

            // e.g. protocolMethodResponse.getValue().toObject(...)
            String expressConversion = "protocolMethodResponse.getValue()";
            if (protocolResponseBodyType == ClassType.BINARY_DATA) {
                expressConversion = expressionConvertFromBinaryData(
                        responseBodyType, rawResponseBodyType, expressConversion,
                        protocolMethod.getProxyMethod().getResponseContentTypes(),
                        typeReferenceStaticClasses);
            }

            if (isResponseBase(convenienceMethod.getReturnValue().getType())) {
                IType headerType = ((GenericType) convenienceMethod.getReturnValue().getType()).getTypeArguments()[0];
                methodBlock.methodReturn(String.format(
                        "new ResponseBase<>(protocolMethodResponse.getRequest(), protocolMethodResponse.getStatusCode(), protocolMethodResponse.getHeaders(), %1$s, new %2$s(protocolMethodResponse.getHeaders()))", expressConversion, headerType));
            } else {
                methodBlock.methodReturn(String.format(
                        "new SimpleResponse<>(protocolMethodResponse, %s)", expressConversion));
            }
        } else {
            String statement = String.format("%1$s(%2$s)%3$s",
                    getMethodName(protocolMethod),
                    invocationExpression,
                    convertFromResponse);
            if (protocolResponseBodyType == ClassType.BINARY_DATA) {
                statement = expressionConvertFromBinaryData(
                        responseBodyType, rawResponseBodyType, statement,
                        protocolMethod.getProxyMethod().getResponseContentTypes(),
                        typeReferenceStaticClasses);
            }
            if (convenienceMethod.getType() == ClientMethodType.SimpleSyncRestResponse) {
                if (isResponseBase(convenienceMethod.getReturnValue().getType())) {
                    IType headerType = ((GenericType) convenienceMethod.getReturnValue().getType()).getTypeArguments()[0];

                    methodBlock.line(getProtocolMethodResponseStatement(protocolMethod, invocationExpression));

                    methodBlock.methodReturn(String.format(
                            "new ResponseBase<>(protocolMethodResponse.getRequest(), protocolMethodResponse.getStatusCode(), protocolMethodResponse.getHeaders(), null, new %1$s(protocolMethodResponse.getHeaders()))", headerType));
                } else {
                    methodBlock.methodReturn(statement);
                }
            } else if (responseBodyType.asNullable() == ClassType.VOID) {
                methodBlock.line(statement + ";");
            } else {
                methodBlock.methodReturn(statement);
            }
        }
    }

    @Override
    protected void writeThrowException(ClientMethodType methodType, String exceptionExpression, JavaBlock methodBlock) {
        if (JavaSettings.getInstance().isUseClientLogger()) {
            methodBlock.line(String.format("throw LOGGER.atError().log(%s);", exceptionExpression));
        } else {
            methodBlock.line(String.format("throw %s;", exceptionExpression));
        }
    }

    private static String getMethodInvokeViaAsyncClient(ClientMethod convenienceMethod) {
        List<String> parameterNames = convenienceMethod.getMethodInputParameters().stream()
                .map(ClientMethodParameter::getName).collect(Collectors.toList());

        return String.format("%1$s.%2$s(%3$s)",
                ASYNC_CLIENT_VAR_NAME, convenienceMethod.getName(), String.join(", ", parameterNames));
    }

    private String getProtocolMethodResponseStatement(ClientMethod protocolMethod, String invocationExpression) {
        String statement = String.format("%1$s(%2$s)",
                getMethodName(protocolMethod),
                invocationExpression);

        return String.format(
                "%1$s protocolMethodResponse = %2$s;",
                protocolMethod.getReturnValue().getType(), statement);
    }

    private IType getResponseBodyType(ClientMethod method) {
        // no need to care about LRO
        IType type = method.getReturnValue().getType();
        if (type instanceof GenericType
                && (
                ClassType.RESPONSE.getName().equals(((GenericType) type).getName())
                        || (PagedIterable.class.getSimpleName().equals(((GenericType) type).getName())))) {
            type = ((GenericType) type).getTypeArguments()[0];
        } else if (isResponseBase(type)) {
            // TODO: ResponseBase is not in use, hence it may have bug
            type = ((GenericType) type).getTypeArguments()[1];
        }
        return type;
    }

    private boolean isResponseBase(IType type) {
        return type instanceof GenericType && ResponseBase.class.getSimpleName().equals(((GenericType) type).getName());
    }

    private String expressionConvertFromBinaryData(IType responseBodyType, IType rawType, String invocationExpression,
                                                   Set<String> mediaTypes,
                                                   Set<GenericType> typeReferenceStaticClasses) {
        SupportedMimeType mimeType = SupportedMimeType.getResponseKnownMimeType(mediaTypes);
        // TODO (weidxu): support XML etc.
        switch (mimeType) {
            case TEXT:
                return String.format("%s.toString()", invocationExpression);

            case BINARY:
                return invocationExpression;

            default:
                // JSON etc.
                if (responseBodyType instanceof EnumType) {
                    // enum
                    IType elementType = ((EnumType) responseBodyType).getElementType();
                    return String.format("%1$s.from%2$s(%3$s.toObject(%2$s.class))", responseBodyType, elementType, invocationExpression);
                } else if (responseBodyType instanceof GenericType) {
                    // generic, e.g. List, Map
                    typeReferenceStaticClasses.add((GenericType) responseBodyType);
                    return String.format("%2$s.toObject(%1$s)", TemplateUtil.getTypeReferenceCreation(responseBodyType), invocationExpression);
                } else if (responseBodyType == ClassType.BINARY_DATA) {
                    // BinaryData
                    return invocationExpression;
                } else if (isModelOrBuiltin(responseBodyType)) {
                    // class
                    return String.format("%2$s.toObject(%1$s.class)", responseBodyType.asNullable(), invocationExpression);
                } else if (responseBodyType == ArrayType.BYTE_ARRAY) {
                    // byte[]
                    if (rawType == ClassType.BASE_64_URL) {
                        return String.format("%1$s.toObject(Base64Url.class).decodedBytes()", invocationExpression);
                    } else {
                        return String.format("%1$s.toObject(byte[].class)", invocationExpression);
                    }
                } else {
                    return invocationExpression;
                }
        }
    }
}
