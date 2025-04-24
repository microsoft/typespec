// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents security information.
 */
public class Security {
    private boolean authenticationRequired;
    private List<Scheme> schemes = new ArrayList<>();

    /**
     * Creates a new instance of the Security class.
     */
    public Security() {
    }

    /**
     * Gets whether authentication is required.
     *
     * @return Whether authentication is required.
     */
    public boolean isAuthenticationRequired() {
        return authenticationRequired;
    }

    /**
     * Sets whether authentication is required.
     *
     * @param authenticationRequired Whether authentication is required.
     */
    public void setAuthenticationRequired(boolean authenticationRequired) {
        this.authenticationRequired = authenticationRequired;
    }

    /**
     * Gets the security schemes.
     *
     * @return The security schemes.
     */
    public List<Scheme> getSchemes() {
        return schemes;
    }

    /**
     * Sets the security schemes.
     *
     * @param schemes The security schemes.
     */
    public void setSchemes(List<Scheme> schemes) {
        this.schemes = schemes;
    }
}
