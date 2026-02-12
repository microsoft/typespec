// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.KnownMediaType;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import io.clientcore.core.utils.CoreUtils;
import java.util.Collections;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.Stack;
import java.util.stream.Collectors;

public class SchemaUtil {

    private SchemaUtil() {
    }

    public static Schema getLowestCommonParent(List<Schema> schemas) {
        return getLowestCommonParent(schemas.iterator());
    }

    public static Schema getLowestCommonParent(Iterator<Schema> schemas) {
        if (schemas == null || !schemas.hasNext()) {
            return null;
        }

        LinkedList<Schema> chain = null;
        while (schemas.hasNext()) {
            Schema schema = schemas.next();
            if (chain == null) {
                chain = new LinkedList<>();
                chain.addFirst(schema);
                while (schema instanceof ObjectSchema
                    && ((ObjectSchema) schema).getParents() != null
                    && ((ObjectSchema) schema).getParents().getImmediate() != null
                    && !((ObjectSchema) schema).getParents().getImmediate().isEmpty()) {
                    // Assume always inheriting from an ObjectSchema and no multiple inheritance
                    schema = ((ObjectSchema) schema).getParents().getImmediate().get(0);
                    chain.addFirst(schema);
                }
            } else {
                Stack<Schema> newChain = new Stack<>();
                newChain.push(schema);
                while (schema instanceof ObjectSchema
                    && ((ObjectSchema) schema).getParents() != null
                    && ((ObjectSchema) schema).getParents().getImmediate() != null
                    && !((ObjectSchema) schema).getParents().getImmediate().isEmpty()) {
                    // Assume always inheriting from an ObjectSchema and no multiple inheritance
                    schema = ((ObjectSchema) schema).getParents().getImmediate().get(0);
                    newChain.push(schema);
                }
                int i = 0;
                while (!newChain.empty() && i < chain.size()) {
                    Schema top = chain.get(i);
                    Schema compare = newChain.pop();
                    if (top == compare) {
                        i++;
                    } else {
                        for (; i < chain.size(); i++) {
                            chain.remove(i);
                        }
                    }
                }
            }
        }

        return chain.isEmpty() ? new AnySchema() : chain.getLast();
    }

    /*
     * Returns raw response type.
     * In case of binary response:
     * For DPG, returns BinaryData
     * For vanilla/mgmt, returns InputStream
     */
    public static IType getOperationResponseType(Operation operation, JavaSettings settings) {
        final Schema responseBodySchema = SchemaUtil.getLowestCommonParent(operation.getResponseSchemas().iterator());
        return getOperationResponseType(responseBodySchema, operation, settings);
    }

    /*
     * Returns raw response type.
     * In case of binary response:
     *
     * 1. response.binary=true(e.g. Content-Type=application/zip):
     * For DPG, returns BinaryData.
     * For vanilla/mgmt, returns InputStream if use-input-stream-for-binary=true, otherwise, returns BinaryData.
     *
     * 2. response with BinarySchema(e.g. Content-Type=text/powershell):
     * For vanilla, returns Flux<ByteBuffer>.
     * For DPG/mgmt, returns BinaryData.
     */
    public static IType getOperationResponseType(Schema responseBodySchema, Operation operation,
        JavaSettings settings) {
        final IType responseBodyType = Mappers.getSchemaMapper().map(responseBodySchema);
        if (responseBodyType != null) {
            return responseBodyType;
        }
        if (operation.checksResourceExistenceWithHead()) {
            // Azure core would internally convert the response status code of HEAD to boolean.
            return PrimitiveType.BOOLEAN;
        }
        if (operation.hasBinaryResponse()) {
            if (settings.isDataPlaneClient() || !settings.isInputStreamForBinary()) {
                return ClassType.BINARY_DATA;
            } else {
                return ClassType.INPUT_STREAM;
            }
        }
        return PrimitiveType.VOID;
    }

