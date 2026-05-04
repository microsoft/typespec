// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Reflection;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class HierarchyBuildingTests
    {
        [Test]
        public void DogExtendsIntermediatePetModel()
        {
            // Verify that Dog extends Pet (not Animal directly) due to @Legacy.hierarchyBuilding(Pet)
            var dogType = typeof(Dog);
            var baseType = dogType.BaseType;
            
            Assert.IsNotNull(baseType);
            Assert.AreEqual("Pet", baseType!.Name);
        }

        [Test]
        public void DogHasPropertiesFromBothAnimalAndPet()
        {
            // Verify Dog has all properties from the hierarchy
            var dogType = typeof(Dog);
            
            // From Animal (public)
            var nameProperty = dogType.GetProperty("Name", BindingFlags.Public | BindingFlags.Instance);
            
            // From Pet (intermediate)
            var trainedProperty = dogType.GetProperty("Trained", BindingFlags.Public | BindingFlags.Instance);
            
            // From Dog
            var breedProperty = dogType.GetProperty("Breed", BindingFlags.Public | BindingFlags.Instance);
            
            Assert.IsNotNull(nameProperty, "Dog should have Name property from Animal");
            Assert.IsNotNull(trainedProperty, "Dog should have Trained property from Pet");
            Assert.IsNotNull(breedProperty, "Dog should have Breed property");
        }

        [Test]
        public void PetExtendsAnimal()
        {
            // Verify that Pet extends Animal (normal inheritance)
            var petType = typeof(Pet);
            var baseType = petType.BaseType;
            
            Assert.IsNotNull(baseType);
            Assert.AreEqual("Animal", baseType!.Name);
        }

        [Test]
        public void AnimalIsAbstractBaseClass()
        {
            // Verify Animal is the abstract discriminated base
            var animalType = typeof(Animal);
            
            Assert.IsTrue(animalType.IsAbstract, "Animal should be abstract");
            Assert.IsTrue(animalType.IsClass, "Animal should be a class");
        }

        [Test]
        public void DogInheritsFromPetNotAnimalDirectly()
        {
            // This is the key test for hierarchy building - Dog -> Pet -> Animal
            var dogType = typeof(Dog);
            var petType = typeof(Pet);
            var animalType = typeof(Animal);
            
            // Dog's immediate base should be Pet
            Assert.AreEqual(petType, dogType.BaseType, "Dog should directly extend Pet");
            
            // Pet's immediate base should be Animal
            Assert.AreEqual(animalType, petType.BaseType, "Pet should directly extend Animal");
            
            // Dog should be assignable to both Pet and Animal
            Assert.IsTrue(petType.IsAssignableFrom(dogType), "Dog should be assignable to Pet");
            Assert.IsTrue(animalType.IsAssignableFrom(dogType), "Dog should be assignable to Animal");
        }

        [Test]
        public void AnimalOperationsClientExists()
        {
            // Verify AnimalOperations client is generated
            var clientType = typeof(SampleTypeSpecClient);
            var getAnimalOpsMethod = clientType.GetMethod("GetAnimalOperationsClient");
            
            Assert.IsNotNull(getAnimalOpsMethod, "Client should have GetAnimalOperationsClient() method");
            Assert.AreEqual("AnimalOperations", getAnimalOpsMethod!.ReturnType.Name);
        }

        [Test]
        public void PetOperationsClientExists()
        {
            // Verify PetOperations client is generated
            var clientType = typeof(SampleTypeSpecClient);
            var getPetOpsMethod = clientType.GetMethod("GetPetOperationsClient");
            
            Assert.IsNotNull(getPetOpsMethod, "Client should have GetPetOperationsClient() method");
            Assert.AreEqual("PetOperations", getPetOpsMethod!.ReturnType.Name);
        }

        [Test]
        public void DogOperationsClientExists()
        {
            // Verify DogOperations client is generated
            var clientType = typeof(SampleTypeSpecClient);
            var getDogOpsMethod = clientType.GetMethod("GetDogOperationsClient");
            
            Assert.IsNotNull(getDogOpsMethod, "Client should have GetDogOperationsClient() method");
            Assert.AreEqual("DogOperations", getDogOpsMethod!.ReturnType.Name);
        }

        [Test]
        public void UpdateDogAsAnimalOperationExists()
        {
            // Verify UpdateDogAsAnimal operation exists and accepts Animal parameter
            var animalOpsType = typeof(SampleTypeSpecClient).Assembly.GetType("SampleTypeSpec.AnimalOperations");
            Assert.IsNotNull(animalOpsType, "AnimalOperations type should exist");
            
            var updateDogMethod = animalOpsType!.GetMethods()
                .FirstOrDefault(m => m.Name == "UpdateDogAsAnimal" || m.Name == "UpdateDogAsAnimalAsync");
            
            Assert.IsNotNull(updateDogMethod, "UpdateDogAsAnimal operation should exist");
        }

        [Test]
        public void UpdatePetAsAnimalOperationExists()
        {
            // Verify UpdatePetAsAnimal operation exists and accepts Animal parameter
            var animalOpsType = typeof(SampleTypeSpecClient).Assembly.GetType("SampleTypeSpec.AnimalOperations");
            Assert.IsNotNull(animalOpsType, "AnimalOperations type should exist");
            
            var updatePetMethod = animalOpsType!.GetMethods()
                .FirstOrDefault(m => m.Name == "UpdatePetAsAnimal" || m.Name == "UpdatePetAsAnimalAsync");
            
            Assert.IsNotNull(updatePetMethod, "UpdatePetAsAnimal operation should exist");
        }

        [Test]
        public void UpdateDogAsPetOperationExists()
        {
            // Verify UpdateDogAsPet operation exists in PetOperations
            var petOpsType = typeof(SampleTypeSpecClient).Assembly.GetType("SampleTypeSpec.PetOperations");
            Assert.IsNotNull(petOpsType, "PetOperations type should exist");
            
            var updateDogMethod = petOpsType!.GetMethods()
                .FirstOrDefault(m => m.Name == "UpdateDogAsPet" || m.Name == "UpdateDogAsPetAsync");
            
            Assert.IsNotNull(updateDogMethod, "UpdateDogAsPet operation should exist");
        }

        [Test]
        public void UpdateDogAsDogOperationExists()
        {
            // Verify UpdateDogAsDog operation exists in DogOperations
            var dogOpsType = typeof(SampleTypeSpecClient).Assembly.GetType("SampleTypeSpec.DogOperations");
            Assert.IsNotNull(dogOpsType, "DogOperations type should exist");
            
            var updateDogMethod = dogOpsType!.GetMethods()
                .FirstOrDefault(m => m.Name == "UpdateDogAsDog" || m.Name == "UpdateDogAsDogAsync");
            
            Assert.IsNotNull(updateDogMethod, "UpdateDogAsDog operation should exist");
        }

        [Test]
        public void DogCanBePassedToAnimalOperation()
        {
            // Verify Dog instance can be used where Animal is expected (polymorphism)
            Dog dog = new Dog("Rex", true, "German Shepherd");
            Animal animal = dog; // This should compile
            
            Assert.IsNotNull(animal);
            Assert.AreEqual("Rex", animal.Name);
            
            // Verify the dog can be cast back
            Dog? castBack = animal as Dog;
            Assert.IsNotNull(castBack);
            Assert.AreEqual("German Shepherd", castBack!.Breed);
        }

        [Test]
        public void DogCanBePassedToPetOperation()
        {
            // Verify Dog instance can be used where Pet is expected (polymorphism)
            Dog dog = new Dog("Rex", true, "German Shepherd");
            Pet pet = dog;
            
            Assert.IsNotNull(pet);
            Assert.AreEqual("Rex", pet.Name);
            Assert.IsTrue(pet.Trained);
            
            // Verify the dog can be cast back
            Dog? castBack = pet as Dog;
            Assert.IsNotNull(castBack);
            Assert.AreEqual("German Shepherd", castBack!.Breed);
        }

        [Test]
        public void AllHierarchyLevelsHaveCorrectProperties()
        {
            // Create a dog and verify all properties through the hierarchy are accessible
            Dog dog = new Dog("Rex", true, "German Shepherd");
            
            // Access as Dog
            Assert.AreEqual("Rex", dog.Name);
            Assert.AreEqual("German Shepherd", dog.Breed);
            Assert.IsTrue(dog.Trained);
            
            // Access as Pet
            Pet pet = dog;
            Assert.AreEqual("Rex", pet.Name);
            Assert.IsTrue(pet.Trained);
            
            // Access as Animal
            Animal animal = dog;
            Assert.AreEqual("Rex", animal.Name);
        }
    }
}
