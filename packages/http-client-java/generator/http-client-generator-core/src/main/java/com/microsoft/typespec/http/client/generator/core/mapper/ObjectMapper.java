// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

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
        String className = compositeType.getLanguage().getJava().getName();
        if (settings.isCustomType(compositeType.getLanguage().getJava().getName())) {
            classPackage = settings.getPackage(settings.getCustomTypesSubpackage());
        } else if (settings.isFluent() && isInnerModel(compositeType)) {
            className += "Inner";
            classPackage = settings.getPackage(settings.getFluentModelsSubpackage());
        } else if (settings.isFluent() && compositeType.isFlattenedSchema()) {
            // put class of flattened type to implementation package
            classPackage = settings.getPackage(settings.getFluentModelsSubpackage());
        } else if (settings.isDataPlaneClient() && isInternalModel(compositeType)) {
            // internal type is not exposed to user
            classPackage = settings.getPackage(settings.getImplementationSubpackage(), settings.getModelsSubpackage());
        } else if (isPageModel(compositeType)) {
            // put class of Page<> type to implementation package
            // for DPG from TypeSpec, these are not generated to class

            // this would not affect mgmt from Swagger, as the "usage" from m4 does not have this information.

            classPackage = settings.getPackage(settings.getImplementationSubpackage(), settings.getModelsSubpackage());
        } else {
            classPackage = settings.getPackage(settings.getModelsSubpackage());
        }

        return new ClassType.Builder()
            .packageName(classPackage)
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
        return SchemaUtil.mapExternalModel(compositeType);
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
     * Page model does not need to be exposed to user, as it is internal wire data that will be converted to PagedFlux or PagedIterable.
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
