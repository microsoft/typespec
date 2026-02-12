// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.hierarchybuilding;

import azure.clientgenerator.core.hierarchybuilding.models.Animal;
import azure.clientgenerator.core.hierarchybuilding.models.Dog;
import azure.clientgenerator.core.hierarchybuilding.models.Pet;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class HierarchyBuildingTests {

    private final AnimalOperationsClient animalClient
        = new HierarchyBuildingClientBuilder().buildAnimalOperationsClient();
    private final PetOperationsClient petClient = new HierarchyBuildingClientBuilder().buildPetOperationsClient();
    private final DogOperationsClient dogClient = new HierarchyBuildingClientBuilder().buildDogOperationsClient();

    @Test
    public void testUpdatePetAsAnimal() {
        // Test operation that accepts Animal input and returns Animal output
        // Service expects Pet data and returns Pet data
        Pet inputPet = new Pet("Buddy", true);
        Animal response = animalClient.updatePetAsAnimal(inputPet);

        // Verify response is a Pet
        Assertions.assertNotNull(response);
        Assertions.assertEquals("pet", response.getKind());
        Assertions.assertEquals("Buddy", response.getName());

        // Verify it's actually a Pet instance (polymorphic deserialization)
        Assertions.assertInstanceOf(Pet.class, response);
        Pet petResponse = (Pet) response;
        Assertions.assertTrue(petResponse.isTrained());
    }

    @Test
    public void testUpdateDogAsAnimal() {
        // Test operation that accepts Animal input and returns Animal output
        // Service expects Dog data and returns Dog data
        // Due to @hierarchyBuilding(Pet), Dog should inherit from Pet rather than Animal directly
        Dog inputDog = new Dog("Rex", true, "German Shepherd");
        Animal response = animalClient.updateDogAsAnimal(inputDog);

        // Verify response is a Dog
        Assertions.assertNotNull(response);
        Assertions.assertEquals("dog", response.getKind());
        Assertions.assertEquals("Rex", response.getName());

        // Verify it's actually a Dog instance (polymorphic deserialization)
        Assertions.assertInstanceOf(Dog.class, response);
        Dog dogResponse = (Dog) response;
        Assertions.assertTrue(dogResponse.isTrained());
        Assertions.assertEquals("German Shepherd", dogResponse.getBreed());

        // Verify Dog extends Pet (hierarchy building)
        Assertions.assertInstanceOf(Pet.class, dogResponse);
    }

    @Test
    public void testUpdatePetAsPet() {
        // Test operation that accepts Pet input and returns Pet output
        Pet inputPet = new Pet("Buddy", true);
        Pet response = petClient.updatePetAsPet(inputPet);

        // Verify response is a Pet
        Assertions.assertNotNull(response);
        Assertions.assertEquals("pet", response.getKind());
        Assertions.assertEquals("Buddy", response.getName());
        Assertions.assertTrue(response.isTrained());
    }

    @Test
    public void testUpdateDogAsPet() {
        // Test operation that accepts Pet input and returns Pet output
        // Service expects Dog data and returns Dog data, but through Pet interface
        Dog inputDog = new Dog("Rex", true, "German Shepherd");
        Pet response = petClient.updateDogAsPet(inputDog);

        // Verify response is a Dog (polymorphic deserialization)
        Assertions.assertNotNull(response);
        Assertions.assertEquals("dog", response.getKind());
        Assertions.assertEquals("Rex", response.getName());
        Assertions.assertTrue(response.isTrained());

        // Verify it's actually a Dog instance
        Assertions.assertInstanceOf(Dog.class, response);
        Dog dogResponse = (Dog) response;
        Assertions.assertEquals("German Shepherd", dogResponse.getBreed());
    }

    @Test
    public void testUpdateDogAsDog() {
        // Test operation that accepts Dog input and returns Dog output
        Dog inputDog = new Dog("Rex", true, "German Shepherd");
        Dog response = dogClient.updateDogAsDog(inputDog);

        // Verify response is a Dog
        Assertions.assertNotNull(response);
        Assertions.assertEquals("dog", response.getKind());
        Assertions.assertEquals("Rex", response.getName());
        Assertions.assertTrue(response.isTrained());
        Assertions.assertEquals("German Shepherd", response.getBreed());

        // Verify Dog extends Pet (hierarchy building)
        Assertions.assertInstanceOf(Pet.class, response);
    }
}
