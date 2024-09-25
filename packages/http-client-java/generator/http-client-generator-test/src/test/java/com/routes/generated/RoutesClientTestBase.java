// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package com.routes.generated;

// The Java test files under 'generated' package are generated for your reference.
// If you wish to modify these files, please copy them out of the 'generated' package, and modify there.
// See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.

import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.test.TestMode;
import com.azure.core.test.TestProxyTestBase;
import com.azure.core.util.Configuration;
import com.routes.InInterfaceClient;
import com.routes.PathParametersClient;
import com.routes.PathParametersLabelExpansionExplodeClient;
import com.routes.PathParametersLabelExpansionStandardClient;
import com.routes.PathParametersMatrixExpansionExplodeClient;
import com.routes.PathParametersMatrixExpansionStandardClient;
import com.routes.PathParametersPathExpansionExplodeClient;
import com.routes.PathParametersPathExpansionStandardClient;
import com.routes.PathParametersReservedExpansionClient;
import com.routes.PathParametersSimpleExpansionExplodeClient;
import com.routes.PathParametersSimpleExpansionStandardClient;
import com.routes.QueryParametersClient;
import com.routes.QueryParametersQueryContinuationExplodeClient;
import com.routes.QueryParametersQueryContinuationStandardClient;
import com.routes.QueryParametersQueryExpansionExplodeClient;
import com.routes.QueryParametersQueryExpansionStandardClient;
import com.routes.RoutesClient;
import com.routes.RoutesClientBuilder;

class RoutesClientTestBase extends TestProxyTestBase {
    protected RoutesClient routesClient;

    protected PathParametersClient pathParametersClient;

    protected PathParametersReservedExpansionClient pathParametersReservedExpansionClient;

    protected PathParametersSimpleExpansionStandardClient pathParametersSimpleExpansionStandardClient;

    protected PathParametersSimpleExpansionExplodeClient pathParametersSimpleExpansionExplodeClient;

    protected PathParametersPathExpansionStandardClient pathParametersPathExpansionStandardClient;

    protected PathParametersPathExpansionExplodeClient pathParametersPathExpansionExplodeClient;

    protected PathParametersLabelExpansionStandardClient pathParametersLabelExpansionStandardClient;

    protected PathParametersLabelExpansionExplodeClient pathParametersLabelExpansionExplodeClient;

    protected PathParametersMatrixExpansionStandardClient pathParametersMatrixExpansionStandardClient;

    protected PathParametersMatrixExpansionExplodeClient pathParametersMatrixExpansionExplodeClient;

    protected QueryParametersClient queryParametersClient;

    protected QueryParametersQueryExpansionStandardClient queryParametersQueryExpansionStandardClient;

    protected QueryParametersQueryExpansionExplodeClient queryParametersQueryExpansionExplodeClient;

    protected QueryParametersQueryContinuationStandardClient queryParametersQueryContinuationStandardClient;

    protected QueryParametersQueryContinuationExplodeClient queryParametersQueryContinuationExplodeClient;

    protected InInterfaceClient inInterfaceClient;

    @Override
    protected void beforeTest() {
        RoutesClientBuilder routesClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            routesClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        routesClient = routesClientbuilder.buildClient();

        RoutesClientBuilder pathParametersClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersClient = pathParametersClientbuilder.buildPathParametersClient();

        RoutesClientBuilder pathParametersReservedExpansionClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersReservedExpansionClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersReservedExpansionClient
            = pathParametersReservedExpansionClientbuilder.buildPathParametersReservedExpansionClient();

        RoutesClientBuilder pathParametersSimpleExpansionStandardClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersSimpleExpansionStandardClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersSimpleExpansionStandardClient
            = pathParametersSimpleExpansionStandardClientbuilder.buildPathParametersSimpleExpansionStandardClient();

        RoutesClientBuilder pathParametersSimpleExpansionExplodeClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersSimpleExpansionExplodeClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersSimpleExpansionExplodeClient
            = pathParametersSimpleExpansionExplodeClientbuilder.buildPathParametersSimpleExpansionExplodeClient();

        RoutesClientBuilder pathParametersPathExpansionStandardClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersPathExpansionStandardClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersPathExpansionStandardClient
            = pathParametersPathExpansionStandardClientbuilder.buildPathParametersPathExpansionStandardClient();

        RoutesClientBuilder pathParametersPathExpansionExplodeClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersPathExpansionExplodeClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersPathExpansionExplodeClient
            = pathParametersPathExpansionExplodeClientbuilder.buildPathParametersPathExpansionExplodeClient();

        RoutesClientBuilder pathParametersLabelExpansionStandardClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersLabelExpansionStandardClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersLabelExpansionStandardClient
            = pathParametersLabelExpansionStandardClientbuilder.buildPathParametersLabelExpansionStandardClient();

        RoutesClientBuilder pathParametersLabelExpansionExplodeClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersLabelExpansionExplodeClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersLabelExpansionExplodeClient
            = pathParametersLabelExpansionExplodeClientbuilder.buildPathParametersLabelExpansionExplodeClient();

        RoutesClientBuilder pathParametersMatrixExpansionStandardClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersMatrixExpansionStandardClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersMatrixExpansionStandardClient
            = pathParametersMatrixExpansionStandardClientbuilder.buildPathParametersMatrixExpansionStandardClient();

        RoutesClientBuilder pathParametersMatrixExpansionExplodeClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            pathParametersMatrixExpansionExplodeClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        pathParametersMatrixExpansionExplodeClient
            = pathParametersMatrixExpansionExplodeClientbuilder.buildPathParametersMatrixExpansionExplodeClient();

        RoutesClientBuilder queryParametersClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            queryParametersClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        queryParametersClient = queryParametersClientbuilder.buildQueryParametersClient();

        RoutesClientBuilder queryParametersQueryExpansionStandardClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            queryParametersQueryExpansionStandardClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        queryParametersQueryExpansionStandardClient
            = queryParametersQueryExpansionStandardClientbuilder.buildQueryParametersQueryExpansionStandardClient();

        RoutesClientBuilder queryParametersQueryExpansionExplodeClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            queryParametersQueryExpansionExplodeClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        queryParametersQueryExpansionExplodeClient
            = queryParametersQueryExpansionExplodeClientbuilder.buildQueryParametersQueryExpansionExplodeClient();

        RoutesClientBuilder queryParametersQueryContinuationStandardClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            queryParametersQueryContinuationStandardClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        queryParametersQueryContinuationStandardClient = queryParametersQueryContinuationStandardClientbuilder
            .buildQueryParametersQueryContinuationStandardClient();

        RoutesClientBuilder queryParametersQueryContinuationExplodeClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            queryParametersQueryContinuationExplodeClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        queryParametersQueryContinuationExplodeClient
            = queryParametersQueryContinuationExplodeClientbuilder.buildQueryParametersQueryContinuationExplodeClient();

        RoutesClientBuilder inInterfaceClientbuilder = new RoutesClientBuilder()
            .endpoint(Configuration.getGlobalConfiguration().get("ENDPOINT", "http://localhost:3000"))
            .httpClient(getHttpClientOrUsePlayback(getHttpClients().findFirst().orElse(null)))
            .httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));
        if (getTestMode() == TestMode.RECORD) {
            inInterfaceClientbuilder.addPolicy(interceptorManager.getRecordPolicy());
        }
        inInterfaceClient = inInterfaceClientbuilder.buildInInterfaceClient();

    }
}
