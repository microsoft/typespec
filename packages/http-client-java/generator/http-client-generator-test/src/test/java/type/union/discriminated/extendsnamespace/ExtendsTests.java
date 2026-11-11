// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.union.discriminated.extendsnamespace;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.union.discriminated.extendsnamespace.customdiscriminator.models.Cat2;
import type.union.discriminated.extendsnamespace.customdiscriminator.models.Dog2;
import type.union.discriminated.extendsnamespace.explicitdiscriminator.models.Cat;
import type.union.discriminated.extendsnamespace.explicitdiscriminator.models.Dog;
import type.union.discriminated.extendsnamespace.injecteddiscriminator.models.Cat1;
import type.union.discriminated.extendsnamespace.injecteddiscriminator.models.Dog1;

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

    @Test
    public void testInjectedDiscriminator() {
        InjectedDiscriminatorOperationsClient client
            = new ExtendsClientBuilder().buildInjectedDiscriminatorOperationsClient();
        Cat1 cat = Assertions.assertInstanceOf(Cat1.class, client.getCat());
        Assertions.assertEquals("Whiskers", cat.getName());
        Assertions.assertTrue(cat.isMeow());
        client.putCat(new Cat1("Whiskers", true));

        Dog1 dog = Assertions.assertInstanceOf(Dog1.class, client.getDog());
        Assertions.assertEquals("Rex", dog.getName());
        Assertions.assertFalse(dog.isBark());
        client.putDog(new Dog1("Rex", false));
    }

    @Test
    public void testCustomDiscriminator() {
        CustomDiscriminatorOperationsClient client
            = new ExtendsClientBuilder().buildCustomDiscriminatorOperationsClient();
        Cat2 cat = Assertions.assertInstanceOf(Cat2.class, client.getCat());
        Assertions.assertEquals("Whiskers", cat.getName());
        Assertions.assertTrue(cat.isMeow());
        client.putCat(new Cat2("Whiskers", true));

        Dog2 dog = Assertions.assertInstanceOf(Dog2.class, client.getDog());
        Assertions.assertEquals("Rex", dog.getName());
        Assertions.assertFalse(dog.isBark());
        client.putDog(new Dog2("Rex", false));
    }
}
