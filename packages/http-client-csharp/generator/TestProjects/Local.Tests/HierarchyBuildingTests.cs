// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class HierarchyBuildingTests
    {
        [Test]
        public void RelaxedOverrideCanBeConstructedWithoutRequiredBaseValue()
        {
            var model = new ConstructorOverride(Enumerable.Repeat("item", 1));
            Assert.IsNull(model.Value);
            Assert.AreEqual("fixed", model.Mode);
            CollectionAssert.AreEqual(new[] { "item" }, model.Items);
            model.Value = "assigned";
            Assert.AreEqual("assigned", model.Value);
            using var json = JsonDocument.Parse(ModelReaderWriter.Write(model));
            Assert.AreEqual("assigned", json.RootElement.GetProperty("value").GetString());
            Assert.AreEqual("fixed", json.RootElement.GetProperty("mode").GetString());
            Assert.AreEqual("item", json.RootElement.GetProperty("items")[0].GetString());
            var roundTrip = ModelReaderWriter.Read<ConstructorOverride>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("assigned", roundTrip.Value);
            Assert.AreEqual("fixed", roundTrip.Mode);
            CollectionAssert.AreEqual(new[] { "item" }, roundTrip.Items);
            Assert.AreEqual("assigned", ((ConstructorBase)model).Value);
            Assert.Throws<ArgumentNullException>(() => new ConstructorOverride(null!));
            Assert.Throws<ArgumentNullException>(() => new ConstructorBase(null!, ["item"]));
            Assert.AreEqual("required", new ConstructorBase("required", ["item"]).Value);
        }

        [Test]
        public void RelaxedOverrideOfReadOnlyPropertySharesValueWithoutPublicBaseSetter()
        {
            var model = new ConstructorReadOnlyOverride { Value = "assigned" };
            Assert.AreEqual("assigned", model.Value);
            Assert.AreEqual("assigned", ((ConstructorReadOnlyBase)model).Value);
            Assert.IsNull(typeof(ConstructorReadOnlyBase).GetProperty(nameof(ConstructorReadOnlyBase.Value))!.GetSetMethod());
            var roundTrip = ModelReaderWriter.Read<ConstructorReadOnlyOverride>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("assigned", roundTrip.Value);
            Assert.AreEqual("assigned", ((ConstructorReadOnlyBase)roundTrip).Value);
        }

        [Test]
        public void RelaxedNonJsonOverrideDoesNotValidateMissingBaseValue()
        {
            var model = new XmlConstructorOverride("title");
            Assert.IsNull(model.Value);
            Assert.IsNull(model.Note);
            Assert.AreEqual("title", model.Title);
            model.Value = "assigned";
            model.Note = "note";
            Assert.AreEqual("assigned", ((XmlConstructorBase)model).Value);
            Assert.AreEqual("note", model.Note);
            Assert.Throws<ArgumentNullException>(() => new XmlConstructorOverride(null!));
            Assert.Throws<ArgumentNullException>(() => new XmlConstructorBase(null!, "title"));
            Assert.Throws<ArgumentNullException>(() => new XmlConstructorMiddle(null!, "title"));
            Assert.AreEqual("required", new XmlConstructorBase("required", "title").Value);
        }

        [Test]
        public void RelaxedReadOnlyOverridesShareValueAcrossThreeLevels()
        {
            var model = new ConstructorReadOnlyLeaf { Value = "assigned" };
            Assert.AreEqual("assigned", model.Value);
            Assert.AreEqual("assigned", ((ConstructorReadOnlyOverride)model).Value);
            Assert.AreEqual("assigned", ((ConstructorReadOnlyBase)model).Value);
            var roundTrip = ModelReaderWriter.Read<ConstructorReadOnlyLeaf>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("assigned", roundTrip.Value);
            Assert.AreEqual("assigned", ((ConstructorReadOnlyOverride)roundTrip).Value);
            Assert.AreEqual("assigned", ((ConstructorReadOnlyBase)roundTrip).Value);
        }

        [Test]
        public void NonJsonModelFactoryAllowsRelaxedBaseValue()
        {
            var model = SampleTypeSpecModelFactory.XmlConstructorOverride(title: "title");
            Assert.IsNull(model.Value);
            Assert.AreEqual("title", model.Title);
            Assert.IsNull(model.Note);
            var fromXml = ModelReaderWriter.Read<XmlConstructorOverride>(
                BinaryData.FromString("<XmlConstructorOverride><title>title</title></XmlConstructorOverride>"),
                new ModelReaderWriterOptions("X"))!;
            Assert.IsNull(fromXml.Value);
            Assert.AreEqual("title", fromXml.Title);
            model.Value = "assigned";
            Assert.AreEqual("assigned", ((XmlConstructorBase)model).Value);
            Assert.Throws<ArgumentNullException>(() => new XmlConstructorBase(null!, "title"));
        }

        [Test]
        public void InheritedRelaxedOverrideDoesNotRestoreRequiredAncestorParameter()
        {
            var model = new ConstructorInheritedLeaf(["item"]) { Value = "assigned" };
            Assert.AreEqual("assigned", ((ConstructorBase)model).Value);
            Assert.AreEqual("fixed", model.Mode);
            CollectionAssert.AreEqual(new[] { "item" }, model.Items);
            var roundTrip = ModelReaderWriter.Read<ConstructorInheritedLeaf>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("assigned", roundTrip.Value);
            CollectionAssert.AreEqual(new[] { "item" }, roundTrip.Items);
            Assert.Throws<ArgumentNullException>(() => new ConstructorInheritedLeaf(null!));
        }

        [Test]
        public void RenamedRelaxedOverrideSharesBaseValueAndRetainsOtherRequirements()
        {
            var model = new RenamedConstructorOverride("title") { RenamedValue = "assigned" };
            Assert.AreEqual("assigned", ((RenamedConstructorBase)model).Value);
            Assert.AreEqual("title", model.Title);
            var roundTrip = ModelReaderWriter.Read<RenamedConstructorOverride>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("assigned", roundTrip.RenamedValue);
            Assert.AreEqual("assigned", ((RenamedConstructorBase)roundTrip).Value);
            var leaf = new RenamedConstructorLeaf("title") { RenamedValue = "leaf" };
            Assert.AreEqual("leaf", ((RenamedConstructorBase)leaf).Value);
            Assert.Throws<ArgumentNullException>(() => new RenamedConstructorOverride(null!));
            Assert.Throws<ArgumentNullException>(() => new RenamedConstructorBase(null!, "title"));
        }

        [Test]
        public void ReadOnlyIntermediateDoesNotExposeForwardedSetter()
        {
            var model = new ConstructorWritableLeaf { Value = "assigned" };
            Assert.IsNull(typeof(ConstructorReadOnlyMiddle).GetProperty(nameof(ConstructorReadOnlyMiddle.Value))!.GetSetMethod());
            Assert.IsTrue(typeof(ConstructorReadOnlyMiddle).GetProperty(nameof(ConstructorReadOnlyMiddle.Value))!.GetSetMethod(true)!.IsFamilyAndAssembly);
            Assert.AreEqual("assigned", ((ConstructorReadOnlyMiddle)model).Value);
            Assert.AreEqual("assigned", ((ConstructorWritableBase)model).Value);
            var roundTrip = ModelReaderWriter.Read<ConstructorWritableLeaf>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("assigned", ((ConstructorWritableBase)roundTrip).Value);
        }

        [Test]
        public void RenamedOverrideCanReuseGrandparentName()
        {
            var model = new RenamedConstructorReturnedName("title") { Value = "assigned" };
            Assert.AreEqual("assigned", ((RenamedConstructorOverride)model).RenamedValue);
            Assert.AreEqual("assigned", ((RenamedConstructorBase)model).Value);
            var roundTrip = ModelReaderWriter.Read<RenamedConstructorReturnedName>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("assigned", roundTrip.Value);
        }

        [Test]
        public void RequiredRenamedOverrideInitializesRelaxedBaseStorage()
        {
            var model = new RequiredRenamedConstructorOverride("title", "supplied");
            Assert.AreEqual("supplied", model.RequiredValue);
            Assert.AreEqual("supplied", ((RenamedConstructorOverride)model).RenamedValue);
            Assert.AreEqual("supplied", ((RenamedConstructorBase)model).Value);
            var roundTrip = ModelReaderWriter.Read<RequiredRenamedConstructorOverride>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("supplied", roundTrip.RequiredValue);
            Assert.Throws<ArgumentNullException>(() => new RequiredRenamedConstructorOverride("title", null!));
        }

        [Test]
        public void RenamedCollectionsShareReadOnlyBaseStorage()
        {
            var model = new ConstructorReadOnlyCollectionOverride();
            Assert.IsTrue((bool)model.RenamedItems.GetType().GetProperty("IsUndefined")!.GetValue(model.RenamedItems)!);
            model.RenamedItems.Add("item");
            model.RenamedValues.Add("key", "value");
            CollectionAssert.AreEqual(new[] { "item" }, ((ConstructorReadOnlyCollectionBase)model).Items);
            Assert.AreEqual("value", ((ConstructorReadOnlyCollectionBase)model).Values["key"]);
            var roundTrip = ModelReaderWriter.Read<ConstructorReadOnlyCollectionOverride>(ModelReaderWriter.Write(model))!;
            CollectionAssert.AreEqual(new[] { "item" }, roundTrip.RenamedItems);
            CollectionAssert.AreEqual(new[] { "item" }, ((ConstructorReadOnlyCollectionBase)roundTrip).Items);
            Assert.AreEqual("value", roundTrip.RenamedValues["key"]);
            Assert.IsNull(typeof(ConstructorReadOnlyCollectionBase).GetProperty(nameof(ConstructorReadOnlyCollectionBase.Items))!.GetSetMethod(true));
        }

        [Test]
        public void RequiredRenamedCollectionsInitializeSharedStorageOnce()
        {
            var enumerations = 0;
            var items = Enumerable.Range(0, 1).Select(_ =>
            {
                enumerations++;
                return "item";
            });
            var model = new ConstructorRequiredCollectionOverride(items, new System.Collections.Generic.Dictionary<string, string> { ["key"] = "value" });
            Assert.AreEqual(1, enumerations);
            CollectionAssert.AreEqual(new[] { "item" }, model.RequiredItems);
            CollectionAssert.AreEqual(new[] { "item" }, ((ConstructorReadOnlyCollectionBase)model).Items);
            Assert.AreEqual("value", ((ConstructorReadOnlyCollectionBase)model).Values["key"]);
            model.RequiredItems.Add("another");
            Assert.AreEqual(2, ((ConstructorReadOnlyCollectionOverride)model).RenamedItems.Count);
            var roundTrip = ModelReaderWriter.Read<ConstructorRequiredCollectionOverride>(ModelReaderWriter.Write(model))!;
            CollectionAssert.AreEqual(new[] { "item", "another" }, roundTrip.RequiredItems);
        }

        [Test]
        public void RenamedNarrowedLiteralRetainsFixedValue()
        {
            var model = new RenamedLiteralConstructorOverride();
            Assert.AreEqual("fixed", model.RenamedValue);
            Assert.AreEqual("fixed", ((LiteralConstructorBase)model).Value);
            using var json = JsonDocument.Parse(ModelReaderWriter.Write(model));
            Assert.AreEqual("fixed", json.RootElement.GetProperty("value").GetString());
            var roundTrip = ModelReaderWriter.Read<RenamedLiteralConstructorOverride>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("fixed", roundTrip.RenamedValue);
            Assert.AreEqual("fixed", ((LiteralConstructorBase)roundTrip).Value);
            Assert.Throws<ArgumentNullException>(() => new LiteralConstructorBase(null!));
        }

        [Test]
        public void CollidingClientNamesPreserveBothDeclaredProperties()
        {
            var model = new ConstructorClientNameCollision("original", "other");
            Assert.AreEqual("original", model.Value);
            Assert.AreEqual("other", model.ValueProperty);
            model.Value = "changed-original";
            model.ValueProperty = "changed-other";
            Assert.AreEqual("changed-original", ((ConstructorClientNameCollisionBase)model).Value);
            using var json = JsonDocument.Parse(ModelReaderWriter.Write(model));
            Assert.AreEqual("changed-original", json.RootElement.GetProperty("original").GetString());
            Assert.AreEqual("changed-other", json.RootElement.GetProperty("other").GetString());
            Assert.AreEqual(2, json.RootElement.EnumerateObject().Count());
            var roundTrip = ModelReaderWriter.Read<ConstructorClientNameCollision>(ModelReaderWriter.Write(model))!;
            Assert.AreEqual("changed-original", roundTrip.Value);
            Assert.AreEqual("changed-other", roundTrip.ValueProperty);
            var leaf = new ConstructorClientNameCollisionLeaf("leaf-original", "leaf-other");
            var roundTripLeaf = ModelReaderWriter.Read<ConstructorClientNameCollisionLeaf>(ModelReaderWriter.Write(leaf))!;
            Assert.AreEqual("leaf-original", roundTripLeaf.Value);
            Assert.AreEqual("leaf-other", roundTripLeaf.ValueProperty);
            Assert.Throws<ArgumentNullException>(() => new ConstructorClientNameCollision(null!, "other"));
            Assert.Throws<ArgumentNullException>(() => new ConstructorClientNameCollision("original", null!));
        }

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
