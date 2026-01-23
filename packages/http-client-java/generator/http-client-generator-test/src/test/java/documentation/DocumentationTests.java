// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package documentation;

import documentation.lists.models.BulletPointsEnum;
import documentation.lists.models.BulletPointsModel;
import org.junit.jupiter.api.Test;

// Markdown in Javadoc is not supported till JDK23
public class DocumentationTests {

    private final ListsClient listsClient = new DocumentationClientBuilder().buildListsClient();
    private final TextFormattingClient textFormattingClient
        = new DocumentationClientBuilder().buildTextFormattingClient();

    @Test
    public void testBulletPointsOp() {
        listsClient.bulletPointsOp();
    }

    @Test
    public void testBulletPointsModel() {
        listsClient.bulletPointsModel(new BulletPointsModel(BulletPointsEnum.SIMPLE));
    }

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
