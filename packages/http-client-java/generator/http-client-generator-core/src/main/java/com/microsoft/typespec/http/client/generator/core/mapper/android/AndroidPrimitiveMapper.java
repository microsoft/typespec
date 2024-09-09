// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ByteArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DateTimeSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.PrimitiveSchema;
import com.microsoft.typespec.http.client.generator.core.mapper.PrimitiveMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class AndroidPrimitiveMapper extends PrimitiveMapper {
    private static final AndroidPrimitiveMapper INSTANCE = new AndroidPrimitiveMapper();

    protected AndroidPrimitiveMapper() {
    }

    public static PrimitiveMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(PrimitiveSchema primaryType) {
        IType baseResolved = super.map(primaryType);
        if (primaryType == null || primaryType.getType() == null) {
            return baseResolved;
        }
        switch (primaryType.getType()) {
            case BYTE_ARRAY:
                ByteArraySchema byteArraySchema = (ByteArraySchema) primaryType;
                if (byteArraySchema.getFormat() == ByteArraySchema.Format.BASE_64_URL) {
                    return ClassType.ANDROID_BASE_64_URL;
                } else {
                    return ArrayType.BYTE_ARRAY;
                }
            case DATE_TIME:
                DateTimeSchema dateTimeSchema = (DateTimeSchema) primaryType;
                if (dateTimeSchema.getFormat() == DateTimeSchema.Format.DATE_TIME_RFC_1123) {
                    return ClassType.ANDROID_DATE_TIME_RFC_1123;
                } else {
                    return ClassType.ANDROID_DATE_TIME;
                }
            case DURATION:
                return ClassType.ANDROID_DURATION;
            case DATE:
                return ClassType.ANDROID_LOCAL_DATE;
            case UNIXTIME:
                return ClassType.ANDROID_DATE_TIME;
            default:
                return baseResolved;
        }
    }
}
