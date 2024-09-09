// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.android;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ExternalDocumentation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPollingDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodTransformationDetail;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;

import java.util.List;
import java.util.Map;
import java.util.Set;

public class AndroidClientMethod extends ClientMethod {

    /**
     * Create a new ClientMethod with the provided properties.
     *
     * @param description The description of this ClientMethod.
     * @param returnValue The return value of this ClientMethod.
     * @param name The name of this ClientMethod.
     * @param parameters The parameters of this ClientMethod.
     * @param onlyRequiredParameters Whether this ClientMethod has omitted optional parameters.
     * @param type The type of this ClientMethod.
     * @param proxyMethod The ProxyMethod that this ClientMethod eventually calls.
     * @param validateExpressions The expressions (parameters and service client properties) that need to be validated
     * in this ClientMethod.
     * @param clientReference The reference to the service client.
     * @param requiredNullableParameterExpressions The parameter expressions which are required.
     * @param isGroupedParameterRequired The parameter that needs to transformed before pagination.
     * @param groupedParameterTypeName The type name of groupedParameter.
     * @param methodPageDetails The pagination information if this is a paged method.
     * @param methodTransformationDetails The parameter transformations before calling ProxyMethod.
     * @param externalDocumentation The external documentation.
     * @param hasWithContextOverload Whether this ClientMethod has a withContext overload.
     */
    protected AndroidClientMethod(String description, ReturnValue returnValue, String name,
        List<ClientMethodParameter> parameters, boolean onlyRequiredParameters, ClientMethodType type,
        ProxyMethod proxyMethod, Map<String, String> validateExpressions, String clientReference,
        List<String> requiredNullableParameterExpressions, boolean isGroupedParameterRequired,
        String groupedParameterTypeName, MethodPageDetails methodPageDetails,
        List<MethodTransformationDetail> methodTransformationDetails, JavaVisibility methodVisibility,
        JavaVisibility methodVisibilityInWrapperClient, MethodPollingDetails methodPollingDetails,
        ExternalDocumentation externalDocumentation, boolean hasWithContextOverload) {
        super(description, returnValue, name, parameters, onlyRequiredParameters, type, proxyMethod,
            validateExpressions, clientReference, requiredNullableParameterExpressions, isGroupedParameterRequired,
            groupedParameterTypeName, methodPageDetails, methodTransformationDetails, methodVisibility,
            methodVisibilityInWrapperClient, null, methodPollingDetails, externalDocumentation, null,
            hasWithContextOverload);
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports, JavaSettings settings) {
        getReturnValue().addImportsTo(imports, includeImplementationImports);

        imports.add("com.azure.android.core.rest.annotation.ServiceMethod");
        imports.add("com.azure.android.core.rest.annotation.ReturnType");
        imports.add("java.util.concurrent.ExecutionException");
        imports.add("java9.util.function.Function");

        for (ClientMethodParameter parameter : getParameters()) {
            parameter.addImportsTo(imports, includeImplementationImports);
        }

        if (getMethodPageDetails() != null) {
            imports.add("com.azure.android.core.rest.PagedResponseBase");
        }

        if (includeImplementationImports) {
            getProxyMethod().addImportsTo(imports, includeImplementationImports, settings);
            for (ProxyMethodParameter parameter : getProxyMethod().getParameters()) {
                parameter.getClientType().addImportsTo(imports, true);
            }
        }

        if (imports.contains(ClassType.UNIX_TIME_DATE_TIME.getFullName())) {
            imports.remove(ClassType.UNIX_TIME_DATE_TIME.getFullName());
            imports.add(ClassType.ANDROID_DATE_TIME.getFullName());
        }
    }

    public static class Builder extends ClientMethod.Builder {
        @Override
        public ClientMethod build() {
            return new AndroidClientMethod(description, returnValue, name, parameters, onlyRequiredParameters, type,
                proxyMethod, validateExpressions, clientReference, requiredNullableParameterExpressions,
                isGroupedParameterRequired, groupedParameterTypeName, methodPageDetails, methodTransformationDetails,
                methodVisibility, methodVisibilityInWrapperClient, methodPollingDetails, externalDocumentation,
                hasWithContextOverload);
        }
    }
}
