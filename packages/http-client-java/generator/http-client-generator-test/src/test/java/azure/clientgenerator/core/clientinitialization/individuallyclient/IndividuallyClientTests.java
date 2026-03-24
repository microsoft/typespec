// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientinitialization.individuallyclient;

import azure.clientgenerator.core.clientinitialization.individuallyclient.models.BlobProperties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class IndividuallyClientTests {

    @Test
    public void testIndividuallyNestedWithPath() {
        IndividuallyNestedWithPathClient client
            = new IndividuallyNestedWithPathClientBuilder().blobName("test-blob").buildClient();

        client.withQuery("text");
        BlobProperties blobProperties = client.getStandalone();
        Assertions.assertNotNull(blobProperties);
        Assertions.assertEquals("test-blob", blobProperties.getName());
        client.deleteStandalone();
    }

    @Test
    public void testIndividuallyNestedWithQuery() {
        IndividuallyNestedWithQueryClient client
            = new IndividuallyNestedWithQueryClientBuilder().blobName("test-blob").buildClient();

        client.withQuery("text");
        BlobProperties blobProperties = client.getStandalone();
        Assertions.assertNotNull(blobProperties);
        Assertions.assertEquals("test-blob", blobProperties.getName());
        client.deleteStandalone();
    }

    @Test
    public void testIndividuallyNestedWithHeader() {
        IndividuallyNestedWithHeaderClient client
            = new IndividuallyNestedWithHeaderClientBuilder().name("test-name-value").buildClient();

        client.withQuery("text");
        client.getStandalone();
        client.deleteStandalone();
    }

    @Test
    public void testIndividuallyNestedWithMultiple() {
        IndividuallyNestedWithMultipleClient client
            = new IndividuallyNestedWithMultipleClientBuilder().name("test-name-value").region("us-west").buildClient();

        client.withQuery("text");
        client.getStandalone();
        client.deleteStandalone();
    }

    @Test
    public void testIndividuallyNestedWithMixed() {
        IndividuallyNestedWithMixedClient client
            = new IndividuallyNestedWithMixedClientBuilder().name("test-name-value").buildClient();

        client.withQuery("us-west", "text");
        client.getStandalone("us-west");
        client.deleteStandalone("us-west");
    }

    @Test
    public void testIndividuallyNestedWithParamAlias() {
        IndividuallyNestedWithParamAliasClient client
            = new IndividuallyNestedWithParamAliasClientBuilder().blobName("sample-blob").buildClient();

        client.withAliasedName();
        client.withOriginalName();
    }
}
