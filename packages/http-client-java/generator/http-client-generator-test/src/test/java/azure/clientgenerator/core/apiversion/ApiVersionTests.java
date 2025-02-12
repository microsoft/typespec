// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.apiversion;

import azure.clientgenerator.core.apiversion.header.HeaderClient;
import azure.clientgenerator.core.apiversion.header.HeaderClientBuilder;
import azure.clientgenerator.core.apiversion.header.HeaderServiceVersion;
import azure.clientgenerator.core.apiversion.path.PathClient;
import azure.clientgenerator.core.apiversion.path.PathClientBuilder;
import azure.clientgenerator.core.apiversion.path.PathServiceVersion;
import azure.clientgenerator.core.apiversion.query.QueryClient;
import azure.clientgenerator.core.apiversion.query.QueryClientBuilder;
import azure.clientgenerator.core.apiversion.query.QueryServiceVersion;
import org.junit.jupiter.api.Test;

public class ApiVersionTests {

    @Test
    public void headerTests() {
        HeaderClient client = new HeaderClientBuilder().serviceVersion(HeaderServiceVersion.getLatest()).buildClient();
        client.headerApiVersion();
    }

    @Test
    public void pathTests() {
        PathClient client = new PathClientBuilder().serviceVersion(PathServiceVersion.getLatest()).buildClient();
        client.pathApiVersion();
    }

    @Test
    public void queryTests() {
        QueryClient client = new QueryClientBuilder().serviceVersion(QueryServiceVersion.getLatest()).buildClient();
        client.queryApiVersion();
    }
}
