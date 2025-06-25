// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.implementation;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;

/**
 * Represents language-agnostic information about an operation for instrumentation purposes
 */
public class OperationInstrumentationInfo {
    private final String operationName;

    public OperationInstrumentationInfo(Operation operation) {
        String clientName = null;

        if (operation.getOperationGroup().getCodeModel() != null) {
            clientName = getName(operation.getOperationGroup().getCodeModel().getLanguage());
        }

        String methodName = getName(operation.getLanguage());
        this.operationName
            = CoreUtils.isNullOrEmpty(clientName) ? methodName : String.format("%s.%s", clientName, methodName);
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
