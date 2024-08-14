// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.PrimitiveSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.mapper.PrimitiveMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;

public class TypeSpecPrimitiveMapper extends PrimitiveMapper {

    private static final PrimitiveMapper INSTANCE = new TypeSpecPrimitiveMapper();

    public static PrimitiveMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected IType createPrimitiveType(PrimitiveSchema primaryType) {
        if (primaryType.getType() == Schema.AllSchemaTypes.DATE) {
            return ClassType.LOCAL_DATE;
        } else if (primaryType.getType() == Schema.AllSchemaTypes.UNIXTIME) {
            return PrimitiveType.UNIX_TIME_LONG;
        } else {
            return super.createPrimitiveType(primaryType);
        }
    }
}
