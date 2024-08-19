// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.preprocessor.namer.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.XmsExampleWrapper;

import java.util.Locale;
import java.util.Map;

public class ProxyMethodExampleMapper implements IMapper<XmsExampleWrapper, ProxyMethodExample> {

    private static final ProxyMethodExampleMapper INSTANCE = new ProxyMethodExampleMapper();

    protected ProxyMethodExampleMapper() {
    }

    public static ProxyMethodExampleMapper getInstance() {
        return INSTANCE;
    }

    // https://azure.github.io/autorest/extensions/#x-ms-examples
    // https://github.com/Azure/azure-rest-api-specs/blob/main/documentation/x-ms-examples.md

    @SuppressWarnings("unchecked")
    @Override
    public ProxyMethodExample map(XmsExampleWrapper exampleWrapper) {
        ProxyMethodExample.Builder builder = new ProxyMethodExample.Builder().name(exampleWrapper.getExampleName());

        Object xmsExample = exampleWrapper.getXmsExample();
        if (xmsExample instanceof Map) {
            // parameters
            Object parameters = ((Map<String, Object>) xmsExample).get("parameters");
            if (parameters instanceof Map) {
                for (Map.Entry<String, Object> entry : ((Map<String, Object>) parameters).entrySet()) {
                    builder.parameter(entry.getKey(), entry.getValue());
                }
            }

            // responses
            Object responses = ((Map<String, Object>) xmsExample).get("responses");
            if (responses instanceof Map) {
                for (Map.Entry<String, Object> entry : ((Map<String, Object>) responses).entrySet()) {
                    try {
                        Integer statusCode = Integer.valueOf(entry.getKey());
                        builder.response(statusCode, entry.getValue());
                    } catch (NumberFormatException numberFormatException) {
                        // ignore the response
                    }
                }
            }

            // x-ms-original-file
            String xmsOriginalFile = (String) ((Map<String, Object>) xmsExample).get("x-ms-original-file");
            builder.originalFile(xmsOriginalFile);
            if (exampleWrapper.getOperationId() != null) {
                builder.codeSnippetIdentifier(buildCodeSnippetIdentifier(exampleWrapper.getOperationId(), exampleWrapper.getExampleName()));
            }
        }
        return builder.build();
    }

    private String buildCodeSnippetIdentifier(String operationId, String exampleName) {
        return String.format("%s.generated.%s.%s", JavaSettings.getInstance().getPackage(), getValidName(operationId), getValidName(exampleName)).toLowerCase(Locale.ROOT);
    }

    private String getValidName(String exampleName) {
        return CodeNamer.getValidName(exampleName).replace("_", "");
    }
}
