// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package service.multipleservices;

import org.junit.jupiter.api.Test;
import service.multipleservices.servicea.AOperationsClient;
import service.multipleservices.servicea.ASubNamespaceClient;
import service.multipleservices.servicea.ServiceAClientBuilder;
import service.multipleservices.serviceb.BOperationsClient;
import service.multipleservices.serviceb.BSubNamespaceClient;
import service.multipleservices.serviceb.ServiceBClientBuilder;

public final class MultipleServicesTests {

    private final AOperationsClient aOperationsClient = new ServiceAClientBuilder().buildAOperationsClient();
    private final ASubNamespaceClient aSubNamespaceClient = new ServiceAClientBuilder().buildASubNamespaceClient();
    private final BOperationsClient bOperationsClient = new ServiceBClientBuilder().buildBOperationsClient();
    private final BSubNamespaceClient bSubNamespaceClient = new ServiceBClientBuilder().buildBSubNamespaceClient();

    @Test
    public void testMultipleServiceClients() {
        aOperationsClient.opA();
        aSubNamespaceClient.subOpA();
        bOperationsClient.opB();
        bSubNamespaceClient.subOpB();
    }
}
