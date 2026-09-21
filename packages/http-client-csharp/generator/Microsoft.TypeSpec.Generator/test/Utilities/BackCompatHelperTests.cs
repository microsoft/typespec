// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Utilities
{
    public class BackCompatHelperTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator(includeXmlDocs: true);
        }

        // Detection: a nullable value-type parameter that became non-nullable qualifies.
        [Test]
        public void HasRelaxedNullableValueTypeParametersOnlyMatchesNullableToNonNullableValueType()
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            ParameterProvider Param(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: true))!;
            MethodSignature Sig(params ParameterProvider[] parameters) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", parameters);

            var previous = Sig(Param("value", new InputNullableType(InputPrimitiveType.Int32)), Param("flag", InputPrimitiveType.Boolean));
            var current = Sig(Param("value", InputPrimitiveType.Int32), Param("flag", InputPrimitiveType.Boolean));

            Assert.IsTrue(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(previous, current));
        }

        // Detection guards: only the nullable-value-type -> non-nullable direction on the same underlying
        // type qualifies. Reference-type nullability, the widening direction, a different underlying type,
        // and an unchanged signature must all be rejected.
        [Test]
        public void HasRelaxedNullableValueTypeParametersOnlyRejectsOtherChanges()
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            MethodSignature Sig(InputType parameterType) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [typeFactory.CreateParameter(InputFactory.QueryParameter("value", parameterType, isRequired: true))!]);

            // Reference-type nullability cannot form distinct overloads (string? and string collide).
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                Sig(new InputNullableType(InputPrimitiveType.String)), Sig(InputPrimitiveType.String)));

            // The widening direction (non-nullable -> nullable) is not handled.
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                Sig(InputPrimitiveType.Int32), Sig(new InputNullableType(InputPrimitiveType.Int32))));

            // A different underlying value type is not a nullability-only change.
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                Sig(new InputNullableType(InputPrimitiveType.Int32)), Sig(InputPrimitiveType.Int64)));

            // An unchanged signature has no nullability change.
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                Sig(InputPrimitiveType.Int32), Sig(InputPrimitiveType.Int32)));

            // A ref/out parameter cannot be forwarded through .Value, so a nullability change on one is
            // rejected rather than producing an un-compilable shim (ref int? -> ref int).
            MethodSignature RefSig(CSharpType parameterType) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [new ParameterProvider("value", $"", parameterType, isRef: true)]);
            Assert.IsFalse(BackCompatHelper.HasRelaxedNullableValueTypeParametersOnly(
                RefSig(new CSharpType(typeof(int), isNullable: true)), RefSig(new CSharpType(typeof(int)))));
        }

        // Detection: a nullable parameter that changed from optional to required (same type) qualifies.
        [Test]
        public void IsSingleNullableParameterOptionalToRequiredMatchesOptionalToRequiredNullable()
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            ParameterProvider Opt(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: false))!;
            ParameterProvider Req(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: true))!;
            MethodSignature Sig(params ParameterProvider[] parameters) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", parameters);

            var previous = Sig(Opt("value", new InputNullableType(InputPrimitiveType.Int32)), Opt("flag", InputPrimitiveType.Boolean));
            var current = Sig(Req("value", new InputNullableType(InputPrimitiveType.Int32)), Opt("flag", InputPrimitiveType.Boolean));

            Assert.IsTrue(BackCompatHelper.IsSingleNullableParameterOptionalToRequired(previous, current));
        }

        // Detection guards (parameter types are assumed already equal): a non-nullable parameter, an
        // unchanged optionality, and a drop that would be ambiguous must all be rejected.
        [Test]
        public void IsSingleNullableParameterOptionalToRequiredRejectsOtherChanges()
        {
            var typeFactory = CodeModelGenerator.Instance.TypeFactory;
            ParameterProvider Opt(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: false))!;
            ParameterProvider Req(string name, InputType type) => typeFactory.CreateParameter(InputFactory.QueryParameter(name, type, isRequired: true))!;
            MethodSignature Sig(params ParameterProvider[] parameters) => new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", parameters);

            // A non-nullable parameter becoming required is not in scope (only nullable parameters qualify).
            Assert.IsFalse(BackCompatHelper.IsSingleNullableParameterOptionalToRequired(
                Sig(Opt("value", InputPrimitiveType.Int32)), Sig(Req("value", InputPrimitiveType.Int32))));

            // Unchanged optionality has nothing to restore.
            Assert.IsFalse(BackCompatHelper.IsSingleNullableParameterOptionalToRequired(
                Sig(Opt("value", new InputNullableType(InputPrimitiveType.Int32))), Sig(Opt("value", new InputNullableType(InputPrimitiveType.Int32)))));

            // Dropping the parameter would be ambiguous when another parameter shares its underlying type.
            Assert.IsFalse(BackCompatHelper.IsSingleNullableParameterOptionalToRequired(
                Sig(Opt("a", new InputNullableType(InputPrimitiveType.Int32)), Opt("b", new InputNullableType(InputPrimitiveType.Int32))),
                Sig(Req("a", new InputNullableType(InputPrimitiveType.Int32)), Opt("b", new InputNullableType(InputPrimitiveType.Int32)))));
        }

        [Test]
        public void AddedOptionalParameterUsesCurrentDocumentation(
            [Values(false, true)] bool async,
            [Values(0, 12, 24)] int indentation)
        {
            var current = CreateOperation(async);
            var previous = CreatePreviousOperation(current, indentation);
            string originalDocs = RenderDocs(current.XmlDocs);
            var shim = CreateShim(current, previous);
            var docs = ReadDocs(shim.XmlDocs);

            AssertCurrentDocumentation(docs);
            Assert.AreEqual(new[] { "id", "cancellationToken" }, docs.Elements("param").Select(p => (string?)p.Attribute("name")));
            Assert.AreEqual("Current identifier.", docs.Elements("param").First().Value.Trim());
            AssertValidParameterReferences(shim);
            Assert.AreEqual(originalDocs, RenderDocs(current.XmlDocs));
            Assert.AreEqual(new[] { "id", "expand", "cancellationToken" }, current.Signature.Parameters.Select(p => p.Name));
            Assert.AreEqual(new[] { "id", "cancellationToken" }, shim.Signature.Parameters.Select(p => p.Name));
            Assert.IsTrue(shim.Signature.Parameters.All(p => p.DefaultValue is null));
            Assert.IsFalse(shim.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));

            using var writer = new CodeWriter();
            writer.WriteMethod(shim);
            var syntax = SyntaxFactory.ParseMemberDeclaration(writer.ToString(false))!;
            var invocation = syntax.DescendantNodes().OfType<InvocationExpressionSyntax>().Single();
            Assert.AreEqual(current.Signature.Name, ((MemberAccessExpressionSyntax)invocation.Expression).Name.Identifier.ValueText);
            Assert.AreEqual(new[] { "id", "expand", "cancellationToken" },
                invocation.ArgumentList.Arguments.Select(a => a.NameColon?.Name.Identifier.ValueText));
            Assert.IsTrue(invocation.ArgumentList.Arguments[1].Expression.IsKind(SyntaxKind.DefaultLiteralExpression));
            Assert.AreEqual(1, syntax.DescendantNodes().OfType<ReturnStatementSyntax>().Count());
        }

        [TestCase("Id", "id")]
        [TestCase("some_id", "someId")]
        [TestCase("class", "class")]
        public void CompatibilityDocumentationMapsParametersAndPreservesExceptionReasons(string previousName, string currentName)
        {
            var current = CreateOperation(false, currentName);
            var previous = CreatePreviousOperation(current, 24, previousName);
            var id = current.Signature.Parameters[0];
            var expand = current.Signature.Parameters[1];
            current.XmlDocs.Update(exceptions:
            [
                new XmlDocExceptionStatement(typeof(ArgumentException), "has an unsupported value.", [id, expand]),
                new XmlDocExceptionStatement(typeof(InvalidOperationException), "cannot be expanded.", [expand]),
                new XmlDocExceptionStatement(typeof(NotSupportedException), "The service does not support this operation.", [])
            ]);
            string originalDocs = RenderDocs(current.XmlDocs);

            var shim = CreateShim(current, previous);
            var docs = ReadDocs(shim.XmlDocs);
            AssertCurrentDocumentation(docs);
            var parameterName = shim.Signature.Parameters[0].AsVariable().Declaration.RequestedName;
            Assert.AreEqual(parameterName, (string?)docs.Elements("param").First().Attribute("name"));
            Assert.AreEqual("Current identifier.", docs.Elements("param").First().Value.Trim());
            Assert.AreEqual(previousName, shim.Signature.Parameters[0].Name);
            Assert.IsTrue(docs.Elements("exception").Any(e => e.Value.Contains("has an unsupported value.")));
            Assert.IsTrue(docs.Elements("exception").Any(e => e.Value.Contains("The service does not support this operation.")));
            Assert.IsFalse(docs.Elements("exception").Any(e => e.Value.Contains("cannot be expanded.")));
            AssertValidParameterReferences(shim);
            Assert.AreEqual(originalDocs, RenderDocs(current.XmlDocs));
            Assert.AreEqual(currentName, id.Name);
        }

        [Test]
        public void CompatibilityDocumentationPreservesParameterContentAndLaterReordering()
        {
            var current = CreateOperation(false);
            var previous = CreatePreviousOperation(current, 12);
            var id = current.Signature.Parameters[0];
            current.XmlDocs.Update(parameters:
            [
                new XmlDocParamStatement(id, [$"Updated documentation with {typeof(string):C}."],
                    new XmlDocStatement("c", [$"identifier"])),
                .. current.XmlDocs.Parameters.Skip(1)
            ]);
            string originalDocs = RenderDocs(current.XmlDocs);
            var shim = CreateShim(current, previous);
            var parameterDoc = ReadDocs(shim.XmlDocs).Elements("param").First();
            Assert.IsTrue(parameterDoc.Value.Contains("Updated documentation"));
            Assert.IsNotNull(parameterDoc.Element("c"));
            Assert.IsNotNull(parameterDoc.Element("see"));
            Assert.AreEqual("Current identifier.", id.Description.ToString());

            Assert.IsTrue(BackCompatHelper.TryRestorePreviousParameterOrder(shim,
                WithParameters(shim.Signature, shim.Signature.Parameters.Reverse().ToArray())));
            shim.Update(suppressions: []);
            AssertCurrentDocumentation(ReadDocs(shim.XmlDocs));
            Assert.AreEqual(new[] { "cancellationToken", "id" },
                ReadDocs(shim.XmlDocs).Elements("param").Select(p => (string?)p.Attribute("name")));
            AssertValidParameterReferences(shim);
            Assert.AreEqual(originalDocs, RenderDocs(current.XmlDocs));
        }

        [Test]
        public void NullableCompatibilityDocumentationIncludesShimGuard(
            [Values(false, true)] bool async,
            [Values(false, true)] bool addedOptionalParameter)
        {
            var current = CreateOperation(async);
            var value = new ParameterProvider("value", $"Current value.", new CSharpType(typeof(int)));
            var signature = WithParameters(current.Signature,
                addedOptionalParameter ? [value, .. current.Signature.Parameters.Skip(1)] : [value, current.Signature.Parameters[2]]);
            var docsBeforeUpdate = current.XmlDocs;
            docsBeforeUpdate.Update(parameters: signature.Parameters.Select(p => new XmlDocParamStatement(p)).ToArray(), exceptions: []);
            current.Update(signature: signature, xmlDocProvider: docsBeforeUpdate);
            var previousValue = new ParameterProvider("value", $"Stale value.", new CSharpType(typeof(int), isNullable: true), Snippet.Default);
            var previous = new MethodProvider(
                WithParameters(current.Signature, [previousValue, current.Signature.Parameters.Last()]),
                MethodBodyStatement.Empty, new TestTypeProvider(),
                new XmlDocProvider(new XmlDocSummaryStatement([$"Stale summary."])));
            string originalDocs = RenderDocs(current.XmlDocs);

            var shim = CreateShim(current, previous);
            var docs = ReadDocs(shim.XmlDocs);
            AssertCurrentDocumentation(docs);
            Assert.AreEqual("Current value.", docs.Elements("param").First().Value.Trim());
            Assert.IsFalse(docs.Value.Contains("Stale"));
            var nullException = docs.Elements("exception").Single(e => ((string?)e.Attribute("cref"))!.Contains("ArgumentNullException"));
            Assert.AreEqual("value", (string?)nullException.Element("paramref")?.Attribute("name"));
            Assert.IsTrue(shim.Signature.Parameters[0].Type.IsNullable);
            Assert.AreEqual(originalDocs, RenderDocs(current.XmlDocs));
            AssertValidParameterReferences(shim);
        }

        [Test]
        public void ReducedArityCompatibilityDocumentationFiltersRemovedParameter([Values(false, true)] bool async)
        {
            var current = CreateOperation(async);
            current.Signature.Parameters[1].DefaultValue = null;
            var previousParameters = new[]
            {
                new ParameterProvider("id", $"Stale identifier.", new CSharpType(typeof(string))),
                new ParameterProvider("expand", $"Stale expansion.", new CSharpType(typeof(int), isNullable: true), Snippet.Default),
                new ParameterProvider("cancellationToken", $"Stale cancellation.", new CSharpType(typeof(CancellationToken)), Snippet.Default)
            };
            var previous = new MethodProvider(WithParameters(current.Signature, previousParameters),
                MethodBodyStatement.Empty, new TestTypeProvider(),
                new XmlDocProvider(new XmlDocSummaryStatement([$"Stale summary."])));
            string originalDocs = RenderDocs(current.XmlDocs);

            var shim = CreateShim(current, previous);
            AssertCurrentDocumentation(ReadDocs(shim.XmlDocs));
            Assert.AreEqual(new[] { "id", "cancellationToken" }, shim.Signature.Parameters.Select(p => p.Name));
            Assert.IsNotNull(shim.Signature.Parameters[1].DefaultValue);
            AssertValidParameterReferences(shim);
            Assert.AreEqual(originalDocs, RenderDocs(current.XmlDocs));
        }

        [TestCase("absent")]
        [TestCase("empty")]
        [TestCase("inherit")]
        public void CompatibilityDocumentationNeverFallsBackToStaleProse(string documentation)
        {
            var current = CreateOperation(false);
            var previous = CreatePreviousOperation(current, 24);
            var docs = documentation switch
            {
                "absent" => XmlDocProvider.Empty,
                "empty" => new XmlDocProvider(new XmlDocSummaryStatement([$""]), returns: new XmlDocReturnsStatement($"")),
                "inherit" => XmlDocProvider.InheritDocs,
                _ => throw new ArgumentOutOfRangeException(nameof(documentation))
            };
            current.Update(xmlDocProvider: docs);
            string originalDocs = RenderDocs(current.XmlDocs);

            var shim = CreateShim(current, previous);
            Assert.AreEqual(originalDocs, RenderDocs(shim.XmlDocs));
            Assert.AreEqual(originalDocs, RenderDocs(current.XmlDocs));
        }

        [Test]
        public void CompatibilityDocumentationUsesUndocumentedCurrentSignatureWithoutBaselineFallback()
        {
            var current = CreateOperation(false);
            var previous = CreatePreviousOperation(current, 24);
            current = new MethodProvider(
                new MethodSignature(current.Signature.Name, null, current.Signature.Modifiers, current.Signature.ReturnType,
                    null, current.Signature.Parameters),
                Snippet.Null, current.EnclosingType);
            var shim = CreateShim(current, previous);
            var docs = ReadDocs(shim.XmlDocs);
            Assert.IsNull(docs.Element("summary"));
            Assert.IsNull(docs.Element("returns"));
            Assert.AreEqual("Current identifier.", docs.Elements("param").First().Value.Trim());
            Assert.IsFalse(docs.Value.Contains("Stale"));
            AssertValidParameterReferences(shim);
        }

        [Test]
        public async Task CompatibilityDocumentationIsStableAcrossPublishedBaselines()
        {
            string source = File.ReadAllText(Path.Combine(Helpers.GetAssetFileOrDirectoryPath(false), "OperationClient.cs"));
            var compilation = CSharpCompilation.Create("OriginalRelease",
                [CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose))],
                [
                    MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    MetadataReference.CreateFromFile(typeof(EditorBrowsableAttribute).Assembly.Location),
                    MetadataReference.CreateFromFile(Assembly.Load("System.Runtime").Location)
                ],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            string? expectedDocs = null;
            for (int release = 0; release < 3; release++)
            {
                using var dll = new MemoryStream();
                using var xml = new MemoryStream();
                var emitted = compilation.Emit(dll, xmlDocumentationStream: xml);
                Assert.IsTrue(emitted.Success, string.Join(Environment.NewLine, emitted.Diagnostics));
                Assert.IsFalse(emitted.Diagnostics.Any(d => d.Id is "CS1572" or "CS1734"));
                var baseline = CSharpCompilation.Create("Baseline", references:
                [
                    .. compilation.References,
                    MetadataReference.CreateFromImage(dll.ToArray(), documentation: XmlDocumentationProvider.CreateFromBytes(xml.ToArray()))
                ]);
                await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: () => Task.FromResult<Compilation>(baseline), includeXmlDocs: true);
                var current = CreateOperation(false);
                var currentAsync = CreateOperation(true);
                var type = new TestTypeProvider(name: "OperationClient", methods: [current, currentAsync]);
                if (release == 0)
                {
                    var previousDocs = RenderDocs(type.LastContractView!.Methods.First(m => m.Signature.Name == "GetAllAsync").XmlDocs);
                    StringAssert.Contains("Stale summary.", previousDocs);
                    StringAssert.Contains("2026-03-01", previousDocs);
                    StringAssert.DoesNotContain("<list", previousDocs);
                }
                type.ProcessTypeForBackCompatibility();
                var shims = type.Methods.Where(m => m.Signature.Parameters.Count == 2).ToArray();
                Assert.AreEqual(2, shims.Length);
                foreach (var shim in shims)
                {
                    AssertCurrentDocumentation(ReadDocs(shim.XmlDocs));
                    AssertValidParameterReferences(shim);
                    expectedDocs ??= RenderDocs(shim.XmlDocs);
                    Assert.AreEqual(expectedDocs, RenderDocs(shim.XmlDocs), $"Release {release}");
                }
                string output = new TypeProviderWriter(type).Write().Content;
                compilation = CSharpCompilation.Create($"Release{release}",
                    [CSharpSyntaxTree.ParseText(output, new CSharpParseOptions(documentationMode: DocumentationMode.Diagnose))],
                    compilation.References, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            }
        }

        private static MethodProvider CreateOperation(bool async, string idName = "id")
        {
            var id = new ParameterProvider(idName, $"Current identifier.", new CSharpType(typeof(string)));
            var expand = new ParameterProvider("expand", $"Current expansion.", new CSharpType(typeof(int), isNullable: true),
                Snippet.Default, location: ParameterLocation.Query);
            var cancellation = new ParameterProvider("cancellationToken", $"Current cancellation.", new CSharpType(typeof(CancellationToken)),
                Snippet.Default, location: ParameterLocation.Query);
            var docs = new XmlDocProvider(
                new XmlDocSummaryStatement([$"Current operation returning {typeof(string):C}."],
                    new XmlDocStatement($"<list type=\"bullet\">", $"</list>", [],
                        new XmlDocStatement("item", [],
                            new XmlDocStatement("term", [$"Default Api Version"]),
                            new XmlDocStatement("description", [$"2026-04-01"])))),
                [new XmlDocParamStatement(id), new XmlDocParamStatement(expand), new XmlDocParamStatement(cancellation)],
                [
                    new XmlDocExceptionStatement(typeof(ArgumentNullException), [id, expand]),
                    new XmlDocExceptionStatement(typeof(ArgumentException), [expand]),
                    new XmlDocExceptionStatement(typeof(InvalidOperationException), "The operation failed.", [])
                ],
                new XmlDocReturnsStatement($"Current result as {typeof(string):C}."));
            return new MethodProvider(
                new MethodSignature(async ? "GetAllAsync" : "GetAll", $"Signature description.", MethodSignatureModifiers.Public,
                    new CSharpType(async ? typeof(Task<string>) : typeof(string)), $"Signature return.", [id, expand, cancellation]),
                Snippet.Null, new TestTypeProvider(), docs);
        }

        private static MethodProvider CreatePreviousOperation(MethodProvider current, int indentation, string idName = "id")
        {
            var continuation = new string(' ', indentation) + "Default Api Version.2026-03-01.";
            return new MethodProvider(
                new MethodSignature(current.Signature.Name, $"Stale summary.\n{continuation}", MethodSignatureModifiers.Public,
                    current.Signature.ReturnType, $"Stale return.",
                    [
                        new ParameterProvider(idName, $"Stale identifier.", new CSharpType(typeof(string))),
                        new ParameterProvider("cancellationToken", $"Stale cancellation.", new CSharpType(typeof(CancellationToken)), Snippet.Default)
                    ]),
                MethodBodyStatement.Empty, new TestTypeProvider());
        }

        private static MethodProvider CreateShim(MethodProvider current, MethodProvider previous)
        {
            var type = new CompatibilityTestType(current, previous);
            var methods = new List<MethodProvider> { current };
            BackCompatHelper.AddBackCompatOverloads(type, methods);
            Assert.AreEqual(2, methods.Count);
            return methods[1];
        }

        private static MethodSignature WithParameters(MethodSignature signature, IReadOnlyList<ParameterProvider> parameters)
            => new MethodSignature(signature.Name, signature.Description, signature.Modifiers, signature.ReturnType, signature.ReturnDescription, parameters);

        private static string RenderDocs(XmlDocProvider docs)
        {
            using var writer = new CodeWriter();
            writer.WriteXmlDocsNoScope(docs);
            return writer.ToString(false);
        }

        private static XElement ReadDocs(XmlDocProvider docs)
            => XElement.Parse("<member>" + string.Join("\n", RenderDocs(docs).Split('\n')
                .Where(line => line.StartsWith("///")).Select(line => line[3..])) + "</member>");

        private static void AssertCurrentDocumentation(XElement docs)
        {
            Assert.IsTrue(docs.Element("summary")!.Value.Contains("Current operation"));
            Assert.IsNotNull(docs.Element("summary")!.Element("list")?.Element("item")?.Element("term"));
            Assert.IsTrue(docs.Element("summary")!.Value.Contains("2026-04-01"));
            Assert.IsTrue(docs.Element("summary")!.Descendants("see").Any());
            Assert.IsTrue(docs.Element("returns")!.Value.Contains("Current result"));
            Assert.IsTrue(docs.Element("returns")!.Descendants("see").Any());
            Assert.IsFalse(docs.Value.Contains("Stale"));
            Assert.IsFalse(docs.Value.Contains("2026-03-01"));
        }

        private static void AssertValidParameterReferences(MethodProvider method)
        {
            var names = method.Signature.Parameters.Select(p => p.AsVariable().Declaration.RequestedName).ToHashSet();
            var docs = ReadDocs(method.XmlDocs);
            foreach (var element in docs.Descendants().Where(e => e.Name.LocalName is "param" or "paramref"))
            {
                Assert.Contains((string?)element.Attribute("name"), names.ToArray());
            }
        }

        private sealed class CompatibilityTestType(MethodProvider current, MethodProvider previous)
            : TestTypeProvider(methods: [current])
        {
            private protected override TypeProvider? BuildLastContractView(string? generatedTypeName = null, string? generatedTypeNamespace = null)
                => new TestTypeProvider(methods: [previous]);
        }
    }
}
