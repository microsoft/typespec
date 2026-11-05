// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void OriginalTypeOfDocumentationFormattingCannotChangeNativeBinding(bool customReflection)
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(captured: false));
            var owner = new OriginalTypeOfHostOwner(captured: false);
            owner.EnsureBuilt();
            var formatter = new OriginalTypeOfAliasDocType();
            CSharpType documentationType = customReflection ? new CSharpType(formatter) : typeof(Uri);
            owner.Update(xmlDocs: new XmlDocProvider(summary: new XmlDocSummaryStatement(new[]
            {
                FormattableStringFactory.Create("see {0}", new object[] { documentationType })
            })));
            FinalizeGeneratedInstanceOwner(owner);
            // Descriptor construction caches harmless Uri metadata. Arm BEFORE
            // preparation and keep the formatter stable through the writer pass.
            formatter.Arm(customReflection);
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, new TypeProvider[] { owner }, _ => true);
            Assert.That(prepared, Is.Not.Null);
            var preparationNameReads = formatter.NameReads;
            var preparationPredicateReads = formatter.PredicateReads;
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write(); // Exactly one inherited standard-writer pass.
            var qualifiedContent = output.QualifiedContent ?? throw new InvalidOperationException("Missing qualified companion.");

            // Native binding and runtime are measured on BOTH actual products
            // before the desired retention/shortening assertions. In particular,
            // don't assume the raw typeof operand still denotes Exception.
            var raw = InspectOriginalDocBinding(output.Content, host.Snapshot, customReflection);
            var qualified = InspectOriginalDocBinding(qualifiedContent, host.Snapshot, customReflection);
            Assert.That(qualified.Seed, Is.EqualTo("System.Exception"));
            Assert.That(qualified.Operand, Is.EqualTo("System.Exception"));
            Assert.That(qualified.Runtime, Is.EqualTo(typeof(Exception)));
            Assert.Multiple(() =>
            {
                Assert.That(raw.Seed, Is.EqualTo("System.Exception"), output.Content);
                Assert.That(raw.Operand, Is.EqualTo("System.Exception"), output.Content);
                Assert.That(raw.Runtime, Is.EqualTo(typeof(Exception)));
                Assert.That(raw.SeedSpelling, Is.EqualTo(customReflection ? "global::System.Exception" : "Exception"));
                Assert.That(raw.OperandSpelling, Is.EqualTo(customReflection ? "global::System.Exception" : "Exception"));
                Assert.That(preparationNameReads, Is.Zero, "Preparation must not invoke a custom Type.Name formatter.");
                Assert.That(preparationPredicateReads, Is.Zero, "Audit reflection dispatch before virtual Type predicates.");
            });
        }

        private static (string Seed, string Operand, Type Runtime, string SeedSpelling, string OperandSpelling) InspectOriginalDocBinding(
            string content, CompleteSourceInputSnapshot snapshot, bool aliasExpected)
        {
            var tree = CSharpSyntaxTree.ParseText(content, snapshot.ParseOptions!);
            var compilation = snapshot.Compilation.WithAssemblyName("OriginalDocPurity_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, content);
            var model = compilation.GetSemanticModel(tree);
            var root = tree.GetRoot();
            var aliases = root.DescendantNodes().OfType<UsingDirectiveSyntax>().Where(usingSyntax => usingSyntax.Alias is not null).ToArray();
            Assert.That(aliases, Has.Length.EqualTo(aliasExpected ? 1 : 0));
            if (aliasExpected)
            {
                Assert.That(aliases.Single().Alias!.Name.Identifier.ValueText, Is.EqualTo("Exception"));
                Assert.That(model.GetSymbolInfo(aliases.Single().Name!).Symbol!.ToDisplayString(), Is.EqualTo("System.Uri"));
            }
            var method = root.DescendantNodes().OfType<MethodDeclarationSyntax>().Single(m => m.Identifier.ValueText == "M");
            var declaration = method.DescendantNodes().OfType<VariableDeclaratorSyntax>().Single();
            var local = (ILocalSymbol)model.GetDeclaredSymbol(declaration)!;
            var invocationSyntax = method.DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
            var invocation = (IInvocationOperation)model.GetOperation(invocationSyntax)!;
            Assert.That(invocation.TargetMethod.Name, Is.EqualTo("Pass"));
            Assert.That(invocation.TargetMethod.IsStatic, Is.False);
            Assert.That(invocation.TargetMethod.DeclaredAccessibility, Is.EqualTo(Accessibility.Private));
            var typeOfSyntax = method.DescendantNodes().OfType<TypeOfExpressionSyntax>().Single();
            var typeOf = (ITypeOfOperation)model.GetOperation(typeOfSyntax)!;
            Assert.That(SymbolEqualityComparer.Default.Equals(typeOf.TypeOperand, local.Type), Is.True);
            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join("\n", emitted.Diagnostics));
            var runtimeOwner = Assembly.Load(stream.ToArray()).GetType("Sample.Clock")!;
            var runtime = (Type)runtimeOwner.GetMethod("M")!.Invoke(Activator.CreateInstance(runtimeOwner), new object?[] { null })!;
            Assert.That(runtime.FullName, Is.EqualTo(typeOf.TypeOperand.ToDisplayString()));
            return (local.Type.ToDisplayString(), typeOf.TypeOperand.ToDisplayString(), runtime,
                ((VariableDeclarationSyntax)declaration.Parent!).Type.ToString(), typeOfSyntax.Type.ToString());
        }

        private sealed class OriginalTypeOfAliasDocType() : TypeDelegator(typeof(Uri))
        {
            private bool _escape;
            internal int NameReads { get; private set; }
            internal int PredicateReads { get; private set; }
            internal void Arm(bool escape) { _escape = escape; NameReads = 0; PredicateReads = 0; }
            public override bool IsGenericParameter { get { PredicateReads++; return _escape; } }
            public override string Name { get { NameReads++; return _escape ? "T\nusing Exception = global::System.Uri;\n//" : base.Name; } }
        }
    }
}
