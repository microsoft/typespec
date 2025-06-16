// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a request to an operation.
 */
public class Request extends Metadata {
    private List<Parameter> parameters = new ArrayList<>();
    private List<Parameter> signatureParameters = new ArrayList<>();

    /**
     * Creates a new instance of the Request class.
     */
    public Request() {
    }

    /**
     * Gets the parameter inputs to the operation.
     *
     * @return The parameter inputs to the operation.
     */
    public List<Parameter> getParameters() {
        return parameters;
    }

    /**
     * Sets the parameter inputs to the operation.
     *
     * @param parameters The parameter inputs to the operation.
     */
    public void setParameters(List<Parameter> parameters) {
        this.parameters = parameters;
    }

    /**
     * Gets the signature parameters.
     *
     * @return The signature parameters.
     */
    public List<Parameter> getSignatureParameters() {
        return signatureParameters;
    }

    /**
     * Sets the signature parameters.
     *
     * @param signatureParameters The signature parameters.
     */
    public void setSignatureParameters(List<Parameter> signatureParameters) {
        this.signatureParameters = signatureParameters;
    }
}
