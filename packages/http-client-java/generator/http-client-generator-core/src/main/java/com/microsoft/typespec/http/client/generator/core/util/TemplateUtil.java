// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPollingDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import com.azure.core.util.CoreUtils;
import com.azure.json.JsonProviders;
import com.azure.json.JsonWriter;
import org.slf4j.Logger;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

public class TemplateUtil {

    private static final Logger LOGGER = new PluginLogger(Javagen.getPluginInstance(), TemplateUtil.class);

    // begin of constant for template replacement, used in ResourceUtil.loadTextFromResource
    public static final String SERVICE_NAME = "service-name";
    public static final String SERVICE_DESCRIPTION = "service-description";

    public static final String GROUP_ID = "group-id";
    public static final String ARTIFACT_ID = "artifact-id";
    public static final String ARTIFACT_VERSION = "artifact-version";
    public static final String PACKAGE_NAME = "package-name";
    public static final String IMPRESSION_PIXEL = "impression-pixel";

    public static final String MANAGER_CLASS = "manager-class";

    public static final String SAMPLE_CODES = "sample-codes";

    public static final String DATE_UTC = "date-utc";

    private static final String[] ESCAPE_REPLACEMENT;

    static {
        ESCAPE_REPLACEMENT = new String[128];
        ESCAPE_REPLACEMENT['\\'] = "\\\\";
        ESCAPE_REPLACEMENT['\t'] = "\\t";
        ESCAPE_REPLACEMENT['\b'] = "\\b";
        ESCAPE_REPLACEMENT['\n'] = "\\n";
        ESCAPE_REPLACEMENT['\r'] = "\\r";
        ESCAPE_REPLACEMENT['\f'] = "\\f";
        ESCAPE_REPLACEMENT['\"'] = "\\\"";
    }

    // end of constant for template replacement

