// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        // Original raw acceptance regressions; native oracles precede output assertions.
        // Original anchors: UnobservedCallSourceAllowsNamespaceReduction(1) and
        // CallerExpressionTextIsPreservedAfterADeclarationDecision(1).
        [TestCase(false)]
        [TestCase(true)]
        public void OriginalTypeOfHostUsesPrivateOriginalHelpersAndShortensRawSeed(bool captured)
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(captured));
            var owner = new OriginalTypeOfHostOwner(captured);
            owner.EnsureBuilt();
            FinalizeGeneratedInstanceOwner(owner);
            TypeProvider[] roots = [owner];
            using var prepared = PreparedFieldTypes.CreateForGeneration(host.Generator, roots, _ => true);

            // ONE inherited generator.GetWriter call and ONE Write, without a
            // factory override/counter that would itself forbid admission.
            var writer = host.Generator.GetWriter(owner);
            writer.PreparedFieldTypes = prepared;
            var output = writer.Write();
            var qualifiedContent = output.QualifiedContent
                ?? throw new InvalidOperationException("Missing same-pass qualified companion.");

            // Native binding/operations/diagnostics/emit/runtime on BOTH actual
            // products precede desired raw spelling and internal lifetime facts.
            // Every support declaration was physically captured before preparation.
            var raw = AssertOriginalTypeOfNative(output.Content, host.Snapshot, captured);
            var qualified = AssertOriginalTypeOfNative(qualifiedContent, host.Snapshot, captured);
            Assert.That(raw.Diagnostics, Is.EqualTo(qualified.Diagnostics));
            Assert.That(raw.EmitDiagnostics, Is.EqualTo(qualified.EmitDiagnostics));
            if (captured)
            {
                // Compare exact syntax text, not a normalized/reconstructed typeof.
                Assert.That(raw.CapturedText, Is.EqualTo(qualified.ArgumentText));
                Assert.That(raw.Runtime, Is.EqualTo(qualified.ArgumentText));
                Assert.That(qualified.Runtime, Is.EqualTo(qualified.ArgumentText));
            }

            // These are the original desired reductions. In particular BOTH
            // variants must shorten the finite unused-local declaration site.
            Assert.Multiple(() =>
            {
                Assert.That(raw.SeedType, Is.EqualTo("Exception"), "Shorten the original local, not an invented field.");
                Assert.That(raw.OperandType, Is.EqualTo(captured ? "global::System.Exception" : "Exception"));
                Assert.That(qualified.SeedType, Is.EqualTo("global::System.Exception"));
                Assert.That(qualified.OperandType, Is.EqualTo("global::System.Exception"));
            });

            // Only essential lifetime/permission/consumption/identity checks;
            // no selection-certificate count matrix before the raw consumer.
            Assert.That(writer.GetType(), Is.EqualTo(typeof(TypeProviderWriter)));
            Assert.That(prepared, Is.Not.Null);
            Assert.That(BodyOnlyExistingSlot(typeof(PreparedFieldTypes), "_rootSnapshot").GetValue(prepared), Is.EqualTo(roots));
            Assert.That(BodyOnlyExistingSlot(typeof(TypeProvider), "_preparedFieldTypes").GetValue(owner), Is.SameAs(prepared));
            Assert.That(host.Generator.SourceInputModel.PreEmissionSourceInputs, Is.SameAs(host.Snapshot));
            Assert.That(host.Snapshot.IsCurrentFor(host.DirectoryPath), Is.True);
            Assert.That(prepared!.CanCommit(), Is.True);
            Assert.That(prepared.CanCommitBodyNames(output), Is.True);
            Assert.That(owner.Fields, Is.Empty);
            Assert.That(owner.CachedType, Is.SameAs(owner.Type));
            Assert.That(owner.Seed.Variable.Type, Is.SameAs(owner.ExceptionType));
            Assert.That(owner.Operand.Type, Is.SameAs(owner.ExceptionType));

            var file = prepared.SourceFiles.Single();
            Assert.That(file.FileOwner, Is.SameAs(owner));
            Assert.That(file.IsCurrent(), Is.True);
            var leaf = file.Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, owner.Operand));
            var receipt = output.SourceConsumption
                ?? throw new InvalidOperationException("Missing exact-source consumption receipt.");
            Assert.That(receipt.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(receipt.Generation, Is.EqualTo(file.Generation));
            Assert.That(receipt.File, Is.EqualTo(file.FilePath));
            Assert.That(receipt.RootCount, Is.EqualTo(file.Roots.Length));
            var expected = file.Roots.SelectMany(root => root.DescendantsAndSelf()
                .Where(n => ReferenceEquals(n, root) || n.EmissionBoundary)).Select(n => n.Id).ToArray();
            Assert.That(receipt.Consumed, Is.EqualTo(expected));
            Assert.That(receipt.Consumed.Distinct().Count(), Is.EqualTo(receipt.Consumed.Length));
            Assert.That(receipt.Consumed.Contains(leaf.Id), Is.True);
            var permission = prepared.GetTypeOfNamePermission(file, leaf);
            if (captured)
            {
                Assert.That(permission, Is.Null, "Omitted CAE captures the original operand spelling.");
            }
            else
            {
                Assert.That(permission, Is.Not.Null, "A selected call alone is not editing permission.");
                Assert.That(permission!.IsCurrent, Is.True);
                Assert.That(permission.Occurrence, Is.SameAs(leaf));
                Assert.That(SymbolEqualityComparer.Default.Equals(permission.CanonicalCompilerMetadataTarget,
                    file.Compilation.GetTypeByMetadataName("System.Exception")), Is.True);
            }
        }

        // Exact original support inventories, excluding Clock (which is emitted
        // by the real writer). These are actual physical compiler source inputs,
        // not an incomplete generated lookup index or metadata helper substitute.
        private static string OriginalTypeOfSupportSource(bool captured) => captured
            ? "using System; using System.Runtime.CompilerServices; namespace Sample { " +
              "public class Consumer { public Consumer(object value, [CallerArgumentExpression(\"value\")] string text = \"\") {} } " +
              "public static class Extensions { public static string CaptureExtension(this object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }"
            : "using System; using System.Runtime.CompilerServices; namespace Sample { " +
              "public class Consumer { public Consumer(object value) {} } public class CapturedConsumer { public CapturedConsumer(object value, [CallerArgumentExpression(\"value\")] string text = \"\") {} } " +
              "public static class Extensions { public static object IdentityExtension(this object value) => value; public static string CapturedExtension(this object value, [CallerArgumentExpression(\"value\")] string text = \"\") => text; } }";

        private static (string SeedType, string OperandType, string ArgumentText, string? CapturedText,
            object? Runtime, string[] Diagnostics, string[] EmitDiagnostics) AssertOriginalTypeOfNative(
            string content, CompleteSourceInputSnapshot snapshot, bool captured)
        {
            var tree = CSharpSyntaxTree.ParseText(content, snapshot.ParseOptions
                ?? throw new InvalidOperationException("Missing captured compiler parse options."));
            var compilation = snapshot.Compilation.WithAssemblyName("OriginalTypeOfHost_" + Guid.NewGuid().ToString("N")).AddSyntaxTrees(tree);
            var diagnostics = compilation.GetDiagnostics();
            Assert.That(diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty,
                string.Join(Environment.NewLine, diagnostics));
            // These native source symbols must come from the physical inventory,
            // not from extra trees supplied after the complete-input proof.
            foreach (var name in captured ? new[] { "Consumer", "Extensions" } : new[] { "Consumer", "CapturedConsumer", "Extensions" })
            {
                var support = compilation.GetTypeByMetadataName("Sample." + name)
                    ?? throw new InvalidOperationException("Missing original support source: " + name);
                Assert.That(support.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(snapshot.Compilation.SyntaxTrees.Single()));
            }
            var model = compilation.GetSemanticModel(tree);
            var exception = compilation.GetTypeByMetadataName("System.Exception")!;
            var systemType = compilation.GetTypeByMetadataName("System.Type")!;
            var clock = compilation.GetTypeByMetadataName("Sample.Clock")!;
            var declaration = tree.GetRoot().DescendantNodes().OfType<ClassDeclarationSyntax>().Single();
            Assert.That(declaration.Members.All(m => m is MethodDeclarationSyntax), Is.True);
            Assert.That(declaration.Members.OfType<MethodDeclarationSyntax>().Select(m => m.Identifier.ValueText),
                Is.EqualTo(captured ? new[] { "M", "Capture" } : new[] { "M", "Pass", "Generic", "CaptureOther", "Capture" }));
            var m = clock.GetMembers("M").OfType<IMethodSymbol>().Single();
            Assert.That(m.IsStatic, Is.False);
            Assert.That(m.DeclaredAccessibility, Is.EqualTo(Accessibility.Public));
            Assert.That(m.ReturnType.SpecialType, Is.EqualTo(SpecialType.System_Object));
            Assert.That(m.Parameters, Has.Length.EqualTo(1));
            Assert.That(m.Parameters.Single().Name, Is.EqualTo("value"));
            Assert.That(m.Parameters.Single().Type.SpecialType, Is.EqualTo(SpecialType.System_Object));
            var mSyntax = (MethodDeclarationSyntax)m.DeclaringSyntaxReferences.Single().GetSyntax();
            Assert.That(mSyntax.Body!.Statements, Has.Count.EqualTo(2));
            var localSyntax = (LocalDeclarationStatementSyntax)mSyntax.Body.Statements[0];
            var variable = localSyntax.Declaration.Variables.Single();
            var seed = model.GetDeclaredSymbol(variable) as ILocalSymbol
                ?? throw new InvalidOperationException("Missing actual seed local symbol.");
            Assert.That(seed.Name, Is.EqualTo("seed"));
            Assert.That(SymbolEqualityComparer.Default.Equals(seed.Type, exception), Is.True);
            Assert.That(variable.Initializer!.Value.IsKind(SyntaxKind.DefaultLiteralExpression), Is.True);
            Assert.That(model.GetOperation(variable.Initializer.Value), Is.InstanceOf<IDefaultValueOperation>());
            var returned = (ReturnStatementSyntax)mSyntax.Body.Statements[1];
            var callSyntax = (InvocationExpressionSyntax)returned.Expression!;
            Assert.That(callSyntax.Expression, Is.InstanceOf<IdentifierNameSyntax>());
            Assert.That(callSyntax.ArgumentList.Arguments, Has.Count.EqualTo(1), "Keep the original omitted CAE argument.");
            var argument = callSyntax.ArgumentList.Arguments.Single();
            Assert.That(argument.NameColon, Is.Null);
            var typeOfSyntax = (TypeOfExpressionSyntax)argument.Expression;
            var typeOf = model.GetOperation(typeOfSyntax) as ITypeOfOperation
                ?? throw new InvalidOperationException("Missing actual native typeof operation.");
            Assert.That(SymbolEqualityComparer.Default.Equals(typeOf.TypeOperand, exception), Is.True);
            Assert.That(SymbolEqualityComparer.Default.Equals(typeOf.Type, systemType), Is.True);
            Assert.That(SymbolEqualityComparer.Default.Equals(model.GetTypeInfo(typeOfSyntax.Type).Type, exception), Is.True);
            var invocation = model.GetOperation(callSyntax) as IInvocationOperation
                ?? throw new InvalidOperationException("Missing actual native helper invocation.");
            var helper = clock.GetMembers(captured ? "Capture" : "Pass").OfType<IMethodSymbol>().Single();
            Assert.That(SymbolEqualityComparer.Default.Equals(invocation.TargetMethod, helper), Is.True);
            Assert.That(SymbolEqualityComparer.Default.Equals(model.GetSymbolInfo(callSyntax).Symbol, helper), Is.True);
            Assert.That(helper.DeclaringSyntaxReferences.Single().SyntaxTree, Is.SameAs(tree));
            Assert.That(helper.IsStatic, Is.EqualTo(captured));
            Assert.That(helper.DeclaredAccessibility, Is.EqualTo(Accessibility.Private));
            Assert.That(helper.MethodKind, Is.EqualTo(MethodKind.Ordinary));
            Assert.That(helper.Arity, Is.Zero);
            Assert.That(helper.ReturnType.SpecialType, Is.EqualTo(captured ? SpecialType.System_String : SpecialType.System_Object));
            Assert.That(helper.Parameters.Select(p => p.Type.SpecialType), Is.EqualTo(captured
                ? new[] { SpecialType.System_Object, SpecialType.System_String } : new[] { SpecialType.System_Object }));
            Assert.That(helper.Parameters[0].Name, Is.EqualTo("value"));
            Assert.That(helper.Parameters[0].GetAttributes(), Is.Empty);
            Assert.That(invocation.Arguments, Has.Length.EqualTo(captured ? 2 : 1));
            var supplied = invocation.Arguments.Single(a => a.Parameter!.Ordinal == 0);
            Assert.That(supplied.IsImplicit, Is.False);
            Assert.That(supplied.ArgumentKind, Is.EqualTo(ArgumentKind.Explicit));
            Assert.That(SymbolEqualityComparer.Default.Equals(supplied.Parameter, helper.Parameters[0]), Is.True);
            var suppliedValue = supplied.Value is IConversionOperation conversion ? conversion.Operand : supplied.Value;
            Assert.That(suppliedValue, Is.InstanceOf<ITypeOfOperation>());
            Assert.That(SymbolEqualityComparer.Default.Equals(((ITypeOfOperation)suppliedValue).TypeOperand, exception), Is.True);
            Assert.That(suppliedValue.Syntax.Span, Is.EqualTo(typeOfSyntax.Span));
            string? capturedText = null;
            if (captured)
            {
                Assert.That(invocation.Instance, Is.Null);
                var text = helper.Parameters[1];
                Assert.That(text.Name, Is.EqualTo("text"));
                Assert.That(text.IsOptional, Is.True);
                Assert.That(text.ExplicitDefaultValue, Is.EqualTo(""));
                var attribute = text.GetAttributes().Single();
                Assert.That(attribute.AttributeClass!.ToDisplayString(), Is.EqualTo("System.Runtime.CompilerServices.CallerArgumentExpressionAttribute"));
                Assert.That(attribute.ConstructorArguments.Single().Value, Is.EqualTo("value"));
                var omitted = invocation.Arguments.Single(a => a.Parameter!.Ordinal == 1);
                Assert.That(omitted.IsImplicit, Is.True);
                Assert.That(omitted.ArgumentKind, Is.EqualTo(ArgumentKind.DefaultValue));
                Assert.That(omitted.Value.ConstantValue.HasValue, Is.True);
                capturedText = (string)omitted.Value.ConstantValue.Value!;
                Assert.That(capturedText, Is.EqualTo(argument.ToString()));
            }
            else
            {
                Assert.That(invocation.Instance, Is.InstanceOf<IInstanceReferenceOperation>());
                Assert.That(SymbolEqualityComparer.Default.Equals(invocation.Instance!.Type, clock), Is.True);
            }

            using var stream = new MemoryStream();
            var emitted = compilation.Emit(stream);
            Assert.That(emitted.Success, Is.True, string.Join(Environment.NewLine, emitted.Diagnostics));
            var runtimeClock = Assembly.Load(stream.ToArray()).GetType("Sample.Clock")!;
            var runtimeM = runtimeClock.GetMethod("M", BindingFlags.Public | BindingFlags.Instance)!;
            Assert.That(runtimeM.IsStatic, Is.False);
            Assert.That(runtimeM.ReturnType, Is.EqualTo(typeof(object)));
            Assert.That(runtimeM.GetParameters().Single().ParameterType, Is.EqualTo(typeof(object)));
            var runtimeHelper = runtimeClock.GetMethod(captured ? "Capture" : "Pass",
                BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static)!;
            Assert.That(runtimeHelper.IsPrivate, Is.True);
            Assert.That(runtimeHelper.IsStatic, Is.EqualTo(captured));
            var runtime = runtimeM.Invoke(Activator.CreateInstance(runtimeClock), new object?[] { null });
            Assert.That(runtime, Is.EqualTo(captured ? (object)argument.ToString() : typeof(Exception)));
            return (localSyntax.Declaration.Type.ToString(), typeOfSyntax.Type.ToString(), argument.ToString(),
                capturedText, runtime, OriginalTypeOfRelevantDiagnostics(diagnostics), OriginalTypeOfRelevantDiagnostics(emitted.Diagnostics));
        }

        // Task02: ignore ONLY default UNSUPPRESSED Hidden CS8019. Preserve every
        // other diagnostic (including Hidden and suppressed) by severity/ID/message.
        private static string[] OriginalTypeOfRelevantDiagnostics(IEnumerable<Diagnostic> diagnostics) => diagnostics
            .Where(d => !(d.Id == "CS8019" && d.Severity == DiagnosticSeverity.Hidden &&
                d.DefaultSeverity == DiagnosticSeverity.Hidden && !d.IsSuppressed))
            .Select(d => $"{d.Id}:{d.Severity}:{d.GetMessage()}")
            .OrderBy(d => d, StringComparer.Ordinal).ToArray();

        private sealed class OriginalTypeOfHostOwner(bool captured) : TypeProvider
        {
            private sealed class Template<T> { }
            internal CSharpType ExceptionType { get; } = typeof(Exception);
            internal MethodProvider M { get; private set; } = null!;
            internal DeclarationExpression Seed { get; private set; } = null!;
            internal TypeOfExpression Operand { get; private set; } = null!;
            internal InvokeMethodExpression Call { get; private set; } = null!;
            internal MethodProvider Helper { get; private set; } = null!;
            protected override string BuildName() => "Clock";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "Clock.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected override XmlDocProvider BuildXmlDocs() => new();
            protected internal override FieldProvider[] BuildFields() => Array.Empty<FieldProvider>();
            protected internal override PropertyProvider[] BuildProperties() => Array.Empty<PropertyProvider>();
            protected internal override ConstructorProvider[] BuildConstructors() => Array.Empty<ConstructorProvider>();
            protected override TypeProvider[] BuildNestedTypes() => Array.Empty<TypeProvider>();
            protected internal override MethodProvider[] BuildMethods()
            {
                Operand = new TypeOfExpression(ExceptionType);
                Call = new InvokeMethodExpression(null, captured ? "Capture" : "Pass", new ValueExpression[] { Operand });
                Seed = new DeclarationExpression(ExceptionType, "seed");
                var body = new MethodBodyStatements(new MethodBodyStatement[]
                {
                    Seed.Assign(new KeywordExpression("default", null)).Terminate(), Return(Call)
                });
                M = new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public,
                    typeof(object), null, new[] { ObjectParameter("value") }), body, this, xmlDocProvider: new XmlDocProvider());
                if (captured)
                {
                    Helper = CaptureHelper("Capture", "value", isStatic: true, first: false);
                    return new[] { M, Helper };
                }
                var value = ObjectParameter("value");
                Helper = new MethodProvider(new MethodSignature("Pass", null, MethodSignatureModifiers.Private,
                    typeof(object), null, new[] { value }), value.AsVariable(), this, xmlDocProvider: new XmlDocProvider());
                CSharpType t = typeof(Template<>).GetGenericArguments()[0];
                var generic = new MethodProvider(new MethodSignature("Generic", null, MethodSignatureModifiers.Private,
                    typeof(object), null, Array.Empty<ParameterProvider>(), GenericArguments: new[] { t }),
                    new TypeOfExpression(t), this, xmlDocProvider: new XmlDocProvider());
                return new[] { M, Helper, generic,
                    CaptureHelper("CaptureOther", "first", isStatic: false, first: true),
                    CaptureHelper("Capture", "value", isStatic: false, first: false) };
            }

            private static ParameterProvider ObjectParameter(string name) => new(name, $"{name}", typeof(object));

            private MethodProvider CaptureHelper(string name, string capturedName, bool isStatic, bool first)
            {
                // Existing AttributeStatement API: the constructor argument is
                // the actual parameter-name STRING, not a metadata/symbol hint.
                var text = new ParameterProvider("text", $"text", typeof(string), defaultValue: Literal(""),
                    attributes: new[] { new AttributeStatement(typeof(CallerArgumentExpressionAttribute),
                        new ValueExpression[] { Literal(capturedName) }, Array.Empty<KeyValuePair<string, ValueExpression>>()) });
                var parameters = first ? new[] { ObjectParameter("first"), ObjectParameter("value"), text }
                    : new[] { ObjectParameter("value"), text };
                return new MethodProvider(new MethodSignature(name, null,
                    MethodSignatureModifiers.Private | (isStatic ? MethodSignatureModifiers.Static : (MethodSignatureModifiers)0),
                    typeof(string), null, parameters), text.AsVariable(), this, xmlDocProvider: new XmlDocProvider());
            }
        }
    }
}
