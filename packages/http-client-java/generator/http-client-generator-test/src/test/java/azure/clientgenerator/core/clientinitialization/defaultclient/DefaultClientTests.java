// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientinitialization.defaultclient;

import azure.clientgenerator.core.clientinitialization.defaultclient.models.BlobProperties;
import azure.clientgenerator.core.clientinitialization.defaultclient.models.Input;
import azure.clientgenerator.core.clientinitialization.defaultclient.models.WithBodyRequest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class DefaultClientTests {

    @Test
    public void testHeaderParam() {
        HeaderParamClient headerParamClient = new HeaderParamClientBuilder().name("test-name-value").buildClient();

        headerParamClient.withQuery("test-id");
        headerParamClient.withBody(new Input("test-name"));
    }

    @Test
    public void testMultipleParams() {
        MultipleParamsClient multipleParamsClient
            = new MultipleParamsClientBuilder().name("test-name-value").region("us-west").buildClient();

        multipleParamsClient.withQuery("test-id");
        multipleParamsClient.withBody(new Input("test-name"));
    }

    @Test
    public void testMixedParams() {
        MixedParamsClient mixedParamsClient = new MixedParamsClientBuilder().name("test-name-value").buildClient();

        mixedParamsClient.withQuery("us-west", "test-id");
        mixedParamsClient.withBody("us-west", new WithBodyRequest("test-name"));
    }

    @Test
    public void testPathParam() {
        PathParamClient pathParamClient = new PathParamClientBuilder().blobName("sample-blob").buildClient();

        pathParamClient.withQuery("text");
        BlobProperties blobProperties = pathParamClient.getStandalone();
        Assertions.assertNotNull(blobProperties);
        Assertions.assertEquals("sample-blob", blobProperties.getName());
        pathParamClient.deleteStandalone();
    }

    @Test
    public void testParamAlias() {
        ParamAliasClient paramAliasClient = new ParamAliasClientBuilder().blobName("sample-blob").buildClient();

        paramAliasClient.withAliasedName();
        paramAliasClient.withOriginalName();
    }

    @Test
    public void testQueryParam() {
        QueryParamClient queryParamClient = new QueryParamClientBuilder().blobName("test-blob").buildClient();

        queryParamClient.withQuery("text");
        BlobProperties blobProperties = queryParamClient.getStandalone();
        Assertions.assertNotNull(blobProperties);
        Assertions.assertEquals("test-blob", blobProperties.getName());
        queryParamClient.deleteStandalone();
    }
}
