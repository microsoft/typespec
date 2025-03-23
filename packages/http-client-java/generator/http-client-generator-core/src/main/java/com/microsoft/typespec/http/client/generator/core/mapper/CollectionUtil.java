// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Utility class for collections.
 */
public final class CollectionUtil {
    private CollectionUtil() {
    }

    /**
     * Get an unmodifiable view of the given list.
     *
     * @param list the list for which an unmodifiable view is to be returned.
     * @param <T> the type of elements in the list.
     * @return an immutable list containing the same elements as the given list, or null if the input list is null.
     */
    public static <T> List<T> toImmutableList(List<T> list) {
        return list == null ? null : Collections.unmodifiableList(list);
    }

    /**
     * Get an unmodifiable view of the given set.
     *
     * @param set the set for which an unmodifiable view is to be returned.
     * @param <T> the type of elements in the set.
     * @return an immutable set containing the same elements as the given set, or null if the input set is null.
     */
    public static <T> Set<T> toImmutableSet(Set<T> set) {
        return set == null ? null : Collections.unmodifiableSet(set);
    }

    /**
     * Get an unmodifiable view of the given map, where the values are immutable lists.
     *
     * @param map the map for which an unmodifiable view is to be returned.
     * @param <K> the type of keys in the map.
     * @param <V> the type of elements in the lists that are values in the map.
     * @return an immutable map containing the same entries as the given map, with values as immutable lists, or null
     * if the input map is null.
     */
    public static <K, V> Map<K, List<V>> toImmutableMapOfList(Map<K, List<V>> map) {
        if (map == null) {
            return null;
        }
        if (map == Collections.unmodifiableMap(map)) {
            // if map is already unmodifiable, then Collections.unmodifiableMap will return the same reference.
            return map;
        }
        final Map<K, List<V>> m = new HashMap<>(map.size());
        for (Map.Entry<K, List<V>> e : map.entrySet()) {
            m.put(e.getKey(), toImmutableList(e.getValue()));
        }
        return Collections.unmodifiableMap(m);
    }
}
