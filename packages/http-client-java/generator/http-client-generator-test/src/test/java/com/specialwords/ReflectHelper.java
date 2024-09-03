// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.specialwords;

import com.azure.core.http.rest.RequestOptions;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.stream.Stream;

// use reflection to call mock server, as special-words test is about compiler, not runtime
class ReflectHelper {

    public static <T> void invokeWithResponseMethods(Class<T> clazz, Object client, Object... parameters) throws InvocationTargetException, IllegalAccessException {
        for (Method m : clazz.getDeclaredMethods()) {
            if (m.getName().endsWith("WithResponse")) {
                Object[] args = Stream.concat(Arrays.stream(parameters), Stream.of((RequestOptions) null)).toArray(Object[]::new);
                m.invoke(client, args);
            }
        }
    }
}
