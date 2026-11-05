// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaInterface;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Writes a Proxy to a JavaClass block.
 */
public class ProxyTemplate implements IJavaTemplate<Proxy, JavaClass> {
    private static final ProxyTemplate INSTANCE = new ProxyTemplate();

    protected ProxyTemplate() {
    }

    public static ProxyTemplate getInstance() {
        return INSTANCE;
    }

    /**
     * Adds imports required by the generated protocol implementation.
     *
     * @param restAPI The proxy to generate.
     * @param imports The imports for the containing class.
     */
    public final void addImportsTo(Proxy restAPI, Set<String> imports) {
        if (restAPI != null && !JavaSettings.getInstance().isAzureV1()) {
            ClientCoreProtocolImplementationTemplate.addImportsTo(restAPI, imports);
        }
    }

    public final void write(Proxy restAPI, JavaClass classBlock) {
        JavaSettings settings = JavaSettings.getInstance();
        if (restAPI != null) {
            if (!settings.isAzureV1()) {
                ClientCoreProtocolImplementationTemplate.write(restAPI, classBlock);
                return;
            }
            classBlock.javadocComment(comment -> comment.description(String.format(
                "The interface defining all the services for %1$s to be used by the proxy service to perform REST calls.",
                restAPI.getClientTypeName())));
            classBlock.annotation("Host(\"" + restAPI.getBaseURL() + "\")");
            classBlock.annotation("ServiceInterface(name = \"" + restAPI.getClientTypeName() + "\")");

            JavaVisibility visibility = JavaVisibility.Private;
            if (settings.isServiceInterfaceAsPublic()) {
                visibility = JavaVisibility.Public;
            }

            classBlock.interfaceBlock(visibility, restAPI.getName(), interfaceBlock -> {
                for (ProxyMethod restAPIMethod : restAPI.getMethods()) {
                    if (restAPIMethod.getRequestContentType().equals("multipart/form-data")
                        || restAPIMethod.getRequestContentType().equals("application/x-www-form-urlencoded")) {
                        interfaceBlock.lineComment("@Multipart not supported by " + ClassType.REST_PROXY.getName());
                    }

                    writeProxyMethodHeaders(restAPIMethod, interfaceBlock);

                    interfaceBlock.annotation(String.format("%1$s(\"%2$s\")",
                        CodeNamer.toPascalCase(restAPIMethod.getHttpMethod().toString().toLowerCase()),
                        restAPIMethod.getUrlPath()));
                    if (!restAPIMethod.getResponseExpectedStatusCodes().isEmpty()) {
                        interfaceBlock.annotation(String.format("ExpectedResponses({%1$s})",
                            restAPIMethod.getResponseExpectedStatusCodes()
                                .stream()
                                .map(String::valueOf)
                                .collect(Collectors.joining(", "))));
                    }

                    if (!settings.isDataPlaneClient()) {
                        if (restAPIMethod.getReturnValueWireType() != null) {
                            interfaceBlock.annotation(String.format("ReturnValueWireType(%1$s.class)",
                                restAPIMethod.getReturnValueWireType()));
                        }
                    }

                    // write @UnexpectedResponseExceptionType
                    if (restAPIMethod.getUnexpectedResponseExceptionTypes() != null) {
                        writeUnexpectedExceptions(restAPIMethod, interfaceBlock);
                    }
                    if (restAPIMethod.getUnexpectedResponseExceptionType() != null) {
                        writeSingleUnexpectedException(restAPIMethod, interfaceBlock);
                    }

                    ArrayList<String> parameterDeclarationList = new ArrayList<>();
                    if (restAPIMethod.isResumable()) {
                        interfaceBlock.annotation("ResumeOperation");
                    }

                    for (ProxyMethodParameter parameter : restAPIMethod.getParameters()) {
                        String parameterDeclaration = buildParameterDeclaration(restAPIMethod, parameter);
                        parameterDeclarationList.add(parameterDeclaration);
                    }

                    writeProxyMethodSignature(parameterDeclarationList, restAPIMethod, interfaceBlock);
                }
            });
        }
    }

