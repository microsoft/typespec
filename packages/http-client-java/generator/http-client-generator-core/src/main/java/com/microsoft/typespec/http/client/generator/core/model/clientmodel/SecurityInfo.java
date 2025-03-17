// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OAuth2Flow;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Scheme;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class SecurityInfo {

    private Set<Scheme.SecuritySchemeType> securityTypes = new HashSet<>();

    private Set<String> scopes = new HashSet<>();
    private List<OAuth2Flow> flows = new ArrayList<>();

    private String headerName;

    private String headerValuePrefix;

    /**
     * Gets the type of the security.
     *
     * @return the type of the security
     */
    public Set<Scheme.SecuritySchemeType> getSecurityTypes() {
        return securityTypes;
    }

    public void setSecurityTypes(Set<Scheme.SecuritySchemeType> securityTypes) {
        this.securityTypes = securityTypes;
    }

    /**
     * Gets the OAuth2 scopes for OAUTH2.
     *
     * @return the OAuth2 scopes for OAUTH2
     */
    public Set<String> getScopes() {
        return scopes;
    }

    public void setScopes(Set<String> scopes) {
        this.scopes = scopes;
    }

    /**
     * Gets the OAuth2 flows for OAUTH2.
     *
     * @return the OAuth2 flows for OAUTH2
     */
    public List<OAuth2Flow> getFlows() {
        return flows;
    }

    public void setFlows(List<OAuth2Flow> flows) {
        this.flows = flows;
    }

    /**
     * Gets the name of the header for KEY auth.
     *
     * @return the name of the header for KEY auth
     */
    public String getHeaderName() {
        return headerName;
    }

    public void setHeaderName(String headerName) {
        this.headerName = headerName;
    }

    /**
     * Gets the prefix of the header value for KEY auth.
     *
     * @return the prefix of the header value for KEY auth
     */
    public String getHeaderValuePrefix() {
        return headerValuePrefix;
    }

    public void setHeaderValuePrefix(String headerValuePrefix) {
        this.headerValuePrefix = headerValuePrefix;
    }
}
