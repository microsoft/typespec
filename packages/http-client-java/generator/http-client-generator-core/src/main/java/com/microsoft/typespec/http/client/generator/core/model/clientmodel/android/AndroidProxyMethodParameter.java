// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.android;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterSynthesizedOrigin;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.util.serializer.CollectionFormat;

import java.util.Set;

public class AndroidProxyMethodParameter extends ProxyMethodParameter {

    /**
     * Create a new RestAPIParameter based on the provided properties.
     *
     * @param description The description of this parameter.
     * @param wireType The type of this parameter.
     * @param clientType The type of this parameter users interact with.
     * @param name The name of this parameter when it is used as a variable.
     * @param requestParameterLocation The location within the REST API method's HttpRequest where this parameter will
     * be added.
     * @param requestParameterName The name of the HttpRequest's parameter to substitute with this parameter's value.
     * @param alreadyEncoded Whether the value of this parameter will already be encoded (and can therefore be skipped
     * when other parameters' values are being encoded.
     * @param isConstant Whether this parameter is a constant value.
     * @param isRequired Whether this parameter is required.
     * @param isNullable Whether this parameter is nullable.
     * @param fromClient Whether this parameter's value comes from a ServiceClientProperty.
     * @param headerCollectionPrefix The x-ms-header-collection-prefix extension value.
     * @param parameterReference The reference to this parameter from a caller.
     * @param defaultValue The default value of the parameter.
     * @param collectionFormat The collection format if the parameter is a list type.
     */
    protected AndroidProxyMethodParameter(String description, IType wireType, IType clientType, String name,
        RequestParameterLocation requestParameterLocation, String requestParameterName, boolean alreadyEncoded,
        boolean isConstant, boolean isRequired, boolean isNullable, boolean fromClient, String headerCollectionPrefix,
        String parameterReference, String defaultValue, CollectionFormat collectionFormat, boolean explode) {
        super(description, wireType, wireType, clientType, name, requestParameterLocation, requestParameterName,
            alreadyEncoded, isConstant, isRequired, isNullable, fromClient, headerCollectionPrefix, parameterReference,
            defaultValue, collectionFormat, explode, ParameterSynthesizedOrigin.NONE);
    }

    @Override
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports, JavaSettings settings) {
        if (getRequestParameterLocation() != RequestParameterLocation.NONE) {
            imports.add(String.format("com.azure.android.core.rest.annotation.%1$sParam",
                CodeNamer.toPascalCase(getRequestParameterLocation().toString())));
        }
        if (getRequestParameterLocation() != RequestParameterLocation.BODY) {
            if (getClientType() == ArrayType.BYTE_ARRAY) {
                imports.add("com.azure.android.core.util.Base64Util");
            }
        }

        getWireType().addImportsTo(imports, includeImplementationImports);
    }

    public static class Builder extends ProxyMethodParameter.Builder {
        @Override
        public ProxyMethodParameter build() {
            return new AndroidProxyMethodParameter(description, wireType, clientType, name, requestParameterLocation,
                requestParameterName, alreadyEncoded, isConstant, isRequired, isNullable, fromClient,
                headerCollectionPrefix, parameterReference, defaultValue, collectionFormat, explode);
        }
    }
}
