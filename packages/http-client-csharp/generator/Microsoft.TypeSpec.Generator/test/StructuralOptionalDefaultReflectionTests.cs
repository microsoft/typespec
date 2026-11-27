// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public partial class StructuralTypeNameIntegrationTests
    {
        [Test]
        public void StructuralOptionalDefaultReflectionSeparatesMissingNullAndDbNullOnValidDeclarations()
        {
            const string source = "using System.Runtime.InteropServices; public class Clock { public static void M([Optional] object missing, object explicitNull=null){} public static void N(object required){} }";
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("DefaultReflectionKinds", new[] { tree }, References,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(static d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            using var bytes = new MemoryStream();
            Assert.That(compilation.Emit(bytes).Success, Is.True);
            var type = Assembly.Load(bytes.ToArray()).GetType("Clock")!;
            var parameters = type.GetMethod("M")!.GetParameters();
            var required = type.GetMethod("N")!.GetParameters().Single();
            Assert.That(parameters[0].IsOptional, Is.True);
            Assert.That(parameters[0].HasDefaultValue, Is.False);
            Assert.That(parameters[0].DefaultValue, Is.SameAs(Missing.Value));
            Assert.That(parameters[1].IsOptional, Is.True);
            Assert.That(parameters[1].HasDefaultValue, Is.True);
            Assert.That(parameters[1].DefaultValue, Is.Null);
            Assert.That(required.IsOptional, Is.False);
            Assert.That(required.HasDefaultValue, Is.False);
            Assert.That(required.DefaultValue, Is.SameAs(DBNull.Value));
        }
    }
}
