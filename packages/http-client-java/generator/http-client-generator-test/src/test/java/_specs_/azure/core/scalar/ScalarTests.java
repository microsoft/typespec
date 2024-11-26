// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package _specs_.azure.core.scalar;

import _specs_.azure.core.scalar.models.AzureLocationModel;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ScalarTests {

    private final static String LOCATION_REGION = "eastus";
    private final ScalarClient client = new ScalarClientBuilder().endpoint("http://localhost:3001").buildClient();

    @Test
    public void testGet() {
        Assertions.assertEquals(LOCATION_REGION, client.get());
    }

    @Test
    public void testHeader() {
        client.headerMethod(LOCATION_REGION);
    }

    @Test
    public void testPost() {
        AzureLocationModel azureLocationModel = client.post(new AzureLocationModel(LOCATION_REGION));
        Assertions.assertEquals(LOCATION_REGION, azureLocationModel.getLocation());
    }

    @Test
    public void testPut() {
        client.put(LOCATION_REGION);
    }

    @Test
    public void testQuery() {
        client.query(LOCATION_REGION);
    }
}
