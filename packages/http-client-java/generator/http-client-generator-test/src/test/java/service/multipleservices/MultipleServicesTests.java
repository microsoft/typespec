// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package service.multipleservices;

import com.azure.core.util.Configuration;
import org.junit.jupiter.api.Test;
import service.multipleservices.servicea.AOperationsClient;
import service.multipleservices.servicea.ASubNamespaceClient;
import service.multipleservices.servicea.ServiceAClientBuilder;
import service.multipleservices.serviceb.BOperationsClient;
import service.multipleservices.serviceb.BSubNamespaceClient;
import service.multipleservices.serviceb.ServiceBClientBuilder;

public final class MultipleServicesTests {

    private static final String ENDPOINT = Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000");

    private final AOperationsClient aOperationsClient
        = new ServiceAClientBuilder().endpoint(ENDPOINT).buildAOperationsClient();
    private final ASubNamespaceClient aSubNamespaceClient
        = new ServiceAClientBuilder().endpoint(ENDPOINT).buildASubNamespaceClient();
    private final BOperationsClient bOperationsClient
        = new ServiceBClientBuilder().endpoint(ENDPOINT).buildBOperationsClient();
    private final BSubNamespaceClient bSubNamespaceClient
        = new ServiceBClientBuilder().endpoint(ENDPOINT).buildBSubNamespaceClient();

    @Test
    public void testMultipleServiceClients() {
        aOperationsClient.opA();
        aSubNamespaceClient.subOpA();
        bOperationsClient.opB();
        bSubNamespaceClient.subOpB();
    }
}
