// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.PrimitiveSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.mapper.PrimitiveMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class FluentPrimitiveMapper extends PrimitiveMapper {

    private static final FluentPrimitiveMapper INSTANCE = new FluentPrimitiveMapper();

    public static FluentPrimitiveMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(PrimitiveSchema primaryType) {
        if (primaryType == null) {
            return null;
        }
        if (parsed.containsKey(primaryType)) {
            return parsed.get(primaryType);
        }
        if (primaryType.getType() == Schema.AllSchemaTypes.CREDENTIAL) {
            // swagger is "format": "password", which mostly serve as a hint
            IType type = ClassType.STRING;
            parsed.put(primaryType, type);
            return type;
        } else {
            return super.map(primaryType);
        }
    }
}
