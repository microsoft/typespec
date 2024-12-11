// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ObjectMapper implements IMapper<ObjectSchema, IType>, NeedsPlainObjectCheck {
    private static final ObjectMapper INSTANCE = new ObjectMapper();
    Map<ObjectSchema, ClassType> parsed = new ConcurrentHashMap<>();

    protected ObjectMapper() {
    }

    public static ObjectMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public ClassType map(ObjectSchema compositeType) {
        if (compositeType == null) {
            return null;
        }

        return parsed.computeIfAbsent(compositeType, this::createClassType);
    }

    private ClassType createClassType(ObjectSchema compositeType) {
        JavaSettings settings = JavaSettings.getInstance();

        ClassType result = mapPredefinedModel(compositeType);
        if (result != null) {
            return result;
        }

        if (isPlainObject(compositeType)) {
            return ClassType.OBJECT;
        }

        String classPackage;
        String[] packageSuffixes;
        String className = compositeType.getLanguage().getJava().getName();
        if (settings.isCustomType(compositeType.getLanguage().getJava().getName())) {
            packageSuffixes = new String[] { settings.getCustomTypesSubpackage() };
        } else if (settings.isFluent() && isInnerModel(compositeType)) {
            className += "Inner";
            packageSuffixes = new String[] { settings.getFluentModelsSubpackage() };
        } else if (settings.isFluent() && compositeType.isFlattenedSchema()) {
            // put class of flattened type to fluent package
            packageSuffixes = new String[] { settings.getFluentModelsSubpackage() };
        } else if (settings.isDataPlaneClient() && isInternalModel(compositeType)) {
            // internal type is not exposed to user
            packageSuffixes = new String[] { settings.getImplementationSubpackage(), settings.getModelsSubpackage() };
        } else if (isPageModel(compositeType)) {
            // put class of Page<> type to implementation package
            // for DPG from TypeSpec, these are not generated to class

            // this would not affect mgmt from Swagger, as the "usage" from m4 does not have this information.

            packageSuffixes = new String[] { settings.getImplementationSubpackage(), settings.getModelsSubpackage() };
        } else {
            packageSuffixes = new String[] { settings.getModelsSubpackage() };
        }
        /*
         * For models with language.java.namespace, it would be used as the base package name to append suffixes.
         * Otherwise, the packageName in JavaSetting is the base package name.
         */
        if (!CoreUtils.isNullOrEmpty(compositeType.getLanguage().getJava().getNamespace())) {
            classPackage
                = settings.getPackageName(compositeType.getLanguage().getJava().getNamespace(), packageSuffixes);
        } else {
            classPackage = settings.getPackage(packageSuffixes);
        }

        return new ClassType.Builder().packageName(classPackage)
            .name(className)
            .extensions(compositeType.getExtensions())
            .usedInXml(SchemaUtil.treatAsXml(compositeType))
            .build();
    }

    /**
     * Extension for predefined types in azure-core.
     *
     * @param compositeType object type
     * @return The predefined type.
     */
    protected ClassType mapPredefinedModel(ObjectSchema compositeType) {
        if (JavaSettings.getInstance().isBranded()) {
            return SchemaUtil.mapExternalModel(compositeType);
        } else {
            return null;
        }
    }

    /**
     * Extension for Fluent inner model.
     *
     * @param compositeType object type
     * @return whether the type should be treated as inner model
     */
    protected boolean isInnerModel(ObjectSchema compositeType) {
        return false;
    }

    /**
     * Extension for Page model.
     * <p>
     * Page model does not need to be exposed to user, as it is internal wire data that will be converted to PagedFlux
     * or PagedIterable.
     * Check in TypeSpec.
     *
     * @param compositeType object type
     * @return whether the type is a Page model.
     */
    private static boolean isPageModel(ObjectSchema compositeType) {
        return compositeType.getUsage() != null && compositeType.getUsage().contains(SchemaContext.PAGED);
    }

    private static boolean isInternalModel(ObjectSchema compositeType) {
        return compositeType.getUsage() != null && compositeType.getUsage().contains(SchemaContext.INTERNAL);
    }
}
