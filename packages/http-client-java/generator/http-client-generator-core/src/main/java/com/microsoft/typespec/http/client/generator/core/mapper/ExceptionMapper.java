// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ExceptionMapper implements IMapper<ObjectSchema, ClientException> {
    private static final ExceptionMapper INSTANCE = new ExceptionMapper();
    Map<ObjectSchema, ClientException> parsed = new ConcurrentHashMap<>();

    protected ExceptionMapper() {
    }

    public static ExceptionMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public ClientException map(ObjectSchema compositeType) {
        if (compositeType == null
                // there is no need to generate Exception class, if we use Exceptions from azure-core
                || (JavaSettings.getInstance().isDataPlaneClient() && JavaSettings.getInstance().isUseDefaultHttpStatusCodeToExceptionTypeMapping())) {
            return null;
        }

        return parsed.computeIfAbsent(compositeType, cType -> buildException(cType, JavaSettings.getInstance()));
    }

    protected ClientException buildException(ObjectSchema compositeType, JavaSettings settings) {
        String errorName = compositeType.getLanguage().getJava().getName();
        String methodOperationExceptionTypeName = errorName + "Exception";

        if (compositeType.getExtensions() != null && compositeType.getExtensions().getXmsClientName() != null) {
            methodOperationExceptionTypeName = compositeType.getExtensions().getXmsClientName();
        }

        boolean isCustomType = settings.isCustomType(methodOperationExceptionTypeName);
        String exceptionSubPackage = isCustomType
                ? settings.getCustomTypesSubpackage()
                : settings.getModelsSubpackage();
        String packageName = settings.getPackage(exceptionSubPackage);

        return createClientExceptionBuilder()
                .packageName(packageName)
                .name(methodOperationExceptionTypeName)
                .errorName(errorName)
                .build();
    }

    protected ClientException.Builder createClientExceptionBuilder() {
        return new ClientException.Builder();
    }
}
