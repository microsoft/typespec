// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.provisioning.http.client.generator.provisioning.model;

import com.azure.core.management.Region;
import com.azure.core.models.ResponseError;
import com.azure.core.util.BinaryData;
import com.azure.core.util.ETag;

import java.lang.reflect.Type;
import java.net.InetAddress;
import java.net.URI;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class TypeRegistry {
    private static final Map<Type, ModelBase> _mapping = new HashMap<>();
    private static final List<ModelBase> _types = new ArrayList<>();

    public static List<ModelBase> getTypes() {
        return Collections.unmodifiableList(_types);
    }

    static {
        // Primitives
        registerExternal(Object.class);
        registerExternal(Boolean.class);
        registerExternal(Integer.class);
        registerExternal(Long.class);
        registerExternal(Float.class);
        registerExternal(Double.class);
        registerExternal(String.class);

        // Common types
        registerExternal(BinaryData.class);
        registerExternal(OffsetDateTime.class);
        registerExternal(UUID.class);
        registerExternal(InetAddress.class);
        registerExternal(Duration.class);
        registerExternal(URI.class);

        // Azure types
        registerExternal(Region.class);
        registerExternal(ETag.class);
        registerExternal(ResponseError.class);
    }

    public static <T> void registerExternal(Class<T> clazz) {
        register(new ExternalModel(clazz));
    }

    public static void register(ModelBase type) {
        Objects.requireNonNull(type, "type");
        if (_types.contains(type)) {
            throw new IllegalArgumentException("Type " + type.getName() + " has already been registered!");
        }
        if (type.getArmType() != null && _mapping.containsKey(type.getArmType())) {
            throw new IllegalArgumentException(type.getName() + "'s ArmType has already been registered!");
        }

        _types.add(type);
        if (type.getArmType() != null) {
            _mapping.put(type.getArmType(), type);
        }
    }

    public static ModelBase get(Type armType) {
        Objects.requireNonNull(armType, "armType");
        return _mapping.get(armType);
    }

    public static Set<String> collectNamespaces(Collection<ModelBase> types) {
        return collectNamespaces(types, new HashSet<>(), new HashSet<>());
    }

    public static Set<String> collectNamespaces(Collection<ModelBase> types, Set<String> namespaces, Set<ModelBase> visited) {
        if (namespaces == null) {
            namespaces = new HashSet<>();
        }
        if (visited == null) {
            visited = new HashSet<>();
        }
        for (ModelBase type : types) {
            if (type == null || visited.contains(type)) {
                continue;
            }
            visited.add(type);

            if (type.getProvisioningPackage() == null) {
                continue;
            }
            namespaces.add(type.getProvisioningPackage());

            recurse(type, namespaces, visited);
        }
        return namespaces;
    }

    private static void recurse(ModelBase type, Set<String> namespaces, Set<ModelBase> visited) {
        if (type instanceof SimpleModel) {
            collectNamespaces(((SimpleModel) type).getProperties().stream().map(Property::getPropertyType).collect(Collectors.toList()), namespaces, visited);
        } else if (type instanceof Resource) {
            collectNamespaces(((Resource) type).getProperties().stream().map(Property::getPropertyType).collect(Collectors.toList()), namespaces, visited);
        } else if (type instanceof ListModel) {
            collectNamespaces(Collections.singletonList(((ListModel) type).getElementType()), namespaces, visited);
        } else if (type instanceof DictionaryModel) {
            collectNamespaces(Collections.singletonList(((DictionaryModel) type).getElementType()), namespaces, visited);
        }
    }

    public static void remove(ModelBase model) {
        _types.remove(model);
        if (model.getArmType() != null) {
            _mapping.remove(model.getArmType());
        }
    }
}
