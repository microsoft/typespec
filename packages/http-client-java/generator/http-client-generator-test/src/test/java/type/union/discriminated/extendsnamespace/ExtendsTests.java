// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.union.discriminated.extendsnamespace;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.union.discriminated.extendsnamespace.explicitdiscriminator.models.Cat;
import type.union.discriminated.extendsnamespace.explicitdiscriminator.models.Dog;

public class ExtendsTests {
    @Test
    public void testExplicitDiscriminator() {
        ExplicitDiscriminatorOperationsClient client
            = new ExtendsClientBuilder().buildExplicitDiscriminatorOperationsClient();
        Cat cat = Assertions.assertInstanceOf(Cat.class, client.getCat());
        Assertions.assertEquals("Whiskers", cat.getName());
        Assertions.assertTrue(cat.isMeow());
        client.putCat(new Cat("Whiskers", true));

        Dog dog = Assertions.assertInstanceOf(Dog.class, client.getDog());
        Assertions.assertEquals("Rex", dog.getName());
        Assertions.assertFalse(dog.isBark());
        client.putDog(new Dog("Rex", false));
    }
}
