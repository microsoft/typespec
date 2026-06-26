// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.implementation;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import io.clientcore.core.utils.CoreUtils;

/**
 * Represents language-agnostic information about an operation for instrumentation purposes
 */
public class OperationInstrumentationInfo {
    private final String operationName;

    public OperationInstrumentationInfo(Operation operation) {
        String localOperationName = SchemaUtil.getCrossLanguageDefinitionId(operation);
        if (localOperationName == null) {
            // cross language operation id is not available for unbranded libs, let's fallback
            // to namespace.clientName.methodName
            Client codeModel = operation.getOperationGroup().getCodeModel();
            String clientName = null;
            if (codeModel != null) {
                String namespace = codeModel.getLanguage().getDefault().getNamespace();
                String name = getName(codeModel.getLanguage());
                clientName = namespace == null ? name : String.format("%s.%s", namespace, name);
            }

            String methodName = getName(operation.getLanguage());
            localOperationName
                = CoreUtils.isNullOrEmpty(clientName) ? methodName : String.format("%s.%s", clientName, methodName);
        }

        this.operationName = localOperationName;
    }

    /**
     * Gets the language-agnostic operation name qualified within the namespace.
     *
     * @return The operation name.
     */
    public String getOperationName() {
        return operationName;
    }

    private static String getName(Languages languages) {
        return (languages != null && languages.getDefault() != null) ? languages.getDefault().getName() : null;
    }
}
