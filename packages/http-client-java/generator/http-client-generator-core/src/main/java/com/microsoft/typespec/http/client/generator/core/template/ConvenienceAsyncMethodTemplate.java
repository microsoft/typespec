// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ConvenienceMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.core.http.rest.PagedResponse;
import com.azure.core.http.rest.PagedResponseBase;
import com.azure.core.util.CoreUtils;
import com.azure.core.util.FluxUtil;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Set;

public class ConvenienceAsyncMethodTemplate extends ConvenienceMethodTemplateBase {

    private static final ConvenienceAsyncMethodTemplate INSTANCE = new ConvenienceAsyncMethodTemplate();

    protected ConvenienceAsyncMethodTemplate() {
    }

    public static ConvenienceAsyncMethodTemplate getInstance() {
        return INSTANCE;
    }

    public void addImports(Set<String> imports, List<ConvenienceMethod> convenienceMethods) {
        if (!CoreUtils.isNullOrEmpty(convenienceMethods)) {
            super.addImports(imports, convenienceMethods);

            // async e.g. FluxUtil::toMono
            imports.add(FluxUtil.class.getName());

            // async pageable
            imports.add(PagedResponse.class.getName());
            imports.add(PagedResponseBase.class.getName());
            imports.add(Flux.class.getName());
        }
    }

    @Override
    protected boolean isMethodIncluded(ClientMethod method) {
        return isMethodAsync(method) && isMethodVisible(method) && !method.isImplementationOnly();
    }

    @Override
    protected boolean isMethodIncluded(ConvenienceMethod method) {
        return isMethodAsync(method.getProtocolMethod()) && isMethodVisible(method.getProtocolMethod())
                // for LRO, we actually choose the protocol method of "WithModel"
                && (method.getProtocolMethod().getType() != ClientMethodType.LongRunningBeginAsync || (method.getProtocolMethod().getImplementationDetails() != null && method.getProtocolMethod().getImplementationDetails().isImplementationOnly()))
                && method.getProtocolMethod().getMethodParameters().stream().noneMatch(p -> p.getClientType() == ClassType.CONTEXT);
    }

    protected void writeInvocationAndConversion(
            ClientMethod convenienceMethod, ClientMethod protocolMethod,
            String invocationExpression,
            JavaBlock methodBlock,
            Set<GenericType> typeReferenceStaticClasses) {

        ClientMethodType methodType = protocolMethod.getType();

        IType responseBodyType = getResponseBodyType(convenienceMethod);
        IType protocolResponseBodyType = getResponseBodyType(protocolMethod);
        IType rawResponseBodyType = convenienceMethod.getProxyMethod().getRawResponseBodyType();

        if (methodType == ClientMethodType.PagingAsync) {
            String expressionMapFromBinaryData = expressionMapFromBinaryData(
                    responseBodyType, rawResponseBodyType,
                    protocolMethod.getProxyMethod().getResponseContentTypes(),
                    typeReferenceStaticClasses);
            if (expressionMapFromBinaryData == null) {
                // no need to do the map
                methodBlock.methodReturn(String.format("%1$s(%2$s)", getMethodName(protocolMethod), invocationExpression));
            } else {
                methodBlock.line("PagedFlux<BinaryData> pagedFluxResponse = %1$s(%2$s);", getMethodName(protocolMethod), invocationExpression);

                methodBlock.methodReturn(String.format(
                        "PagedFlux.create(() -> (continuationTokenParam, pageSizeParam) -> {\n" +
                                "    Flux<PagedResponse<BinaryData>> flux = (continuationTokenParam == null)\n" +
                                "        ? pagedFluxResponse.byPage().take(1)\n" +
                                "        : pagedFluxResponse.byPage(continuationTokenParam).take(1);\n" +
                                "    return flux.map(pagedResponse -> new PagedResponseBase<Void, %1$s>(pagedResponse.getRequest(),\n" +
                                "        pagedResponse.getStatusCode(),\n" +
                                "        pagedResponse.getHeaders(),\n" +
                                "        pagedResponse.getValue().stream().map(%2$s).collect(Collectors.toList()),\n" +
                                "        pagedResponse.getContinuationToken(),\n" +
                                "        null));\n" +
                                "})",
                        responseBodyType.asNullable(), expressionMapFromBinaryData));
            }
        } else if (methodType == ClientMethodType.LongRunningBeginAsync) {
            String methodName = protocolMethod.getName();
            methodBlock.methodReturn(String.format("serviceClient.%1$s(%2$s)", methodName, invocationExpression));
        } else {
            String returnTypeConversionExpression = "";
            if (protocolResponseBodyType == ClassType.BINARY_DATA) {
                returnTypeConversionExpression = expressionConvertFromBinaryData(
                        responseBodyType, rawResponseBodyType,
                        protocolMethod.getProxyMethod().getResponseContentTypes(),
                        typeReferenceStaticClasses);
            }

            methodBlock.methodReturn(
                    String.format("%1$s(%2$s).flatMap(FluxUtil::toMono)%3$s",
                            getMethodName(protocolMethod),
                            invocationExpression,
                            returnTypeConversionExpression));
        }
    }

