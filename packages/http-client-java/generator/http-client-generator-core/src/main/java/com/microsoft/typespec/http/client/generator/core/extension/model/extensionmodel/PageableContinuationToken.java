// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Header;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import java.util.List;

public class PageableContinuationToken {

    private Parameter parameter;
    private List<Property> responseProperty;
    private Header responseHeader;

    public Parameter getParameter() {
        return parameter;
    }

    public void setParameter(Parameter parameter) {
        this.parameter = parameter;
    }

    public List<Property> getResponseProperty() {
        return responseProperty;
    }

    public void setResponseProperty(List<Property> responseProperty) {
        this.responseProperty = responseProperty;
    }

    public Header getResponseHeader() {
        return responseHeader;
    }

    public void setResponseHeader(Header responseHeader) {
        this.responseHeader = responseHeader;
    }
}
