// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.model.inheritance;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.model.inheritance.notdiscriminated.NotDiscriminatedClient;
import type.model.inheritance.notdiscriminated.NotDiscriminatedClientBuilder;
import type.model.inheritance.notdiscriminated.Siamese;

class InheritanceTests {

    NotDiscriminatedClient client = new NotDiscriminatedClientBuilder().buildClient();

    @Test
    void postValid() {
        Siamese siamese = new Siamese("abc", 32, true);
        client.postValid(siamese);
    }

    @Test
    void getValid() {
        Siamese siamese = client.getValid();
        Assertions.assertEquals(true, siamese.isSmart());
        Assertions.assertEquals(32, siamese.getAge());
        Assertions.assertEquals("abc", siamese.getName());
    }

    @Test
    void putValid() {
        Siamese siamese = new Siamese("abc", 32, true);
        client.putValid(siamese);
    }
}
