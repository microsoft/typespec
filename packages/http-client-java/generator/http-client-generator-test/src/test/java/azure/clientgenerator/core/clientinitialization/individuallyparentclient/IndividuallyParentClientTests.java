// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.clientinitialization.individuallyparentclient;

import azure.clientgenerator.core.clientinitialization.individuallyparentclient.models.BlobProperties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class IndividuallyParentClientTests {

    private final IndividuallyParentClient parentClient = new IndividuallyParentClientBuilder().buildClient();

    @Test
    public void testIndividuallyParentNestedWithPath() {
        IndividuallyParentNestedWithPathClient client
            = parentClient.getIndividuallyParentNestedWithPathClient("test-blob");

        client.withQuery("text");
        BlobProperties blobProperties = client.getStandalone();
        Assertions.assertNotNull(blobProperties);
        Assertions.assertEquals("test-blob", blobProperties.getName());
        client.deleteStandalone();
    }

    @Test
    public void testIndividuallyParentNestedWithQuery() {
        IndividuallyParentNestedWithQueryClient client
            = parentClient.getIndividuallyParentNestedWithQueryClient("test-blob");

        client.withQuery("text");
        BlobProperties blobProperties = client.getStandalone();
        Assertions.assertNotNull(blobProperties);
        Assertions.assertEquals("test-blob", blobProperties.getName());
        client.deleteStandalone();
    }

    @Test
    public void testIndividuallyParentNestedWithHeader() {
        IndividuallyParentNestedWithHeaderClient client
            = parentClient.getIndividuallyParentNestedWithHeaderClient("test-name-value");

        client.withQuery("text");
        client.getStandalone();
        client.deleteStandalone();
    }

    @Test
    public void testIndividuallyParentNestedWithMultiple() {
        IndividuallyParentNestedWithMultipleClient client
            = parentClient.getIndividuallyParentNestedWithMultipleClient("test-name-value", "us-west");

        client.withQuery("text");
        client.getStandalone();
        client.deleteStandalone();
    }

    @Test
    public void testIndividuallyParentNestedWithMixed() {
        IndividuallyParentNestedWithMixedClient client
            = parentClient.getIndividuallyParentNestedWithMixedClient("test-name-value");

        client.withQuery("us-west", "text");
        client.getStandalone("us-west");
        client.deleteStandalone("us-west");
    }

    @Test
    public void testIndividuallyParentNestedWithParamAlias() {
        IndividuallyParentNestedWithParamAliasClient client
            = parentClient.getIndividuallyParentNestedWithParamAliasClient("sample-blob");

        client.withAliasedName();
        client.withOriginalName();
    }
}
