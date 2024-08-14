// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;
import java.util.Objects;

public class ConvenienceMethod {

    private final ClientMethod protocolMethod;
    private final List<ClientMethod> convenienceMethods;

    public ConvenienceMethod(ClientMethod clientMethod, List<ClientMethod> convenienceMethods) {
        this.protocolMethod = clientMethod;
        this.convenienceMethods = convenienceMethods;
    }

    public ClientMethod getProtocolMethod() {
        return protocolMethod;
    }

    public List<ClientMethod> getConvenienceMethods() {
        return convenienceMethods;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConvenienceMethod that = (ConvenienceMethod) o;
        return protocolMethod.equals(that.protocolMethod);
    }

    @Override
    public int hashCode() {
        return Objects.hash(protocolMethod);
    }
}
