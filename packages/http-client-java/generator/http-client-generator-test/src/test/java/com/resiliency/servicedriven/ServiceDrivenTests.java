// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.resiliency.servicedriven;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ServiceDrivenTests {

    private final com.resiliency.servicedriven.v1.ResiliencyServiceDrivenClient oldClient1 = new com.resiliency.servicedriven.v1.ResiliencyServiceDrivenClientBuilder()
            .endpoint("http://localhost:3000")
            .serviceDeploymentVersion("v1")
            .buildClient();

    private final com.resiliency.servicedriven.v1.ResiliencyServiceDrivenClient oldClient2 = new com.resiliency.servicedriven.v1.ResiliencyServiceDrivenClientBuilder()
            .endpoint("http://localhost:3000")
            .serviceDeploymentVersion("v2")
            .buildClient();

    private final ResiliencyServiceDrivenClient client2v1 = new ResiliencyServiceDrivenClientBuilder()
            .endpoint("http://localhost:3000")
            .serviceDeploymentVersion("v2")
            .serviceVersion(ServiceDrivenServiceVersion.V1)
            .buildClient();

    private final ResiliencyServiceDrivenClient client2v2 = new ResiliencyServiceDrivenClientBuilder()
            .endpoint("http://localhost:3000")
            .serviceDeploymentVersion("v2")
            .serviceVersion(ServiceDrivenServiceVersion.V2)
            .buildClient();

    @Test
    public void testAddOptionalParamFromNone() {
        oldClient1.fromNone();
        oldClient2.fromNone();

        client2v1.fromNone();
        client2v2.fromNone("new");
    }

    @Test
    public void testAddOptionalParamFromOneRequired() {
        oldClient1.fromOneRequired("required");
        oldClient2.fromOneRequired("required");
        
        client2v1.fromOneRequired("required");
        client2v2.fromOneRequired("required", "new");
    }

    @Test
    public void testAddOptionalParamFromOneOptional() {
        oldClient1.fromOneOptional("optional");
        oldClient2.fromOneOptional("optional");

        client2v1.fromOneOptional("optional");
        client2v2.fromOneOptional("optional", "new");
    }

    @Test
    public void testAddOperation() {
        client2v2.addOperation();
    }

    @Test
    public void testInvalidVersion() {
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> client2v1.fromNone("new"));

        Assertions.assertThrows(IllegalArgumentException.class,
                () -> client2v1.fromOneRequired("required", "new"));

        Assertions.assertThrows(IllegalArgumentException.class,
                () -> client2v1.fromOneOptional("optional", "new"));
    }
}
