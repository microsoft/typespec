// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.routes;

import java.util.List;
import java.util.Set;

import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import org.junit.jupiter.api.Test;

public class RouteTests {

    @Test
    public void testFixed() {
        new RoutesClientBuilder().buildClient().fixed();

        new RoutesClientBuilder().buildInInterfaceClient().fixed();
    }

    @Test
    public void testPath() {
        var client = new RoutesClientBuilder().buildPathParametersClient();

        client.templateOnly("a");

        client.explicit("a");

        client.annotationOnly("a");
    }

    @Test
    public void testPathReservedExpansion() {
        var client = new RoutesClientBuilder().buildPathParametersReservedExpansionClient();

        // TODO, need enhancement in core or codegen
        client.template("foo/bar baz".replace(" ", "%20"));
        client.annotation("foo/bar baz".replace(" ", "%20"));
    }

    @Test
    public void testQuery() {
        var client = new RoutesClientBuilder().buildQueryParametersClient();

        client.templateOnly("a");

        client.explicit("a");

        client.annotationOnly("a");
    }

    @Test
    public void testQueryExpansionStandard() {
        var client = new RoutesClientBuilder().buildQueryParametersQueryExpansionStandardClient();

        client.primitive("a");

        client.array(List.of("a", "b"));
    }

    @Test
    public void testQueryExpansionContinuationStandard() {
        var client = new RoutesClientBuilder().buildQueryParametersQueryContinuationStandardClient();

        client.primitive("a");

        client.array(List.of("a", "b"));
    }

    @Test
    public void testQueryExpansionExplode() {
        var client = new RoutesClientBuilder().buildQueryParametersQueryExpansionExplodeClient();

        client.primitive("a");

//        client.array(List.of("a", "b"));
    }

    @Test
    public void buildQueryParametersQueryContinuationExplode() {
        var client = new RoutesClientBuilder().httpLogOptions(new HttpLogOptions()
                .setLogLevel(HttpLogDetailLevel.BODY_AND_HEADERS)
                .setAllowedQueryParamNames(Set.of("fixed", "param"))
        ).buildQueryParametersQueryContinuationExplodeClient();

        client.primitive("a");

//        client.array(List.of("a", "b"));
    }
}
