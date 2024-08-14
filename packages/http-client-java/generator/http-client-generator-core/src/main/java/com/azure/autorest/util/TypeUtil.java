// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.util;

import com.azure.autorest.Javagen;
import com.azure.autorest.extension.base.plugin.PluginLogger;
import com.azure.autorest.model.clientmodel.GenericType;
import com.azure.autorest.model.clientmodel.IType;

import java.util.Arrays;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

public class TypeUtil {

    private static final PluginLogger LOGGER = new PluginLogger(Javagen.getPluginInstance(), TypeUtil.class);

    private static final ConcurrentMap<String, Optional<Class<?>>> TYPE_CLASS_MAP = new ConcurrentHashMap<>();

    private TypeUtil() {
    }

    /**
     * Whether the given type is GenericType and is subclass of either of the given classes.
     * @param type the type to check
     * @param parentClasses classes to match either one
     * @return whether the given type is GenericType and is subclass of either of the given classes
     */
    public static boolean isGenericTypeClassSubclassOf(IType type, Class<?>... parentClasses) {
        if (!(type instanceof GenericType) || parentClasses == null || parentClasses.length == 0) return false;
        Class<?> genericClass = getGenericClass((GenericType) type);
        return genericClass != null && Arrays.stream(parentClasses).anyMatch(p -> p.isAssignableFrom(genericClass));
    }

    private static Class<?> getGenericClass(GenericType type) {
        String className = type.getPackage() + "." + type.getName();
        return TYPE_CLASS_MAP.computeIfAbsent(className, key -> {
            try {
                return Optional.of(Class.forName(key));
            } catch (ClassNotFoundException e) {
                LOGGER.warn("class " + key + " not found!", e);
                return Optional.empty();
            }
        }).orElse(null);
    }
}
