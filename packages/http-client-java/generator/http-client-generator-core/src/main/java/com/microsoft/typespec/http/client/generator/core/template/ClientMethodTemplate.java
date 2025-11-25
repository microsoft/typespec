// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

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
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodParameter;
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
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.CollectionFormat;
import com.microsoft.typespec.http.client.generator.core.util.MethodNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.utils.CoreUtils;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Writes a ClientMethod to a JavaType block.
 */
public class ClientMethodTemplate extends ClientMethodTemplateBase {
    private static final ClientMethodTemplate INSTANCE = new ClientMethodTemplate();

    protected ClientMethodTemplate() {
    }

    public static ClientMethodTemplate getInstance() {
        return INSTANCE;
    }

    /**
     * Adds validations to the client method.
     *
     * @param function The client method code block.
     * @param clientMethod the client method to add parameter validations for.
     * @param settings AutoRest generation settings, used to determine if validations should be added.
     */
    protected static void addValidations(JavaBlock function, ClientMethod clientMethod, JavaSettings settings) {
        if (!settings.isClientSideValidations()) {
            return;
        }
        final boolean isSync = JavaSettings.getInstance().isSyncStackEnabled() && clientMethod.getType().isSync();
        // Parameter expressions to validate for non-null value.
        final List<String> paramReferenceExpressions = clientMethod.getRequiredNullableParameterExpressions();
        // Parameter expressions for custom validation (key is the expression, value is the validation).
        final Map<String, String> validateParamExpressions = new HashMap<>(clientMethod.getValidateExpressions());

        for (String paramReferenceExpression : paramReferenceExpressions) {
            final JavaIfBlock nullCheck = function.ifBlock(paramReferenceExpression + " == null", ifBlock -> {
                final String paramRequiredException = "new IllegalArgumentException(\"Parameter "
                    + paramReferenceExpression + " is required and cannot be null.\")";
                if (isSync) {
                    if (settings.isUseClientLogger()) {
                        ifBlock.line("throw LOGGER.atError().log(" + paramRequiredException + ");");
                    } else {
                        ifBlock.line("throw " + paramRequiredException + ";");
                    }
                } else {
                    ifBlock.methodReturn("Mono.error(" + paramRequiredException + ")");
                }
            });

            final String validateParamExpression = validateParamExpressions.remove(paramReferenceExpression);
            if (validateParamExpression != null) {
                nullCheck.elseBlock(elseBlock -> elseBlock.line(validateParamExpression + ";"));
            }
        }

        for (Map.Entry<String, String> e : validateParamExpressions.entrySet()) {
            final String paramReferenceExpression = e.getKey();
            final String validateParamExpression = e.getValue();
            function.ifBlock(paramReferenceExpression + " != null",
                ifBlock -> ifBlock.line(validateParamExpression + ";"));
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

        for (ClientMethodParameter parameter : clientMethod.getMethodParameters()) {
            if (parameter.isRequired()) {
                // Parameter is required and will be part of the method signature.
                continue;
            }
            final String defaultValue = parameterDefaultValueExpression(parameter);
            function.line("final %s %s = %s;", parameter.getClientType(), parameter.getName(),
                defaultValue == null ? "null" : defaultValue);
        }
    }

    /**
     * Adds optional variable instantiations and constant variables into the client method.
     *
     * @param function The client method code block.
     * @param clientMethod The client method.
     * @param settings AutoRest generation settings.
     */
    protected static void addOptionalAndConstantVariables(JavaBlock function, ClientMethod clientMethod,
        JavaSettings settings) {
        final List<ProxyMethodParameter> proxyMethodParameters = clientMethod.getProxyMethod().getParameters();
        for (ProxyMethodParameter parameter : proxyMethodParameters) {
            if (parameter.isFromClient()) {
                // parameter is scoped to the client, hence no local variable instantiation for it.
                continue;
            }
            final IType parameterClientType = parameter.getClientType();
            IType parameterWireType;
            if (parameter.isNullable()) {
                parameterWireType = parameter.getWireType().asNullable();
            } else {
                parameterWireType = parameter.getWireType();
            }

            // TODO (alzimmer): There are a few similar transforms like this but they all have slight nuances on output.
            // This always turns ArrayType and ListType into String, the case further down this file may not.
            if (parameterWireType != ClassType.BASE_64_URL
                && parameter.getRequestParameterLocation() != RequestParameterLocation.BODY
                // && parameter.getRequestParameterLocation() != RequestParameterLocation.FormData
                && (parameterClientType instanceof ArrayType || parameterClientType instanceof IterableType)) {
                parameterWireType = ClassType.STRING;
            }

            // If the parameter isn't required and the client method only uses required parameters, optional
            // parameters are omitted and will need to instantiated in the method.
            boolean optionalOmitted = clientMethod.getOnlyRequiredParameters() && !parameter.isRequired();

            // Optional variables and constants are always null if their wire type and client type differ and applying
            // conversions between the types is ignored.
            boolean alwaysNull = parameterWireType != parameterClientType && optionalOmitted;

            // Constants should be included if the parameter is a constant, and it's either required or optional
            // constants aren't generated as enums.
            boolean includeConstant
                = parameter.isConstant() && (!settings.isOptionalConstantAsEnum() || parameter.isRequired());

            // Client methods only add local variable instantiations when the parameter isn't passed by the caller,
            // isn't always null, is an optional parameter that was omitted or is a constant that is either required
            // or AutoRest isn't generating with optional constant as enums.
            if (!alwaysNull && (optionalOmitted || includeConstant)) {
                final String defaultValue = parameterDefaultValueExpression(parameter);
                function.line("final %s %s = %s;", parameterClientType, parameter.getParameterReference(),
                    defaultValue == null ? "null" : defaultValue);
            }
        }
    }

    private static String parameterDefaultValueExpression(MethodParameter parameter) {
        final IType clientType = parameter.getClientType();
        if (clientType == ArrayType.BYTE_ARRAY && JavaSettings.getInstance().isNullByteArrayMapsToEmptyArray()) {
            // there's no EMPTY_BYTE_ARRAY in clients, unlike that in models
            return "new byte[0]";
        } else {
            return clientType.defaultValueExpression(parameter.getDefaultValue());
        }
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

                function.line("%s%s = new %s();",
                    !conditionalAssignment ? transformation.getOutParameter().getClientType() + " " : "",
                    outParameterName, transformationOutputParameterModelCompositeTypeName);
            }

            for (ParameterMapping mapping : transformation.getMappings()) {
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
     */
    protected static void convertClientTypesToWireTypes(JavaBlock function, ClientMethod clientMethod) {
        final List<ProxyMethodParameter> proxyMethodParameters = clientMethod.getProxyMethod().getParameters();
        for (ProxyMethodParameter parameter : proxyMethodParameters) {
            final RequestParameterLocation location = parameter.getRequestParameterLocation();
            final IType parameterClientType = parameter.getClientType();

            IType parameterWireType;
            if (parameter.isNullable()) {
                parameterWireType = parameter.getWireType().asNullable();
            } else {
                parameterWireType = parameter.getWireType();
            }

            if (location != RequestParameterLocation.BODY) {
                if (parameterClientType == ArrayType.BYTE_ARRAY) {
                    if (parameterWireType != ClassType.BASE_64_URL) {
                        // A byte[] with wire-type not as Base64-encoded URL is converted to Base64-encoded 'String'.
                        // Refer byteArrayToBase64Encoded(..)
                        parameterWireType = ClassType.STRING;
                    }
                } else if (parameterClientType instanceof IterableType) {
                    if (parameter.getExplode()) {
                        // Iterable gets converted to 'List<String>'.
                        // Refer iterableToWireStringValuesList(..)'
                        parameterWireType = new ListType(ClassType.STRING);
                    } else {
                        // Iterable gets converted to a delimited 'String' of wire values.
                        // Refer iterableToDelimitedStringOfWireValues(..)
                        parameterWireType = ClassType.STRING;
                    }
                }
            }

            if (parameterWireType == parameterClientType) {
                // If the wire type and client type are the same there is no conversion needed.
                continue;
            }

            final String parameterName = parameter.getParameterReference();
            final String parameterWireName = parameter.getParameterReferenceConverted();
            final boolean alwaysNull = clientMethod.getOnlyRequiredParameters() && !parameter.isRequired();

            boolean addedConversion = false;
            if (location != RequestParameterLocation.BODY) {
                if (parameterClientType == ArrayType.BYTE_ARRAY) {
                    // The only expected 'ArrayType' is 'ArrayType.BYTE_ARRAY' (See definition of ArrayType).
                    if (alwaysNull) {
                        function.line("%s %s = %s;", parameterWireType, parameterWireName, "null");
                    } else {
                        final String expression = byteArrayToBase64Encoded(parameterName, parameterWireType);
                        function.line("%s %s = %s;", parameterWireType, parameterWireName, expression);
                    }
                    addedConversion = true;
                } else if (parameterClientType instanceof IterableType) {
                    boolean shouldNullCheck
                        = !clientMethod.getRequiredNullableParameterExpressions().contains(parameterName);
                    if (alwaysNull) {
                        function.line("%s %s = %s;", parameterWireType, parameterWireName, "null");
                    } else if (parameter.getExplode()) {
                        String iterableToListExpression
                            = iterableToWireStringValuesList(parameterName, shouldNullCheck);
                        function.line("%s %s = %s;", parameterWireType, parameterWireName, iterableToListExpression);
                    } else {
                        final IterableType iterableType = (IterableType) parameterClientType;
                        final String iterableToStringExpression = iterableToDelimitedStringOfWireValues(parameterName,
                            shouldNullCheck, iterableType, parameter);
                        function.line("%s %s = %s;", parameterWireType, parameterWireName, iterableToStringExpression);
                    }
                    addedConversion = true;
                }
            } else {
                // RequestParameterLocation.BODY
                if (parameterClientType instanceof IterableType) {
                    if (parameter.getWireType().isUsedInXml()) {
                        function.line("%s %s = new %s(%s);", parameter.getWireType(), parameterWireName,
                            parameter.getWireType(), alwaysNull ? "null" : parameterName);
                        addedConversion = true;
                    }
                }
            }

            if (!addedConversion) {
                function.line(parameter.convertFromClientType(parameterName, parameterWireName,
                    clientMethod.getOnlyRequiredParameters() && !parameter.isRequired(),
                    parameter.isConstant() || alwaysNull));
            }
        }
    }

    /**
     * Obtain the Java code that converts an iterable to a list of string values.
     *
     * @param parameterName the name of the iterable parameter to convert.
     * @param shouldCheckNull whether to use an empty list if the parameter value is null.
     * @return Java code that converts an iterable to a list of string values.
     */
    private static String iterableToWireStringValuesList(String parameterName, boolean shouldCheckNull) {
        final String stringList = parameterName + ".stream()" + ".map(item -> Objects.toString(item, \"\"))"
            + ".collect(Collectors.toList())";
        if (shouldCheckNull) {
            return "(" + parameterName + " == null) ? new ArrayList<>()" + ": " + stringList;
        } else {
            return stringList;
        }
    }

    /**
     * Obtain the Java code that converts an iterable to a delimited string of wire values.
     *
     * @param parameterName the name of the iterable parameter to convert.
     * @param shouldNullCheck whether to check if the parameter is null before converting it.
     * @param iterableType the type of the iterable to convert.
     * @param parameter the proxy method parameter that is being converted.
     * @return Java code that converts an iterable to a delimited string of wire values.
     */
    private static String iterableToDelimitedStringOfWireValues(String parameterName, boolean shouldNullCheck,
        IterableType iterableType, ProxyMethodParameter parameter) {
        final IType elementType = iterableType.getElementType();
        final boolean isEnumElementType = elementType instanceof EnumType;
        final boolean isPrimitiveElementType = elementType == ClassType.STRING
            || (elementType instanceof ClassType && ((ClassType) elementType).isBoxedType());
        final CollectionFormat collectionFormat = parameter.getCollectionFormat();
        final String delimiter = ClassType.STRING.defaultValueExpression(collectionFormat.getDelimiter());

        final String iterableToStringExpression;
        if (isEnumElementType) {
            final EnumType enumType = (EnumType) elementType;
            iterableToStringExpression
                = enumIterableToDelimitedStringOfWireValues(parameterName, shouldNullCheck, delimiter, enumType);
        } else if (isPrimitiveElementType) {
            iterableToStringExpression
                = primitiveIterableToDelimitedStringOfWireValues(parameterName, shouldNullCheck, delimiter);
        } else {
            iterableToStringExpression = modelIterableToDelimitedStringOfWireValues(parameterName, shouldNullCheck,
                delimiter, collectionFormat, elementType, parameter);
        }
        return iterableToStringExpression;
    }

    /**
     * Obtain the Java code that converts an enum iterable parameter to a string of delimiter seperated wire values.
     *
     * @param parameterName the name of the enum iterable parameter to convert.
     * @param shouldCheckNull whether to check if the parameter is null before converting it.
     * @param delimiter the delimiter to use when joining the enum values into a string.
     * @param enumType the enum type of the parameter to convert.
     * @return Java code that converts an enum iterable parameter to a string of delimiter separated values.
     */
    private static String enumIterableToDelimitedStringOfWireValues(String parameterName, boolean shouldCheckNull,
        String delimiter, EnumType enumType) {
        // EnumTypes should provide a 'toString' implementation that represents the wire value.
        //
        // If the parameter is null, the converted value is null. Otherwise, convert the parameter to a string,
        // mapping each element to the toString value, finally joining with the delimiter (collection format).
        //
        // Not all enums will be backed by Strings. Get the backing value before converting to string, this will prevent
        // using the enum name rather than the enum value when it isn't a String-based enum. Ex, a long-based enum with
        // value 100 called HIGH will return "100" rather than "HIGH".
        //
        final String enumToString = enumType.getElementType() == ClassType.STRING
            ? "paramItemValue"
            : "paramItemValue == null ? null : paramItemValue." + enumType.getToMethodName() + "()";
        final String streamToString = parameterName + ".stream()" + ".map(paramItemValue -> Objects.toString("
            + enumToString + ", \"\"))" + ".collect(Collectors.joining(" + delimiter + "))";
        if (shouldCheckNull) {
            return "(" + parameterName + " == null) ? null : " + streamToString;
        } else {
            return streamToString;
        }
    }

    /**
     * Obtain the Java code that converts a primitive iterable parameter to a string of delimiter seperated string wire
     * values.
     * <p>
     * The primitive types are Boolean, Byte, Integer, Long, Float, Double, String.
     * </p>
     * 
     * @param parameterName the name of the primitive iterable parameter to convert.
     * @param shouldCheckNull whether to check if the parameter is null before converting it.
     * @param delimiter the delimiter to use when joining the enum values into a string.
     * @return Java code that converts a primitive iterable parameter to a string of delimiter separated values.
     */
    private static String primitiveIterableToDelimitedStringOfWireValues(String parameterName, boolean shouldCheckNull,
        String delimiter) {
        final String streamToString
            = parameterName + ".stream()" + ".map(paramItemValue -> Objects.toString(paramItemValue, \"\"))"
                + ".collect(Collectors.joining(" + delimiter + "))";
        if (shouldCheckNull) {
            return "(" + parameterName + " == null) ? null : " + streamToString;
        } else {
            return streamToString;
        }
    }

    /**
     * Obtain the Java code that converts an iterable of model types to a delimited string of serialized wire values.
     *
     * @param parameterName the name of the iterable parameter to convert.
     * @param shouldCheckNull whether to check if the parameter is null before converting it.
     * @param delimiter the delimiter to use when joining the deserialized model values into a string.
     * @param collectionFormat the collection format to use when serializing the iterable to a string.
     * @param elementType the type of the elements in the iterable.
     * @param parameter the proxy method parameter that is being converted.
     * @return Java code that converts an iterable of model types to a delimited string of wire values.
     */
    private static String modelIterableToDelimitedStringOfWireValues(String parameterName, boolean shouldCheckNull,
        String delimiter, CollectionFormat collectionFormat, IType elementType, ProxyMethodParameter parameter) {
        // this logic depends on rawType of proxy method parameter be List<WireType>
        // alternative would be to check wireType of client method parameter.
        IType elementWireType = parameter.getRawType() instanceof IterableType
            ? ((IterableType) parameter.getRawType()).getElementType()
            : elementType;

        final String iterableToSerialize;
        if (elementWireType != elementType) {
            // convert List<ClientType> to List<WireType>.
            iterableToSerialize = parameterName + ".stream()" + ".map(paramItemValue -> "
                + elementWireType.convertFromClientType("paramItemValue") + ")" + ".collect(Collectors.toList())";
        } else {
            iterableToSerialize = parameterName;
        }

        // Use serializer to convert List<WireType> to String.
        //
        if (JavaSettings.getInstance().isAzureV1()) {
            // Always use serializeIterable as Iterable supports both Iterable and List.
            return String.format(
                "JacksonAdapter.createDefaultSerializerAdapter().serializeIterable(%s, CollectionFormat.%s)",
                iterableToSerialize, collectionFormat.toString().toUpperCase(Locale.ROOT));
        } else {
            // mostly code from
            // https://github.com/Azure/azure-sdk-for-java/blob/e1f8f21b1111f8ac9372e0b039f3de92485a5a66/sdk/core/azure-core/src/main/java/com/azure/core/util/serializer/JacksonAdapter.java#L250-L304
            final String serializeItemValueCode
                = TemplateUtil.loadTextFromResource("ClientMethodSerializeItemValue.java");
            final String streamToString = iterableToSerialize + ".stream()" + ".map(" + serializeItemValueCode + ")"
                + ".collect(Collectors.joining(" + delimiter + "))";
            if (shouldCheckNull) {
                return "(" + parameterName + " == null) ? null : " + streamToString;
            } else {
                return streamToString;
            }
        }
    }

    /**
     * Obtain the Java code that converts a parameter of type byte[] to Base64 encoded form (encoded as string or url).
     *
     * @param parameterName the name of the byte[] parameter to convert.
     * @param wireType the wire type of the parameter, used to determine whether to encode as a string or url.
     * @return Java code that converts a byte[] parameter to Base64 encoded form.
     */
    private static String byteArrayToBase64Encoded(String parameterName, IType wireType) {
        if ((wireType == ClassType.STRING)) {
            // byte[] to Base64-encoded String.
            return "Base64Util.encodeToString" + "(" + parameterName + ")";
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

        // need a "final" variable for RequestOptions
        if (repeatabilityRequestHeaders || contentTypeRequestHeaders) {
            requestOptionsLocal = true;
            function.line(
                "RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;");
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
            function.line("requestOptionsLocal.addRequestCallback(requestLocal -> {");
            function.indent(() -> function.ifBlock(
                "requestLocal.getBody() != null && requestLocal.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null",
                ifBlock -> function
                    .line("requestLocal.getHeaders().set(HttpHeaderName.CONTENT_TYPE, \"" + contentType + "\");")));
            function.line("});");
        }

        return requestOptionsLocal;
    }

    private static void requestOptionsSetHeaderIfAbsent(JavaBlock function, String expression, String headerName) {
        function.line("requestOptionsLocal.addRequestCallback(requestLocal -> {");
        function.indent(() -> function.ifBlock(
            "requestLocal.getHeaders().get(HttpHeaderName.fromString(\"" + headerName + "\")) == null",
            ifBlock -> function.line("requestLocal.getHeaders().set(HttpHeaderName.fromString(\"" + headerName + "\"), "
                + expression + ");")));
        function.line("});");
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
    public void write(ClientMethod clientMethod, JavaType typeBlock) {
        final boolean writingInterface = typeBlock instanceof JavaInterface;
        if (clientMethod.getMethodVisibility() != JavaVisibility.Public && writingInterface) {
            return;
        }

        JavaSettings settings = JavaSettings.getInstance();

        ProxyMethod restAPIMethod = clientMethod.getProxyMethod();
        generateJavadoc(clientMethod, typeBlock, restAPIMethod, writingInterface);

        switch (clientMethod.getType()) {
            case PagingSync:
                if (settings.isSyncStackEnabled()) {
                    if (settings.isDataPlaneClient()) {
                        generateProtocolPagingPlainSync(clientMethod, typeBlock, settings);
                    } else {
                        generatePagingPlainSync(clientMethod, typeBlock, settings);
                    }
                } else {
                    if (settings.isDataPlaneClient()) {
                        generateProtocolPagingSync(clientMethod, typeBlock, settings);
                    } else {
                        generatePagingSync(clientMethod, typeBlock, settings);
                    }
                }
                break;

            case PagingAsync:
                if (settings.isDataPlaneClient()) {
                    generateProtocolPagingAsync(clientMethod, typeBlock, settings);
                } else {
                    generatePagingAsync(clientMethod, typeBlock, settings);
                }
                break;

            case PagingSyncSinglePage:
                if (settings.isDataPlaneClient()) {
                    generateProtocolPagingSinglePage(clientMethod, typeBlock, settings);
                } else {
                    generatePagedSinglePage(clientMethod, typeBlock, settings);
                }
                break;

            case PagingAsyncSinglePage:
                if (settings.isDataPlaneClient()) {
                    generateProtocolPagingAsyncSinglePage(clientMethod, typeBlock, settings);
                } else {
                    generatePagedAsyncSinglePage(clientMethod, typeBlock, settings);
                }
                break;

            case LongRunningAsync:
                generateLongRunningAsync(clientMethod, typeBlock, settings);
                break;

            case LongRunningSync:
                if (settings.isSyncStackEnabled()) {
                    generateLongRunningPlainSync(clientMethod, typeBlock, settings);
                } else {
                    generateSyncMethod(clientMethod, typeBlock, settings);
                }
                break;

            case LongRunningBeginAsync:
                if (settings.isDataPlaneClient()) {
                    generateProtocolLongRunningBeginAsync(clientMethod, typeBlock);
                } else {
                    generateLongRunningBeginAsync(clientMethod, typeBlock, settings);
                }
                break;

            case LongRunningBeginSync:
                if (settings.isSyncStackEnabled()) {
                    if (settings.isDataPlaneClient()) {
                        generateProtocolLongRunningBeginSync(clientMethod, typeBlock);
                    } else {
                        generateLongRunningBeginSync(clientMethod, typeBlock, settings);
                    }
                } else {
                    generateLongRunningBeginSyncOverAsync(clientMethod, typeBlock);
                }
                break;

            case Resumable:
                generateResumable(clientMethod, typeBlock, settings);
                break;

            case SimpleSync:
                if (settings.isSyncStackEnabled()) {
                    generateSimpleSyncMethod(clientMethod, typeBlock);
                } else {
                    generateSimplePlainSyncMethod(clientMethod, typeBlock);
                }
                break;

            case SimpleSyncRestResponse:
                if (settings.isSyncStackEnabled()) {
                    generatePlainSyncMethod(clientMethod, typeBlock, settings);
                } else {
                    generateSyncMethod(clientMethod, typeBlock, settings);
                }
                break;

            case SimpleAsyncRestResponse:
                generateSimpleAsyncRestResponse(clientMethod, typeBlock, settings);
                break;

            case SimpleAsync:
                generateSimpleAsync(clientMethod, typeBlock, settings);
                break;

            case SendRequestAsync:
                generateSendRequestAsync(clientMethod, typeBlock);
                break;

            case SendRequestSync:
                generateSendRequestSync(clientMethod, typeBlock);
                break;
        }
    }

    protected void generateProtocolPagingSync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        generatePagingSync(clientMethod, typeBlock, settings);
    }

    protected void generateProtocolPagingPlainSync(ClientMethod clientMethod, JavaType typeBlock,
        JavaSettings settings) {
        addServiceMethodAnnotation(typeBlock, ReturnType.COLLECTION);
        if (clientMethod.getMethodPageDetails().nonNullNextLink()) {
            writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
                addOptionalVariables(function, clientMethod);

                function.line("RequestOptions requestOptionsForNextPage = new RequestOptions();");
                function.line(
                    "requestOptionsForNextPage.setContext(requestOptions != null && requestOptions.getContext() != null ? requestOptions.getContext() : "
                        + TemplateUtil.getContextNone() + ");");

                MethodPageDetails.NextLinkReInjection nextLinkReInjection
                    = clientMethod.getMethodPageDetails().getNextLinkReInjection();
                if (nextLinkReInjection != null) {
                    addQueryParameterReInjectionLogic(nextLinkReInjection, function);
                }

                function.line("return new PagedIterable<>(");
                function.indent(() -> {
                    function.line("%s,",
                        this.getPagingSinglePageExpression(clientMethod,
                            clientMethod.getProxyMethod().getPagingSinglePageMethodName(),
                            clientMethod.getArgumentList(), settings));
                    function.line("%s);",
                        this.getPagingNextPageExpression(clientMethod,
                            clientMethod.getMethodPageDetails()
                                .getNextMethod()
                                .getProxyMethod()
                                .getPagingSinglePageMethodName(),
                            clientMethod.getMethodPageDetails().getNextMethod().getArgumentList(), settings));
                });
            });
        } else if (clientMethod.getMethodPageDetails().getContinuationToken() != null) {
            MethodPageDetails.ContinuationToken continuationToken
                = clientMethod.getMethodPageDetails().getContinuationToken();
            // currently this is for unbranded
            String methodName = clientMethod.getProxyMethod().getPagingSinglePageMethodName();
            String argumentLine = clientMethod.getArgumentList().replace("requestOptions", "requestOptionsLocal");

            writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
                addOptionalVariables(function, clientMethod);

                function.line("return new PagedIterable<>(pagingOptions -> {");
                function.indent(() -> {
                    function.line(getLogExceptionExpressionForPagingOptions(clientMethod));
                    function.line(
                        "RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;\n");
                    function.ifBlock("pagingOptions.getContinuationToken() != null", ifBlock -> {
                        if (continuationToken.getRequestParameter().getRequestParameterLocation()
                            == RequestParameterLocation.QUERY) {
                            // QUERY
                            function.line("requestOptionsLocal.addRequestCallback(requestLocal -> {");
                            function.line("    UriBuilder urlBuilder = UriBuilder.parse(requestLocal.getUri());");
                            function.line("    urlBuilder.setQueryParameter("
                                + ClassType.STRING.defaultValueExpression(
                                    continuationToken.getRequestParameter().getRequestParameterName())
                                + ", String.valueOf(pagingOptions.getContinuationToken()));");
                            function.line("    requestLocal.setUri(urlBuilder.toString());");
                            function.line("});");
                        } else {
                            // HEADER
                            function.line("requestOptionsLocal.setHeader(HttpHeaderName.fromString("
                                + ClassType.STRING.defaultValueExpression(
                                    continuationToken.getRequestParameter().getRequestParameterName())
                                + "), String.valueOf(pagingOptions.getContinuationToken()));");
                        }
                    });
                    function.methodReturn(methodName + "(" + argumentLine + ")");
                });
                function.line("});");
            });
        } else {
            writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
                addOptionalVariables(function, clientMethod);
                function.line("return new PagedIterable<>(");
                function.indent(() -> function.line(this.getPagingSinglePageExpression(clientMethod,
                    clientMethod.getProxyMethod().getPagingSinglePageMethodName(), clientMethod.getArgumentList(),
                    settings) + ");"));
            });
        }
    }

    protected void generateProtocolPagingAsync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        generatePagingAsync(clientMethod, typeBlock, settings);
    }

    protected void generateProtocolPagingAsyncSinglePage(ClientMethod clientMethod, JavaType typeBlock,
        JavaSettings settings) {
        generatePagedAsyncSinglePage(clientMethod, typeBlock, settings);
    }

    protected void generateProtocolPagingSinglePage(ClientMethod clientMethod, JavaType typeBlock,
        JavaSettings settings) {
        generatePagedSinglePage(clientMethod, typeBlock, settings);
    }

    private void generatePagedSinglePage(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        final ProxyMethod restAPIMethod = clientMethod.getProxyMethod().toSync();

        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            if (!settings.isSyncStackEnabled()) {
                function.methodReturn(
                    String.format("%s(%s).block()", clientMethod.getProxyMethod().getPagingAsyncSinglePageMethodName(),
                        clientMethod.getArgumentList()));
                return;
            }

            addValidations(function, clientMethod, settings);
            addOptionalAndConstantVariables(function, clientMethod, settings);
            applyParameterTransformations(function, clientMethod, settings);
            convertClientTypesToWireTypes(function, clientMethod);

            boolean requestOptionsLocal = false;
            if (settings.isDataPlaneClient()) {
                requestOptionsLocal = addSpecialHeadersToRequestOptions(function, clientMethod);
            }

            String serviceMethodCall
                = checkAndReplaceParamNameCollision(clientMethod, restAPIMethod, requestOptionsLocal, settings);
            function.line(String.format("%s res = %s;", restAPIMethod.getReturnType(), serviceMethodCall));
            if (settings.isAzureV1()) {
                pagedSinglePageResponseConversion(restAPIMethod, clientMethod, settings, function);
            } else {
                function.line("return new PagedResponse<>(");
                function.line("res.getRequest(),");
                function.line("res.getStatusCode(),");
                function.line("res.getHeaders(),");
                function.line("res.getBody(),");
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

    protected void pagedSinglePageResponseConversion(ProxyMethod restAPIMethod, ClientMethod clientMethod,
        JavaSettings settings, JavaBlock function) {
        function.line("return new PagedResponseBase<>(");
        function.line("res.getRequest(),");
        function.line("res.getStatusCode(),");
        function.line("res.getHeaders(),");
        if (settings.isDataPlaneClient()) {
            function.line("getValues(res.getValue(), \"%s\"),",
                clientMethod.getMethodPageDetails().getSerializedItemName());
        } else {
            function.line("res.getValue().%s(),",
                CodeNamer.getModelNamer().modelPropertyGetterName(clientMethod.getMethodPageDetails().getItemName()));
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
    }

    protected void generatePagingSync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
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
                if (settings.isDataPlaneClient()) {
                    function.line("RequestOptions requestOptionsForNextPage = new RequestOptions();");
                    function.line(
                        "requestOptionsForNextPage.setContext(requestOptions != null && requestOptions.getContext() != null ? requestOptions.getContext() : "
                            + TemplateUtil.getContextNone() + ");");
                }

                function.line("return new PagedIterable<>(");

                String nextMethodArgs = clientMethod.getMethodPageDetails()
                    .getNextMethod()
                    .getArgumentList()
                    .replace("requestOptions", "requestOptionsForNextPage");
                String firstPageArgs = clientMethod.getArgumentList();
                function.indent(() -> {
                    function.line("%s,", this.getPagingSinglePageExpression(clientMethod,
                        clientMethod.getProxyMethod().getPagingSinglePageMethodName(), firstPageArgs, settings));
                    function.line("%s);",
                        this.getPagingNextPageExpression(clientMethod,
                            clientMethod.getMethodPageDetails()
                                .getNextMethod()
                                .getProxyMethod()
                                .getPagingSinglePageMethodName(),
                            nextMethodArgs, settings));
                });
            });
        } else {
            writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {

                String effectiveFirstPageArgs = clientMethod.getArgumentList();
                addOptionalVariables(function, clientMethod);
                function.line("return new PagedIterable<>(");
                function.indent(() -> function.line(this.getPagingSinglePageExpression(clientMethod,
                    clientMethod.getProxyMethod().getPagingSinglePageMethodName(), effectiveFirstPageArgs, settings)
                    + ");"));
            });
        }
    }

    protected void generatePagingAsync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        addServiceMethodAnnotation(typeBlock, ReturnType.COLLECTION);
        if (clientMethod.getMethodPageDetails().nonNullNextLink()) {
            writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
                addOptionalVariables(function, clientMethod);
                if (settings.isDataPlaneClient()) {
                    function.line("RequestOptions requestOptionsForNextPage = new RequestOptions();");
                    function.line(
                        "requestOptionsForNextPage.setContext(requestOptions != null && requestOptions.getContext() != null ? requestOptions.getContext() : "
                            + TemplateUtil.getContextNone() + ");");
                }

                MethodPageDetails.NextLinkReInjection reinjectedParams
                    = clientMethod.getMethodPageDetails().getNextLinkReInjection();
                if (reinjectedParams != null) {
                    addQueryParameterReInjectionLogic(reinjectedParams, function);
                }

                function.line("return new PagedFlux<>(");
                function.indent(() -> {
                    function.line(this.getPagingSinglePageExpression(clientMethod,
                        clientMethod.getProxyMethod().getPagingAsyncSinglePageMethodName(),
                        clientMethod.getArgumentList(), settings) + ",");
                    function.line(this.getPagingNextPageExpression(clientMethod,
                        clientMethod.getMethodPageDetails()
                            .getNextMethod()
                            .getProxyMethod()
                            .getPagingAsyncSinglePageMethodName(),
                        clientMethod.getMethodPageDetails().getNextMethod().getArgumentList(), settings) + ");");
                });
            });
        } else {
            writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
                addOptionalVariables(function, clientMethod);
                function.line("return new PagedFlux<>(");
                function.indent(() -> function.line(this.getPagingSinglePageExpression(clientMethod,
                    clientMethod.getProxyMethod().getPagingAsyncSinglePageMethodName(), clientMethod.getArgumentList(),
                    settings) + ");"));
            });
        }
    }

    private static void addServiceMethodAnnotation(JavaType typeBlock, ReturnType returnType) {
        typeBlock.annotation("ServiceMethod(returns = ReturnType." + returnType.name() + ")");
    }

    protected void addQueryParameterReInjectionLogic(MethodPageDetails.NextLinkReInjection nextLinkReInjection,
        JavaBlock javaBlock) {
        javaBlock.line("if (requestOptions != null) {");
        javaBlock.indent(() -> {
            javaBlock.line("requestOptions.addRequestCallback(httpRequest -> {");
            javaBlock.indent(() -> {
                javaBlock.line("UrlBuilder urlBuilder = UrlBuilder.parse(httpRequest.getUrl().toString());");
                javaBlock.line("Map<String, String> queryParams = urlBuilder.getQuery();");
                for (String paramSerializedName : nextLinkReInjection.getQueryParameterSerializedNames()) {
                    javaBlock.line("if (queryParams.containsKey(\"" + paramSerializedName + "\")) {");
                    javaBlock.indent(() -> {
                        javaBlock.line("requestOptionsForNextPage.addQueryParam(\"" + paramSerializedName
                            + "\", queryParams.get(\"" + paramSerializedName + "\"));");
                    });
                    javaBlock.line("}");
                }
            });
            javaBlock.line("});");
        });
        javaBlock.line("}");

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

    protected void generateSimpleAsync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), (function -> {
            addOptionalVariables(function, clientMethod);
            function.line("return %s(%s)", clientMethod.getProxyMethod().getSimpleAsyncRestResponseMethodName(),
                clientMethod.getArgumentList());
            function.indent(() -> {
                if (GenericType.flux(ClassType.BYTE_BUFFER).equals(clientMethod.getReturnValue().getType())) {
                    // Previously this used StreamResponse::getValue, but it isn't guaranteed that the return is
                    // StreamResponse, instead use Response::getValue as StreamResponse is just a fancier
                    // Response<Flux<ByteBuffer>>.
                    function.text(".flatMapMany(fluxByteBufferResponse -> fluxByteBufferResponse.getValue());");
                } else if (!GenericType.mono(ClassType.VOID).equals(clientMethod.getReturnValue().getType())
                    && !GenericType.flux(ClassType.VOID).equals(clientMethod.getReturnValue().getType())) {
                    function.text(".flatMap(res -> Mono.justOrEmpty(res.getValue()));");
                } else {
                    function.text(".flatMap(ignored -> Mono.empty());");
                }
            });
        }));
    }

    private void generateSimpleSyncMethod(ClientMethod clientMethod, JavaType typeBlock) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), (function -> {
            addOptionalVariables(function, clientMethod);

            String argumentList = clientMethod.getArgumentList();
            if (CoreUtils.isNullOrEmpty(argumentList)) {
                // If there are no arguments the argument is Context.NONE
                argumentList = TemplateUtil.getContextNone();
            } else if (clientMethod.getParameters().stream().noneMatch(p -> p.getClientType() == ClassType.CONTEXT)) {
                // If the arguments don't contain Context append Context.NONE
                argumentList += ", " + TemplateUtil.getContextNone();
            }

            if (ClassType.STREAM_RESPONSE.equals(clientMethod.getReturnValue().getType())) {
                function.text(".flatMapMany(StreamResponse::getValue);");
            }
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
            if (CoreUtils.isNullOrEmpty(argumentList)) {
                // If there are no arguments the argument is Context.NONE
                argumentList = TemplateUtil.getContextNone();
            } else if (clientMethod.getParameters().stream().noneMatch(p -> p.getClientType() == ClassType.CONTEXT)) {
                // If the arguments don't contain Context append Context.NONE
                argumentList += ", " + TemplateUtil.getContextNone();
            }

            if (clientMethod.getReturnValue().getType().equals(PrimitiveType.VOID)) {
                function.line("%s(%s);", clientMethod.getProxyMethod().getSimpleRestResponseMethodName(), argumentList);
            } else {
                function.line("return %s(%s).getValue();",
                    clientMethod.getProxyMethod().getSimpleRestResponseMethodName(), argumentList);
            }
        }));
    }

    protected void generateSyncMethod(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
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
//                    } else if ("Response".equals(genericType.getName()) && genericType.getTypeArguments()[0].equals(ClassType.BinaryData)) {
//                        function.line("return %s(%s).flatMap(response -> new BinaryData(response.getValue())",
//                            effectiveAsyncMethodName, clientMethod.getArgumentList());
//                        function.line(".map(bd -> new SimpleResponse<>(response.getRequest(), response.getStatusCode(), response.getHeaders(), bd)))");
//                        function.line(".block();");
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

            boolean requestOptionsLocal = false;
            if (settings.isDataPlaneClient()) {
                requestOptionsLocal = addSpecialHeadersToRequestOptions(function, clientMethod);
            }

            String serviceMethodCall = checkAndReplaceParamNameCollision(clientMethod, restAPIMethod.toSync(),
                requestOptionsLocal, settings);
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
        typeBlock.javadocComment(comment -> {
            if (JavaSettings.getInstance().isDataPlaneClient()) {
                generateProtocolMethodJavadoc(clientMethod, comment);
            } else {
                generateJavadoc(clientMethod, comment, restAPIMethod, useFullClassName);
            }
        });
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
        if (clientMethod.isPageStreamingType()) {
            final MethodPageDetails methodPageDetails = clientMethod.getMethodPageDetails();
            for (ClientMethodParameter parameter : methodParameters) {
                if (!methodPageDetails.shouldHideParameter(parameter)) {
                    commentBlock.param(parameter.getName(), parameterDescriptionOrDefault(parameter));
                }
            }
        } else {
            for (ClientMethodParameter parameter : methodParameters) {
                commentBlock.param(parameter.getName(), parameterDescriptionOrDefault(parameter));
            }
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

    protected void generatePagedAsyncSinglePage(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        final ProxyMethod restAPIMethod = clientMethod.getProxyMethod();

        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            if (clientMethod.hasWithContextOverload()) {
                String arguments = clientMethod.getArgumentList();
                arguments = CoreUtils.isNullOrEmpty(arguments) ? "context" : arguments + ", context";

                // If this PagedResponse method doesn't have a Context parameter, call into the overload that does.
                // Doing this prevents duplicating validation and setup logic, which in some cases can reduce out
                // hundreds of lines of code.
                String methodCall
                    = clientMethod.getProxyMethod().getPagingAsyncSinglePageMethodName() + "(" + arguments + ")";
                function.methodReturn("FluxUtil.withContext(context -> " + methodCall + ")");
                return;
            }

            addValidations(function, clientMethod, settings);
            addOptionalAndConstantVariables(function, clientMethod, settings);
            applyParameterTransformations(function, clientMethod, settings);
            convertClientTypesToWireTypes(function, clientMethod);

            boolean requestOptionsLocal = false;
            if (settings.isDataPlaneClient()) {
                requestOptionsLocal = addSpecialHeadersToRequestOptions(function, clientMethod);
            }

            String serviceMethodCall
                = checkAndReplaceParamNameCollision(clientMethod, restAPIMethod, requestOptionsLocal, settings);
            if (contextInParameters(clientMethod)) {
                function.line("return " + serviceMethodCall);
            } else {
                function.line("return FluxUtil.withContext(context -> " + serviceMethodCall + ")");
            }
            function.indent(() -> {
                function.line(".map(res -> new PagedResponseBase<>(");
                function.indent(() -> {
                    function.line("res.getRequest(),");
                    function.line("res.getStatusCode(),");
                    function.line("res.getHeaders(),");
                    if (settings.isDataPlaneClient() && settings.isAzureV1()) {
                        function.line("getValues(res.getValue(), \"%s\"),",
                            clientMethod.getMethodPageDetails().getSerializedItemName());
                    } else {
                        function.line("res.getValue().%s(),", CodeNamer.getModelNamer()
                            .modelPropertyGetterName(clientMethod.getMethodPageDetails().getItemName()));
                    }
                    if (clientMethod.getMethodPageDetails().nonNullNextLink()) {
                        if (settings.isDataPlaneClient() && settings.isAzureV1()) {
                            function.line("getNextLink(res.getValue(), \"%s\"),",
                                clientMethod.getMethodPageDetails().getSerializedNextLinkName());
                        } else {
                            function.line(nextLinkLine(clientMethod));
                        }
                    } else {
                        function.line("null,");
                    }

                    if (responseTypeHasDeserializedHeaders(clientMethod.getProxyMethod().getReturnType())) {
                        function.line("res.getDeserializedHeaders()));");
                    } else {
                        function.line("null));");
                    }
                });
            });
        });
    }

    /**
     * Get the expression for nextLink, for variable "res" of type "Response".
     *
     * @param clientMethod the client method to generate implementation
     * @return nextLink expression
     */
    protected static String nextLinkLine(ClientMethod clientMethod) {
        return nextLinkLine(clientMethod, "getValue()");
    }

    /**
     * Get the expression for nextLink, for variable "res" of type "Response".
     *
     * @param clientMethod the client method to generate implementation
     * @param valueExpression the value expression to get the result value of the "Response"
     * @return nextLink expression
     */
    protected static String nextLinkLine(ClientMethod clientMethod, String valueExpression) {
        return nextLinkLine(clientMethod, valueExpression, null);
    }

    /**
     * Get the expression for nextLink, for variable "res" of type "Response", or variable with the specified name.
     *
     * @param clientMethod the client method to generate implementation
     * @param valueExpression the value expression to get the result value of the "Response"
     * @param result name of the variable if it's not of type "Response"
     * @return nextLink expression
     */
    protected static String nextLinkLine(ClientMethod clientMethod, String valueExpression, String result) {
        String nextLinkGetter
            = CodeNamer.getModelNamer().modelPropertyGetterName(clientMethod.getMethodPageDetails().getNextLinkName());
        // nextLink could be type URL
        String nextLinkConvert
            = (clientMethod.getMethodPageDetails().getNextLinkType() == ClassType.URL ? ".toString()" : "");
        if (result != null) {
            return String.format("%s.%s%s()", result, nextLinkGetter, nextLinkConvert);
        } else {
            return String.format("res.%3$s.%1$s()%2$s,", nextLinkGetter, nextLinkConvert, valueExpression);
        }
    }

    private static boolean responseTypeHasDeserializedHeaders(IType type) {
        if (type instanceof GenericType && "Mono".equals(((GenericType) type).getName())) {
            type = ((GenericType) type).getTypeArguments()[0];
        }

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
        boolean useLocalRequestOptions, JavaSettings settings) {
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
            if (useLocalRequestOptions && "requestOptions".equals(proxyMethodArgument)) {
                // Simple static mapping for RequestOptions when 'useLocalRequestOptions' is true.
                parameterName = "requestOptionsLocal";
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
                        // For synchronous methods check if this parameter is the 'Context' parameter and map to
                        // 'Context.NONE' as synchronous methods have no way to infer 'Context'. Without doing this
                        // mapping generated code will reference a non-existent value which won't compile.
                        // TODO (alzimmer): If needed in the future use a more complex validation than String matching.
                        // It could be possible for the interface method to have another parameter called 'context'
                        // which isn't 'Context'. This can be done by looking for the 'ProxyMethodParameter' with the
                        // matching name and checking if it's the 'Context' parameter.
                        parameterName = (parameter == null && "context".equals(proxyMethodArgument))
                            ? TemplateUtil.getContextNone()
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

    protected void generateSimpleAsyncRestResponse(ClientMethod clientMethod, JavaType typeBlock,
        JavaSettings settings) {
        final ProxyMethod restAPIMethod = clientMethod.getProxyMethod();

        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            if (clientMethod.hasWithContextOverload()) {
                String arguments = clientMethod.getArgumentList();
                arguments = CoreUtils.isNullOrEmpty(arguments) ? "context" : arguments + ", context";

                // If this RestResponse method doesn't have a Context parameter, call into the overload that does.
                // Doing this prevents duplicating validation and setup logic, which in some cases can reduce out
                // hundreds of lines of code.
                String methodCall
                    = clientMethod.getProxyMethod().getSimpleAsyncRestResponseMethodName() + "(" + arguments + ")";
                function.methodReturn("FluxUtil.withContext(context -> " + methodCall + ")");
                return;
            }

            addValidations(function, clientMethod, settings);
            addOptionalAndConstantVariables(function, clientMethod, settings);
            applyParameterTransformations(function, clientMethod, settings);
            convertClientTypesToWireTypes(function, clientMethod);

            boolean requestOptionsLocal = false;
            if (settings.isDataPlaneClient()) {
                requestOptionsLocal = addSpecialHeadersToRequestOptions(function, clientMethod);
            }

            String serviceMethodCall
                = checkAndReplaceParamNameCollision(clientMethod, restAPIMethod, requestOptionsLocal, settings);
            if (contextInParameters(clientMethod)) {
                function.methodReturn(serviceMethodCall);
            } else {
                function.methodReturn("FluxUtil.withContext(context -> " + serviceMethodCall + ")");
            }
        });
    }

    protected boolean contextInParameters(ClientMethod clientMethod) {
        return clientMethod.getParameters().stream().anyMatch(param -> ClassType.CONTEXT.equals(param.getClientType()));
    }

    /**
     * Extension to write LRO async client method.
     *
     * @param clientMethod client method
     * @param typeBlock type block
     * @param settings java settings
     */
    protected void generateLongRunningAsync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {

    }

    /**
     * Extension to write LRO sync client method.
     *
     * @param clientMethod client method
     * @param typeBlock type block
     * @param settings java settings
     */
    protected void generateLongRunningPlainSync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {

    }

    /**
     * Extension to write LRO begin async client method.
     *
     * @param clientMethod client method
     * @param typeBlock type block
     * @param settings java settings
     */
    protected void generateLongRunningBeginAsync(ClientMethod clientMethod, JavaType typeBlock, JavaSettings settings) {
        String contextParam;
        if (clientMethod.getParameters().stream().anyMatch(p -> p.getClientType().equals(ClassType.CONTEXT))) {
            contextParam = "context";
        } else {
            contextParam = TemplateUtil.getContextNone();
        }
        String pollingStrategy = getPollingStrategy(clientMethod, contextParam);
        typeBlock.annotation("ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)");
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            function.line("return PollerFlux.create(Duration.ofSeconds(%s),",
                clientMethod.getMethodPollingDetails().getPollIntervalInSeconds());
            function.increaseIndent();
            function.line("() -> this.%s(%s),", clientMethod.getProxyMethod().getSimpleAsyncRestResponseMethodName(),
                clientMethod.getArgumentList());
            function.line(pollingStrategy + ",");
            function.line(
                TemplateUtil.getLongRunningOperationTypeReferenceExpression(clientMethod.getMethodPollingDetails())
                    + ");");
            function.decreaseIndent();
        });
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
        typeBlock.annotation("ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)");
        String contextParam;
        if (clientMethod.getParameters().stream().anyMatch(p -> p.getClientType().equals(ClassType.CONTEXT))) {
            contextParam = "context";
        } else {
            contextParam = TemplateUtil.getContextNone();
        }
        String pollingStrategy = getSyncPollingStrategy(clientMethod, contextParam);

        String argumentList = clientMethod.getArgumentList();
        if (CoreUtils.isNullOrEmpty(argumentList)) {
            // If there are no arguments the argument is Context.NONE
            argumentList = TemplateUtil.getContextNone();
        } else if (clientMethod.getParameters().stream().noneMatch(p -> p.getClientType() == ClassType.CONTEXT)) {
            // If the arguments don't contain Context append Context.NONE
            argumentList += ", " + TemplateUtil.getContextNone();
        }

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

    private void generateProtocolLongRunningBeginSync(ClientMethod clientMethod, JavaType typeBlock) {
        String contextParam
            = "requestOptions != null && requestOptions.getContext() != null ? requestOptions.getContext() : "
                + TemplateUtil.getContextNone();
        String pollingStrategy = getSyncPollingStrategy(clientMethod, contextParam);
        typeBlock.annotation("ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)");
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            function.line("return SyncPoller.createPoller(Duration.ofSeconds(%s),",
                clientMethod.getMethodPollingDetails().getPollIntervalInSeconds());
            function.increaseIndent();
            function.line("() -> this.%s(%s),", clientMethod.getProxyMethod().getSimpleRestResponseMethodName(),
                clientMethod.getArgumentList());
            function.line(pollingStrategy + ",");
            function.line(
                TemplateUtil.getLongRunningOperationTypeReferenceExpression(clientMethod.getMethodPollingDetails())
                    + ");");
            function.decreaseIndent();
        });
    }

    /**
     * Generate long-running begin async method for protocol client
     *
     * @param clientMethod client method
     * @param typeBlock type block
     */
    protected void generateProtocolLongRunningBeginAsync(ClientMethod clientMethod, JavaType typeBlock) {
        String contextParam
            = "requestOptions != null && requestOptions.getContext() != null ? requestOptions.getContext() : Context.NONE";
        String pollingStrategy = getPollingStrategy(clientMethod, contextParam);
        typeBlock.annotation("ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)");
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            function.line("return PollerFlux.create(Duration.ofSeconds(%s),",
                clientMethod.getMethodPollingDetails().getPollIntervalInSeconds());
            function.increaseIndent();
            function.line("() -> this.%s(%s),", clientMethod.getProxyMethod().getSimpleAsyncRestResponseMethodName(),
                clientMethod.getArgumentList());
            function.line(pollingStrategy + ",");
            function.line(
                TemplateUtil.getLongRunningOperationTypeReferenceExpression(clientMethod.getMethodPollingDetails())
                    + ");");
            function.decreaseIndent();
        });
    }

    private String getPagingSinglePageExpression(ClientMethod clientMethod, String methodName, String argumentLine,
        JavaSettings settings) {
        if (settings.isDataPlaneClient() && settings.isPageSizeEnabled()) {
            Optional<String> maxPageSizeSerializedName
                = MethodUtil.serializedNameOfMaxPageSizeParameter(clientMethod.getProxyMethod());
            if (maxPageSizeSerializedName.isPresent()) {
                argumentLine = argumentLine.replace("requestOptions", "requestOptionsLocal");
                StringBuilder expression = new StringBuilder();
                expression.append("(pageSize) -> {");
                expression.append(
                    "RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;")
                    .append("if (pageSize != null) {")
                    .append("  requestOptionsLocal.addRequestCallback(requestLocal -> {")
                    .append("    UrlBuilder urlBuilder = UrlBuilder.parse(requestLocal.getUrl());")
                    .append("    urlBuilder.setQueryParameter(\"")
                    .append(maxPageSizeSerializedName.get())
                    .append("\", String.valueOf(pageSize));")
                    .append("    requestLocal.setUrl(urlBuilder.toString());")
                    .append("  });")
                    .append("}")
                    .append(String.format("return %s(%s);", methodName, argumentLine));
                expression.append("}");
                return expression.toString();
            }
        }

        if (settings.isAzureV1()) {
            return String.format("() -> %s(%s)", methodName, argumentLine);
        } else {
            return String.format("pagingOptions -> { %s return %s(%s); }",
                getLogExceptionExpressionForPagingOptions(clientMethod), methodName, argumentLine);
        }
    }

    private String getPagingNextPageExpression(ClientMethod clientMethod, String methodName, String argumentLine,
        JavaSettings settings) {
        if (settings.isDataPlaneClient() && settings.isPageSizeEnabled()) {
            Optional<String> maxPageSizeSerializedName
                = MethodUtil.serializedNameOfMaxPageSizeParameter(clientMethod.getProxyMethod());
            if (maxPageSizeSerializedName.isPresent()) {
                argumentLine = argumentLine.replace("requestOptions", "requestOptionsLocal");
                StringBuilder expression = new StringBuilder();
                expression.append("(nextLink, pageSize) -> {");
                expression.append("RequestOptions requestOptionsLocal = new RequestOptions();")
                    .append("requestOptionsLocal.setContext(requestOptionsForNextPage.getContext());")
                    .append("if (pageSize != null) {")
                    .append("  requestOptionsLocal.addRequestCallback(requestLocal -> {")
                    .append("    UrlBuilder urlBuilder = UrlBuilder.parse(requestLocal.getUrl());")
                    .append("    urlBuilder.setQueryParameter(\"")
                    .append(maxPageSizeSerializedName.get())
                    .append("\", String.valueOf(pageSize));")
                    .append("    requestLocal.setUrl(urlBuilder.toString());")
                    .append("  });")
                    .append("}")
                    .append(String.format("return %s(%s);", methodName, argumentLine));
                expression.append("}");
                return expression.toString();
            }
        }

        if (settings.isDataPlaneClient()) {
            argumentLine = argumentLine.replace("requestOptions", "requestOptionsForNextPage");
        }

        if (settings.isAzureV1()) {
            return String.format("nextLink -> %s(%s)", methodName, argumentLine);
        } else {
            return String.format("(pagingOptions, nextLink) -> { %s return %s(%s); }",
                getLogExceptionExpressionForPagingOptions(clientMethod), methodName, argumentLine);
        }
    }

    private String getPollingStrategy(ClientMethod clientMethod, String contextParam) {
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
            .getPollingStrategy()
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

    protected void generateSendRequestAsync(ClientMethod clientMethod, JavaType typeBlock) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            function.line("return FluxUtil.withContext(context -> %1$s.getHttpPipeline().send(%2$s, context)",
                clientMethod.getClientReference(), clientMethod.getArgumentList());
            function.indent(() -> {
                function.line(".flatMap(response -> BinaryData.fromFlux(response.getBody())");
                function.line(
                    ".map(body -> new SimpleResponse<>(response.getRequest(), response.getStatusCode(), response.getHeaders(), body))));");
            });
        });
    }

    protected void generateSendRequestSync(ClientMethod clientMethod, JavaType typeBlock) {
        addServiceMethodAnnotation(typeBlock, ReturnType.SINGLE);
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(),
            function -> function.methodReturn(
                "this.sendRequestAsync(httpRequest).contextWrite(c -> c.putAll(FluxUtil.toReactorContext(context).readOnly())).block()"));
    }

    private static String getServiceVersionValue(ClientMethod clientMethod) {
        String serviceVersion = "null";
        if (JavaSettings.getInstance().isDataPlaneClient()
            && clientMethod.getProxyMethod() != null
            && clientMethod.getProxyMethod().getParameters() != null) {
            if (clientMethod.getProxyMethod()
                .getParameters()
                .stream()
                .anyMatch(p -> p.getOrigin() == ParameterSynthesizedOrigin.API_VERSION)) {
                serviceVersion = clientMethod.getClientReference() + ".getServiceVersion().getVersion()";
            }
        }
        return serviceVersion;
    }

    protected String getLogExceptionExpressionForPagingOptions(ClientMethod clientMethod) {
        StringBuilder expression = new StringBuilder();
        expression.append("if (pagingOptions.getOffset() != null) {")
            .append(getLogExpression("offset", clientMethod.getName()))
            .append("}");
        expression.append("if (pagingOptions.getPageSize() != null) {")
            .append(getLogExpression("pageSize", clientMethod.getName()))
            .append("}");
        expression.append("if (pagingOptions.getPageIndex() != null) {")
            .append(getLogExpression("pageIndex", clientMethod.getName()))
            .append("}");
        if (clientMethod.getMethodPageDetails().getContinuationToken() == null) {
            expression.append("if (pagingOptions.getContinuationToken() != null) {")
                .append(getLogExpression("continuationToken", clientMethod.getName()))
                .append("}");
        }
        return expression.toString();
    }

    protected String getLogExpression(String propertyName, String methodName) {
        return "throw LOGGER.logThrowableAsError(new IllegalArgumentException(\"'" + propertyName
            + "' in PagingOptions is not supported in API '" + methodName + "'.\"))";
    }
}