    public static Property getDiscriminatorProperty(ObjectSchema compositeType) {
        Property discriminatorProperty = null;
        if (compositeType.getDiscriminator() != null) {
            discriminatorProperty = compositeType.getDiscriminator().getProperty();
        } else {
            for (Schema parent : compositeType.getParents().getAll()) {
                if (parent instanceof ObjectSchema && ((ObjectSchema) parent).getDiscriminator() != null) {
                    discriminatorProperty = ((ObjectSchema) parent).getDiscriminator().getProperty();
                    break;
                }
            }
        }
        if (discriminatorProperty == null) {
            throw new IllegalArgumentException(String.format("discriminator not found in type %s and its parents",
                compositeType.getLanguage().getJava().getName()));
        }

        return discriminatorProperty;
    }

    public static String getDiscriminatorSerializedName(ObjectSchema compositeType) {
        String discriminator = null;
        if (compositeType.getDiscriminator() != null) {
            discriminator = compositeType.getDiscriminator().getProperty().getSerializedName();
        } else if (compositeType.getDiscriminatorValue() != null) {
            for (Schema parent : compositeType.getParents().getAll()) {
                if (parent instanceof ObjectSchema && ((ObjectSchema) parent).getDiscriminator() != null) {
                    discriminator = ((ObjectSchema) parent).getDiscriminator().getProperty().getSerializedName();
                    break;
                }
            }
        }
        if (discriminator == null) {
            throw new IllegalArgumentException(String.format("discriminator not found in type %s and its parents",
                compositeType.getLanguage().getJava().getName()));
        }
        return discriminator;
    }

    /**
     * Whether response contains header schemas.
     *
     * @param operation the operation
     * @param settings the JavaSetting object
     * @return whether response of the operation contains headers
     */
    public static boolean responseContainsHeaderSchemas(Operation operation, JavaSettings settings) {
        if ((operation.isLro() || operation.isPageable()) && (settings.isFluent() || settings.isDataPlaneClient())) {
            // Response headers will be omitted, as LRO method has return type as SyncPoller or PollerFlux, not
            // Response.
            // Same for pageable methods, as they return PagedFlux or PagedIterable. And PagedResponse contains headers.
            return false;
        }
        return operation.hasHeaderSchemaResponse();
    }

    /**
     * Merge summary and description.
     * <p>
     * If summary exists, it will take 1st line, and description will be moved to 2nd line in Javadoc.
     *
     * @param summary the summary text.
     * @param description the description text.
     * @return the merged text for Javadoc.
     */
    public static String mergeSummaryWithDescription(String summary, String description) {
        if (Objects.equals(summary, description)) {
            summary = null;
        }

        if (!CoreUtils.isNullOrEmpty(summary) && !CoreUtils.isNullOrEmpty(description)) {
            return summary + "\n\n" + description;
        } else if (!CoreUtils.isNullOrEmpty(summary)) {
            return summary;
        } else if (!CoreUtils.isNullOrEmpty(description)) {
            return description;
        } else {
            return "";
        }
    }

    public static IType removeModelFromParameter(RequestParameterLocation parameterRequestLocation, IType type) {
        if (parameterRequestLocation == RequestParameterLocation.BODY) {
            return ClassType.BINARY_DATA;
        }
        if (type instanceof PrimitiveType) {
            return type;
        }
        if (type instanceof EnumType) {
            return ClassType.STRING;
        }
        if (type instanceof ListType && ((ListType) type).getElementType() instanceof EnumType) {
            return new ListType(ClassType.STRING);
        }
        if (type instanceof IterableType && ((IterableType) type).getElementType() instanceof EnumType) {
            return new IterableType(ClassType.STRING);
        }
        return type;
    }

    public static IType tryMapToBinaryData(IType type, Operation operation) {
        if (type.asNullable() == ClassType.VOID) {
            return type;
        }
        if (operation.checksResourceExistenceWithHead()) {
            return type;
        }
        return ClassType.BINARY_DATA;
    }