    /**
     * Print object to JSON string with indent.
     *
     * @param jsonObject the Java object
     * @return the JSON string
     */
    public static String prettyPrintToJson(Object jsonObject) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JsonWriter jsonWriter = JsonProviders.createWriter(outputStream)) {
            jsonWriter.writeUntyped(jsonObject).flush();

            return outputStream.toString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Load text from resources, with string replacement.
     *
     * @param filename the filename of the text template.
     * @param replacements the string replacement to apply to the text template.
     * @return the text, with string replacement applied.
     */
    public static String loadTextFromResource(String filename, String... replacements) {
        String text = "";
        try (InputStream inputStream = TemplateUtil.class.getClassLoader().getResourceAsStream(filename)) {
            if (inputStream != null) {
                text = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))
                        .lines()
                        .collect(Collectors.joining(System.lineSeparator()));
                if (!text.isEmpty()) {
                    text += System.lineSeparator();
                }

                if (replacements.length > 0) {
                    if (replacements.length % 2 == 0) {
                        // replacement in template
                        for (int i = 0; i < replacements.length; i += 2) {
                            String key = replacements[i];
                            String value = replacements[i+1];
                            text = text.replace("{{" + key + "}}", value);
                        }
                    } else {
                        LOGGER.warn("Replacements skipped due to incorrect length: {}", Arrays.asList(replacements));
                    }
                }
            }
            return text;
        } catch (IOException e) {
            LOGGER.error("Failed to read file '{}'", filename);
            throw new IllegalStateException(e);
        }
    }

    /**
     * Helper function to write client methods to service client and method group
     *
     * @param classBlock Java class block
     * @param clientMethods collection of client methods
     */
    public static void writeClientMethodsAndHelpers(JavaClass classBlock, List<ClientMethod> clientMethods) {
        JavaSettings settings = JavaSettings.getInstance();

        // collect types of TypeReference<T>
        Set<GenericType> typeReferenceStaticClasses = new HashSet<>();

        for (ClientMethod clientMethod : clientMethods) {
            Templates.getClientMethodTemplate().write(clientMethod, classBlock);

            // this is coupled with ClientMethodTemplate.generateLongRunningBeginAsync, see getLongRunningOperationTypeReferenceExpression
            if (clientMethod.getType() == ClientMethodType.LongRunningBeginAsync && clientMethod.getMethodPollingDetails() != null) {
                if (clientMethod.getMethodPollingDetails().getIntermediateType() instanceof GenericType) {
                    typeReferenceStaticClasses.add((GenericType) clientMethod.getMethodPollingDetails().getIntermediateType());
                }

                if (clientMethod.getMethodPollingDetails().getFinalType() instanceof GenericType) {
                    typeReferenceStaticClasses.add((GenericType) clientMethod.getMethodPollingDetails().getFinalType());
                }
            }
        }

        // static classes for LRO
        for (GenericType typeReferenceStaticClass : typeReferenceStaticClasses) {
            writeTypeReferenceStaticVariable(classBlock, typeReferenceStaticClass);
        }

        // helper methods for LLC
        if (settings.isDataPlaneClient() &&
                clientMethods.stream().anyMatch(m -> m.getMethodPageDetails() != null)) {
            writePagingHelperMethods(classBlock);
        }
    }

    /**
     * Gets the expression of the intermediate and final type in LRO operation, used for "PollerFlux.create".
     *
     * @param details the MethodPollingDetails of LRO operation.
     * @return the expression
     */
    public static String getLongRunningOperationTypeReferenceExpression(MethodPollingDetails details) {
        // see writeTypeReferenceStaticClass
        return getTypeReferenceCreation(details.getIntermediateType()) + ", "
            + getTypeReferenceCreation(details.getFinalType());
    }

    /**
     * Gets the expression of the creation of TypeReference for different types.
     * It uses a static variable for Generic type. See {@link #writeTypeReferenceStaticVariable(JavaClass, GenericType)}
     *
     * @param type the type.
     * @return the expression
     */
    public static String getTypeReferenceCreation(IType type) {
        // see writeTypeReferenceStaticClass
        // Array, class, enum, and primitive types are all able to use TypeReference.createInstance which will create
        // or use a singleton instance.
        // Generic types must use a custom instance that supports complex generic parameters.
        if (!JavaSettings.getInstance().isBranded()) {
            return (type instanceof ArrayType || type instanceof ClassType || type instanceof EnumType || type instanceof PrimitiveType)
                    ? type.asNullable() + ".class"
                    : CodeNamer.getEnumMemberName("TypeReference" + ((GenericType) type).toJavaPropertyString());
        } else {
            return (type instanceof ArrayType || type instanceof ClassType || type instanceof EnumType || type instanceof PrimitiveType)
                    ? "TypeReference.createInstance(" + type.asNullable() + ".class)"
                    : CodeNamer.getEnumMemberName("TypeReference" + ((GenericType) type).toJavaPropertyString());
        }
    }

    /**
     * Writes a static final variable for TypeReference.
     * See {@link #getTypeReferenceCreation(IType)}
     *
     * @param classBlock the class block to write the code.
     * @param type the generic type.
     */
    public static void writeTypeReferenceStaticVariable(JavaClass classBlock, GenericType type) {
        // see getLongRunningOperationTypeReferenceExpression

        if (!JavaSettings.getInstance().isBranded()) {
            StringBuilder sb = new StringBuilder();
            for (IType typeArgument : type.getTypeArguments()) {
                if (sb.length() > 0) {
                    sb.append(", ");
                }
                sb.append(typeArgument.getClientType().toString()).append(".class");
            }
            classBlock.privateStaticFinalVariable(String.format("Type %1$s = new ParameterizedType() {"
                            + "@Override public Type getRawType() { return " + type.getName() + ".class; }"
                            + "@Override public Type[] getActualTypeArguments() { return new Type[] { " + sb + " }; }"
                            + "@Override public Type getOwnerType() { return null; } }",
                    CodeNamer.getEnumMemberName("TypeReference" + type.toJavaPropertyString())));
        } else {
            classBlock.privateStaticFinalVariable(String.format("TypeReference<%1$s> %2$s = new TypeReference<%1$s>() {}",
                    type, CodeNamer.getEnumMemberName("TypeReference" + type.toJavaPropertyString())));
        }
    }

    /**
     * Helper function to write helper methods for LLC paging
     *
     * @param classBlock Java class block
     */
    private static void writePagingHelperMethods(JavaClass classBlock) {
        classBlock.privateMethod("List<BinaryData> getValues(BinaryData binaryData, String path)", block -> {
            block.line("try {");
            block.line("Map<?, ?> obj = binaryData.toObject(Map.class);");
            block.line("List<?> values = (List<?>) obj.get(path);");
            block.line("return values.stream().map(BinaryData::fromObject).collect(Collectors.toList());");
            block.line("} catch (RuntimeException e) { return null; }");
        });
        classBlock.privateMethod("String getNextLink(BinaryData binaryData, String path)", block -> {
            block.line("try {");
            block.line("Map<?, ?> obj = binaryData.toObject(Map.class);");
            block.line("return (String) obj.get(path);");
            block.line("} catch (RuntimeException e) { return null; }");
        });
    }

    /**
     * Writes corresponding "ServiceMethod" annotation for client method.
     *
     * @param clientMethod the client method.
     * @param typeBlock the code block.
     */
    public static void writeClientMethodServiceMethodAnnotation(ClientMethod clientMethod, JavaType typeBlock) {
        switch (clientMethod.getType()) {
            case PagingSync:
            case PagingAsync:
                typeBlock.annotation("ServiceMethod(returns = ReturnType.COLLECTION)");
                break;
            case LongRunningBeginSync:
            case LongRunningBeginAsync:
                typeBlock.annotation("ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)");
                break;
            default:
                if (JavaSettings.getInstance().isBranded()) {
                    typeBlock.annotation("ServiceMethod(returns = ReturnType.SINGLE)");
                }
                break;
        }
    }

    /**
     * Helper function to add a JsonGetter to a class block.
     *
     * @param classBlock The class block being annotated.
     * @param settings The AutoRest settings to determine if JsonGetter should be added.
     * @param propertyName The JSON property name for the JsonGetter.
     */
    public static void addJsonGetter(JavaClass classBlock, JavaSettings settings, String propertyName) {
        if (!settings.isStreamStyleSerialization()) {
            addJsonGetterOrJsonSetter(classBlock, settings, () -> "JsonGetter(\"" + propertyName + "\")");
        }
    }

    /**
     * Helper function to add a JsonSetter to a class block.
     *
     * @param classBlock The class block being annotated.
     * @param settings The AutoRest settings to determine if JsonSetter should be added.
     * @param propertyName The JSON property name for the JsonSetter.
     */
    public static void addJsonSetter(JavaClass classBlock, JavaSettings settings, String propertyName) {
        if (!settings.isStreamStyleSerialization()) {
            addJsonGetterOrJsonSetter(classBlock, settings, () -> "JsonSetter(\"" + propertyName + "\")");
        }
    }

    private static void addJsonGetterOrJsonSetter(JavaClass classBlock, JavaSettings settings,
        Supplier<String> annotation) {
        if (settings.isGettersAndSettersAnnotatedForSerialization()) {
            classBlock.annotation(annotation.get());
        }
    }

    public static void addClientLogger(JavaClass classBlock, String className, JavaFileContents javaFileContents) {
        // Only need to check for usage of LOGGER as code will generate usages of ClientLogger with LOGGER.
        if (javaFileContents.contains("LOGGER")) {
            // hack to add LOGGER class variable only if LOGGER is used in code
            classBlock.privateStaticFinalVariable(
                ClassType.CLIENT_LOGGER + " LOGGER = new ClientLogger(" + className + ".class)");
        }
    }

    /**
     * Escape String for Java files.
     *
     * @param str string to escape
     * @return escaped string
     */
    public static String escapeString(String str) {
        if (CoreUtils.isNullOrEmpty(str)) {
            return str;
        }

        StringBuilder builder = null;

        int last = 0;
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            String replacement = c < 128 ? ESCAPE_REPLACEMENT[c] : null;

            if (replacement == null) {
                continue;
            }

            if (builder == null) {
                builder = new StringBuilder(str.length() * 2);
            }

            if (last != i) {
                builder.append(str, last, i);
            }

            builder.append(replacement);
            last = i + 1;
        }

        if (builder == null) {
            return str;
        }

        builder.append(str, last, str.length());
        return builder.toString();
    }
}
