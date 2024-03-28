// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.Json.Serialization;
using Azure.Core.Expressions.DataFactory;
using Inheritance.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class InheritanceTests
    {
        private const int NumberOfPublicPropertiesOnBase = 14;

        [Test]
        public void SingularInheritanceUsesBaseClass()
        {
            Assert.AreEqual(typeof(BaseClass), typeof(ClassThatInheritsFromBaseClass).BaseType);
        }

        [Test]
        public void SingularInheritanceUsesBaseClassForClassesWithDiscriminator()
        {
            Assert.AreEqual(typeof(BaseClass), typeof(BaseClassWithDiscriminator).BaseType);
        }

        [Test]
        public void MultipleInheritanceResolvedToFirstClassWhenNoDiscriminatorOthersInlined()
        {
            var type = typeof(ClassThatInheritsFromBaseClassAndSomeProperties);
            Assert.AreEqual(typeof(BaseClass), type.BaseType);
            // public
            Assert.AreEqual(NumberOfPublicPropertiesOnBase, type.GetProperties().Length);

            var inheritedProperty = TypeAsserts.HasProperty(type, "BaseClassProperty", BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(typeof(BaseClass), inheritedProperty.DeclaringType);

            var inlinedProperty = TypeAsserts.HasProperty(type, "SomeProperty", BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(type, inlinedProperty.DeclaringType);

            inlinedProperty = TypeAsserts.HasProperty(type, "SomeOtherProperty", BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(type, inlinedProperty.DeclaringType);
        }

        [Test]
        public void MultipleInheritanceBaseTypeOverride()
        {
            var type = typeof(ClassThatInheritsFromBaseClassAndSomePropertiesWithBaseClassOverride);
            Assert.AreEqual(typeof(SomeProperties), type.BaseType);
            // public
            Assert.AreEqual(NumberOfPublicPropertiesOnBase, type.GetProperties().Length);

            var inlinedProperty = TypeAsserts.HasProperty(type, "BaseClassProperty", BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(type, inlinedProperty.DeclaringType);

            var inheritedProperty = TypeAsserts.HasProperty(type, "SomeProperty", BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(typeof(SomeProperties), inheritedProperty.DeclaringType);

            inheritedProperty = TypeAsserts.HasProperty(type, "SomeOtherProperty", BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(typeof(SomeProperties), inheritedProperty.DeclaringType);
        }

        [Test]
        public void MultipleInheritanceResolvedToBaseWithDiscriminatorOthersInlined()
        {
            var type = typeof(ClassThatInheritsFromBaseClassWithDiscriminatorAndSomeProperties);
            Assert.AreEqual(typeof(BaseClassWithDiscriminator), type.BaseType);
            // public
            Assert.AreEqual(NumberOfPublicPropertiesOnBase, type.GetProperties().Length);
            TypeAsserts.HasProperty(type, "DiscriminatorProperty", BindingFlags.Instance | BindingFlags.NonPublic);
            TypeAsserts.HasProperty(type, "BaseClassProperty", BindingFlags.Instance | BindingFlags.Public);
            TypeAsserts.HasProperty(type, "SomeProperty", BindingFlags.Instance | BindingFlags.Public);
            TypeAsserts.HasProperty(type, "SomeOtherProperty", BindingFlags.Instance | BindingFlags.Public);
        }

        [Test]
        public void DiscriminatorBaseTypeIsAbstract()
        {
            Assert.IsTrue(typeof(BaseClassWithDiscriminator).IsAbstract);
        }

        [Test]
        public void DiscriminatorValueIsSetOnSubClassConstruction()
        {
            var baseClassWithDiscriminator = new ClassThatInheritsFromBaseClassWithDiscriminatorAndSomeProperties();
            Assert.AreEqual("ClassThatInheritsFromBaseClassWithDiscriminatorAndSomeProperties", baseClassWithDiscriminator.DiscriminatorProperty);
        }

        [Test]
        public void DiscriminatorValueIsSetOnSubClassSerializationConstruction()
        {
            var baseClassWithDiscriminator = new ClassThatInheritsFromBaseClassWithDiscriminatorAndSomeProperties();
            Assert.AreEqual("ClassThatInheritsFromBaseClassWithDiscriminatorAndSomeProperties", baseClassWithDiscriminator.DiscriminatorProperty);
        }

        [Test]
        public void RedefinedPropertyIgnored()
        {
            Assert.AreEqual(NumberOfPublicPropertiesOnBase - 2, typeof(ClassThatInheritsFromBaseClassAndRedefinesAProperty).GetProperties().Length);
        }

        [Test]
        public void RedefinedPropertyFromComposedBaseClassIgnored()
        {
            // We expect BaseClassProperty on ClassThatInheritsFromSomePropertiesAndBaseClassAndRedefinesAProperty to be ignored
            Assert.AreEqual(NumberOfPublicPropertiesOnBase, typeof(ClassThatInheritsFromSomePropertiesAndBaseClassAndRedefinesAProperty).GetProperties().Length);
        }

        [Test]
        public void CanCreateInstanceOfDerivedClassWithEnumDiscriminator()
        {
            var derived = new DerivedClassWithEnumDiscriminator();
            Assert.AreEqual(BaseClassWithEnumDiscriminatorEnum.Derived, derived.DiscriminatorProperty);
        }

        [Test]
        public void CanCreateInstanceOfDerivedClassWithExtensibleEnumDiscriminator()
        {
            var derived = new DerivedClassWithExtensibleEnumDiscriminator();
            Assert.AreEqual(BaseClassWithEntensibleEnumDiscriminatorEnum.Derived, derived.DiscriminatorProperty);

            var anotherDerived = new AnotherDerivedClassWithExtensibleEnumDiscriminator();
            Assert.AreEqual(new BaseClassWithEntensibleEnumDiscriminatorEnum("random value"), anotherDerived.DiscriminatorProperty);
        }

        [Test]
        public void DataFactoryElementProperties()
        {
            Assert.AreEqual(typeof(DataFactoryElement<string>), typeof(BaseClass).GetProperty("DfeString").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<double>), typeof(BaseClass).GetProperty("DfeDouble").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<bool>), typeof(BaseClass).GetProperty("DfeBool").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<int>), typeof(BaseClass).GetProperty("DfeInt").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<BinaryData>), typeof(BaseClass).GetProperty("DfeObject").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<IList<SeparateClass>>), typeof(BaseClass).GetProperty("DfeListOfT").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<IList<string>>), typeof(BaseClass).GetProperty("DfeListOfString").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<IDictionary<string, string>>), typeof(BaseClass).GetProperty("DfeKeyValuePairs").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<DateTimeOffset>), typeof(BaseClass).GetProperty("DfeDateTime").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<TimeSpan>), typeof(BaseClass).GetProperty("DfeDuration").PropertyType);
            Assert.AreEqual(typeof(DataFactoryElement<Uri>), typeof(BaseClass).GetProperty("DfeUri").PropertyType);
            Assert.IsTrue(typeof(SeparateClass).GetCustomAttributes().Any(a => a.GetType() == typeof(JsonConverterAttribute)));
        }
    }
}
