// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com._specs_.azure.core.page;

import com._specs_.azure.core.page.models.ListItemInputBody;
import com._specs_.azure.core.page.models.ListItemInputExtensibleEnum;
import com.azure.core.http.HttpClient;
import com.azure.core.test.http.AssertingHttpClientBuilder;
import org.junit.jupiter.api.Test;

public class PageTests {

    private final PageClient client = new PageClientBuilder()
            .httpClient(new AssertingHttpClientBuilder(HttpClient.createDefault()).assertSync().build())
            .buildClient();

    @Test
    public void testListNoModel() {
        // verification here is that there is no Page or CustomPage class generated in models

        client.listWithPage().stream().count();

        client.listWithCustomPageModel().stream().count();
    }

    @Test
    public void testListTwoModels() {
        TwoModelsAsPageItemClient client = new PageClientBuilder().buildTwoModelsAsPageItemClient();

        client.listFirstItem().stream().count();

        client.listSecondItem().stream().count();
    }

    @Test
    public void testPageRequestBody() {
        client.listWithParameters(new ListItemInputBody("Madge"), ListItemInputExtensibleEnum.SECOND).stream().count();
    }
}