    /**
     * Maps CADL model to model from external packages.
     *
     * @param compositeType the CADL model.
     * @return the model from external packages, if available.
     */
    public static ClassType mapExternalModel(ObjectSchema compositeType) {
        // For now, the external packages is the azure-core

        ClassType classType = null;
        if (compositeType.getLanguage() != null && compositeType.getLanguage().getDefault() != null) {
            String namespace = compositeType.getLanguage().getDefault().getNamespace();
            String name = compositeType.getLanguage().getDefault().getName();

            if (!CoreUtils.isNullOrEmpty(namespace) && !CoreUtils.isNullOrEmpty(name)) {
                if (Objects.equals(namespace, "Azure.Core.Foundations")) {
                    // https://github.com/Azure/azure-sdk-for-java/blob/main/sdk/core/azure-core/src/main/java/com/azure/core/models/ResponseError.java
                    if (Objects.equals(name, "Error")
                        || (Objects.equals(SchemaUtil.getCrossLanguageDefinitionId(compositeType),
                            "Azure.Core.Foundations.Error"))
                        || Objects.equals(name, "ErrorResponse")) {
                        classType = ClassType.RESPONSE_ERROR;
                    }
                    /*
                     * ResponseInnerError is not public, however it could be exposed via "innererror" when a model
                     * extends Error.
                     * In this case, generator would had to generate a class.
                     */
                }

                if (compositeType.getLanguage().getJava() != null
                    && compositeType.getLanguage().getJava().getNamespace() != null) {

                    // https://github.com/Azure/azure-sdk-for-java/blob/main/sdk/core/azure-core-experimental/src/main/java/com/azure/core/experimental/models/PollResult.java
                    if (Objects.equals(name, ClassType.POLL_OPERATION_DETAILS.getName())
                        && Objects.equals(compositeType.getLanguage().getJava().getNamespace(),
                            ClassType.POLL_OPERATION_DETAILS.getPackage())) {
                        classType = ClassType.POLL_OPERATION_DETAILS;
                    } else if (ClassType.REQUEST_CONDITIONS.getName().endsWith(name)
                        && Objects.equals(compositeType.getLanguage().getJava().getNamespace(),
                            ClassType.REQUEST_CONDITIONS.getPackage())) {
                        classType = ClassType.REQUEST_CONDITIONS;
                    } else if (ClassType.MATCH_CONDITIONS.getName().endsWith(name)
                        && Objects.equals(compositeType.getLanguage().getJava().getNamespace(),
                            ClassType.REQUEST_CONDITIONS.getPackage())) {
                        classType = ClassType.MATCH_CONDITIONS;
                    }
                }
            }
        }
        return classType;
    }

    /**
     * Maps set of SchemaContext to set of ImplementationDetails.Usage.
     *
     * @param schemaContexts the set of SchemaContext.
     * @return the set of ImplementationDetails.Usage.
     */
    public static Set<ImplementationDetails.Usage> mapSchemaContext(Set<SchemaContext> schemaContexts) {
        if (schemaContexts == null) {
            return Collections.emptySet();
        }
        return schemaContexts.stream().map(ImplementationDetails.Usage::fromSchemaContext).collect(Collectors.toSet());
    }

    public static String getDefaultName(Metadata m) {
        if (m.getLanguage() == null || m.getLanguage().getDefault() == null) {
            return null;
        }
        return m.getLanguage().getDefault().getName();
    }

    public static String getCrossLanguageDefinitionId(Metadata m) {
        if (m.getLanguage() == null || m.getLanguage().getDefault() == null) {
            return null;
        }
        return m.getLanguage().getDefault().getCrossLanguageDefinitionId();
    }

    public static String getJavaName(Metadata m) {
        if (m.getLanguage() == null || m.getLanguage().getJava() == null) {
            return null;
        }
        return m.getLanguage().getJava().getName();
    }

    public static boolean treatAsXml(Schema schema) {
        return (schema.getSerializationFormats() != null
            && schema.getSerializationFormats().contains(KnownMediaType.XML.value()))
            || (schema.getSerialization() != null && schema.getSerialization().getXml() != null);
    }
}
