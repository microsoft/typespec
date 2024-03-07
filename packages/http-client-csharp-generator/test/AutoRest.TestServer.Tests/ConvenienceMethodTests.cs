// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading;
using Azure;
using Azure.Core;
using ConvenienceInCadl;
using ConvenienceInCadl.Models;
using MixApiVersion;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class ConvenienceMethodTests
    {
        [Test]
        public void ProtocolScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("Protocol");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolValue");
            Assert.AreEqual(typeof(CancellationToken), convenienceInUpdate.GetParameters().Last().ParameterType);
        }

        [Test]
        public void ConvenienceWithOptionalScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceWithOptional");
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceWithOptionalValue");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            Assert.AreEqual(typeof(CancellationToken), convenienceInUpdate.GetParameters().Last().ParameterType);
        }

        [Test]
        public void ConvenienceWithRequiredScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceWithRequired", new[] { typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceWithRequired", new[] { typeof(CancellationToken) });
            Assert.AreEqual(false, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.IsNotNull(convenienceInUpdate);
        }

        [Test]
        public void ConvenienceShouldNotGenerateScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceShouldNotGenerate");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceShouldNotGenerateValue");
            Assert.IsNull(convenienceInUpdate);
        }

        [Test]
        public void ProtocolShouldNotGenerateConvenienceScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolShouldNotGenerateConvenience");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolShouldNotGenerateConvenienceValue");
            Assert.IsNull(convenienceInUpdate);
        }

        [Test]
        public void UpdateConvenienceScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("UpdateConvenience", new[] { typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("UpdateConvenience", new[] { typeof(CancellationToken) });
            Assert.AreEqual(false, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.IsNotNull(convenienceInUpdate);
        }

        [Test]
        public void ProtocolOptionalQueryScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolOptionalQuery");
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolOptionalQueryValue");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(true, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(true, convenienceInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            Assert.AreEqual(typeof(CancellationToken), convenienceInUpdate.GetParameters().Last().ParameterType);
        }

        [Test]
        public void ProtocolRequiredQueryScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolRequiredQuery");
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolRequiredQueryValue");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(false, convenienceInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            Assert.AreEqual(typeof(CancellationToken), convenienceInUpdate.GetParameters().Last().ParameterType);
        }

        [Test]
        public void ProtocolOptionalModelScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolOptionalModel", new[] { typeof(RequestContent), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolOptionalModel", new[] { typeof(Model), typeof(CancellationToken) });
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional); // This is RequestContent, which is actually optional.
            Assert.AreEqual(true, convenienceInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            Assert.AreEqual(typeof(CancellationToken), convenienceInUpdate.GetParameters().Last().ParameterType);
        }

        [Test]
        public void ProtocolRequiredModelScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolRequiredModel", new[] { typeof(RequestContent), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolRequiredModel", new[] { typeof(Model), typeof(CancellationToken) });
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(false, convenienceInUpdate.GetParameters().First().IsOptional);
        }

        [Test]
        public void ConvenienceOptionalQueryWithOptionalScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalQueryWithOptional");
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalQueryWithOptionalValue");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(true, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(true, convenienceInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            Assert.AreEqual(typeof(CancellationToken), convenienceInUpdate.GetParameters().Last().ParameterType);
        }

        [Test]
        public void ConvenienceRequiredQueryWithOptionalScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceRequiredQueryWithOptional");
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceRequiredQueryWithOptionalValue");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(false, convenienceInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            Assert.AreEqual(typeof(CancellationToken), convenienceInUpdate.GetParameters().Last().ParameterType);
        }

        [Test]
        public void ConvenienceOptionalQueryWithRequiredScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalQueryWithRequired", new[] { typeof(int), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalQueryWithRequired", new[] { typeof(int), typeof(CancellationToken) });
            Assert.AreEqual(false, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(true, convenienceInUpdate.GetParameters().First().IsOptional);
        }

        [Test]
        public void ConvenienceRequiredQueryWithRequiredScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceRequiredQueryWithRequired", new[] { typeof(int), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceRequiredQueryWithRequired", new[] { typeof(int), typeof(CancellationToken) });
            Assert.AreEqual(false, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(false, convenienceInUpdate.GetParameters().First().IsOptional);
        }

        [Test]
        public void ConvenienceOptionalModelWithOptionalScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalModelWithOptional", new[] { typeof(RequestContent), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalModelWithOptional", new[] { typeof(Model), typeof(CancellationToken) });
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional); // This is RequestContent, which is actually optional.
            Assert.AreEqual(true, convenienceInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(typeof(RequestContext), protocolInUpdate.GetParameters().Last().ParameterType);
            Assert.AreEqual(typeof(CancellationToken), convenienceInUpdate.GetParameters().Last().ParameterType);
        }

        [Test]
        public void ConvenienceRequiredModelWithOptionalScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceRequiredModelWithOptional", new[] { typeof(RequestContent), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceRequiredModelWithOptional", new[] { typeof(Model), typeof(CancellationToken) });
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(false, convenienceInUpdate.GetParameters().First().IsOptional);
        }

        [Test]
        public void ConvenienceOptionalModelWithRequiredScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalModelWithRequired", new[] { typeof(RequestContent), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalModelWithRequired", new[] { typeof(Model), typeof(CancellationToken) });
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional); // This is RequestContent, which is actually optional.
            Assert.AreEqual(true, convenienceInUpdate.GetParameters().First().IsOptional);
        }

        [Test]
        public void ProtocolOptionalBeforeRequiredScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolOptionalBeforeRequired", new[] { typeof(RequestContent), typeof(int), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ProtocolOptionalBeforeRequired", new[] { typeof(Model), typeof(int), typeof(CancellationToken) });
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(false, convenienceInUpdate.GetParameters().First().IsOptional);
        }

        [Test]
        public void ConvenienceOptionalBeforeRequiredScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalBeforeRequired", new[] { typeof(RequestContent), typeof(int), typeof(RequestContext) });
            var convenienceInUpdate = typeof(ConvenienceInCadlClient).GetMethod("ConvenienceOptionalBeforeRequired", new[] { typeof(Model), typeof(int), typeof(CancellationToken) });
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
            Assert.AreEqual(false, protocolInUpdate.GetParameters().First().IsOptional);
            Assert.AreEqual(false, convenienceInUpdate.GetParameters().First().IsOptional);
        }

        [Test]
        public void NoConvenienceScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("NoConvenience");
            Assert.AreEqual(false, protocolInUpdate.GetParameters().Last().IsOptional);
        }

        [Test]
        public void NoConvenienceRequiredBodyScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("NoConvenienceRequiredBody");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
        }

        [Test]
        public void NoConvenienceOptionalBodyScenario()
        {
            var protocolInUpdate = typeof(ConvenienceInCadlClient).GetMethod("NoConvenienceOptionalBody");
            Assert.AreEqual(true, protocolInUpdate.GetParameters().Last().IsOptional);
        }

        [Test]
        public void SetKeepNonOverloadableProtocolSignature()
        {
            var getPetsClientMethod = typeof(MixApiVersionClient).GetMethod("GetPetsClient");
            Assert.AreEqual(typeof(Pets), getPetsClientMethod.ReturnType);

            var method = getPetsClientMethod.ReturnType.GetMethod("Delete");
            Assert.AreEqual(true, method.GetParameters().Last().IsOptional);

            method = getPetsClientMethod.ReturnType.GetMethod("Read");
            Assert.AreEqual(false, method.GetParameters().Last().IsOptional);
        }
    }
}
