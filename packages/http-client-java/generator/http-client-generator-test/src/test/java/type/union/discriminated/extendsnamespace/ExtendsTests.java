// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package type.union.discriminated.extendsnamespace;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import type.union.discriminated.extendsnamespace.customdiscriminator.models.Cat2;
import type.union.discriminated.extendsnamespace.customdiscriminator.models.Dog2;
import type.union.discriminated.extendsnamespace.enumdiscriminator.models.Cat3;
import type.union.discriminated.extendsnamespace.enumdiscriminator.models.Dog3;
import type.union.discriminated.extendsnamespace.explicitdiscriminator.models.Cat;
import type.union.discriminated.extendsnamespace.explicitdiscriminator.models.Dog;
import type.union.discriminated.extendsnamespace.injecteddiscriminator.models.Cat1;
import type.union.discriminated.extendsnamespace.injecteddiscriminator.models.Dog1;
import type.union.discriminated.extendsnamespace.recursive.models.Cat4;
import type.union.discriminated.extendsnamespace.recursive.models.Dog4;

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

    @Test
    public void testEnumDiscriminator() {
        EnumDiscriminatorOperationsClient client = new ExtendsClientBuilder().buildEnumDiscriminatorOperationsClient();
        Cat3 cat = Assertions.assertInstanceOf(Cat3.class, client.getCat());
        Assertions.assertEquals("Whiskers", cat.getName());
        Assertions.assertTrue(cat.isMeow());
        client.putCat(new Cat3("Whiskers", true));

        Dog3 dog = Assertions.assertInstanceOf(Dog3.class, client.getDog());
        Assertions.assertEquals("Rex", dog.getName());
        Assertions.assertFalse(dog.isBark());
        client.putDog(new Dog3("Rex", false));
    }

    @Test
    public void testRecursive() {
        RecursiveClient client = new ExtendsClientBuilder().buildRecursiveClient();
        Cat4 cat = Assertions.assertInstanceOf(Cat4.class, client.get());
        Assertions.assertEquals("Whiskers", cat.getName());
        Assertions.assertEquals("Rex", Assertions.assertInstanceOf(Dog4.class, cat.getFriend()).getName());
        Assertions.assertEquals("Kitten", Assertions.assertInstanceOf(Cat4.class, cat.getFriends().get(0)).getName());
        Assertions.assertEquals("Rex", Assertions.assertInstanceOf(Dog4.class, cat.getLookup().get("best")).getName());

        client.put(new Cat4("Whiskers", true).setFriend(new Dog4("Rex", false))
            .setFriends(List.of(new Cat4("Kitten", false)))
            .setLookup(Map.of("best", new Dog4("Rex", false))));
    }
}
