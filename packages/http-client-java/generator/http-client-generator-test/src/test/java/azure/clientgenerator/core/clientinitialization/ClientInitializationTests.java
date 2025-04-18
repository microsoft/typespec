// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientinitialization;

import azure.clientgenerator.core.clientinitialization.models.Input;
import azure.clientgenerator.core.clientinitialization.models.WithBodyRequest;
import org.junit.jupiter.api.Test;

public final class ClientInitializationTests {

    private static final String TEST_NAME = "test-name-value";
    private static final String TEST_ID = "test-id";
    private static final Input TEST_BODY = new Input("test-name");
    private static final String TEST_REGION = "us-west";
    private static final String TEST_BLOB = "sample-blob";

    @Test
    public void testHeader() {
        HeaderParamClient client = new HeaderParamClientBuilder().name(TEST_NAME).buildClient();
        client.withQuery(TEST_ID);
        client.withBody(TEST_BODY);
    }

    @Test
    public void testPath() {
        PathParamClient client = new PathParamClientBuilder().blobName(TEST_BLOB).buildClient();
        client.withQuery("text");
        client.getStandalone();
        client.deleteStandalone();
    }

    @Test
    public void testMixed() {
        MixedParamsClient client = new MixedParamsClientBuilder().name(TEST_NAME).buildClient();
        client.withQuery(TEST_REGION, TEST_ID);
        client.withBody(TEST_REGION, new WithBodyRequest("test-name"));
    }

    @Test
    public void testMultiple() {
        MultipleParamsClient client
            = new MultipleParamsClientBuilder().name(TEST_NAME).region(TEST_REGION).buildClient();
        client.withQuery(TEST_ID);
        client.withBody(TEST_BODY);
    }

    @Test
    public void testParamAlias() {
        // TODO: blob and blobName should be one param
        ParamAliasClient client = new ParamAliasClientBuilder().blobName(TEST_BLOB).blob(TEST_BLOB).buildClient();
        client.withOriginalName();
        client.withAliasedName();
    }
}
