// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using required_optional;
using required_optional.Models;

namespace AutoRest.TestServer.Tests
{
    public class RequiredOptionalTest : TestServerTestBase
    {
        private void TestDefaultNullParameter(Type clientType, string methodName, string parameterName)
        {
            var parameters = clientType.GetMethod(methodName)?.GetParameters() ?? Array.Empty<ParameterInfo>();
            var parameter = parameters.FirstOrDefault(p => p.Name == parameterName);
            Assert.NotNull(parameter);
            Assert.IsTrue(parameter.HasDefaultValue);
            Assert.Null(parameter.DefaultValue);
        }

        private void TestNotDefaultParameter(Type clientType, string methodName, string parameterName)
        {
            var parameters = clientType.GetMethod(methodName)?.GetParameters() ?? Array.Empty<ParameterInfo>();
            var parameter = parameters.FirstOrDefault(p => p.Name == parameterName);
            Assert.NotNull(parameter);
            Assert.IsFalse(parameter.HasDefaultValue);
        }

        [Test]
        public Task OptionalArrayHeader() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalArrayHeaderAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalArrayHeaderAsync), "headerParameter");
        });

        [Test]
        public Task RequiredArrayHeader() => Test((host, pipeline) =>
        {
            var value = Enumerable.Empty<string>();
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredArrayHeaderAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredArrayHeaderAsync), "headerParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalArrayParameter() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalArrayParameterAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalArrayParameterAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredArrayParameter() => Test((host, pipeline) =>
        {
            var value = Enumerable.Empty<string>();
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredArrayParameterAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredArrayParameterAsync), "bodyParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalArrayProperty() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalArrayPropertyAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalArrayPropertyAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredArrayProperty() => Test((host, pipeline) =>
        {
            var value = new ArrayWrapper(Enumerable.Empty<string>());
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredArrayPropertyAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredArrayPropertyAsync), "bodyParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalClassParameter() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalClassParameterAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalClassParameterAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredClassParameter() => Test((host, pipeline) =>
        {
            var value = new Product(0)
            {
                Name = string.Empty
            };
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredClassParameterAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredClassParameterAsync), "bodyParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalClassProperty() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalClassPropertyAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalClassPropertyAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredClassProperty() => Test((host, pipeline) =>
        {
            var value = new ClassWrapper(new Product(0)
            {
                Name = string.Empty
            });
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredClassPropertyAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredClassPropertyAsync), "bodyParameter");
        }, ignoreScenario: true);

        private void TestImplicitClientConstructor()
        {
            var constructorParameters = typeof(ImplicitRestClient).GetConstructors().FirstOrDefault(c => c.GetParameters().Any())?.GetParameters() ?? Array.Empty<ParameterInfo>();
            var pathParameter = constructorParameters.FirstOrDefault(p => p.Name == "requiredGlobalPath");
            var queryParameter = constructorParameters.FirstOrDefault(p => p.Name == "requiredGlobalQuery");
            Assert.NotNull(pathParameter);
            Assert.NotNull(queryParameter);
            Assert.IsFalse(pathParameter.HasDefaultValue);
            Assert.IsFalse(queryParameter.HasDefaultValue);
        }

        [Test]
        public Task OptionalGlobalQuery() => Test(async (host, pipeline) =>
        {
            var result = await new ImplicitClient(ClientDiagnostics, pipeline, string.Empty, string.Empty, host).RestClient.GetOptionalGlobalQueryAsync();
            Assert.AreEqual(200, result.Status);
            TestImplicitClientConstructor();
        });

        [Test]
        public Task RequiredGlobalQuery() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ImplicitClient(ClientDiagnostics, pipeline, string.Empty, string.Empty, host).RestClient.GetRequiredGlobalQueryAsync());
            TestImplicitClientConstructor();
        }, ignoreScenario: true);

        [Test]
        public Task OptionalImplicitBody() => Test(async (host, pipeline) =>
        {
            var result = await new ImplicitClient(ClientDiagnostics, pipeline, string.Empty, string.Empty, host).RestClient.PutOptionalBodyAsync();
            Assert.AreEqual(200, result.Status);
            TestImplicitClientConstructor();
            TestDefaultNullParameter(typeof(ImplicitRestClient), nameof(ImplicitRestClient.PutOptionalBodyAsync), "bodyParameter");
        });

        [Test]
        public Task OptionalImplicitHeader() => Test(async (host, pipeline) =>
        {
            var result = await new ImplicitClient(ClientDiagnostics, pipeline, string.Empty, string.Empty, host).RestClient.PutOptionalHeaderAsync();
            Assert.AreEqual(200, result.Status);
            TestImplicitClientConstructor();
            TestDefaultNullParameter(typeof(ImplicitRestClient), nameof(ImplicitRestClient.PutOptionalHeaderAsync), "queryParameter");
        });

        [Test]
        public Task OptionalImplicitQuery() => Test(async (host, pipeline) =>
        {
            var result = await new ImplicitClient(ClientDiagnostics, pipeline, string.Empty, string.Empty, host).RestClient.PutOptionalQueryAsync();
            Assert.AreEqual(200, result.Status);
            TestImplicitClientConstructor();
            TestDefaultNullParameter(typeof(ImplicitRestClient), nameof(ImplicitRestClient.PutOptionalQueryAsync), "queryParameter");
        });

        [Test]
        public Task RequiredPath() => Test((host, pipeline) =>
        {
            var value = string.Empty;
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ImplicitClient(ClientDiagnostics, pipeline, string.Empty, string.Empty, host).RestClient.GetRequiredPathAsync(value));
            TestImplicitClientConstructor();
            TestNotDefaultParameter(typeof(ImplicitClient), nameof(ImplicitClient.GetRequiredPathAsync), "pathParameter");
        }, ignoreScenario: true);

        [Test]
        public Task RequiredGlobalPath() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ImplicitClient(ClientDiagnostics, pipeline, string.Empty, string.Empty, host).RestClient.GetRequiredGlobalPathAsync());
            TestImplicitClientConstructor();
        }, ignoreScenario: true);

        [Test]
        public Task OptionalIntegerHeader() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalIntegerHeaderAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalIntegerHeaderAsync), "headerParameter");
        });

        [Test]
        public Task RequiredIntegerHeader() => Test((host, pipeline) =>
        {
            var value = 0;
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredIntegerHeaderAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredIntegerHeaderAsync), "headerParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalIntegerParameter() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalIntegerParameterAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalIntegerParameterAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredIntegerParameter() => Test((host, pipeline) =>
        {
            var value = 0;
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredIntegerParameterAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredIntegerParameterAsync), "bodyParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalIntegerProperty() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalIntegerPropertyAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalIntegerPropertyAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredIntegerProperty() => Test((host, pipeline) =>
        {
            var value = new IntWrapper(0);
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredIntegerPropertyAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredIntegerPropertyAsync), "bodyParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalStringHeader() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalStringHeaderAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalStringHeaderAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredStringHeader() => Test((host, pipeline) =>
        {
            var value = string.Empty;
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredStringHeaderAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredStringHeaderAsync), "headerParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalStringParameter() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalStringParameterAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalStringParameterAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredStringParameter() => Test((host, pipeline) =>
        {
            var value = string.Empty;
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredStringParameterAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredStringParameterAsync), "bodyParameter");
        }, ignoreScenario: true);

        [Test]
        public Task OptionalStringProperty() => Test(async (host, pipeline) =>
        {
            var result = await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostOptionalStringPropertyAsync();
            Assert.AreEqual(200, result.Status);
            TestDefaultNullParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostOptionalStringParameterAsync), "bodyParameter");
        });

        [Test]
        public Task RequiredStringProperty() => Test((host, pipeline) =>
        {
            var value = new StringWrapper(string.Empty);
            Assert.ThrowsAsync<RequestFailedException>(async () => await new ExplicitClient(ClientDiagnostics, pipeline, host).RestClient.PostRequiredStringPropertyAsync(value));
            TestNotDefaultParameter(typeof(ExplicitRestClient), nameof(ExplicitRestClient.PostRequiredStringPropertyAsync), "bodyParameter");
        }, ignoreScenario: true);
    }
}
