// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceValue;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Contains utility methods to help map from modelerfour to Java Autorest.
 */
public final class MapperUtils {
    /**
     * Create enum client type from code model.
     * @param enumType code model schema for enum
     * @param expandable whether it's expandable enum
     * @param useCodeModelNameForEnumMember whether to use code model enum member name for client enum member name
     * @return enum client type
     */
    public static IType createEnumType(ChoiceSchema enumType, boolean expandable, boolean useCodeModelNameForEnumMember) {
        JavaSettings settings = JavaSettings.getInstance();
        String enumTypeName = enumType.getLanguage().getJava().getName();

        if (enumTypeName == null || enumTypeName.isEmpty() || enumTypeName.equals("enum")) {
            return ClassType.STRING;
        } else {
            String enumPackage = settings.getPackage(settings.getModelsSubpackage());
            if (settings.isCustomType(enumTypeName)) {
                enumPackage = settings.getPackage(settings.getCustomTypesSubpackage());
            } else if (settings.isDataPlaneClient() && (enumType.getUsage() != null && enumType.getUsage().contains(SchemaContext.INTERNAL))) {
                // internal type, which is not exposed to user
                enumPackage = settings.getPackage(settings.getImplementationSubpackage(), settings.getModelsSubpackage());
            }

            String summary = enumType.getSummary();
            String description = enumType.getLanguage().getJava() == null ? null : enumType.getLanguage().getJava().getDescription();
            description = SchemaUtil.mergeSummaryWithDescription(summary, description);
            if (CoreUtils.isNullOrEmpty(description)) {
                description = "Defines values for " + enumTypeName + ".";
            }

            List<ClientEnumValue> enumValues = new ArrayList<>();
            for (ChoiceValue enumValue : enumType.getChoices()) {
                String enumName = enumValue.getValue();
                String enumDescription = null;
                if (useCodeModelNameForEnumMember) {
                    if (enumValue.getLanguage() != null && enumValue.getLanguage().getJava() != null
                        && enumValue.getLanguage().getJava().getName() != null) {
                        enumName = enumValue.getLanguage().getJava().getName();
                        enumDescription = enumValue.getLanguage().getJava().getDescription();
                    } else if (enumValue.getLanguage() != null && enumValue.getLanguage().getDefault() != null
                        && enumValue.getLanguage().getDefault().getName() != null) {
                        enumName = enumValue.getLanguage().getDefault().getName();
                        enumDescription = enumValue.getLanguage().getDefault().getDescription();
                    }
                }
                final String memberName = CodeNamer.getEnumMemberName(enumName);
                long counter = enumValues.stream().filter(v -> v.getName().equals(memberName)).count();
                if (counter > 0) {
                    enumValues.add(new ClientEnumValue(memberName + "_" + counter, enumValue.getValue(), enumDescription));
                } else {
                    enumValues.add(new ClientEnumValue(memberName, enumValue.getValue(), enumDescription));
                }
            }

            return new EnumType.Builder()
                    .packageName(enumPackage)
                    .name(enumTypeName)
                    .description(description)
                    .expandable(expandable)
                    .values(enumValues)
                    .elementType(Mappers.getSchemaMapper().map(enumType.getChoiceType()))
                    .implementationDetails(new ImplementationDetails.Builder()
                            .usages(SchemaUtil.mapSchemaContext(enumType.getUsage()))
                            .build())
                    .crossLanguageDefinitionId(enumType.getCrossLanguageDefinitionId())
                    .build();
        }
    }

    static IType handleResponseSchema(Operation operation, JavaSettings settings) {
        Schema responseBodySchema = SchemaUtil.getLowestCommonParent(operation.getResponses().stream()
            .map(Response::getSchema).filter(Objects::nonNull).iterator());
        boolean xmlWrapperResponse = responseBodySchema != null && responseBodySchema.getSerialization() != null
            && responseBodySchema.getSerialization().getXml() != null
            && responseBodySchema.getSerialization().getXml().isWrapped();

        if (!xmlWrapperResponse) {
            return SchemaUtil.getOperationResponseType(responseBodySchema, operation, settings);
        }

        // XML wrapped response types are tricky as they're defined as ArraySchema but in reality it's a specialized
        // ObjectSchema.
        ArraySchema arraySchema = (ArraySchema) responseBodySchema;
        String className = arraySchema.getElementType().getLanguage().getJava().getName() + "Wrapper";
        String classPackage = settings.isCustomType(className)
            ? settings.getPackage(className)
            : settings.getPackage(settings.getImplementationSubpackage() + ".models");

        return new ClassType.Builder()
            .packageName(classPackage)
            .name(className)
            .extensions(responseBodySchema.getExtensions())
            .build();
    }

    private MapperUtils() {
    }
}
