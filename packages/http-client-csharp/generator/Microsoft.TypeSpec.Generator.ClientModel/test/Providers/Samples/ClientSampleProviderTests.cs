// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Providers.Samples;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Samples
{
    public class ClientSampleProviderTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        // -------------------------------------------------------------------
        // Basic structure
        // -------------------------------------------------------------------

        [Test]
        public void Name_FollowsSamplesConvention()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");
            Assert.AreEqual("Samples_TestClient", provider.Name);
        }

        [Test]
        public void RelativeFilePath_IsInTestsGeneratedSamples()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");
            Assert.IsTrue(provider.RelativeFilePath.Contains("tests"));
            Assert.IsTrue(provider.RelativeFilePath.Contains("Samples"));
            Assert.IsTrue(provider.RelativeFilePath.EndsWith(".cs"));
        }

        [Test]
        public void DeclarationModifiers_ArePublicPartial()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");
            Assert.IsTrue(provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Partial));
        }

        // -------------------------------------------------------------------
        // Method generation
        // -------------------------------------------------------------------

        [Test]
        public void GeneratesSyncAndAsyncMethodPerSample()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");
            var methods = provider.Methods;

            // Each sample should produce sync + async = 2 methods
            Assert.IsTrue(methods.Count >= 2);

            // Should have at least one async and one sync method
            Assert.IsTrue(methods.Any(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async)));
            Assert.IsTrue(methods.Any(m =>
                !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async)));
        }

        [Test]
        public void AsyncMethods_ReturnTask()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");
            var asyncMethods = provider.Methods
                .Where(m => m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async))
                .ToList();

            foreach (var method in asyncMethods)
            {
                Assert.IsNotNull(method.Signature.ReturnType);
                Assert.AreEqual(typeof(Task), method.Signature.ReturnType!.FrameworkType);
            }
        }

        [Test]
        public void SyncMethods_ReturnVoid()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");
            var syncMethods = provider.Methods
                .Where(m => !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async))
                .ToList();

            foreach (var method in syncMethods)
            {
                Assert.IsNull(method.Signature.ReturnType);
            }
        }

        [Test]
        public void MethodNames_ContainOperationNameAndExampleKey()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");

            foreach (var method in provider.Methods)
            {
                Assert.IsTrue(method.Signature.Name.Contains("GetWidget"),
                    $"Method name '{method.Signature.Name}' should contain 'GetWidget'");
                Assert.IsTrue(method.Signature.Name.Contains("ShortVersion"),
                    $"Method name '{method.Signature.Name}' should contain 'ShortVersion'");
            }
        }

        [Test]
        public void AsyncMethodNames_EndWithAsync()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");
            var asyncMethods = provider.Methods
                .Where(m => m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async))
                .ToList();

            foreach (var method in asyncMethods)
            {
                Assert.IsTrue(method.Signature.Name.EndsWith("_Async"),
                    $"Async method name '{method.Signature.Name}' should end with '_Async'");
            }
        }

        // -------------------------------------------------------------------
        // Attributes
        // -------------------------------------------------------------------

        [Test]
        public void Methods_HaveTestAttribute()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");

            foreach (var method in provider.Methods)
            {
                Assert.IsTrue(
                    method.Signature.Attributes.Any(a => a.Type.Name == "TestAttribute"),
                    $"Method '{method.Signature.Name}' should have [Test] attribute");
            }
        }

        [Test]
        public void Methods_HaveIgnoreAttribute()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");

            foreach (var method in provider.Methods)
            {
                Assert.IsTrue(
                    method.Signature.Attributes.Any(a => a.Type.Name == "IgnoreAttribute"),
                    $"Method '{method.Signature.Name}' should have [Ignore] attribute");
            }
        }

        // -------------------------------------------------------------------
        // Method body
        // -------------------------------------------------------------------

        [Test]
        public void MethodBody_IsNotEmpty()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");

            foreach (var method in provider.Methods)
            {
                Assert.IsNotNull(method.BodyStatements,
                    $"Method '{method.Signature.Name}' should have a body");
            }
        }

        // -------------------------------------------------------------------
        // No examples → synthesizes default samples
        // -------------------------------------------------------------------

        [Test]
        public void NoExamples_SynthesizesDefault()
        {
            var operation = InputFactory.Operation("GetWidget");
            var serviceMethod = InputFactory.BasicServiceMethod("GetWidget", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var provider = new ClientSampleProvider(client);

            Assert.IsFalse(provider.IsEmpty);
            Assert.IsTrue(provider.Methods.Count >= 2, "Should have at least sync+async methods");
        }

        // -------------------------------------------------------------------
        // Multiple examples → multiply methods
        // -------------------------------------------------------------------

        [Test]
        public void MultipleExamples_GenerateMultipleMethods()
        {
            var shortVersion = new InputOperationExample("ShortVersion", null, [], "");
            var allParameters = new InputOperationExample("AllParameters", null, [], "");

            var operation = InputFactory.Operation("GetWidget");
            SetOperationExamples(operation, [shortVersion, allParameters]);
            var serviceMethod = InputFactory.BasicServiceMethod("GetWidget", operation);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var provider = new ClientSampleProvider(client);

            // Each sample (protocol/convenience) × 2 (sync/async) examples
            Assert.IsTrue(provider.Methods.Count >= 4,
                $"Expected at least 4 methods but got {provider.Methods.Count}");
        }

        // -------------------------------------------------------------------
        // Convenience methods suffixed
        // -------------------------------------------------------------------

        [Test]
        public void ConvenienceMethods_HaveConvenienceSuffix()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");
            var convenienceMethods = provider.Methods
                .Where(m => m.Signature.Name.Contains("_Convenience"))
                .ToList();

            // All convenience-named methods should follow the naming pattern
            foreach (var method in convenienceMethods)
            {
                Assert.IsTrue(method.Signature.Name.Contains("GetWidget"),
                    $"Convenience method '{method.Signature.Name}' should contain the operation name");
            }
        }

        // -------------------------------------------------------------------
        // No parameters on sample methods
        // -------------------------------------------------------------------

        [Test]
        public void SampleMethods_HaveNoParameters()
        {
            var (provider, _) = CreateProviderWithSingleExample("GetWidget");

            foreach (var method in provider.Methods)
            {
                Assert.AreEqual(0, method.Signature.Parameters.Count,
                    $"Method '{method.Signature.Name}' should have no parameters");
            }
        }

        // -------------------------------------------------------------------
        // Helpers
        // -------------------------------------------------------------------

        private static (ClientSampleProvider provider, ClientProvider client) CreateProviderWithSingleExample(
            string operationName)
        {
            var shortVersion = new InputOperationExample("ShortVersion", null, [], "");
            var operation = InputFactory.Operation(operationName);
            SetOperationExamples(operation, [shortVersion]);
            var serviceMethod = InputFactory.BasicServiceMethod(operationName, operation);
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);

            MockHelpers.LoadMockGenerator(clients: () => [inputClient]);

            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var provider = new ClientSampleProvider(client);
            return (provider, client);
        }

        private static void SetOperationExamples(InputOperation operation, IReadOnlyList<InputOperationExample> examples)
        {
            var setter = typeof(InputOperation)
                .GetProperty(nameof(InputOperation.Examples), BindingFlags.Instance | BindingFlags.Public)!
                .GetSetMethod(nonPublic: true)!;
            setter.Invoke(operation, [examples]);
        }
    }
}
