// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.azure.core.annotation.ReturnType;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterMapping;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterSynthesizedOrigin;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaInterface;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ClientCoreClientMethodTemplate extends ClientMethodTemplate {
    private static final ClientCoreClientMethodTemplate INSTANCE = new ClientCoreClientMethodTemplate();

    protected ClientCoreClientMethodTemplate() {

    }

    public static ClientCoreClientMethodTemplate getInstance() {
        return INSTANCE;
    }

    /**
     * Applies parameter transformations to the client method parameters.
     *
     * @param function The client method code block.
     * @param clientMethod The client method.
     * @param settings AutoRest generation settings.
     */
    protected void applyParameterTransformations(JavaBlock function, ClientMethod clientMethod, JavaSettings settings) {
        for (ParameterTransformation transformation : clientMethod.getParameterTransformations().asList()) {
            if (!transformation.hasMappings()) {
                // the case that this flattened parameter is not original parameter from any other parameters
                ClientMethodParameter outParameter = transformation.getOutParameter();
                if (outParameter.isRequired() && outParameter.getClientType() instanceof ClassType) {
                    function.line("%1$s %2$s = new %1$s();", outParameter.getClientType(), outParameter.getName());
                } else {
                    function.line("%1$s %2$s = null;", outParameter.getClientType(), outParameter.getName());
                }

                // TODO (alzimmer): Should this break here? What if there are subsequent method transformation details?
                break;
            }

            String nullCheck = transformation.getOptionalInMappings().map(m -> {
                ClientMethodParameter parameter = m.getInParameter();

                String parameterName;
                if (!parameter.isFromClient()) {
                    parameterName = parameter.getName();
                } else {
                    parameterName = m.getInParameterProperty().getName();
                }

                return parameterName + " != null";
            }).collect(Collectors.joining(" || "));

            boolean conditionalAssignment = !nullCheck.isEmpty()
                && !transformation.getOutParameter().isRequired()
                && !clientMethod.getOnlyRequiredParameters();

            // Use a mutable internal variable, leave the original name for effectively final variable
            String outParameterName = conditionalAssignment
                ? transformation.getOutParameter().getName() + "Internal"
                : transformation.getOutParameter().getName();
            if (conditionalAssignment) {
                function.line(transformation.getOutParameter().getClientType() + " " + outParameterName + " = null;");
                function.line("if (" + nullCheck + ") {");
                function.increaseIndent();
            }

            IType transformationOutputParameterModelType = transformation.getOutParameter().getClientType();
            boolean generatedCompositeType = false;
            if (transformationOutputParameterModelType instanceof ClassType) {
                generatedCompositeType = ((ClassType) transformationOutputParameterModelType).getPackage()
                    .startsWith(settings.getPackage());
            }
            if (generatedCompositeType
                && transformation.getMappings()
                    .stream()
                    .anyMatch(
                        m -> m.getOutParameterPropertyName() != null && !m.getOutParameterPropertyName().isEmpty())) {
                String transformationOutputParameterModelCompositeTypeName
                    = transformationOutputParameterModelType.toString();

                List<String> requiredParams = transformation.getMappings()
                    .stream()
                    .filter(parameterMapping -> parameterMapping.getOutParameterProperty() != null
                        && parameterMapping.getOutParameterProperty().isRequired())
                    .map(requiredParameterMapping -> requiredParameterMapping.getInParameter().getName())
                    .collect(Collectors.toList());

                function.line("%s%s = new %s(%s);",
                    !conditionalAssignment ? transformation.getOutParameter().getClientType() + " " : "",
                    outParameterName, transformationOutputParameterModelCompositeTypeName,
                    String.join(", ", requiredParams));
            }

            for (ParameterMapping mapping : transformation.getMappings()) {
                if (mapping.getOutParameterProperty() != null && mapping.getOutParameterProperty().isRequired()) {
                    continue;
                }
                String inputPath;
                if (mapping.getInParameterProperty() != null) {
                    inputPath = mapping.getInParameter().getName() + "."
                        + CodeNamer.getModelNamer().modelPropertyGetterName(mapping.getInParameterProperty()) + "()";
                } else {
                    inputPath = mapping.getInParameter().getName();
                }

                if (clientMethod.getOnlyRequiredParameters() && !mapping.getInParameter().isRequired()) {
                    inputPath = "null";
                }

                String getMapping;
                if (mapping.getOutParameterPropertyName() != null) {
                    getMapping = String.format(".%s(%s)",
                        CodeNamer.getModelNamer().modelPropertySetterName(mapping.getOutParameterPropertyName()),
                        inputPath);
                } else {
                    getMapping = " = " + inputPath;
                }

                function.line("%s%s%s;",
                    !conditionalAssignment && !generatedCompositeType
                        ? transformation.getOutParameter().getClientType() + " "
                        : "",
                    outParameterName, getMapping);
            }

            if (conditionalAssignment) {
                function.decreaseIndent();
                function.line("}");

                String name = transformation.getOutParameter().getName();
                if (clientMethod.getParameters()
                    .stream()
                    .anyMatch(param -> param.getName().equals(transformation.getOutParameter().getName()))) {
                    name = name + "Local";
                }
                function.line(
                    transformation.getOutParameter().getClientType() + " " + name + " = " + outParameterName + ";");
            }
        }
    }

    @Override
    protected String byteArrayToBase64Encoded(String parameterName, IType wireType) {
        if ((wireType == ClassType.STRING)) {
            // byte[] to Base64-encoded String.
            return "new String(Base64.getEncoder().encode(" + parameterName + "))";
        } else {
            // byte[] to Base64-encoded URL.
            return ClassType.BASE_64_URL.getName() + ".encode" + "(" + parameterName + ")";
        }
    }

    private static boolean addSpecialHeadersToRequestOptions(JavaBlock function, ClientMethod clientMethod) {
        // logic only works for DPG, protocol API, on RequestOptions

        boolean requestOptionsLocal = false;

        final boolean repeatabilityRequestHeaders
            = MethodUtil.isMethodIncludeRepeatableRequestHeaders(clientMethod.getProxyMethod());

        // optional parameter is in getAllParameters
        boolean bodyParameterOptional = clientMethod.getProxyMethod()
            .getAllParameters()
            .stream()
            .anyMatch(p -> p.getRequestParameterLocation() == RequestParameterLocation.BODY
                && !p.isConstant()
                && !p.isFromClient()
                && !p.isRequired());
        // this logic relies on: codegen requires either source defines "content-type" header parameter, or codegen
        // generates a "content-type" header parameter (ref ProxyMethodMapper class)
        boolean singleContentType = clientMethod.getProxyMethod()
            .getAllParameters()
            .stream()
            .noneMatch(p -> p.getRequestParameterLocation() == RequestParameterLocation.HEADER
                && HttpHeaderName.CONTENT_TYPE.getCaseInsensitiveName().equalsIgnoreCase(p.getRequestParameterName())
                && p.getRawType() instanceof EnumType
                && ((EnumType) p.getRawType()).getValues().size() > 1);
        final boolean contentTypeRequestHeaders = bodyParameterOptional && singleContentType;

        // need a "final" variable for RequestContext
        if (repeatabilityRequestHeaders || contentTypeRequestHeaders) {
            requestOptionsLocal = true;
            function.line(
                "RequestContext requestContext = requestContext == null ? RequestContext.none() : requestContext;");
        }

        // repeatability headers
        if (repeatabilityRequestHeaders) {
            requestOptionsSetHeaderIfAbsent(function, MethodUtil.REPEATABILITY_REQUEST_ID_EXPRESSION,
                MethodUtil.REPEATABILITY_REQUEST_ID_HEADER);
            if (clientMethod.getProxyMethod()
                .getSpecialHeaders()
                .contains(MethodUtil.REPEATABILITY_FIRST_SENT_HEADER)) {
                requestOptionsSetHeaderIfAbsent(function, MethodUtil.REPEATABILITY_FIRST_SENT_EXPRESSION,
                    MethodUtil.REPEATABILITY_FIRST_SENT_HEADER);
            }
        }

        // content-type headers for optional body parameter
        if (contentTypeRequestHeaders) {
            final String contentType = clientMethod.getProxyMethod().getRequestContentType();
            function.line("requestContext = requestContext.toBuilder().addRequestCallback(requestLocal -> {");
            function.indent(() -> function.ifBlock(
                "requestLocal.getBody() != null && requestLocal.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null",
                ifBlock -> function
                    .line("requestLocal.getHeaders().set(HttpHeaderName.CONTENT_TYPE, \"" + contentType + "\");")));
            function.line("}).build();");
        }

        return requestOptionsLocal;
    }

    private static void requestOptionsSetHeaderIfAbsent(JavaBlock function, String expression, String headerName) {
        function.line("requestContext = requestContext.toBuilder().addRequestCallback(requestLocal -> {");
        function.indent(() -> function.ifBlock(
            "requestLocal.getHeaders().get(HttpHeaderName.fromString(\"" + headerName + "\")) == null",
            ifBlock -> function.line("requestLocal.getHeaders().set(HttpHeaderName.fromString(\"" + headerName + "\"), "
                + expression + ");")));
        function.line("}).build();");
    }

    protected static void writeMethod(JavaType typeBlock, JavaVisibility visibility, String methodSignature,
        Consumer<JavaBlock> method) {
        if (visibility == JavaVisibility.Public) {
            typeBlock.publicMethod(methodSignature, method);
        } else if (typeBlock instanceof JavaClass) {
            JavaClass classBlock = (JavaClass) typeBlock;
            classBlock.method(visibility, null, methodSignature, method);
        }
    }

    @Override
    public final void write(ClientMethod clientMethod, JavaType typeBlock) {

        final boolean writingInterface = typeBlock instanceof JavaInterface;
        if (clientMethod.getMethodVisibility() != JavaVisibility.Public && writingInterface) {
            return;
        }

        JavaSettings settings = JavaSettings.getInstance();

        ProxyMethod restAPIMethod = clientMethod.getProxyMethod();

        generateJavadoc(clientMethod, typeBlock, restAPIMethod, writingInterface);

        switch (clientMethod.getType()) {
            case PagingSync:
                generatePagingPlainSync(clientMethod, typeBlock, settings);
                break;

            case PagingAsync:
                throw new UnsupportedOperationException("Async methods are not supported");

            case PagingSyncSinglePage:
                generatePagedSinglePage(clientMethod, typeBlock, settings);
                break;

            case PagingAsyncSinglePage:
                throw new UnsupportedOperationException("Async methods are not supported");

            case LongRunningAsync:
                throw new UnsupportedOperationException("Async methods are not supported");

            case LongRunningSync:
                generateLongRunningSync(clientMethod, typeBlock, settings);
                break;

            case LongRunningBeginAsync:
                throw new UnsupportedOperationException("Async methods are not supported");

            case LongRunningBeginSync:
                generateLongRunningBeginSync(clientMethod, typeBlock, settings);
                break;

            case Resumable:
                generateResumable(clientMethod, typeBlock, settings);
                break;

            case SimpleSync:
                generateSimpleSyncMethod(clientMethod, typeBlock);
                break;

            case SimpleSyncRestResponse:
                generatePlainSyncMethod(clientMethod, typeBlock, settings);
                break;

            case SimpleAsyncRestResponse:
                throw new UnsupportedOperationException("Async methods are not supported");

            case SimpleAsync:
                throw new UnsupportedOperationException("Async methods are not supported");

            case SendRequestAsync:
                throw new UnsupportedOperationException("Async methods are not supported");

            case SendRequestSync:
                throw new UnsupportedOperationException("Send request not supported");
        }
    }

    private void generatePagedSinglePage(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        final ProxyMethod restAPIMethod = clientMethod.getProxyMethod().toSync();

        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addValidations(function, clientMethod, settings);
            addOptionalAndConstantVariables(function, clientMethod, settings);
            applyParameterTransformations(function, clientMethod, settings);
            convertClientTypesToWireTypes(function, clientMethod);

            boolean requestOptionsLocal = addSpecialHeadersToRequestOptions(function, clientMethod);

            String serviceMethodCall
                = checkAndReplaceParamNameCollision(clientMethod, restAPIMethod, requestOptionsLocal, settings);
            function.line(String.format("%s res = %s;", restAPIMethod.getReturnType(), serviceMethodCall));
            if (settings.isAzureV1()) {
                function.line("return new PagedResponseBase<>(");
                function.line("res.getRequest(),");
                function.line("res.getStatusCode(),");
                function.line("res.getHeaders(),");
                if (settings.isDataPlaneClient()) {
                    function.line("getValues(res.getValue(), \"%s\"),",
                        clientMethod.getMethodPageDetails().getSerializedItemName());
                } else {
                    function.line("res.getValue().%s(),", CodeNamer.getModelNamer()
                        .modelPropertyGetterName(clientMethod.getMethodPageDetails().getItemName()));
                }
                if (clientMethod.getMethodPageDetails().nonNullNextLink()) {
                    if (settings.isDataPlaneClient()) {
                        function.line("getNextLink(res.getValue(), \"%s\"),",
                            clientMethod.getMethodPageDetails().getSerializedNextLinkName());
                    } else {
                        function.line(nextLinkLine(clientMethod));
                    }
                } else {
                    function.line("null,");
                }

                if (responseTypeHasDeserializedHeaders(clientMethod.getProxyMethod().getReturnType())) {
                    function.line("res.getDeserializedHeaders());");
                } else {
                    function.line("null);");
                }
            } else {
                function.line("return new PagedResponse<>(");
                function.line("res.getRequest(),");
                function.line("res.getStatusCode(),");
                function.line("res.getHeaders(),");
                function.line("res.getValue().%s(),", CodeNamer.getModelNamer()
                    .modelPropertyGetterName(clientMethod.getMethodPageDetails().getItemName()));
                // continuation token
                if (clientMethod.getMethodPageDetails().getContinuationToken() != null) {
                    MethodPageDetails.ContinuationToken continuationToken
                        = clientMethod.getMethodPageDetails().getContinuationToken();
                    if (continuationToken.getResponseHeaderSerializedName() != null) {
                        function.line("res.getHeaders().getValue(HttpHeaderName.fromString(" + ClassType.STRING
                            .defaultValueExpression(continuationToken.getResponseHeaderSerializedName()) + ")),");
                    } else if (continuationToken.getResponsePropertyReference() != null) {
                        StringBuilder continuationTokenExpression = new StringBuilder("res.getValue()");
                        for (ModelPropertySegment propertySegment : continuationToken.getResponsePropertyReference()) {
                            continuationTokenExpression.append(".")
                                .append(
                                    CodeNamer.getModelNamer().modelPropertyGetterName(propertySegment.getProperty()))
                                .append("()");
                        }
                        function.line(continuationTokenExpression.append(",").toString());
                    } else {
                        // this should not happen
                        function.line("null,");
                    }
                } else {
                    function.line("null,");
                }
                // next link
                if (clientMethod.getMethodPageDetails().nonNullNextLink()) {
                    String nextLinkLine = nextLinkLine(clientMethod);
                    nextLinkLine = nextLinkLine.substring(0, nextLinkLine.length() - 1);
                    function.line(nextLinkLine + ",");
                } else {
                    function.line("null,");
                }
                // previous link, first link, last link
                function.line("null,null,null);");
            }
        });
    }

    protected void generatePagingSync(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        addServiceMethodAnnotation(typeBlock, ReturnType.COLLECTION);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            function.methodReturn(String.format("new PagedIterable<>(%s(%s))",
                clientMethod.getProxyMethod().getSimpleAsyncMethodName(), clientMethod.getArgumentList()));
        });
    }

    protected void generatePagingPlainSync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        addServiceMethodAnnotation(typeBlock, ReturnType.COLLECTION);
        if (clientMethod.getMethodPageDetails().nonNullNextLink()) {
            writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
                addOptionalVariables(function, clientMethod);
                if (clientMethod.getParameters()
                    .stream()
                    .anyMatch(param -> param.getClientType() == ClassType.REQUEST_CONTEXT)) {
                    function.line(
                        "RequestContext requestContextForNextPage = requestContext != null ? requestContext : RequestContext.none();");
                }
                function.line("return new PagedIterable<>(");

                String nextMethodArgs = clientMethod.getMethodPageDetails()
                    .getNextMethod()
                    .getArgumentList()
                    .replace("requestContext", "requestContextForNextPage");
                String firstPageArgs = clientMethod.getArgumentList();
                String effectiveNextMethodArgs = nextMethodArgs;
                String effectiveFirstPageArgs = firstPageArgs;
                function.indent(() -> {
                    function.line("%s,",
                        this.getPagingSinglePageExpression(clientMethod,
                            clientMethod.getProxyMethod().getPagingSinglePageMethodName(), effectiveFirstPageArgs,
                            settings));
                    function.line("%s);",
                        this.getPagingNextPageExpression(clientMethod,
                            clientMethod.getMethodPageDetails()
                                .getNextMethod()
                                .getProxyMethod()
                                .getPagingSinglePageMethodName(),
                            effectiveNextMethodArgs, settings));
                });
            });
        } else {
            writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {

                String firstPageArgs = clientMethod.getArgumentList();
                String effectiveFirstPageArgs = firstPageArgs;
                addOptionalVariables(function, clientMethod);
                function.line("return new PagedIterable<>(");
                function.indent(() -> function.line(this.getPagingSinglePageExpression(clientMethod,
                    clientMethod.getProxyMethod().getPagingSinglePageMethodName(), effectiveFirstPageArgs, settings)
                    + ");"));
            });
        }
    }

    private static void addServiceMethodAnnotation(JavaType typeBlock, ReturnType returnType) {
        typeBlock.annotation("ServiceMethod(returns = ReturnType." + returnType.name() + ")");
    }

    protected void generateResumable(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        final ProxyMethod restAPIMethod = clientMethod.getProxyMethod();

        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        typeBlock.publicMethod(clientMethod.getDeclaration(), function -> {
            ProxyMethodParameter parameter = restAPIMethod.getParameters().get(0);
            addValidations(function, clientMethod, settings);
            function.methodReturn("service." + restAPIMethod.getName() + "(" + parameter.getName() + ")");
        });
    }

    private void generateSimpleSyncMethod(ClientMethod clientMethod, JavaType typeBlock) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), (function -> {
            addOptionalVariables(function, clientMethod);

            String argumentList = clientMethod.getArgumentList();

            argumentList = argumentList == null || argumentList.isEmpty()
                ? "RequestContext.none()"
                : argumentList + ", RequestContext.none()";

            if (clientMethod.getReturnValue().getType().equals(PrimitiveType.VOID)) {
                function.line("%s(%s);", clientMethod.getProxyMethod().getSimpleRestResponseMethodName(), argumentList);
            } else {
                function.line("return %s(%s).getValue();",
                    clientMethod.getProxyMethod().getSimpleRestResponseMethodName(), argumentList);
            }
        }));
    }

    private void generateSimplePlainSyncMethod(ClientMethod clientMethod, JavaType typeBlock) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), (function -> {
            addOptionalVariables(function, clientMethod);

            String argumentList = clientMethod.getArgumentList();
            if (clientMethod.getReturnValue().getType().equals(PrimitiveType.VOID)) {
                function.line("%s(%s);", clientMethod.getProxyMethod().getSimpleRestResponseMethodName(), argumentList);
            } else {
                function.line("return %s(%s).getValue();",
                    clientMethod.getProxyMethod().getSimpleRestResponseMethodName(), argumentList);
            }
        }));
    }

    protected void generateSyncMethod(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        String asyncMethodName = MethodNamer.getSimpleAsyncMethodName(clientMethod.getName());
        if (clientMethod.getType() == ClientMethodType.SimpleSyncRestResponse) {
            asyncMethodName = clientMethod.getProxyMethod().getSimpleAsyncRestResponseMethodName();
        }
        String effectiveAsyncMethodName = asyncMethodName;
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            if (clientMethod.getReturnValue().getType() == ClassType.INPUT_STREAM) {
                function.line(
                    "Iterator<ByteBufferBackedInputStream> iterator = %s(%s).map(ByteBufferBackedInputStream::new).toStream().iterator();",
                    effectiveAsyncMethodName, clientMethod.getArgumentList());
                function.anonymousClass("Enumeration<InputStream>", "enumeration", javaBlock -> {
                    javaBlock.annotation("Override");
                    javaBlock.publicMethod("boolean hasMoreElements()",
                        methodBlock -> methodBlock.methodReturn("iterator.hasNext()"));
                    javaBlock.annotation("Override");
                    javaBlock.publicMethod("InputStream nextElement()",
                        methodBlock -> methodBlock.methodReturn("iterator.next()"));
                });
                function.methodReturn("new SequenceInputStream(enumeration)");
            } else if (clientMethod.getReturnValue().getType() != PrimitiveType.VOID) {
                IType returnType = clientMethod.getReturnValue().getType();
                if (returnType instanceof PrimitiveType) {
                    function.line("%s value = %s(%s).block();", returnType.asNullable(), effectiveAsyncMethodName,
                        clientMethod.getArgumentList());
                    function.ifBlock("value != null", ifAction -> ifAction.methodReturn("value"))
                        .elseBlock(elseAction -> {
                            if (settings.isUseClientLogger()) {
                                elseAction.line("throw LOGGER.atError().log(new NullPointerException());");
                            } else {
                                elseAction.line("throw new NullPointerException();");
                            }
                        });
                } else if (returnType instanceof GenericType && !settings.isDataPlaneClient()) {
                    GenericType genericType = (GenericType) returnType;
                    if ("Response".equals(genericType.getName())
                        && genericType.getTypeArguments()[0].equals(ClassType.INPUT_STREAM)) {
                        function.line("return %s(%s).map(response -> {", effectiveAsyncMethodName,
                            clientMethod.getArgumentList());
                        function.indent(() -> {
                            function.line(
                                "Iterator<ByteBufferBackedInputStream> iterator = response.getValue().map(ByteBufferBackedInputStream::new).toStream().iterator();");
                            function.anonymousClass("Enumeration<InputStream>", "enumeration", javaBlock -> {
                                javaBlock.annotation("Override");
                                javaBlock.publicMethod("boolean hasMoreElements()",
                                    methodBlock -> methodBlock.methodReturn("iterator.hasNext()"));
                                javaBlock.annotation("Override");
                                javaBlock.publicMethod("InputStream nextElement()",
                                    methodBlock -> methodBlock.methodReturn("iterator.next()"));
                            });

                            function.methodReturn(
                                "new SimpleResponse<InputStream>(response.getRequest(), response.getStatusCode(), response.getHeaders(), new SequenceInputStream(enumeration))");
                        });

                        function.line("}).block();");
                    } else {
                        function.methodReturn(
                            String.format("%s(%s).block()", effectiveAsyncMethodName, clientMethod.getArgumentList()));
                    }
                } else {
                    function.methodReturn(
                        String.format("%s(%s).block()", effectiveAsyncMethodName, clientMethod.getArgumentList()));
                }
            } else {
                function.line("%s(%s).block();", effectiveAsyncMethodName, clientMethod.getArgumentList());
            }
        });
    }

    protected void generatePlainSyncMethod(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        final ProxyMethod restAPIMethod = clientMethod.getProxyMethod();
        String effectiveProxyMethodName = restAPIMethod.getName();
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {

            addValidations(function, clientMethod, settings);
            addOptionalAndConstantVariables(function, clientMethod, settings);
            applyParameterTransformations(function, clientMethod, settings);
            convertClientTypesToWireTypes(function, clientMethod);

            boolean requestContextLocal = false;

            String serviceMethodCall = checkAndReplaceParamNameCollision(clientMethod, restAPIMethod.toSync(),
                requestContextLocal, settings);
            if (clientMethod.getReturnValue().getType() == ClassType.INPUT_STREAM) {
                function.line(
                    "Iterator<ByteBufferBackedInputStream> iterator = %s(%s).map(ByteBufferBackedInputStream::new).toStream().iterator();",
                    effectiveProxyMethodName, clientMethod.getArgumentList());
                function.anonymousClass("Enumeration<InputStream>", "enumeration", javaBlock -> {
                    javaBlock.annotation("Override");
                    javaBlock.publicMethod("boolean hasMoreElements()",
                        methodBlock -> methodBlock.methodReturn("iterator.hasNext()"));
                    javaBlock.annotation("Override");
                    javaBlock.publicMethod("InputStream nextElement()",
                        methodBlock -> methodBlock.methodReturn("iterator.next()"));
                });
                function.methodReturn("new SequenceInputStream(enumeration)");
            } else if (clientMethod.getReturnValue().getType() != PrimitiveType.VOID) {
                IType returnType = clientMethod.getReturnValue().getType();
                if (returnType instanceof PrimitiveType) {
                    function.line("%s value = %s(%s);", returnType.asNullable(), effectiveProxyMethodName,
                        clientMethod.getArgumentList());
                    function.ifBlock("value != null", ifAction -> ifAction.methodReturn("value"))
                        .elseBlock(elseAction -> {
                            if (settings.isUseClientLogger()) {
                                elseAction.line("throw LOGGER.atError().log(new NullPointerException());");
                            } else {
                                elseAction.line("throw new NullPointerException();");
                            }
                        });
                } else {
                    function.methodReturn(serviceMethodCall);
                }
            } else {
                function.line("%s(%s);", effectiveProxyMethodName, clientMethod.getArgumentList());
            }
        });
    }

    /**
     * Generate javadoc for client method.
     *
     * @param clientMethod client method
     * @param typeBlock code block
     * @param restAPIMethod proxy method
     * @param useFullClassName whether to use fully-qualified class name in javadoc
     */
    public static void generateJavadoc(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        boolean useFullClassName) {
        // interface need a fully-qualified exception class name, since exception is usually only included in
        // ProxyMethod
        typeBlock.javadocComment(comment -> generateJavadoc(clientMethod, comment, restAPIMethod, useFullClassName));
    }

    /**
     * Generate javadoc for client method.
     *
     * @param clientMethod client method
     * @param commentBlock comment block
     * @param restAPIMethod proxy method
     * @param useFullClassName whether to use fully-qualified class name in javadoc
     */
    public static void generateJavadoc(ClientMethod clientMethod, JavaJavadocComment commentBlock,
        ProxyMethod restAPIMethod, boolean useFullClassName) {
        commentBlock.description(clientMethod.getDescription());
        List<ClientMethodParameter> methodParameters = clientMethod.getMethodInputParameters();
        for (ClientMethodParameter parameter : methodParameters) {
            commentBlock.param(parameter.getName(), parameterDescriptionOrDefault(parameter));
        }
        if (restAPIMethod != null && clientMethod.hasParameterDeclaration()) {
            commentBlock.methodThrows("IllegalArgumentException", "thrown if parameters fail the validation");
        }
        generateJavadocExceptions(clientMethod, commentBlock, useFullClassName);
        commentBlock.methodThrows("RuntimeException",
            "all other wrapped checked exceptions if the request fails to be sent");
        commentBlock.methodReturns(clientMethod.getReturnValue().getDescription());
    }

    protected static String parameterDescriptionOrDefault(ClientMethodParameter parameter) {
        String paramJavadoc = parameter.getDescription();
        if (CoreUtils.isNullOrEmpty(paramJavadoc)) {
            paramJavadoc = "The " + parameter.getName() + " parameter";
        }
        return paramJavadoc;
    }

    protected static String nextLinkLine(ClientMethod clientMethod) {
        return nextLinkLine(clientMethod, "getValue()");
    }

    protected static String nextLinkLine(ClientMethod clientMethod, String valueExpression) {
        return String.format("res.%3$s.%1$s()%2$s,",
            CodeNamer.getModelNamer().modelPropertyGetterName(clientMethod.getMethodPageDetails().getNextLinkName()),
            // nextLink could be type URL
            (clientMethod.getMethodPageDetails().getNextLinkType() == ClassType.URL ? ".toString()" : ""),
            valueExpression);
    }

    private static boolean responseTypeHasDeserializedHeaders(IType type) {
        // TODO (alzimmer): ClassTypes should maintain reference to any super class or interface they extend/implement.
        // This code is based on the previous implementation that assume if the T type for Mono<T> is a class that
        // it has deserialized headers. This won't always be the case, but ClassType also isn't able to maintain
        // whether the class is an extension of ResponseBase.
        if (type instanceof ClassType) {
            return true;
        } else
            return type instanceof GenericType && "ResponseBase".equals(((GenericType) type).getName());
    }

    private static String checkAndReplaceParamNameCollision(ClientMethod clientMethod, ProxyMethod restAPIMethod,
        boolean useLocalRequestContext, JavaSettings settings) {
        // Asynchronous methods will use 'FluxUtils.withContext' to infer 'Context' from the Reactor's context.
        // Only replace 'context' with 'Context.NONE' for synchronous methods that don't have a 'Context' parameter.
        boolean isSync = clientMethod.getProxyMethod().isSync();
        StringBuilder builder = new StringBuilder("service.").append(restAPIMethod.getName()).append('(');
        Map<String, ClientMethodParameter> nameToParameter = clientMethod.getParameters()
            .stream()
            .collect(Collectors.toMap(ClientMethodParameter::getName, Function.identity()));
        Set<String> parametersWithTransformations = clientMethod.getParameterTransformations().getOutParameterNames();

        boolean firstParameter = true;
        for (String proxyMethodArgument : clientMethod.getProxyMethodArguments(settings)) {
            String parameterName;
            if (useLocalRequestContext && "requestContext".equals(proxyMethodArgument)) {
                // Simple static mapping for RequestOptions when 'useLocalRequestOptions' is true.
                parameterName = "requestContextLocal";
            } else {
                ClientMethodParameter parameter = nameToParameter.get(proxyMethodArgument);
                if (parameter != null && parametersWithTransformations.contains(proxyMethodArgument)) {
                    // If this ClientMethod contains the ProxyMethod parameter and it has a transformation use the
                    // '*Local' transformed version in the service call.
                    parameterName = proxyMethodArgument + "Local";
                } else {
                    if (!isSync) {
                        // For asynchronous methods always use the argument name.
                        parameterName = proxyMethodArgument;
                    } else {
                        parameterName = (parameter == null && "requestContext".equals(proxyMethodArgument))
                            ? TemplateUtil.getRequestContextNone()
                            : proxyMethodArgument;
                    }
                }
            }

            if (firstParameter) {
                builder.append(parameterName);
                firstParameter = false;
            } else {
                builder.append(", ").append(parameterName);
            }
        }

        return builder.append(')').toString();
    }

    protected boolean contextInParameters(ClientMethod clientMethod) {
        return clientMethod.getParameters().stream().anyMatch(param -> getContextType().equals(param.getClientType()));
    }

    protected IType getContextType() {
        return ClassType.CONTEXT;
    }

    /**
     * Extension to write LRO async client method.
     *
     * @param clientMethod client method
     * @param typeBlock type block
     * @param restAPIMethod proxy method
     * @param settings java settings
     */
    protected void generateLongRunningAsync(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        throw new UnsupportedOperationException("async methods not supported");

    }

    /**
     * Extension to write LRO sync client method.
     *
     * @param clientMethod client method
     * @param typeBlock type block
     * @param settings java settings
     */
    protected void generateLongRunningSync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {

    }

    /**
     * Extension to write LRO begin sync client method.
     *
     * @param clientMethod client method
     * @param typeBlock type block
     */
    protected void generateLongRunningBeginSyncOverAsync(ClientMethod clientMethod, JavaType typeBlock) {
        typeBlock.annotation("ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)");
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            function.methodReturn(String.format("this.%sAsync(%s).getSyncPoller()", clientMethod.getName(),
                clientMethod.getArgumentList()));
        });
    }

    /**
     * Extension to write LRO begin sync client method.
     *
     * @param clientMethod client method
     * @param typeBlock type block
     * @param settings java settings
     */
    protected void generateLongRunningBeginSync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        final ProxyMethod restAPIMethod = clientMethod.getProxyMethod();

        typeBlock.annotation("ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)");
        String contextParam;
        if (clientMethod.getParameters().stream().anyMatch(p -> p.getClientType().equals(ClassType.CONTEXT))) {
            contextParam = "context";
        } else {
            contextParam = TemplateUtil.getContextNone();
        }
        String pollingStrategy = getSyncPollingStrategy(clientMethod, contextParam);

        String argumentList = clientMethod.getArgumentList();

        String effectiveArgumentList = argumentList;
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            function.line("return SyncPoller.createPoller(Duration.ofSeconds(%s),",
                clientMethod.getMethodPollingDetails().getPollIntervalInSeconds());
            function.increaseIndent();
            function.line("() -> this.%s(%s),", clientMethod.getProxyMethod().getSimpleRestResponseMethodName(),
                effectiveArgumentList);
            function.line(pollingStrategy + ",");
            function.line(
                TemplateUtil.getLongRunningOperationTypeReferenceExpression(clientMethod.getMethodPollingDetails())
                    + ");");
            function.decreaseIndent();
        });
    }

    private String getPagingSinglePageExpression(ClientMethod clientMethod, String methodName, String argumentLine,
        JavaSettings settings) {
        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("(pagingOptions) -> {");
        stringBuilder.append("\n");
        stringBuilder.append(getLogExceptionExpressionForPagingOptions(clientMethod));

        if ((clientMethod.getMethodPageDetails().getContinuationToken() != null)) {
            stringBuilder.append("String token = pagingOptions.getContinuationToken();");
            stringBuilder.append("\n");
        }
        stringBuilder.append("return ");
        stringBuilder.append(methodName);
        stringBuilder.append("(");
        stringBuilder.append(argumentLine);
        stringBuilder.append(");");
        stringBuilder.append("\n");
        stringBuilder.append("}");
        return stringBuilder.toString();
    }

    private String getPagingNextPageExpression(ClientMethod clientMethod, String methodName, String argumentLine,
        JavaSettings settings) {

        String lambdaParameters = "nextLink";
        if (!settings.isAzureV1()) {
            lambdaParameters = "(pagingOptions, nextLink)";
        }

        return String.format("%s -> %s(%s)", lambdaParameters, methodName, argumentLine);
    }

    private String getSyncPollingStrategy(ClientMethod clientMethod, String contextParam) {
        String endpoint = "null";
        if (clientMethod.getProxyMethod() != null && clientMethod.getProxyMethod().getParameters() != null) {
            if (clientMethod.getProxyMethod()
                .getParameters()
                .stream()
                .anyMatch(p -> p.isFromClient()
                    && p.getRequestParameterLocation() == RequestParameterLocation.URI
                    && "endpoint".equals(p.getName()))) {
                // has EndpointTrait

                final String baseUrl = clientMethod.getProxyMethod().getBaseUrl();
                final String endpointReplacementExpr = clientMethod.getProxyMethod()
                    .getParameters()
                    .stream()
                    .filter(p -> p.isFromClient() && p.getRequestParameterLocation() == RequestParameterLocation.URI)
                    .filter(p -> baseUrl.contains(String.format("{%s}", p.getRequestParameterName())))
                    .map(p -> String.format(".replace(%1$s, %2$s)",
                        ClassType.STRING.defaultValueExpression(String.format("{%s}", p.getRequestParameterName())),
                        p.getParameterReference()))
                    .collect(Collectors.joining());
                if (!CoreUtils.isNullOrEmpty(endpointReplacementExpr)) {
                    endpoint = ClassType.STRING.defaultValueExpression(baseUrl) + endpointReplacementExpr;
                }
            }
        }
        return clientMethod.getMethodPollingDetails()
            .getSyncPollingStrategy()
            .replace("{httpPipeline}", clientMethod.getClientReference() + ".getHttpPipeline()")
            .replace("{endpoint}", endpoint)
            .replace("{context}", contextParam)
            .replace("{serviceVersion}", getServiceVersionValue(clientMethod))
            .replace("{serializerAdapter}", clientMethod.getClientReference() + ".getSerializerAdapter()")
            .replace("{intermediate-type}", clientMethod.getMethodPollingDetails().getPollResultType().toString())
            .replace("{final-type}", clientMethod.getMethodPollingDetails().getFinalResultType().toString())
            .replace(".setServiceVersion(null)", "")
            .replace(".setEndpoint(null)", "");
    }

    private static String getServiceVersionValue(ClientMethod clientMethod) {
        String serviceVersion = "null";
        if (clientMethod.getProxyMethod() != null && clientMethod.getProxyMethod().getParameters() != null) {
            if (clientMethod.getProxyMethod()
                .getParameters()
                .stream()
                .anyMatch(p -> p.getOrigin() == ParameterSynthesizedOrigin.API_VERSION)) {
                serviceVersion = clientMethod.getClientReference() + ".getServiceVersion().getVersion()";
            }
        }
        return serviceVersion;
    }
}
