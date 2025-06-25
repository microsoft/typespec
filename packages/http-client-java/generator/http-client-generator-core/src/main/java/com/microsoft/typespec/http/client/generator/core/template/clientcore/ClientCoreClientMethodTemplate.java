// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.azure.core.annotation.ReturnType;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.util.CoreUtils;
import com.azure.core.util.serializer.CollectionFormat;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
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
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaIfBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaInterface;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.ClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
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
     * Adds validations to the client method.
     *
     * @param function The client method code block.
     * @param expressionsToCheck Expressions to validate as non-null.
     * @param validateExpressions Expressions to validate with a custom validation (key is the expression, value is the
     * validation).
     * @param settings AutoRest generation settings, used to determine if validations should be added.
     */
    protected static void addValidations(JavaBlock function, List<String> expressionsToCheck,
        Map<String, String> validateExpressions, JavaSettings settings) {
        if (!settings.isClientSideValidations()) {
            return;
        }

        // Iteration of validateExpressions uses expressionsToCheck effectively as a set lookup, may as well turn the
        // expressionsToCheck to a set.
        Set<String> expressionsToCheckSet = new LinkedHashSet<>(expressionsToCheck);

        for (String expressionToCheck : expressionsToCheckSet) {
            // TODO (alzimmer): Need to discuss if this can be changed to the more appropriate NullPointerException.
            String exceptionExpression = "new IllegalArgumentException(\"Parameter " + expressionToCheck
                + " is required and cannot be null.\")";

            // TODO (alzimmer): Determine if the assumption being made here are always true.
            // 1. Assumes that the expression is nullable.
            // 2. Assumes that the client method returns a reactive response.
            // 3. Assumes that the reactive response is a Mono.
            JavaIfBlock nullCheck = function.ifBlock(expressionToCheck + " == null", ifBlock -> {
                if (JavaSettings.getInstance().isSyncStackEnabled()) {
                    if (settings.isUseClientLogger()) {
                        ifBlock.line("throw LOGGER.atError().log(" + exceptionExpression + ");");
                    } else {
                        ifBlock.line("throw " + exceptionExpression + ";");
                    }
                } else {
                    ifBlock.methodReturn("Mono.error(" + exceptionExpression + ")");
                }
            });

            String potentialValidateExpression = validateExpressions.get(expressionToCheck);
            if (potentialValidateExpression != null) {
                nullCheck.elseBlock(elseBlock -> elseBlock.line(potentialValidateExpression + ";"));
            }
        }

        for (Map.Entry<String, String> validateExpression : validateExpressions.entrySet()) {
            if (!expressionsToCheckSet.contains(validateExpression.getKey())) {
                function.ifBlock(validateExpression.getKey() + " != null",
                    ifBlock -> ifBlock.line(validateExpression.getValue() + ";"));
            }
        }
    }

    /**
     * Adds optional variable instantiations into the client method.
     *
     * @param function The client method code block.
     * @param clientMethod The client method.
     */
    protected static void addOptionalVariables(JavaBlock function, ClientMethod clientMethod) {
        if (!clientMethod.getOnlyRequiredParameters()) {
            return;
        }

        final MethodPageDetails pageDetails
            = clientMethod.isPageStreamingType() ? clientMethod.getMethodPageDetails() : null;
        for (ClientMethodParameter parameter : clientMethod.getMethodParameters()) {
            if (parameter.isRequired()) {
                // Parameter is required and will be part of the method signature.
                continue;
            }
            if (pageDetails != null && pageDetails.shouldHideParameter(parameter)) {
                continue;
            }

            IType parameterClientType = parameter.getClientType();
            String defaultValue = parameterDefaultValueExpression(parameterClientType, parameter.getDefaultValue(),
                JavaSettings.getInstance());
            function.line("final %s %s = %s;", parameterClientType, parameter.getName(),
                defaultValue == null ? "null" : defaultValue);
        }
    }

    /**
     * Adds optional variable instantiations and constant variables into the client method.
     *
     * @param function The client method code block.
     * @param clientMethod The client method.
     * @param proxyMethodAndConstantParameters Proxy method constant parameters.
     * @param settings AutoRest generation settings.
     */
    protected static void addOptionalAndConstantVariables(JavaBlock function, ClientMethod clientMethod,
        List<ProxyMethodParameter> proxyMethodAndConstantParameters, JavaSettings settings) {
        addOptionalAndConstantVariables(function, clientMethod, proxyMethodAndConstantParameters, settings, true, true,
            true);
    }

    /**
     * Add optional and constant variables.
     *
     * @param function The client method code block.
     * @param clientMethod The client method.
     * @param proxyMethodAndConstantParameters Proxy method constant parameters.
     * @param settings AutoRest generation settings.
     * @param addOptional Whether optional variable instantiations are added, initialized to default or null.
     * @param addConstant Whether constant variables are added, initialized to default.
     * @param ignoreParameterNeedConvert When adding optional/constant variable, ignore those which need conversion from
     * client type to wire type. Let "ConvertClientTypesToWireTypes" handle them.
     */
    protected static void addOptionalAndConstantVariables(JavaBlock function, ClientMethod clientMethod,
        List<ProxyMethodParameter> proxyMethodAndConstantParameters, JavaSettings settings, boolean addOptional,
        boolean addConstant, boolean ignoreParameterNeedConvert) {
        for (ProxyMethodParameter parameter : proxyMethodAndConstantParameters) {
            IType parameterWireType = parameter.getWireType();
            if (parameter.isNullable()) {
                parameterWireType = parameterWireType.asNullable();
            }
            IType parameterClientType = parameter.getClientType();

            // TODO (alzimmer): There are a few similar transforms like this but they all have slight nuances on output.
            // This always turns ArrayType and ListType into String, the case further down this file may not.
            if (parameterWireType != ClassType.BASE_64_URL
                && parameter.getRequestParameterLocation() != RequestParameterLocation.BODY
                // && parameter.getRequestParameterLocation() != RequestParameterLocation.FormData
                && (parameterClientType instanceof ArrayType || parameterClientType instanceof ListType)) {
                parameterWireType = ClassType.STRING;
            }

            // If the parameter isn't required and the client method only uses required parameters optional
            // parameters are omitted and will need to instantiated in the method.
            boolean optionalOmitted = clientMethod.getOnlyRequiredParameters() && !parameter.isRequired();

            // Optional variables and constants are always null if their wire type and client type differ and applying
            // conversions between the types is ignored.
            boolean alwaysNull
                = ignoreParameterNeedConvert && parameterWireType != parameterClientType && optionalOmitted;

            // Constants should be included if the parameter is a constant and it's either required or optional
            // constants aren't generated as enums.
            boolean includeConstant
                = parameter.isConstant() && (!settings.isOptionalConstantAsEnum() || parameter.isRequired());

            // Client methods only add local variable instantiations when the parameter isn't passed by the caller,
            // isn't always null, is an optional parameter that was omitted or is a constant that is either required
            // or AutoRest isn't generating with optional constant as enums.
            if (!parameter.isFromClient()
                && !alwaysNull
                && ((addOptional && optionalOmitted) || (addConstant && includeConstant))) {
                String defaultValue
                    = parameterDefaultValueExpression(parameterClientType, parameter.getDefaultValue(), settings);
                function.line("final %s %s = %s;", parameterClientType, parameter.getParameterReference(),
                    defaultValue == null ? "null" : defaultValue);
            }
        }
    }

    private static String parameterDefaultValueExpression(IType parameterClientType, String parameterDefaultValue,
        JavaSettings settings) {
        String defaultValue;
        if (settings.isNullByteArrayMapsToEmptyArray() && parameterClientType == ArrayType.BYTE_ARRAY) {
            // there's no EMPTY_BYTE_ARRAY in clients, unlike that in models
            defaultValue = "new byte[0]";
        } else {
            defaultValue = parameterClientType.defaultValueExpression(parameterDefaultValue);
        }
        return defaultValue;
    }

    /**
     * Applies parameter transformations to the client method parameters.
     *
     * @param function The client method code block.
     * @param clientMethod The client method.
     * @param settings AutoRest generation settings.
     */
    protected static void applyParameterTransformations(JavaBlock function, ClientMethod clientMethod,
        JavaSettings settings) {
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

    /**
     * Converts the type represented to the client into the type that is sent over the wire to the service.
     *
     * @param function The client method code block.
     * @param clientMethod The client method.
     * @param autoRestMethodRetrofitParameters Rest API method parameters.
     */
    protected static void convertClientTypesToWireTypes(JavaBlock function, ClientMethod clientMethod,
        List<ProxyMethodParameter> autoRestMethodRetrofitParameters) {
        for (ProxyMethodParameter parameter : autoRestMethodRetrofitParameters) {
            IType parameterWireType = parameter.getWireType();

            if (parameter.isNullable()) {
                parameterWireType = parameterWireType.asNullable();
            }

            IType parameterClientType = parameter.getClientType();

            // TODO (alzimmer): Reconcile the logic here with that earlier in the file.
            // This check parameter explosion but earlier in the file it doesn't.
            if (parameterWireType != ClassType.BASE_64_URL
                && parameter.getRequestParameterLocation() != RequestParameterLocation.BODY
                // && parameter.getRequestParameterLocation() != RequestParameterLocation.FormData &&
                && (parameterClientType instanceof ArrayType || parameterClientType instanceof ListType)) {
                parameterWireType = (parameter.getExplode()) ? new ListType(ClassType.STRING) : ClassType.STRING;
            }

            // If the wire type and client type are the same there is no conversion needed.
            if (parameterWireType == parameterClientType) {
                continue;
            }

            String parameterName = parameter.getParameterReference();
            String parameterWireName = parameter.getParameterReferenceConverted();

            boolean addedConversion = false;
            boolean alwaysNull = clientMethod.getOnlyRequiredParameters() && !parameter.isRequired();

            RequestParameterLocation parameterLocation = parameter.getRequestParameterLocation();
            if (parameterLocation != RequestParameterLocation.BODY &&
            // parameterLocation != RequestParameterLocation.FormData &&
                (parameterClientType instanceof ArrayType || parameterClientType instanceof IterableType)) {

                if (parameterClientType == ArrayType.BYTE_ARRAY) {
                    String expression = "null";
                    if (!alwaysNull) {
                        expression = (parameterWireType == ClassType.STRING)
                            ? "new String(Base64.getEncoder().encode(" + parameterName + "))"
                            : (ClassType.BASE_64_URL.getName() + ".encode(" + parameterName + ")");
                    }

                    function.line(parameterWireType + " " + parameterWireName + " = " + expression + ";");
                    addedConversion = true;
                } else if (parameterClientType instanceof IterableType) {
                    boolean alreadyNullChecked
                        = clientMethod.getRequiredNullableParameterExpressions().contains(parameterName);
                    IType elementType = ((IterableType) parameterClientType).getElementType();
                    String expression;
                    if (alwaysNull) {
                        expression = "null";
                    } else if (!parameter.getExplode()) {
                        CollectionFormat collectionFormat = parameter.getCollectionFormat();
                        String delimiter = ClassType.STRING.defaultValueExpression(collectionFormat.getDelimiter());
                        if (elementType instanceof EnumType) {
                            // EnumTypes should provide a toString implementation that represents the wire value.
                            // Circumvent the use of JacksonAdapter and handle this manually.

                            // If the parameter is null, the converted value is null.
                            // Otherwise, convert the parameter to a string, mapping each element to the toString
                            // value, finally joining with the collection format.
                            EnumType enumType = (EnumType) elementType;
                            // Not enums will be backed by Strings. Get the backing value before converting to string
                            // it, this
                            // will prevent using the enum name rather than the enum value when it isn't a String-based
                            // enum. Ex, a long-based enum with value 100 called HIGH will return "100" rather than
                            // "HIGH".
                            String enumToString = enumType.getElementType() == ClassType.STRING
                                ? "paramItemValue"
                                : "paramItemValue == null ? null : paramItemValue." + enumType.getToMethodName() + "()";
                            if (alreadyNullChecked) {
                                expression = parameterName + ".stream()\n"
                                    + "    .map(paramItemValue -> Objects.toString(" + enumToString + ", \"\"))\n"
                                    + "    .collect(Collectors.joining(" + delimiter + "))";
                            } else {
                                expression = "(" + parameterName + " == null) ? null : " + parameterName + ".stream()\n"
                                    + "    .map(paramItemValue -> Objects.toString(" + enumToString + ", \"\"))\n"
                                    + "    .collect(Collectors.joining(" + delimiter + "))";
                            }
                        } else {
                            if (elementType == ClassType.STRING
                                || (elementType instanceof ClassType && ((ClassType) elementType).isBoxedType())) {
                                String streamSource = parameterName;
                                if (!alreadyNullChecked) {
                                    streamSource = "(" + parameterName + " == null) ? null : " + parameterName;
                                }
                                expression = streamSource + ".stream()\n"
                                    + "    .map(paramItemValue -> Objects.toString(paramItemValue, \"\"))\n"
                                    + "    .collect(Collectors.joining(" + delimiter + "))";
                            } else {
                                // this logic depends on rawType of proxy method parameter be List<WireType>
                                // alternative would be check wireType of client method parameter
                                IType elementWireType = parameter.getRawType() instanceof IterableType
                                    ? ((IterableType) parameter.getRawType()).getElementType()
                                    : elementType;

                                String serializeIterableInput = parameterName;
                                if (elementWireType != elementType) {
                                    // convert List<ClientType> to List<WireType>, if necessary
                                    serializeIterableInput = String.format(
                                        "%s.stream().map(paramItemValue -> %s).collect(Collectors.toList())",
                                        parameterName, elementWireType.convertFromClientType("paramItemValue"));
                                }

                                // convert List<WireType> to String
                                if (JavaSettings.getInstance().isAzureV1()) {
                                    // Always use serializeIterable as Iterable supports both Iterable and List.
                                    expression = String.format(
                                        "JacksonAdapter.createDefaultSerializerAdapter().serializeIterable(%s, CollectionFormat.%s)",
                                        serializeIterableInput, collectionFormat.toString().toUpperCase(Locale.ROOT));
                                } else {
                                    String streamSource = serializeIterableInput;
                                    if (!alreadyNullChecked) {
                                        streamSource = "(" + parameterName + " == null) ? null : " + parameterName;
                                    }
                                    // mostly code from
                                    // https://github.com/Azure/azure-sdk-for-java/blob/e1f8f21b1111f8ac9372e0b039f3de92485a5a66/sdk/core/azure-core/src/main/java/com/azure/core/util/serializer/JacksonAdapter.java#L250-L304
                                    String serializeItemValueCode
                                        = TemplateUtil.loadTextFromResource("ClientMethodSerializeItemValue.java");
                                    expression = streamSource + ".stream().map(" + serializeItemValueCode
                                        + ").collect(Collectors.joining(" + delimiter + "))";
                                }
                            }
                        }
                    } else {
                        if (alreadyNullChecked) {
                            expression
                                = parameterName + ".stream()\n" + "    .map(item -> Objects.toString(item, \"\"))\n"
                                    + "    .collect(Collectors.toList())";
                        } else {
                            expression = "(" + parameterName + " == null) ? new ArrayList<>()\n" + ": " + parameterName
                                + ".stream().map(item -> Objects.toString(item, \"\")).collect(Collectors.toList())";
                        }
                    }
                    function.line("%s %s = %s;", parameterWireType, parameterWireName, expression);
                    addedConversion = true;
                }
            }

            if (parameter.getWireType().isUsedInXml()
                && parameterClientType instanceof ListType
                && (parameterLocation
                    == RequestParameterLocation.BODY /* || parameterLocation == RequestParameterLocation.FormData */)) {
                function.line("%s %s = new %s(%s);", parameter.getWireType(), parameterWireName,
                    parameter.getWireType(), alwaysNull ? "null" : parameterName);
                addedConversion = true;
            }

            if (!addedConversion) {
                function.line(parameter.convertFromClientType(parameterName, parameterWireName,
                    clientMethod.getOnlyRequiredParameters() && !parameter.isRequired(),
                    parameter.isConstant() || alwaysNull));
            }
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
        ClientMethodType methodType = clientMethod.getType();

        // For LRO and paging methods, there is no ClientMethodType to indicate max overload method. So, we check if
        // RequestContext is not present to determine if it is a convenience method. Currently, only max overloads
        // have RequestContext as a parameter.
        boolean isMaxOverload = !CoreUtils.isNullOrEmpty(clientMethod.getMethodInputParameters())
            || clientMethod.getMethodInputParameters().contains(ClientMethodParameter.REQUEST_CONTEXT_PARAMETER);

        if (methodType == ClientMethodType.SimpleSync
            || (methodType == ClientMethodType.PagingSync && !isMaxOverload)
            || (methodType == ClientMethodType.LongRunningBeginSync && !isMaxOverload)) {
            return;
        }

        final boolean writingInterface = typeBlock instanceof JavaInterface;
        if (clientMethod.getMethodVisibility() != JavaVisibility.Public && writingInterface) {
            return;
        }

        JavaSettings settings = JavaSettings.getInstance();

        ProxyMethod restAPIMethod = clientMethod.getProxyMethod();

        generateJavadoc(clientMethod, typeBlock, restAPIMethod, writingInterface);

        switch (methodType) {
            case PagingSync:
                generatePagingPlainSync(clientMethod, typeBlock, settings);
                break;

            case PagingAsync:
                throw new UnsupportedOperationException("Async methods are not supported");

            case PagingSyncSinglePage:
                generatePagedSinglePage(clientMethod, typeBlock, restAPIMethod.toSync(), settings);
                break;

            case PagingAsyncSinglePage:
                throw new UnsupportedOperationException("Async methods are not supported");

            case LongRunningAsync:
                throw new UnsupportedOperationException("Async methods are not supported");

            case LongRunningSync:
                generateLongRunningSync(clientMethod, typeBlock, restAPIMethod, settings);
                break;

            case LongRunningBeginAsync:
                throw new UnsupportedOperationException("Async methods are not supported");

            case LongRunningBeginSync:
                generateLongRunningBeginSync(clientMethod, typeBlock, restAPIMethod, settings);
                break;

            case Resumable:
                generateResumable(clientMethod, typeBlock, restAPIMethod, settings);
                break;

            case SimpleSync:
                generateSimpleSyncMethod(clientMethod, typeBlock);
                break;

            case SimpleSyncRestResponse:
                generatePlainSyncMethod(clientMethod, typeBlock, restAPIMethod, settings);
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

    private void generatePagedSinglePage(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);

        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addValidations(function, clientMethod.getRequiredNullableParameterExpressions(),
                clientMethod.getValidateExpressions(), settings);
            addOptionalAndConstantVariables(function, clientMethod, restAPIMethod.getParameters(), settings);
            applyParameterTransformations(function, clientMethod, settings);
            convertClientTypesToWireTypes(function, clientMethod, restAPIMethod.getParameters());

            boolean requestOptionsLocal = addSpecialHeadersToRequestOptions(function, clientMethod);

            String serviceMethodCall
                = checkAndReplaceParamNameCollision(clientMethod, restAPIMethod, requestOptionsLocal, settings);
            function.line(String.format("%s res = %s;", restAPIMethod.getReturnType(), serviceMethodCall));
            if (settings.isAzureV1()) {
                function.line("return new PagedResponseBase<>(");
                function.line("res.getRequest(),");
                function.line("res.getStatusCode(),");
                function.line("res.getHeaders(),");
                function.line(pageItemsLine(clientMethod));
                if (clientMethod.getMethodPageDetails().nonNullNextLink()) {
                    function.line(nextLinkLine(clientMethod));
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
                function.line(pageItemsLine(clientMethod));
                // continuation token
                if (clientMethod.getMethodPageDetails().getContinuationToken() != null) {
                    MethodPageDetails.ContinuationToken continuationToken
                        = clientMethod.getMethodPageDetails().getContinuationToken();
                    if (continuationToken.getResponseHeaderSerializedName() != null) {
                        function.line("res.getHeaders().getValue(HttpHeaderName.fromString(" + ClassType.STRING
                            .defaultValueExpression(continuationToken.getResponseHeaderSerializedName()) + ")),");
                    } else if (continuationToken.getResponsePropertyReference() != null) {
                        String continuationTokenExpression
                            = nestedReferenceLineWithNullCheck(continuationToken.getResponsePropertyReference(),
                                "res.getValue()") + ",";
                        function.line(continuationTokenExpression);
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

    protected void generateResumable(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        typeBlock.publicMethod(clientMethod.getDeclaration(), function -> {
            ProxyMethodParameter parameter = restAPIMethod.getParameters().get(0);
            addValidations(function, clientMethod.getRequiredNullableParameterExpressions(),
                clientMethod.getValidateExpressions(), settings);
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

    protected void generatePlainSyncMethod(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {
        String effectiveProxyMethodName = clientMethod.getProxyMethod().getName();
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {

            addValidations(function, clientMethod.getRequiredNullableParameterExpressions(),
                clientMethod.getValidateExpressions(), settings);
            addOptionalAndConstantVariables(function, clientMethod, restAPIMethod.getParameters(), settings);
            applyParameterTransformations(function, clientMethod, settings);
            convertClientTypesToWireTypes(function, clientMethod, restAPIMethod.getParameters());

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

    private static String pageItemsLine(ClientMethod clientMethod) {
        StringBuilder stringBuilder = new StringBuilder("res.getValue()");
        for (ModelPropertySegment segment : clientMethod.getMethodPageDetails().getPageItemsPropertyReference()) {
            stringBuilder.append(".")
                .append(CodeNamer.getModelNamer().modelPropertyGetterName(segment.getProperty().getName()))
                .append("()");
        }
        return stringBuilder + ",";
    }

    protected static String nextLinkLine(ClientMethod clientMethod) {
        return nextLinkLine(clientMethod, "getValue()");
    }

    protected static String nextLinkLine(ClientMethod clientMethod, String valueExpression) {
        return nestedReferenceLineWithNullCheck(clientMethod.getMethodPageDetails().getNextLinkPropertyReference(),
            "res." + valueExpression) + ",";
    }

    protected static String nestedReferenceLineWithNullCheck(List<ModelPropertySegment> segments,
        String valueReferenceExpression) {
        /*
         * res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNext() != null
         * ? res.getValue().getNestedNext().getNext()
         * : null
         */
        StringBuilder nullCheckStringBuilder = new StringBuilder();
        StringBuilder propertyRefStringBuilder = new StringBuilder(valueReferenceExpression);
        for (ModelPropertySegment segment : segments) {
            propertyRefStringBuilder.append(".")
                .append(CodeNamer.getModelNamer().modelPropertyGetterName(segment.getProperty().getName()))
                .append("()");

            if (nullCheckStringBuilder.length() > 0) {
                nullCheckStringBuilder.append(" && ");
            }
            nullCheckStringBuilder.append(propertyRefStringBuilder).append(" != null");

            // this would be the last segment
            if (segment.getProperty().getClientType() == ClassType.URL) {
                propertyRefStringBuilder.append(".toString()");
            }
        }
        nullCheckStringBuilder.append(" ? ").append(propertyRefStringBuilder).append(" : null");

        return nullCheckStringBuilder.toString();
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
     * @param restAPIMethod proxy method
     * @param settings java settings
     */
    protected void generateLongRunningSync(ClientMethod clientMethod, JavaType typeBlock, ProxyMethod restAPIMethod,
        JavaSettings settings) {

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
     * @param restAPIMethod proxy method
     * @param settings java settings
     */
    protected void generateLongRunningBeginSync(ClientMethod clientMethod, JavaType typeBlock,
        ProxyMethod restAPIMethod, JavaSettings settings) {
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

    @Override
    protected String getLogExpression(String propertyName, String methodName) {
        return "throw LOGGER.throwableAtError()" + ".addKeyValue(\"propertyName\", \"" + propertyName + "\")"
            + ".addKeyValue(\"methodName\", \"" + methodName + "\")"
            + ".log(\"Not a supported paging option in this API\", IllegalArgumentException::new);";
    }

    @Override
    protected void addQueryParameterReInjectionLogic(MethodPageDetails.NextLinkReInjection nextLinkReInjection,
        JavaBlock javaBlock) {
    }
}
