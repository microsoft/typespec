// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// cspell:ignore DBOS IPDBOSIP

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class PropertyProviderTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestSnakeCaseProperty()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("snake_case", InputPrimitiveType.String, wireName: "snake_case", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("SnakeCase", property.Name);
            Assert.AreEqual("snake_case", property.WireInfo?.SerializedName);
            Assert.IsNotNull(property.Description);
            Assert.AreEqual("Description for snake_case", property.Description!.ToString());
        }

        [Test]
        public void TestPascalCaseProperty()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("PascalCase", InputPrimitiveType.String, wireName: "PascalCase", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("PascalCase", property.Name);
            Assert.AreEqual("PascalCase", property.WireInfo?.SerializedName);
            Assert.IsNotNull(property.Description);
            Assert.AreEqual("Description for PascalCase", property.Description!.ToString());
        }

        [Test]
        public void TestCamelCaseProperty()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("camelCase", InputPrimitiveType.String, wireName: "camelCase", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);
            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("CamelCase", property.Name);
            Assert.AreEqual("camelCase", property.WireInfo?.SerializedName);
            Assert.IsNotNull(property.Description);
            Assert.AreEqual("Description for camelCase", property.Description!.ToString());
        }

        [Test]
        public void TestKebabCaseProperty()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("kebab-case", InputPrimitiveType.String, wireName: "kebab-case", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("KebabCase", property.Name);
            Assert.AreEqual("kebab-case", property.WireInfo?.SerializedName);
            Assert.IsNotNull(property.Description);
            Assert.AreEqual("Description for kebab-case", property.Description!.ToString());
        }

        [Test]
        public void TestExactNamePropertySkipsCasingTransformation()
        {
            // When isExactName is true, the property name should be used as-is without casing transformations.
            InputModelProperty inputModelProperty = InputFactory.Property("snake_case", InputPrimitiveType.String, wireName: "snake_case", isRequired: true, isExactName: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("snake_case", property.Name);
            Assert.AreEqual("snake_case", property.WireInfo?.SerializedName);
        }

        [Test]
        public void TestExactNameModelSkipsCasingTransformation()
        {
            // When isExactName is true on a model, the model name should be used as-is.
            var inputModel = InputFactory.Model("my_model", isExactName: true);

            var modelProvider = new ModelProvider(inputModel);

            Assert.AreEqual("my_model", modelProvider.Name);
        }

        [TestCase("IpAddress", false, "IPAddress")]
        [TestCase("CosmosDbAccount", false, "CosmosDBAccount")]
        [TestCase("OsProfile", false, "OSProfile")]
        [TestCase("IpDbOsIpAddressDb", false, "IPDBOSIPAddressDB")]
        [TestCase("IPAddressCosmosDBOSProfile", false, "IPAddressCosmosDBOSProfile")]
        [TestCase("Ipv4AddressIpv6", false, "IPv4AddressIPv6")]
        [TestCase("IpV4AddressIpV6", false, "IPv4AddressIPv6")]
        [TestCase("IPV4AddressIPV6", false, "IPV4AddressIPV6")]
        [TestCase("OsloIpsumOsmosisDbz", false, "OsloIpsumOsmosisDbz")]
        [TestCase("IpAddress", true, "IpAddress")]
        public void TestPropertyNameNormalizesAcronymCasing(string inputName, bool isExactName, string expectedName)
        {
            var inputProperty = InputFactory.Property(
                inputName,
                InputPrimitiveType.String,
                isRequired: true,
                isExactName: isExactName);
            InputFactory.Model("TestModel", properties: [inputProperty]);

            var property = new PropertyProvider(inputProperty, new TestTypeProvider());

            Assert.AreEqual(expectedName, property.Name);
        }

        [TestCaseSource(nameof(DateTimePropertyNameTestCases))]
        public void TestPropertyNameNormalizesDateTimeSuffix(
            string inputName,
            InputType inputType,
            bool isExactName,
            string expectedName)
        {
            var inputProperty = InputFactory.Property(
                inputName,
                inputType,
                isRequired: true,
                isExactName: isExactName);
            InputFactory.Model("TestModel", properties: [inputProperty]);

            var property = new PropertyProvider(inputProperty, new TestTypeProvider());

            Assert.AreEqual(expectedName, property.Name);
            Assert.AreEqual(inputName.ToVariableName(), property.WireInfo?.SerializedName);
        }

        [TestCase("Ipv4", false, "ipv4")]
        [TestCase("Ipv6", false, "ipv6")]
        [TestCase("IpAddress", false, "ipAddress")]
        [TestCase("DbAccount", false, "dbAccount")]
        [TestCase("OsProfile", false, "osProfile")]
        [TestCase("RegularName", false, "regularName")]
        [TestCase("MiniPv4", false, "miniPv4")]
        [TestCase("Ipv4", true, "ipv4")]
        public void TestPropertyParameterDeclarationNormalizesAcronymCasing(string inputName, bool isExactName, string expectedName)
        {
            var inputProperty = InputFactory.Property(
                inputName,
                InputPrimitiveType.String,
                isRequired: true,
                isExactName: isExactName);
            InputFactory.Model("TestModel", properties: [inputProperty]);

            var property = new PropertyProvider(inputProperty, new TestTypeProvider());

            Assert.AreEqual(expectedName, property.AsParameter.AsVariable().Declaration.RequestedName);
            Assert.AreEqual(expectedName, property.AsVariableExpression.Declaration.RequestedName);
        }

        [Test]
        public async Task TestPropertyNamePreservesLastContractDateTimeSuffix()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var inputModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property(
                        "StartTime",
                        new InputDateTimeType(
                    DateTimeKnownEncoding.Rfc3339,
                    "utcDateTime",
                    "TypeSpec.utcDateTime",
                    InputPrimitiveType.String),
                        isRequired: true)
                ]);

            var modelProvider = new ModelProvider(inputModel);
            var actual = new TypeProviderWriter(modelProvider).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile("Expected"), actual);
        }

        [Test]
        public async Task TestPropertyNamePreservesPreviouslyGeneratedDateTimeSuffixFromLastContract()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var inputModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property(
                        "StartTime",
                        new InputDateTimeType(
                            DateTimeKnownEncoding.Rfc3339,
                            "utcDateTime",
                            "TypeSpec.utcDateTime",
                            InputPrimitiveType.String),
                        isRequired: true)
                ]);

            var modelProvider = new ModelProvider(inputModel);

            Assert.AreEqual("StartOn", modelProvider.Properties.Single().Name);
            Assert.AreEqual(Helpers.GetExpectedFromFile("Expected"), new TypeProviderWriter(modelProvider).Write().Content);
        }

        [Test]
        public async Task TestPropertyNamePreservesHistoricalDateTimeNamesFromLastContract()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var dateTime = new InputDateTimeType(
                DateTimeKnownEncoding.Rfc3339,
                "utcDateTime",
                "TypeSpec.utcDateTime",
                InputPrimitiveType.String);
            var historicalModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property("EndTime", dateTime, isRequired: true),
                    InputFactory.Property("ExpirationTime", dateTime, isRequired: true),
                    InputFactory.Property("AccessTierChangeTime", dateTime, isRequired: true),
                    InputFactory.Property("LastSyncTimestamp", dateTime, isRequired: true)
                ]);
            var canonicalModel = InputFactory.Model(
                "CanonicalModel",
                @namespace: "Test",
                properties: [InputFactory.Property("StartTime", dateTime, isRequired: true)]);
            var internalLegacyModel = InputFactory.Model(
                "InternalLegacyModel",
                @namespace: "Test",
                properties: [InputFactory.Property("StartTime", dateTime, isRequired: true)]);

            var historicalProvider = new ModelProvider(historicalModel);

            Assert.That(
                historicalProvider.Properties.Select(p => p.Name),
                Is.EqualTo(new[] { "EndOn", "ExpireOn", "AccessTierChangeOn", "LastSyncTimestamp" }));
            Assert.AreEqual(
                Helpers.GetExpectedFromFile("Expected"),
                new TypeProviderWriter(historicalProvider).Write().Content);

            // A property absent from the GA contract, and one whose only legacy-looking match is non-public,
            // both take the new canonical name.
            Assert.That(new ModelProvider(canonicalModel).Properties.Single().Name, Is.EqualTo("StartsOn"));
            Assert.That(new ModelProvider(internalLegacyModel).Properties.Single().Name, Is.EqualTo("StartsOn"));
        }

        [Test]
        public async Task TestPropertyNamePreservesDateTimeNameFromProjectedProviderLastContract()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var dateTime = new InputDateTimeType(
                DateTimeKnownEncoding.Rfc3339,
                "utcDateTime",
                "TypeSpec.utcDateTime",
                InputPrimitiveType.String);
            var timestampProperty = InputFactory.Property("lastKeyRotationTimestamp", dateTime, isRequired: true);
            var renamedProperty = InputFactory.Property("startTime", dateTime, isRequired: true);
            InputFactory.Model(
                "DiskEncryptionSetProperties",
                @namespace: "Test",
                properties: [timestampProperty, renamedProperty]);

            // The wire model that declares the properties is not part of the shipped surface. The properties are
            // projected onto the resource data provider, so the last contract must be consulted through the
            // provider that actually declares the public members.
            var projectedProvider = new TestTypeProvider(name: "DiskEncryptionSetData", ns: "Test");
            var wireProvider = new TestTypeProvider(name: "DiskEncryptionSetProperties", ns: "Test");

            projectedProvider.Update(properties:
            [
                new PropertyProvider(timestampProperty, projectedProvider),
                new PropertyProvider(renamedProperty, projectedProvider)
            ]);

            Assert.That(
                projectedProvider.Properties.Select(p => p.Name),
                Is.EqualTo(new[] { "LastKeyRotationTimestamp", "StartOn" }));
            Assert.AreEqual(
                Helpers.GetExpectedFromFile("Expected"),
                new TypeProviderWriter(projectedProvider).Write().Content);

            // The same spec properties on the wire provider, which has no shipped contract of its own, take the
            // new canonical names.
            Assert.That(
                new[] { timestampProperty, renamedProperty }.Select(p => new PropertyProvider(p, wireProvider).Name),
                Is.EqualTo(new[] { "LastKeyRotationOn", "StartsOn" }));
        }

        [Test]
        public async Task TestPropertyNameDoesNotReuseHistoricalNameClaimedByAnotherProperty()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var dateTime = new InputDateTimeType(
                DateTimeKnownEncoding.Rfc3339,
                "utcDateTime",
                "TypeSpec.utcDateTime",
                InputPrimitiveType.String);

            // The GA contract shipped a string "StartOn". The current spec keeps "startOn" and adds a new
            // date-time "startTime", whose canonical name normalizes onto the same historical "StartOn".
            // The historical name is already spoken for, so only the retained property may claim it.
            var inputModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property("startOn", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property("startTime", dateTime, isRequired: true)
                ]);

            var modelProvider = new ModelProvider(inputModel);

            Assert.That(modelProvider.Properties.Select(p => p.Name), Is.EqualTo(new[] { "StartOn", "StartsOn" }));
            Assert.AreEqual(
                Helpers.GetExpectedFromFile("Expected"),
                new TypeProviderWriter(modelProvider).Write().Content);
        }

        [Test]
        public async Task TestPropertyNameDoesNotReuseUnrelatedHistoricalDateTimeName()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // StartDate is a removed GA property, not the previous generated name of the new StartTime property.
            // Although both normalize to StartsOn, the new property must not take the unrelated GA name.
            var inputModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property(
                        "startTime",
                        new InputDateTimeType(
                            DateTimeKnownEncoding.Rfc3339,
                            "utcDateTime",
                            "TypeSpec.utcDateTime",
                            InputPrimitiveType.String),
                        isRequired: true)
                ]);

            Assert.AreEqual("StartsOn", new ModelProvider(inputModel).Properties.Single().Name);
        }

        [Test]
        public async Task TestPropertyNamePrefersExactCanonicalNameFromLastContract()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The contract shipped both the historical "StartOn" and the canonical "StartsOn". The exact
            // canonical match wins, so the result does not depend on their declaration order.
            var inputModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property(
                        "startTime",
                        new InputDateTimeType(
                            DateTimeKnownEncoding.Rfc3339,
                            "utcDateTime",
                            "TypeSpec.utcDateTime",
                            InputPrimitiveType.String),
                        isRequired: true)
                ]);

            Assert.AreEqual("StartsOn", new ModelProvider(inputModel).Properties.Single().Name);
        }

        [Test]
        public async Task TestPropertyNameDoesNotReuseCanonicalNameClaimedBySibling()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var dateTime = new InputDateTimeType(
                DateTimeKnownEncoding.Rfc3339,
                "utcDateTime",
                "TypeSpec.utcDateTime",
                InputPrimitiveType.String);
            var inputModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property("startTime", dateTime, isRequired: true),
                    InputFactory.Property("startsOn", dateTime, isRequired: true)
                ]);

            // The sibling owns the exact canonical StartsOn name, so startTime preserves the still-available
            // historical StartOn name rather than producing a duplicate StartsOn declaration.
            Assert.That(
                new ModelProvider(inputModel).Properties.Select(p => p.Name),
                Is.EqualTo(new[] { "StartOn", "StartsOn" }));
        }

        [Test]
        public async Task TestPropertyNameIgnoresIncompatiblyTypedHistoricalName()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The contract's "StartOn" is a string, so it is a different property that merely normalizes onto
            // the same canonical name. Claiming it would also let ModelProvider restore the shipped string type
            // onto this date-time property.
            var inputModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property(
                        "startTime",
                        new InputDateTimeType(
                            DateTimeKnownEncoding.Rfc3339,
                            "utcDateTime",
                            "TypeSpec.utcDateTime",
                            InputPrimitiveType.String),
                        isRequired: true)
                ]);

            var property = new ModelProvider(inputModel).Properties.Single();

            Assert.AreEqual("StartsOn", property.Name);
            Assert.AreEqual(new CSharpType(typeof(DateTimeOffset)), property.Type);
        }

        [Test]
        public async Task TestPropertyNameDoesNotReuseHistoricalNameClaimedByNormalizedSibling()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The retained "ipStartOn" only claims the shipped "IPStartOn" after acronym normalization, so the
            // claim has to be detected on the generated name rather than the raw identifier.
            var inputModel = InputFactory.Model(
                "TestModel",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property("ipStartOn", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property(
                        "ipStartTime",
                        new InputDateTimeType(
                            DateTimeKnownEncoding.Rfc3339,
                            "utcDateTime",
                            "TypeSpec.utcDateTime",
                            InputPrimitiveType.String),
                        isRequired: true)
                ]);

            Assert.That(
                new ModelProvider(inputModel).Properties.Select(p => p.Name),
                Is.EqualTo(new[] { "IPStartOn", "IPStartsOn" }));
        }

        [Test]
        public async Task TestPropertyNamePreservesCollisionSuffixedHistoricalName()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The model is named "StartOn", so the shipped member carries the enclosing-type collision suffix
            // and is named "StartOnProperty". That suffix has to be stripped before the historical name is
            // matched against the canonical one.
            var inputModel = InputFactory.Model(
                "StartOn",
                @namespace: "Test",
                properties:
                [
                    InputFactory.Property(
                        "startTime",
                        new InputDateTimeType(
                            DateTimeKnownEncoding.Rfc3339,
                            "utcDateTime",
                            "TypeSpec.utcDateTime",
                            InputPrimitiveType.String),
                        isRequired: true)
                ]);

            Assert.AreEqual("StartOnProperty", new ModelProvider(inputModel).Properties.Single().Name);
        }

        [TestCaseSource(nameof(CollectionPropertyTestCases))]
        public void CollectionProperty(CSharpType coreType, InputModelProperty collectionProperty, CSharpType expectedType)
        {
            InputFactory.Model("TestModel", properties: [collectionProperty]);
            var property = new PropertyProvider(collectionProperty, new TestTypeProvider());

            Assert.AreEqual(collectionProperty.Name.ToIdentifierName(), property.Name);
            Assert.AreEqual(expectedType, property.Type);

            // validate the parameter conversion
            var propertyAsParam = property.AsParameter;
            Assert.IsNotNull(propertyAsParam);
            Assert.AreEqual(collectionProperty.Name.ToVariableName(), propertyAsParam.Name);
            Assert.AreEqual(expectedType, propertyAsParam.Type);
        }

        [TestCaseSource(nameof(BodyHasSetterTestCases))]
        public void BodyHasSetterValidation(string name, InputModelType inputModel, bool expectedHasSetter, TypeSignatureModifiers? typeSignatureModifiers = null)
        {
            var collectionProperty = inputModel.Properties.Single();
            var property = new PropertyProvider(collectionProperty, new TestTypeProvider(declarationModifiers: typeSignatureModifiers));

            Assert.AreEqual(expectedHasSetter, property.Body.HasSetter);
        }

        [Test]
        public void AsParameterRespectsChangesToPropertyType()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("prop", InputPrimitiveType.String, wireName: "prop", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());
            property.Type = new CSharpType(typeof(int));
            var parameter = property.AsParameter;

            Assert.IsTrue(parameter.Type.Equals(typeof(int)));
        }

        [Test]
        public void TestSpecialWords()
        {
            var testTypeProvider = new TestTypeProvider();
            var inputPropertyName = testTypeProvider.Name;
            InputModelProperty inputModelProperty = InputFactory.Property(inputPropertyName, InputPrimitiveType.String);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, testTypeProvider);
            Assert.AreEqual(inputPropertyName.ToIdentifierName() + "Property", property.Name);
        }

        [Test]
        public void TestPropertyNameConflictsWithTypeNameAfterPascalCase()
        {
            var testTypeProvider = new TestTypeProvider(name: "Filter");
            InputModelProperty inputModelProperty = InputFactory.Property("filter", InputPrimitiveType.String);
            InputFactory.Model("Filter", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, testTypeProvider);
            Assert.AreEqual("FilterProperty", property.Name);
        }

        [Test]
        public void TestPropertyNameConflictsWithTypeNameAfterAcronymNormalization()
        {
            var testTypeProvider = new TestTypeProvider(name: "IPAddress");
            InputModelProperty inputModelProperty = InputFactory.Property("IpAddress", InputPrimitiveType.String);
            InputFactory.Model("IPAddress", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, testTypeProvider);

            Assert.AreEqual("IPAddressProperty", property.Name);
        }

        private static IEnumerable<TestCaseData> DateTimePropertyNameTestCases()
        {
            var dateTime = new InputDateTimeType(
                DateTimeKnownEncoding.Rfc3339,
                "utcDateTime",
                "TypeSpec.utcDateTime",
                InputPrimitiveType.String);

            yield return new TestCaseData("StartTime", dateTime, false, "StartsOn");
            yield return new TestCaseData("EndTime", dateTime, false, "EndsOn");
            yield return new TestCaseData("StartOn", dateTime, false, "StartsOn");
            yield return new TestCaseData("EndOn", dateTime, false, "EndsOn");
            yield return new TestCaseData("FirstTimestamp", dateTime, false, "FirstTimestamp");
            yield return new TestCaseData("LastTimestamp", dateTime, false, "LastTimestamp");
            yield return new TestCaseData("CreatedAt", dateTime, false, "CreatedOn");
            yield return new TestCaseData("DeletionTimestamp", dateTime, false, "DeletedOn");
            yield return new TestCaseData("ModificationTimeStamp", dateTime, false, "ModifiedOn");
            yield return new TestCaseData("Timestamp", dateTime, false, "Timestamp");
            yield return new TestCaseData("ExpirationDate", dateTime, false, "ExpiresOn");
            yield return new TestCaseData("CreationDate", dateTime, false, "CreatedOn");
            yield return new TestCaseData("CreationTime", dateTime, false, "CreatedOn");
            yield return new TestCaseData("ExpirationDateTime", dateTime.WithNullable(true), false, "ExpiresOn");
            yield return new TestCaseData("DeletionDateTime", dateTime, false, "DeletedOn");
            yield return new TestCaseData("modelExpirationDate", dateTime, false, "ModelExpiresOn");
            yield return new TestCaseData("AccountExpirationDate", dateTime, false, "AccountExpiresOn");
            yield return new TestCaseData("AccessTierChangeTime", dateTime, false, "AccessTierChangedOn");
            yield return new TestCaseData("RecordedAt", InputPrimitiveType.String, false, "RecordedAt");
            yield return new TestCaseData("Date", InputPrimitiveType.PlainDate, false, "Date");
            yield return new TestCaseData("SnapshotTimestamp", dateTime.WithNullable(true), false, "SnapshotOn");
            yield return new TestCaseData("StatusTimestamp", dateTime.WithNullable(true), false, "StatusTimestamp");
            yield return new TestCaseData("LastSyncTimestamp", dateTime, false, "LastSyncOn");
            yield return new TestCaseData("TotalTime", dateTime, false, "TotalTime");
            yield return new TestCaseData("TopicTimestamp", dateTime.WithNullable(true), false, "TopicTimestamp");
            yield return new TestCaseData("FromTime", dateTime, false, "FromTime");
            yield return new TestCaseData("ToDate", dateTime, false, "ToDate");
            yield return new TestCaseData("RecoveryPointInTime", dateTime, false, "RecoveryPointInTime");
            yield return new TestCaseData("StartTime", InputPrimitiveType.String, false, "StartTime");
            yield return new TestCaseData("CreationTimestamp", InputPrimitiveType.String, false, "CreationTimestamp");
            yield return new TestCaseData("CreationTimestamp", dateTime, true, "CreationTimestamp");
        }


        [Test]
        public void CanUpdatePropertyProvider()
        {
            var propertyProvider = new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                type: new CSharpType(typeof(string)),
                name: "name",
                body: new AutoPropertyBody(HasSetter: false),
                enclosingType: new TestTypeProvider());

            Assert.IsFalse(propertyProvider.Body.HasSetter);
            Assert.AreEqual("name", propertyProvider.Name);
            Assert.AreEqual("Gets the name.", propertyProvider.Description!.ToString());
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, propertyProvider.Modifiers);
            Assert.AreEqual(new CSharpType(typeof(string)), propertyProvider.Type);

            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Snippet.Literal("001"))
            };

            propertyProvider.Update(
                modifiers: propertyProvider.Modifiers & ~MethodSignatureModifiers.Virtual,
                type: new CSharpType(typeof(int)),
                name: "newName",
                body: new AutoPropertyBody(HasSetter: true),
                enclosingType: new TestTypeProvider(),
                attributes: attributes);

            Assert.IsTrue(propertyProvider.Body.HasSetter);
            Assert.AreEqual("newName", propertyProvider.Name);
            // Even though description was not provided, it should still be recalculated
            Assert.AreEqual("Gets or sets the newName.", propertyProvider.Description!.ToString());
            Assert.AreEqual(MethodSignatureModifiers.Public, propertyProvider.Modifiers);
            Assert.AreEqual(new CSharpType(typeof(int)), propertyProvider.Type);

            propertyProvider.Update(description: $"new description");
            Assert.AreEqual("new description", propertyProvider.Description.ToString());

            Assert.IsNotNull(propertyProvider.Attributes);
            Assert.AreEqual(attributes.Count, propertyProvider.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, propertyProvider.Attributes[i].Type);
                Assert.IsTrue(propertyProvider.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }
        }

        [Test]
        public void TestAttributes()
        {
            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Snippet.Literal("001"))
            };
            var property = new PropertyProvider(
               description: null,
               modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
               type: new CSharpType(typeof(string)),
               name: "Name",
               body: new AutoPropertyBody(HasSetter: false),
               enclosingType: new TestTypeProvider(),
               attributes: attributes);

            Assert.IsNotNull(property.Attributes);
            Assert.AreEqual(attributes.Count, property.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, property.Attributes[i].Type);
                Assert.IsTrue(property.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }

            // validate the attributes are written correctly
            using var writer = new CodeWriter();
            writer.WriteProperty(property);
            var expectedPropertyString = "[global::System.ObsoleteAttribute]\n" +
                "[global::System.ObsoleteAttribute(\"This is obsolete\")]\n" +
                "[global::System.Diagnostics.CodeAnalysis.ExperimentalAttribute(\"001\")]\n" +
                "public virtual string Name { get; }\n";
            Assert.AreEqual(expectedPropertyString, writer.ToString(false));
        }

        private static IEnumerable<TestCaseData> CollectionPropertyTestCases()
        {
            // List<string> -> IReadOnlyList<string>
            yield return new TestCaseData(
                new CSharpType(typeof(IList<>), typeof(string)),
                InputFactory.Property("readOnlyCollection", InputFactory.Array(InputPrimitiveType.String), isRequired: true, isReadOnly: true),
                new CSharpType(typeof(IReadOnlyList<>), typeof(string)));
            // List<string> -> IList<string>
            yield return new TestCaseData(
                new CSharpType(typeof(IList<>), typeof(string)),
                InputFactory.Property("Collection", InputFactory.Array(InputPrimitiveType.String), isRequired: true, isReadOnly: false),
                new CSharpType(typeof(IList<>), typeof(string)));
            // Dictionary<string, int> -> IReadOnlyDictionary<string, int>
            yield return new TestCaseData(
                new CSharpType(typeof(IDictionary<,>), typeof(string), typeof(int)),
                InputFactory.Property("readOnlyDictionary", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true, isReadOnly: true),
                new CSharpType(typeof(IReadOnlyDictionary<,>), typeof(string), typeof(int)));
            // string -> string
            yield return new TestCaseData(
                new CSharpType(typeof(string)),
                InputFactory.Property("stringProperty", InputPrimitiveType.String, isRequired: true, isReadOnly: true),
                new CSharpType(typeof(string)));
        }

        private static IEnumerable<TestCaseData> BodyHasSetterTestCases()
        {
            yield return new TestCaseData(
                "readOnlyString",
                InputFactory.Model("TestModel", properties: [InputFactory.Property("readOnlyString", InputPrimitiveType.String, isRequired: true, isReadOnly: true)]),
                false,
                null);
            yield return new TestCaseData(
                "readOnlyStringOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("readOnlyString", InputPrimitiveType.Int32, isRequired: true, isReadOnly: true)]),
                false,
                null);
            yield return new TestCaseData(
                "intOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("intProperty", InputPrimitiveType.Int32, isRequired: false)]),
                true,
                null);
            yield return new TestCaseData(
                "intOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("intProperty", InputPrimitiveType.Int32, isRequired: false)]),
                false,
                null);
            yield return new TestCaseData(
                "intOnNoUsageModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.None, properties: [InputFactory.Property("intProperty", InputPrimitiveType.Int32, isRequired: false)]),
                false,
                null);
            yield return new TestCaseData(
                "requiredIntOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("intProperty", InputPrimitiveType.Int32, isRequired: true)]),
                false,
                null);
            yield return new TestCaseData(
                "readOnlyCollectionOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("readOnlyCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: true)]),
                false,
                null);
            yield return new TestCaseData(
                "readOnlyCollectionOnInputOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output, properties: [InputFactory.Property("readOnlyCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: true)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableCollectionOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("nullableCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableCollectionOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("nullableCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableCollectionOnInputOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output, properties: [InputFactory.Property("nullableCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                true,
                null);
            yield return new TestCaseData(
                "readOnlyDictionaryOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("readOnlyDictionary", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true)]),
                false,
                null);
            yield return new TestCaseData(
                "readOnlyDictionaryOnInputOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output | InputModelTypeUsage.Input, properties: [InputFactory.Property("readOnlyDictionary", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableDictionaryOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("nullableDictionary", new InputNullableType(InputFactory.Dictionary(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableDictionaryOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("nullableDictionary", new InputNullableType(InputFactory.Dictionary(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableDictionaryOnInputOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output, properties: [InputFactory.Property("nullableDictionary", new InputNullableType(InputFactory.Dictionary(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                true,
                null);
            yield return new TestCaseData(
                "nonReadOnlyStringPropOnStruct",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("nonReadOnlyString", InputPrimitiveType.String)], modelAsStruct: true),
                true,
                TypeSignatureModifiers.Struct);
            yield return new TestCaseData(
                "requiredReadOnlyStringPropOnStruct",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("readOnlyString", InputPrimitiveType.String, isReadOnly: true, isRequired: true)], modelAsStruct: true),
                false,
                TypeSignatureModifiers.Struct);
            yield return new TestCaseData(
                "propInReadOnlyStruct",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("nonReadOnlyString", InputPrimitiveType.String)], modelAsStruct: true),
                false,
                TypeSignatureModifiers.Struct | TypeSignatureModifiers.ReadOnly);
        }
    }
}
