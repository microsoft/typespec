// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;

/**
 * A tuple of code model {@link Parameter} and corresponding {@link ClientMethodParameter}.
 */
final class ParametersTuple {
    /**
     * the source code model parameter from which client method {@code clientMethodParameter} is derived.
     */
    final Parameter codeModelParameter;
    /**
     * the client method parameter.
     */
    final ClientMethodParameter clientMethodParameter;

    ParametersTuple(Parameter codeModelParameter, ClientMethodParameter clientMethodParameter) {
        this.codeModelParameter = codeModelParameter;
        this.clientMethodParameter = clientMethodParameter;
    }
}
