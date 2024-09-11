// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.core.mapper.ObjectMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class FluentObjectMapper extends ObjectMapper {

    private static final FluentObjectMapper INSTANCE = new FluentObjectMapper();

    public static FluentObjectMapper getInstance() {
        return INSTANCE;
    }

    private final Set<ObjectSchema> innerModels = ConcurrentHashMap.newKeySet();

    @Override
    protected boolean isInnerModel(ObjectSchema compositeType) {
        return innerModels.contains(compositeType);
    }

    @Override
    protected ClassType mapPredefinedModel(ObjectSchema compositeType) {
        ClassType result = null;
        if (compositeType.getLanguage().getJava().getName().equals(FluentType.RESOURCE.getName())) {
            result = FluentType.RESOURCE;
        } else if (compositeType.getLanguage().getJava().getName().equals(FluentType.PROXY_RESOURCE.getName())) {
            result = FluentType.PROXY_RESOURCE;
        } else if (compositeType.getLanguage().getJava().getName().equals(FluentType.SUB_RESOURCE.getName())) {
            result = FluentType.SUB_RESOURCE;
        } else if (compositeType.getLanguage().getJava().getName().equals(FluentType.MANAGEMENT_ERROR.getName())) {
            result = FluentType.MANAGEMENT_ERROR;
        } else if (compositeType.getLanguage().getJava().getName().equals(FluentType.SYSTEM_DATA.getName())) {
            result = FluentType.SYSTEM_DATA;
        } else if (compositeType.getLanguage().getJava().getName().equals(FluentType.ADDITIONAL_INFO.getName())) {
            result = FluentType.ADDITIONAL_INFO;
        }
        return result;
    }

    /**
     * Add types as Inner.
     *
     * @param compositeTypes The types to add as Inner.
     * @return The types from compositeTypes that need to be added.
     */
    public Set<ObjectSchema> addInnerModels(Collection<ObjectSchema> compositeTypes) {
        Set<ObjectSchema> compositeTypesToAdd = new HashSet<>(compositeTypes);
        compositeTypesToAdd.removeAll(innerModels);
        innerModels.addAll(compositeTypesToAdd);
        return compositeTypesToAdd;
    }

    /**
     * Remove types as Inner.
     *
     * @param javaNames The Java class names to remove as Inner.
     */
    public void removeInnerModels(Set<String> javaNames) {
        Set<ObjectSchema> compositeTypesToRemove = innerModels.stream()
                .filter(type -> javaNames.contains(Utils.getJavaName(type)))
                .collect(Collectors.toSet());
        innerModels.removeAll(compositeTypesToRemove);
    }
}
