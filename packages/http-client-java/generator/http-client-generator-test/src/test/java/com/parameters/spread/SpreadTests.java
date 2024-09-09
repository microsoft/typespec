// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.parameters.spread;

import com.parameters.spread.models.BodyParameter;
import org.junit.jupiter.api.Test;

import java.util.List;

public class SpreadTests {

    private final AliasClient aliasClient = new SpreadClientBuilder().buildAliasClient();
    private final ModelClient modelClient = new SpreadClientBuilder().buildModelClient();

    @Test
    public void testSpread() {

        aliasClient.spreadAsRequestBody("foo");

        aliasClient.spreadAsRequestParameter("1", "bar", "foo");

        aliasClient.spreadWithMultipleParameters("1", "bar", "foo", List.of(1, 2), 1, List.of("foo", "bar"));

        aliasClient.spreadParameterWithInnerAlias("1", "bar", "foo", 1);

        aliasClient.spreadParameterWithInnerModel("1", "bar", "foo");
    }

    @Test
    public void testModel() {

        modelClient.spreadAsRequestBody("foo");
        modelClient.spreadCompositeRequestOnlyWithBody(new BodyParameter("foo"));
        modelClient.spreadCompositeRequestWithoutBody("foo", "bar");
        modelClient.spreadCompositeRequest("foo", "bar", new BodyParameter("foo"));
        modelClient.spreadCompositeRequestMix("foo", "bar", "foo");
    }
}