    @Override
    protected void writeThrowException(ClientMethodType methodType, String exceptionExpression, JavaBlock methodBlock) {
        if (methodType == ClientMethodType.PagingAsync) {
            methodBlock.methodReturn(String.format("PagedFlux.create(() -> (ignoredContinuationToken, ignoredPageSize) -> Flux.error(%s))", exceptionExpression));
        } else if (methodType == ClientMethodType.LongRunningBeginAsync) {
            methodBlock.methodReturn(String.format("PollerFlux.error(%s)", exceptionExpression));
        } else {
            methodBlock.methodReturn(String.format("Mono.error(%s)", exceptionExpression));
        }
    }

    private IType getResponseBodyType(ClientMethod method) {
        // no need to care about LRO
        // Mono<T> / PagedFlux<T>
        IType type = ((GenericType) method.getReturnValue().getType()).getTypeArguments()[0];
        if (type instanceof GenericType && ClassType.RESPONSE.getName().equals(((GenericType) type).getName())) {
            // Mono<Response<T>>
            type = ((GenericType) type).getTypeArguments()[0];
        }
        return type;
    }

    private String expressionConvertFromBinaryData(IType responseBodyType, IType rawType,
                                                   Set<String> mediaTypes,
                                                   Set<GenericType> typeReferenceStaticClasses) {
        String expressionMapFromBinaryData = expressionMapFromBinaryData(
                responseBodyType, rawType,
                mediaTypes,
                typeReferenceStaticClasses);
        if (expressionMapFromBinaryData != null) {
            return String.format(".map(%s)", expressionMapFromBinaryData);
        } else {
            // no need to do the map
            return "";
        }
    }

    private String expressionMapFromBinaryData(IType responseBodyType, IType rawType,
                                               Set<String> mediaTypes,
                                               Set<GenericType> typeReferenceStaticClasses) {
        String mapExpression = null;
        SupportedMimeType mimeType = SupportedMimeType.getResponseKnownMimeType(mediaTypes);
        // TODO (weidxu): support XML etc.
        switch (mimeType) {
            case TEXT:
                mapExpression = "protocolMethodData -> protocolMethodData.toString()";
                break;

            case BINARY:
                mapExpression = null;
                break;

            default:
                // JSON etc.
                if (responseBodyType instanceof EnumType) {
                    // enum
                    mapExpression = String.format("protocolMethodData -> %1$s.from%2$s(protocolMethodData.toObject(%2$s.class))", responseBodyType, ((EnumType) responseBodyType).getElementType());
                } else if (responseBodyType instanceof GenericType) {
                    // generic, e.g. list, map
                    typeReferenceStaticClasses.add((GenericType) responseBodyType);
                    mapExpression = String.format("protocolMethodData -> protocolMethodData.toObject(%1$s)", TemplateUtil.getTypeReferenceCreation(responseBodyType));
                } else if (responseBodyType == ClassType.BINARY_DATA) {
                    // BinaryData, no need to do the map in expressionConvertFromBinaryData
                    mapExpression = null;
                } else if (isModelOrBuiltin(responseBodyType)) {
                    // class
                    mapExpression = String.format("protocolMethodData -> protocolMethodData.toObject(%1$s.class)", responseBodyType.asNullable());
                } else if (responseBodyType == ArrayType.BYTE_ARRAY) {
                    // byte[]
                    if (rawType == ClassType.BASE_64_URL) {
                        return "protocolMethodData -> protocolMethodData.toObject(Base64Url.class).decodedBytes()";
                    } else {
                        return "protocolMethodData -> protocolMethodData.toObject(byte[].class)";
                    }
                }
                break;
        }
        return mapExpression;
    }
}
