// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class TypeUtil {

    private TypeUtil() {
    }

    /**
     * Whether the given type is Response, or one of its subclasses.
     *
     * @param type the type to check
     * @return whether the given type is Response, or one of its subclasses.
     */
    public static boolean isResponse(IType type) {
        if (!(type instanceof GenericType)) {
            return false;
        }

        GenericType genericType = (GenericType) type;
        String fullName = genericType.getPackage() + "." + genericType.getName();
        return ClassType.RESPONSE.getFullName().equals(fullName)
            || ClassType.RESPONSE_BASE.getFullName().equals(fullName)
            || ClassType.PAGED_RESPONSE.getFullName().equals(fullName)
            || ClassType.PAGED_RESPONSE_BASE.getFullName().equals(fullName)
            || ClassType.SIMPLE_RESPONSE.getFullName().equals(fullName)
            || ClassType.STREAM_RESPONSE.getFullName().equals(fullName);
    }

}
