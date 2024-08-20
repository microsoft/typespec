// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Scheme;

import java.util.HashSet;
import java.util.Set;

public class SecurityInfo {

    private Set<Scheme.SecuritySchemeType> securityTypes = new HashSet<>();

    private Set<String> scopes = new HashSet<>();

    private String headerName;

    private String headerValuePrefix;

    public Set<Scheme.SecuritySchemeType> getSecurityTypes() {
        return securityTypes;
    }

    public void setSecurityTypes(Set<Scheme.SecuritySchemeType> securityTypes) {
        this.securityTypes = securityTypes;
    }

    public Set<String> getScopes() {
        return scopes;
    }

    public void setScopes(Set<String> scopes) {
        this.scopes = scopes;
    }

    public String getHeaderName() {
        return headerName;
    }

    public void setHeaderName(String headerName) {
        this.headerName = headerName;
    }

    public String getHeaderValuePrefix() {
        return headerValuePrefix;
    }

    public void setHeaderValuePrefix(String headerValuePrefix) {
        this.headerValuePrefix = headerValuePrefix;
    }
}
