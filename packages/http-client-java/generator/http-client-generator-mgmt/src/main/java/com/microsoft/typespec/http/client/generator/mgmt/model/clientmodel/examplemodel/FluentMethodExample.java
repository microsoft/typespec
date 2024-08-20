// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

/**
 * Basic info for Fluent samples with method call.
 */
public interface FluentMethodExample extends FluentExample {

    /**
     * Gets the reference from entry class to the method.
     *
     * E.g. "deployments()" for collection method from Fluent Lite,
     * or "serviceClient().getDeployments()" for service client method from Fluent Premium.
     *
     * This method is used together with {@link FluentExample#getEntryType()}.
     *
     * @return the reference from entry class to the method.
     */
    String getMethodReference();

    /**
     * @return the method name (of the resource collection method, or the client method).
     */
    String getMethodName();
}
