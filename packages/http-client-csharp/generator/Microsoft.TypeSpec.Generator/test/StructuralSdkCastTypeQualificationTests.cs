// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    // Portable policy regressions reproduce the SDK's cast/member-receiver shape
    // and real framework interface/writer metadata. They supplement, not replace,
    // the authenticated original 2699-document/20-reference SDK replay.
    [NonParallelizable]
    public class StructuralSdkCastTypeQualificationTests
    {
        private string? _previous;
        private string _directory = null!;
        private const string FullArgument = "global::Azure.ResourceManager.AppService.AiGatewayData";

        [SetUp]
        public void SetUp()
        {
            _previous = Environment.GetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER");
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", "structural");
            _directory = Path.Combine(Path.GetTempPath(), "typespec-sdk-cast", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_directory);
            MockHelpers.LoadMockGenerator(outputPath: _directory, configuration: "{\"package-name\":\"Sample\",\"disable-xml-docs\":true}");
        }

        [TearDown]
        public void TearDown()
        {
            Environment.SetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER", _previous);
            Directory.Delete(_directory, recursive: true);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void SdkCastReceiverShortensCompleteConstructedType(bool conditionalDocument)
        {
            var code = Build(conditionalDocument);
            var text = Reduce(code);
            StringAssert.Contains("((IPersistableModel<AiGatewayData>)this).GetFormatFromOptions(options)", text);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void RecordedQualifiedParameterWitnessShortensCast(bool conditionalDocument)
        {
            var code = Build(conditionalDocument, recordedParameter: true);
            StringAssert.Contains("((IPersistableModel<AiGatewayData>)this).GetFormatFromOptions(options)", Reduce(code));
        }

        [Test]
        public void ImportedModelArgumentRetainsUnusedImport()
        {
            var model = new CSharpType("Model", "Models", false, false, null, Array.Empty<CSharpType>(), true, false);
            var target = new CSharpType("I", "Contracts", false, false, null, new[] { model }, true, false);
            using var writer = new CodeWriter();
            writer.AppendRaw("namespace Contracts { public class Options {} public interface I<T> { string Run(Options options); } }\nnamespace Models { public class Model {} }\nnamespace App { public class Host : global::Contracts.I<global::Models.Model> {\npublic string Test(Options options) => ((");
            writer.Append($"{target}");
            writer.AppendRaw(")this).Run(options);\npublic string Run(Options options) => \"\";\n} }\n");
            var code = new CodeFile(writer.ToString(), "ImportedArgument.cs", writer.TypeReferences);
            StringAssert.Contains("((I<global::Models.Model>)this).Run(options)", Reduce(code));
        }

        [Test]
        public void FrameworkVaryingOwningMethodRetainsCast()
        {
            var code = Build(conditionalDocument: true, varyingOwner: true);
            StringAssert.Contains("((global::System.ClientModel.Primitives.IPersistableModel<" + FullArgument + ">)this)", Reduce(code));
        }

        [Test]
        public void CallerArgumentExpressionRetainsObservedCast()
        {
            var code = Build(captured: true);
            StringAssert.Contains("((global::System.ClientModel.Primitives.IPersistableModel<" + FullArgument + ">)this)", Reduce(code));
        }

        [Test]
        public void HiddenCastRetainsSpelling()
        {
            var code = Build(hidden: true);
            StringAssert.Contains("((global::System.ClientModel.Primitives.IPersistableModel<" + FullArgument + ">)this)", Reduce(code));
        }

        [Test]
        public void UnrecordedArgumentCannotLoseItsQualification()
        {
            var code = Build();
            code = new CodeFile(code.Content, code.Name, code.TypeReferences!.Where(s => s.Type.Name != "AiGatewayData").ToArray());
            StringAssert.Contains("IPersistableModel<" + FullArgument + ">", Reduce(code));
        }

        [Test]
        public void DuplicateHeadProvenanceRetainsWholeCast()
        {
            var code = Build();
            var head = code.TypeReferences!.Single(s => s.Type.Name == "IPersistableModel");
            code = new CodeFile(code.Content, code.Name, code.TypeReferences!.Concat(new[] { head }).ToArray());
            StringAssert.Contains("((global::System.ClientModel.Primitives.IPersistableModel<" + FullArgument + ">)this)", Reduce(code));
        }

        [Test]
        public void UnusedFrameworkImportIsNotActivatedByCast()
        {
            var code = Build(noImportWitness: true);
            StringAssert.Contains("((global::System.ClientModel.Primitives.IPersistableModel<" + FullArgument + ">)this)", Reduce(code));
        }

        private static CodeFile Build(bool conditionalDocument = false, bool varyingOwner = false, bool captured = false, bool hidden = false, bool noImportWitness = false, bool recordedParameter = false)
        {
            var model = new CSharpType("AiGatewayData", "Azure.ResourceManager.AppService", false, false, null,
                Array.Empty<CSharpType>(), true, false);
            var target = new CSharpType(typeof(IPersistableModel<>), model);
            using var writer = new CodeWriter();
            writer.AppendRaw("using System;\nnamespace Azure.ResourceManager.AppService {\npublic partial class AiGatewayData : ");
            writer.AppendRaw(noImportWitness ? "global::System.ClientModel.Primitives.IPersistableModel<" + FullArgument + "> {\n" : "IPersistableModel<AiGatewayData> {\n");
            if (hidden) writer.AppendRaw("#line hidden\n");
            writer.AppendRaw("public string PersistableModelCreateCore(");
            if (recordedParameter) writer.Append($"{new CSharpType(typeof(ModelReaderWriterOptions))}");
            else writer.AppendRaw(noImportWitness ? "global::System.ClientModel.Primitives.ModelReaderWriterOptions" : "ModelReaderWriterOptions");
            writer.AppendRaw(" options) {\n");
            if (varyingOwner) writer.AppendRaw("#if NET6_0_OR_GREATER\nint framework = 6;\n#else\nint framework = 0;\n#endif\n");
            writer.AppendRaw(captured ? "return Capture(((" : "return ((");
            writer.Append($"{target}");
            writer.AppendRaw(captured ? ")this).GetFormatFromOptions(options));\n}\n" : ")this).GetFormatFromOptions(options);\n}\n");
            if (hidden) writer.AppendRaw("#line default\n");
            if (conditionalDocument && !varyingOwner)
                writer.AppendRaw("public int FrameworkVariation() {\n#if NET6_0_OR_GREATER\nreturn 6;\n#else\nreturn 0;\n#endif\n}\n");
            var declarations = "BinaryData IPersistableModel<AiGatewayData>.Write(ModelReaderWriterOptions options) => null;\nAiGatewayData IPersistableModel<AiGatewayData>.Create(BinaryData data, ModelReaderWriterOptions options) => this;\nstring IPersistableModel<AiGatewayData>.GetFormatFromOptions(ModelReaderWriterOptions options) => \"J\";\n";
            if (noImportWitness) declarations = declarations.Replace("BinaryData", "global::System.BinaryData", StringComparison.Ordinal)
                .Replace("IPersistableModel<AiGatewayData>", "global::System.ClientModel.Primitives.IPersistableModel<" + FullArgument + ">", StringComparison.Ordinal)
                .Replace("ModelReaderWriterOptions", "global::System.ClientModel.Primitives.ModelReaderWriterOptions", StringComparison.Ordinal);
            writer.AppendRaw(declarations);
            if (captured) writer.AppendRaw("static string Capture(string value, [System.Runtime.CompilerServices.CallerArgumentExpression(\"value\")] string source = null) => value;\n");
            writer.AppendRaw("}\n}\n");
            return new CodeFile(writer.ToString(), "AiGatewayData.Serialization.cs", writer.TypeReferences);
        }

        private static void PreserveDiagnostics(CodeFile code, string output, Compilation before, Compilation after, SyntaxTree oldTree, SyntaxTree newTree)
        {
            // Every accepted source change must be a witnessed writer namespace
            // deletion. Project diagnostics through those actual UTF16 erasures,
            // never through arbitrary offsets or a location-free comparison.
            var allowed = code.TypeReferences!.GroupBy(s => s.Span.Start).ToDictionary(g => g.Key,
                g => "global::" + g.First().Type.Namespace + ".");
            var edits = new List<TextSpan>();
            int oldPosition = 0, newPosition = 0;
            while (oldPosition < code.Content.Length)
            {
                if (newPosition < output.Length && code.Content[oldPosition] == output[newPosition]) { oldPosition++; newPosition++; continue; }
                Assert.That(allowed.TryGetValue(oldPosition, out var prefix), Is.True, "Only actual writer namespace-prefix deletion is allowed");
                Assert.That(code.Content.AsSpan(oldPosition).StartsWith(prefix.AsSpan(), StringComparison.Ordinal), Is.True);
                edits.Add(new TextSpan(oldPosition, prefix!.Length));oldPosition += prefix.Length;
            }
            Assert.That(newPosition, Is.EqualTo(output.Length));
            int Map(int offset) => offset - edits.Where(e => e.End <= offset).Sum(e => e.Length);
            string LocationKey(Location location, bool project)
            {
                if (!location.IsInSource) return location.Kind.ToString();
                var span = location.SourceSpan;var tree = location.SourceTree!;
                if (project && ReferenceEquals(tree, oldTree))
                {
                    Assert.That(edits.Any(e => span.Start < e.End && span.End > e.Start || span.Length == 0 && span.Start >= e.Start && span.Start < e.End), Is.False, "A diagnostic intersecting erased text cannot be waived");
                    span = TextSpan.FromBounds(Map(span.Start), Map(span.End));tree = newTree;
                }
                string Line(FileLinePositionSpan line) => line.Path + "|" + line.HasMappedPath + "|" + line.IsValid + "|" + line.StartLinePosition.Line + ":" + line.StartLinePosition.Character + "-" + line.EndLinePosition.Line + ":" + line.EndLinePosition.Character;
                return location.Kind + "|" + tree.FilePath + "|" + span.Start + ":" + span.End + "|" + Line(tree.GetLineSpan(span)) + "|" + Line(tree.GetMappedLineSpan(span));
            }
            string[] Bag(IEnumerable<Diagnostic> diagnostics, bool project) => diagnostics.Select(d => JsonSerializer.Serialize(new
            {
                d.Id, severity = d.Severity.ToString(), defaultSeverity = d.DefaultSeverity.ToString(), d.IsSuppressed, d.IsWarningAsError, d.WarningLevel,
                message = d.GetMessage(System.Globalization.CultureInfo.InvariantCulture),
                descriptor = new { title = d.Descriptor.Title.ToString(), messageFormat = d.Descriptor.MessageFormat.ToString(), description = d.Descriptor.Description.ToString(), d.Descriptor.Category, d.Descriptor.IsEnabledByDefault, d.Descriptor.HelpLinkUri, tags = d.Descriptor.CustomTags.ToArray() },
                properties = d.Properties.OrderBy(p => p.Key, StringComparer.Ordinal).ToArray(), primary = LocationKey(d.Location, project), additional = d.AdditionalLocations.Select(l => LocationKey(l, project)).ToArray()
            })).OrderBy(x => x, StringComparer.Ordinal).ToArray();
            Assert.That(Bag(after.GetDiagnostics(), false), Is.EqualTo(Bag(before.GetDiagnostics(), true)), "Complete compiler diagnostic multiset, including hidden imports and all location endpoints");
            using var oldPe = new MemoryStream();using var oldXml = new MemoryStream();using var newPe = new MemoryStream();using var newXml = new MemoryStream();
            var oldEmit = before.Emit(oldPe, xmlDocumentationStream: oldXml);var newEmit = after.Emit(newPe, xmlDocumentationStream: newXml);
            Assert.That(newEmit.Success, Is.EqualTo(oldEmit.Success));
            Assert.That(Bag(newEmit.Diagnostics, false), Is.EqualTo(Bag(oldEmit.Diagnostics, true)), "Complete emit diagnostic multiset");
            if (oldEmit.Success) Assert.That(newXml.ToArray(), Is.EqualTo(oldXml.ToArray()));
        }

        private static string Reduce(CodeFile code)
        {
            using var workspace = new AdhocWorkspace();
            var paths = new[] { typeof(object).Assembly.Location, typeof(IPersistableModel<>).Assembly.Location,
                typeof(BinaryData).Assembly.Location, Path.Combine(RuntimeEnvironment.GetRuntimeDirectory(), "System.Runtime.dll") };
            var project = workspace.AddProject("SdkCastControl", LanguageNames.CSharp)
                .WithParseOptions(new CSharpParseOptions(documentationMode: DocumentationMode.Parse, preprocessorSymbols: new[] { "EXPERIMENTAL" }))
                .WithCompilationOptions(new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary,
                    metadataReferenceResolver: new WorkspaceMetadataReferenceResolver(), nullableContextOptions: NullableContextOptions.Disable))
                .AddMetadataReferences(paths.Distinct().Select(path => MetadataReference.CreateFromFile(path)));
            var document = project.AddDocument(code.Name, SourceText.From(code.Content), new[] { "Generated" });
            var before = document.Project.GetCompilationAsync().GetAwaiter().GetResult()!;
            var tree = document.GetSyntaxTreeAsync().GetAwaiter().GetResult()!;
            Assert.That(before.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty, "Valid original framework cast fixture");
            var root = tree.GetRoot();
            var rewriter = new StructuralTypeNameReducer(before).CreateRewriter(root, code.TypeReferences!);
            var text = rewriter?.Visit(root)?.ToFullString() ?? code.Content;
            var candidate = document.WithText(SourceText.From(text));
            var after = candidate.Project.GetCompilationAsync().GetAwaiter().GetResult()!;
            Assert.That(after.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            PreserveDiagnostics(code, text, before, after, tree, candidate.GetSyntaxTreeAsync().GetAwaiter().GetResult()!);
            if (code.Content.Contains("CreateCore(global::System.ClientModel.Primitives.ModelReaderWriterOptions", StringComparison.Ordinal))
                Assert.That(before.GetDiagnostics().Any(d => d.Id == "CS8019" && d.Severity == DiagnosticSeverity.Hidden), Is.True, "Unused-import regression anchor");
            string Snapshot(Compilation compilation, SyntaxTree syntaxTree)
            {
                var model = compilation.GetSemanticModel(syntaxTree);
                var cast = syntaxTree.GetRoot().DescendantNodes().OfType<CastExpressionSyntax>().Single(c => c.Expression is ThisExpressionSyntax);
                var conversion = (IConversionOperation)model.GetOperation(cast)!;
                var invocation = (IInvocationOperation)model.GetOperation(cast.Ancestors().OfType<InvocationExpressionSyntax>().First())!;
                return StructuralTypeNameRuleOracleTests.TypeIdentity(conversion.Type!) + "|" + conversion.Conversion.IsReference + "|" + conversion.IsChecked + "|" +
                    invocation.TargetMethod.ContainingType.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat) + "|" + invocation.TargetMethod.GetDocumentationCommentId();
            }
            Assert.That(Snapshot(after, candidate.GetSyntaxTreeAsync().GetAwaiter().GetResult()!), Is.EqualTo(Snapshot(before, tree)));
            return text;
        }
    }
}
