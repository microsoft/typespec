// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.mapper;

import com.azure.autorest.extension.base.model.codemodel.OrSchema;
import com.azure.autorest.extension.base.model.codemodel.SchemaContext;
import com.azure.autorest.extension.base.plugin.JavaSettings;
import com.azure.autorest.model.clientmodel.ClassType;
import com.azure.autorest.model.clientmodel.IType;
import com.azure.autorest.util.SchemaUtil;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class UnionMapper implements IMapper<OrSchema, IType> {
    private static final UnionMapper INSTANCE = new UnionMapper();
    Map<OrSchema, ClassType> parsed = new ConcurrentHashMap<>();

    protected UnionMapper() {
    }

    public static UnionMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public ClassType map(OrSchema compositeType) {
        return ClassType.BINARY_DATA;
//        if (compositeType == null) {
//            return null;
//        }
//
//        return parsed.computeIfAbsent(compositeType, this::createClassType);
    }

    private ClassType createClassType(OrSchema compositeType) {
        JavaSettings settings = JavaSettings.getInstance();

        String className = compositeType.getLanguage().getJava().getName();
        String classPackage = settings.isCustomType(className)
            ? settings.getPackage(settings.getCustomTypesSubpackage())
            : settings.getPackage(settings.getModelsSubpackage());

        if (settings.isDataPlaneClient() && (compositeType.getUsage() != null && compositeType.getUsage().contains(SchemaContext.INTERNAL))) {
            // internal type, which is not exposed to user
            classPackage = settings.getPackage(settings.getImplementationSubpackage(), settings.getModelsSubpackage());
        }

        return new ClassType.Builder()
            .packageName(classPackage)
            .name(className)
            .extensions(compositeType.getExtensions())
            .usedInXml(SchemaUtil.treatAsXml(compositeType))
            .build();
    }
}