    private static String buildParameterDeclaration(ProxyMethod restAPIMethod, ProxyMethodParameter parameter) {
        StringBuilder parameterDeclarationBuilder = new StringBuilder();
        RequestParameterLocation location = parameter.getRequestParameterLocation();

        switch (location) {
            case URI:
            case PATH:
            case QUERY:
            case HEADER:
                parameterDeclarationBuilder.append('@')
                    .append(CodeNamer.toPascalCase(location.toString()))
                    .append("Param(");
                if (location == RequestParameterLocation.QUERY
                    && parameter.getAlreadyEncoded()
                    && parameter.getExplode()) {
                    parameterDeclarationBuilder.append("value = \"")
                        .append(parameter.getRequestParameterName())
                        .append("\", encoded = true, multipleQueryParams = true");
                } else if (location == RequestParameterLocation.QUERY && parameter.getExplode()) {
                    parameterDeclarationBuilder.append("value = \"")
                        .append(parameter.getRequestParameterName())
                        .append("\", multipleQueryParams = true");
                } else if ((location == RequestParameterLocation.PATH || location == RequestParameterLocation.QUERY)
                    && parameter.getAlreadyEncoded()) {
                    parameterDeclarationBuilder.append("value = \"")
                        .append(parameter.getRequestParameterName())
                        .append("\", encoded = true");
                } else if (location == RequestParameterLocation.HEADER
                    && parameter.getHeaderCollectionPrefix() != null
                    && !parameter.getHeaderCollectionPrefix().isEmpty()) {
                    parameterDeclarationBuilder.append('"').append(parameter.getHeaderCollectionPrefix()).append('"');
                } else {
                    parameterDeclarationBuilder.append('"').append(parameter.getRequestParameterName()).append('"');
                }
                parameterDeclarationBuilder.append(") ");

                break;

            case BODY:
                if ("application/x-www-form-urlencoded".equals(restAPIMethod.getRequestContentType())) {
                    parameterDeclarationBuilder.append("@FormParam(\"")
                        .append(parameter.getRequestParameterName())
                        .append("\") ");
                    break;
                }
                parameterDeclarationBuilder.append("@BodyParam(\"")
                    .append(restAPIMethod.getRequestContentType())
                    .append("\") ");
                break;

            // case FormData:
            // parameterDeclarationBuilder.append(String.format("@FormParam(\"%1$s\") ",
            // parameter.getRequestParameterName()));
            // break;

            case NONE:
                break;

            default:
                if (!restAPIMethod.isResumable() && parameter.getWireType() != ClassType.CONTEXT) {
                    throw new IllegalArgumentException("Unrecognized RequestParameterLocation value: " + location);
                }

                break;
        }

        parameterDeclarationBuilder.append(parameter.getWireType()).append(" ").append(parameter.getName());
        return parameterDeclarationBuilder.toString();
    }

    protected void writeUnexpectedExceptions(ProxyMethod restAPIMethod, JavaInterface interfaceBlock) {
        for (Map.Entry<ClassType, List<Integer>> exception : restAPIMethod.getUnexpectedResponseExceptionTypes()
            .entrySet()) {
            interfaceBlock.annotation(
                String.format("UnexpectedResponseExceptionType(value = %1$s.class, code = {%2$s})", exception.getKey(),
                    exception.getValue().stream().map(String::valueOf).collect(Collectors.joining(", "))));
        }
    }

    protected void writeSingleUnexpectedException(ProxyMethod restAPIMethod, JavaInterface interfaceBlock) {
        interfaceBlock.annotation(String.format("UnexpectedResponseExceptionType(%1$s.class)",
            restAPIMethod.getUnexpectedResponseExceptionType()));
    }

    protected void writeProxyMethodSignature(java.util.ArrayList<String> parameterDeclarationList,
        ProxyMethod restAPIMethod, JavaInterface interfaceBlock) {
        String parameterDeclarations = String.join(", ", parameterDeclarationList);
        IType restAPIMethodReturnValueClientType = restAPIMethod.getReturnType().getClientType();
        if (restAPIMethod.getImplementation() != null) {
            interfaceBlock.defaultMethod(String.format("%1$s %2$s(%3$s)", restAPIMethodReturnValueClientType,
                restAPIMethod.getName(), parameterDeclarations),
                functionBlock -> functionBlock.line(restAPIMethod.getImplementation()));
        } else {
            interfaceBlock.publicMethod(String.format("%1$s %2$s(%3$s)", restAPIMethodReturnValueClientType,
                restAPIMethod.getName(), parameterDeclarations));
        }
    }

    /**
     * Extension to write Headers annotation for proxy method.
     *
     * @param restAPIMethod proxy method
     * @param interfaceBlock interface block
     */
    protected void writeProxyMethodHeaders(ProxyMethod restAPIMethod, JavaInterface interfaceBlock) {
    }
}
