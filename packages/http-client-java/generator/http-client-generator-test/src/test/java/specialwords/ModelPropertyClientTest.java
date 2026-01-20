// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package specialwords;

import org.junit.jupiter.api.Test;
import specialwords.modelproperties.models.DictMethods;
import specialwords.modelproperties.models.SameAsModel;

public class ModelPropertyClientTest {

    private final ModelPropertiesClient client = new SpecialWordsClientBuilder().buildModelPropertiesClient();

    @Test
    public void testSameAsModel() {
        client.sameAsModel(new SameAsModel("ok"));
    }

    @Test
    public void testDictMethods() {
        client.dictMethods(new DictMethods("ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok", "ok"));
    }
}
