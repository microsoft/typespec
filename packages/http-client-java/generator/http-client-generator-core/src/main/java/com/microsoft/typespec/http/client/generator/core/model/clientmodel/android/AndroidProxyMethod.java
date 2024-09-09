// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.android;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.azure.core.http.HttpMethod;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.List;
import java.util.Map;
import java.util.Set;

public class AndroidProxyMethod extends ProxyMethod {

    /**
     * Create a new RestAPIMethod with the provided properties.
     *
     * @param requestContentType The Content-Type of the request.
     * @param returnType The type of value that is returned from this method.
     * @param httpMethod The HTTP method that will be used for this method.
     * @param urlPath The path of this method's request URL.
     * @param responseExpectedStatusCodes The status codes that are expected in the response.
     * @param returnValueWireType The return value's type as it is received from the network (across the wire).
     * @param unexpectedResponseExceptionType The exception type to throw if this method receives and unexpected
     * response status code.
     * @param name The name of this REST API method.
     * @param parameters The parameters that are provided to this method.
     * @param description The description of this method.
     * @param isResumable Whether this method is resumable.
     * @param responseContentTypes The media-types in response.
     */
    protected AndroidProxyMethod(String requestContentType, IType returnType, HttpMethod httpMethod, String baseUrl,
        String urlPath, List<Integer> responseExpectedStatusCodes, ClassType unexpectedResponseExceptionType,
        Map<ClassType, List<Integer>> unexpectedResponseExceptionTypes, String name,
        List<ProxyMethodParameter> parameters, String description, IType returnValueWireType, IType responseBodyType,
        boolean isResumable, Set<String> responseContentTypes, String operationId,
        Map<String, ProxyMethodExample> examples, List<String> specialHeaders) {
        super(requestContentType, returnType, httpMethod, baseUrl, urlPath, responseExpectedStatusCodes,
            unexpectedResponseExceptionType, unexpectedResponseExceptionTypes, name, parameters, parameters,
            description, returnValueWireType, responseBodyType, responseBodyType, isResumable, responseContentTypes,
            operationId, examples, specialHeaders);
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports, JavaSettings settings) {

        if (includeImplementationImports) {
            if (getUnexpectedResponseExceptionType() != null) {
                imports.add("com.azure.android.core.rest.annotation.UnexpectedResponseExceptionTypes");
                imports.add("com.azure.android.core.rest.annotation.UnexpectedResponseExceptionType");
                getUnexpectedResponseExceptionType().addImportsTo(imports, includeImplementationImports);
            }
            if (getUnexpectedResponseExceptionTypes() != null) {
                imports.add("com.azure.android.core.rest.annotation.UnexpectedResponseExceptionTypes");
                getUnexpectedResponseExceptionTypes().keySet()
                    .forEach(e -> e.addImportsTo(imports, includeImplementationImports));
            }
            if (isResumable()) {
                imports.add("com.azure.android.core.rest.annotation.ResumeOperation");
            }
            imports.add(String.format("com.azure.android.core.rest.annotation.%1$s",
                CodeNamer.toPascalCase(getHttpMethod().toString().toLowerCase())));

            if (settings.isFluent()) {
                imports.add("com.azure.android.core.rest.annotation.Headers");
            }

            if (getReturnValueWireType() != null) {
                imports.add("com.azure.android.core.rest.annotation.ReturnValueWireType");
                imports.add("com.azure.android.core.rest.annotation.UnexpectedResponseExceptionTypes");
                imports.add("com.azure.android.core.rest.annotation.UnexpectedResponseExceptionType");
                getUnexpectedResponseExceptionType().addImportsTo(imports, includeImplementationImports);
            }
            if (getUnexpectedResponseExceptionTypes() != null) {
                imports.add("com.azure.android.core.rest.annotation.UnexpectedResponseExceptionTypes");
                imports.add("com.azure.android.core.rest.annotation.UnexpectedResponseExceptionType");
                getUnexpectedResponseExceptionTypes().keySet()
                    .forEach(e -> e.addImportsTo(imports, includeImplementationImports));
            }
            if (isResumable()) {
                imports.add("com.azure.android.core.rest.annotation.ResumeOperation");
            }
            imports.add(String.format("com.azure.android.core.rest.annotation.%1$s",
                CodeNamer.toPascalCase(getHttpMethod().toString().toLowerCase())));

            if (settings.isFluent()) {
                imports.add("com.azure.android.core.rest.annotation.Headers");
            }
            imports.add("com.azure.android.core.rest.annotation.ExpectedResponses");
            imports.add("com.azure.android.core.rest.PagedResponse");

            if (getReturnValueWireType() != null) {
                imports.add("com.azure.android.core.rest.annotation.ReturnValueWireType");
                returnValueWireType.addImportsTo(imports, includeImplementationImports);
            }

            returnType.addImportsTo(imports, includeImplementationImports);

            for (ProxyMethodParameter parameter : parameters) {
                parameter.addImportsTo(imports, includeImplementationImports, settings);
            }

            if (imports.contains(ClassType.UNIX_TIME_DATE_TIME.getFullName())) {
                imports.remove(ClassType.UNIX_TIME_DATE_TIME.getFullName());
                imports.add(ClassType.ANDROID_DATE_TIME.getFullName());
            }

            if (imports.contains(ClassType.BASE_64_URL.getFullName())) {
                imports.remove(ClassType.BASE_64_URL.getFullName());
                imports.add(ClassType.ANDROID_BASE_64_URL.getFullName());
            }

            if (imports.contains(ClassType.DATE_TIME_RFC_1123.getFullName())) {
                imports.remove(ClassType.DATE_TIME_RFC_1123.getFullName());
                imports.add(ClassType.ANDROID_DATE_TIME_RFC_1123.getFullName());
            }
        }
    }

    public static class Builder extends ProxyMethod.Builder {

        @Override
        public ProxyMethod build() {
            if (unexpectedResponseExceptionTypes != null && unexpectedResponseExceptionTypes.containsKey(
                unexpectedResponseExceptionType)) {
                unexpectedResponseExceptionType = null;
            }
            return new AndroidProxyMethod(requestContentType, returnType, httpMethod, baseUrl, urlPath,
                responseExpectedStatusCodes, unexpectedResponseExceptionType, unexpectedResponseExceptionTypes, name,
                parameters, description, returnValueWireType, responseBodyType, isResumable, responseContentTypes,
                operationId, examples, specialHeaders);
        }
    }
}
