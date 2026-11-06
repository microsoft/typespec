// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [Test]
        public void GeneratedInstanceBoundaryOwnedEmptyTypeArgumentsPreserveOrdinaryInstanceSyntax()
        {
            using var service = new GeneratedInstanceBoundaryServiceScope();
            var target = new GeneratedInstanceTarget(false);
            target.EnsureBuilt();
            var receiver = new ParameterProvider("receiver", $"receiver", target.Type);
            var call = new InvokeMethodExpression(receiver.AsVariable(), "Safe", new ValueExpression[] { Literal(1) })
            { TypeArguments = Array.Empty<CSharpType>() };
            // Same actual nongeneric syntax as null type arguments. This helper
            // checks native binding, emit and runtime before the prepared facts.
            var result = PrepareGeneratedInstanceBoundary(service.Services, target, receiver, call);
            using var prepared = result.Plan;
            Assert.That(result.Actual!.Arity, Is.Zero);
            Assert.That(result.Actual.IsStatic, Is.False);
            Assert.That(result.SelectionBeforeWrite, Is.Not.Null);
            Assert.That(result.Node.CallProofs?.Selection, Is.Not.Null);
        }
    }
}
