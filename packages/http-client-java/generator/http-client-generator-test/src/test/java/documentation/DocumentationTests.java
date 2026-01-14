// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package documentation;

import org.junit.jupiter.api.Test;

public class DocumentationTests {

    private final ListsClient listsClient = new DocumentationClientBuilder().buildListsClient();
    private final TextFormattingClient textFormattingClient
        = new DocumentationClientBuilder().buildTextFormattingClient();

    @Test
    public void testBulletPointsOp() {
        listsClient.bulletPointsOp();
    }

    // Note: testBulletPointsModel is commented out due to a known issue:
    // The mock API (mockapi.ts) returns status 200 for POST requests, but the generated client
    // expects status 204 based on the NoContentResponse return type in the TypeSpec definition.
    // This is a mismatch between the mock API implementation and the TypeSpec specification.
    //
    // @Test
    // public void testBulletPointsModel() {
    // BulletPointsModel model = new BulletPointsModel(BulletPointsEnum.SIMPLE);
    // listsClient.bulletPointsModelWithResponse(BinaryData.fromObject(model), null);
    // }

    @Test
    public void testNumbered() {
        listsClient.numbered();
    }

    @Test
    public void testBoldText() {
        textFormattingClient.boldText();
    }

    @Test
    public void testItalicText() {
        textFormattingClient.italicText();
    }

    @Test
    public void testCombinedFormatting() {
        textFormattingClient.combinedFormatting();
    }
}
