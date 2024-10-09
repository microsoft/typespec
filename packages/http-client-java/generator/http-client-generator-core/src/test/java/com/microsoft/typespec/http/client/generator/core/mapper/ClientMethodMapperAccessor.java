// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class ClientMethodMapperAccessor extends ClientMethodMapper {

    public static String getDescription(Operation operation, IType returnType, IType baseType) {
        return returnTypeDescription(operation, returnType, baseType);
    }
}
