// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

public class FluentClientMethodExampleTests {

    @Test
    public void mapsResourceMetadataSuffixToServiceClient() {
        assertEquals("featureClient()", FluentClientMethodExample.getServiceClientReference("resources", "feature"));
        assertEquals("policyClient()", FluentClientMethodExample.getServiceClientReference("resources", "policy"));
        assertEquals("subscriptionClient()",
            FluentClientMethodExample.getServiceClientReference("resources", "subscription"));
        assertEquals("managementLockClient()",
            FluentClientMethodExample.getServiceClientReference("resources", "lock"));
        assertEquals("resourceChangeClient()",
            FluentClientMethodExample.getServiceClientReference("resources", "change"));
        assertEquals("dataBoundaryClient()",
            FluentClientMethodExample.getServiceClientReference("resources", "databoundary"));
        assertEquals("deploymentClient()",
            FluentClientMethodExample.getServiceClientReference("resources", "deployments"));
    }

    @Test
    public void usesDefaultServiceClientWithoutMatchingMetadataSuffix() {
        assertEquals("serviceClient()", FluentClientMethodExample.getServiceClientReference("resources", null));
        assertEquals("serviceClient()", FluentClientMethodExample.getServiceClientReference("resources", "unknown"));
        assertEquals("serviceClient()", FluentClientMethodExample.getServiceClientReference("compute", "feature"));
    }

    @Test
    public void usesRoleServiceClientForAuthorization() {
        assertEquals("roleServiceClient()", FluentClientMethodExample.getServiceClientReference("authorization", null));
    }
}
