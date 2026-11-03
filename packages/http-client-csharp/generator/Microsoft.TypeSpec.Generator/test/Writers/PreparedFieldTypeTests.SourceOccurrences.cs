// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Collections;
using System.Collections.Immutable;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [Test]
        public void SourceOccurrenceTraversalCoversCallsInsideConstructionAndExpressionClosures()
        {
            var inner = Static<string>().Invoke(nameof(string.Concat), new ValueExpression[] { Literal("a"), Literal("b") });
            var lambda = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(),
                new NewInstanceExpression(typeof(Exception), new ValueExpression[] { inner }));
            var owner = new OccurrenceOwner(lambda);
            owner.EnsureBuilt();
            var file = new TypeProviderWriter(owner).Write();
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(p => MetadataReference.CreateFromFile(p));
            var tree = CSharpSyntaxTree.ParseText(file.Content);
            var compilation = CSharpCompilation.Create("OccurrenceOracle", new[] { tree }, references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var writtenCalls = tree.GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>().Count();
            Assert.That(writtenCalls, Is.EqualTo(1));
            Assert.That(InspectExecutableCalls(owner), Is.EqualTo(writtenCalls),
                "Pure preparation must see the actual nested emitted children, not rely on the incomplete mutating visitor.");
        }

        [Test]
        public void SourceOccurrenceStandardWriterConsumesStructuredRootsWithoutChangingOutput()
        {
            var owner = new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(),
                new NewInstanceExpression(typeof(Exception), Array.Empty<ValueExpression>())));
            owner.EnsureBuilt();
            var baseline = new TypeProviderWriter(owner).Write().Content;
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CurrentCompilation, _ => true);
            var source = prepared.SourceFiles.Single();
            Assert.That(source.IsCurrent(), Is.True);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.Content, Is.EqualTo(baseline));
            Assert.That(file.SourceConsumption, Is.Not.Null);
            Assert.That(file.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(file.SourceConsumption.Consumed.Distinct().Count(), Is.EqualTo(file.SourceConsumption.Consumed.Length));
            Assert.That(file.SourceConsumption.Consumed.Any(id => id.RootRole == "method" && id.EdgePath.Contains("expression-body")), Is.True);
        }

        private static int InspectExecutableCalls(OccurrenceOwner owner)
        {
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, CurrentCompilation, _ => true);
            return prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Count(n => n.Producer is InvokeMethodExpression);
        }

        [Test]
        public void SourceOccurrenceSharedObjectsHaveDistinctSiblingOwnerAndGenerationIdentities()
        {
            var shared = Literal("shared");
            var first = new OccurrenceOwner(shared, "First", typeof(string));
            var second = new OccurrenceOwner(shared, "Second", typeof(string));
            first.EnsureBuilt(); second.EnsureBuilt();
            var method = new MethodProvider(new MethodSignature("Other", null, MethodSignatureModifiers.Public, typeof(string), null,
                Array.Empty<ParameterProvider>()), shared, first);
            first.Update(methods: new[] { first.Methods[0], method });
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { first, second }, SourceCompilation(), _ => true);
            var edges = prepared.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf())
                .Where(n => ReferenceEquals(n.Producer, shared)).ToArray();
            Assert.That(edges.Length, Is.EqualTo(3));
            Assert.That(edges.Select(n => n.Id).Distinct().Count(), Is.EqualTo(3));
            var firstFile = new TypeProviderWriter(first) { PreparedFieldTypes = prepared }.Write();
            var secondFile = new TypeProviderWriter(second) { PreparedFieldTypes = prepared }.Write();
            Assert.That(firstFile.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(secondFile.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            using var another = PreparedFieldTypes.Create(new TypeProvider[] { first, second }, SourceCompilation(), _ => true);
            Assert.That(another.SourceGeneration, Is.Not.EqualTo(prepared.SourceGeneration));
            Assert.That(another.SourceFiles.SelectMany(f => f.Roots).SelectMany(r => r.DescendantsAndSelf())
                .Where(n => ReferenceEquals(n.Producer, shared)).Select(n => n.Id).Intersect(edges.Select(n => n.Id)), Is.Empty);
        }

        [Test]
        public void SourceOccurrenceSharedCapturedAndOrdinaryArgumentRootsRemainIndependent()
        {
            var compilation = SourceCompilation();
            var value = new ParameterProvider("value", $"", typeof(object));
            var text = new ParameterProvider("text", $"", typeof(string), Literal(""), attributes: new AttributeStatement[]
            { new(typeof(CallerArgumentExpressionAttribute), Literal("value")) });
            var captured = new MethodSignature("Captured", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                typeof(object), null, new[] { value, text });
            var plain = new MethodSignature("Plain", null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                typeof(object), null, new[] { value });
            var shared = New.Instance(typeof(object));
            var body = new TupleExpression(new InvokeMethodExpression(null, captured, new ValueExpression[] { shared }),
                new InvokeMethodExpression(null, plain, new ValueExpression[] { shared }));
            var owner = new OccurrenceOwner(body);
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var calls = nodes.Where(n => n.Producer is InvokeMethodExpression).ToArray();
            Assert.That(calls[0].DeclaredArguments!.ImplicitCallerExpressionInputs, Is.EqualTo(new[] { 0 }));
            Assert.That(calls[1].DeclaredArguments!.ImplicitCallerExpressionInputs, Is.Empty);
            var occurrences = nodes.Where(n => ReferenceEquals(n.Producer, shared)).ToArray();
            Assert.That(occurrences.Length, Is.EqualTo(2));
            Assert.That(occurrences[0].Id, Is.Not.EqualTo(occurrences[1].Id));
            Assert.That(occurrences.All(n => n.IntrinsicSource.Visibility == SourceFactState.Unavailable), Is.True,
                "A declaration-relative map cannot manufacture original source/edit authority.");
        }

        [TestCase("retained-list")]
        [TestCase("replacement")]
        [TestCase("keyword")]
        [TestCase("lambda")]
        public void SourceOccurrenceObservedDivergenceIsStickyAfterRestoration(string kind)
        {
            var keyword = new KeywordExpression("null", null);
            var args = new List<ValueExpression> { keyword };
            var call = new InvokeMethodExpression(null, "Factory", args);
            var owner = new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), call));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var source = prepared.SourceFiles.Single();
            Assert.That(source.IsCurrent(), Is.True);
            var originalBody = owner.Methods[0].BodyExpression!;
            Action restore;
            switch (kind)
            {
                case "retained-list": args.Add(Null); restore = () => args.RemoveAt(1); break;
                case "replacement": call.Update(arguments: new ValueExpression[] { Null }); restore = () => call.Update(arguments: args); break;
                case "keyword": keyword.Update("default", null); restore = () => keyword.Update("null", null); break;
                default:
                    owner.Methods[0].Update(bodyExpression: new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), Null));
                    restore = () => owner.Methods[0].Update(bodyExpression: originalBody); break;
            }
            Assert.That(source.IsCurrent(), Is.False);
            restore();
            Assert.That(source.IsCurrent(), Is.False);
            Assert.That(prepared.GetSourceFile(owner), Is.SameAs(source), "No re-prepare or replacement view after invalidation.");
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.SourceConsumption!.WasCurrentAtEndOfWrite, Is.False);
        }

        [Test]
        public void SourceOccurrencePreparationAndResetObservationNeverExecuteOpaqueCallbacksOrBuilders()
        {
            int callbacks = 0;
            var opaque = new SourceCallbackExpression(writer => { callbacks++; writer.AppendRaw("null"); });
            var owner = new OccurrenceOwner(opaque);
            owner.EnsureBuilt();
            int builds = owner.MethodBuilds;
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            Assert.That(callbacks, Is.EqualTo(0));
            var node = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).Single(n => ReferenceEquals(n.Producer, opaque));
            Assert.That(node.IsOpaque, Is.True);
            Assert.That(node.IntrinsicSource.Provenance, Is.EqualTo(SourceProvenance.Opaque));
            owner.ResetMethods();
            Assert.That(prepared.SourceFiles.Single().IsCurrent(), Is.False);
            Assert.That(owner.MethodBuilds, Is.EqualTo(builds));
            Assert.That(callbacks, Is.EqualTo(0));
        }

        [Test]
        public void SourceOccurrenceUnknownCollectionsAreOpaqueWithoutInvokingGettersOrEnumerators()
        {
            var opaqueList = new SourceOpaqueList<ValueExpression>();
            var call = new InvokeMethodExpression(null, "Factory", opaqueList);
            var node = PreparedSourceOccurrence.Capture(new(Guid.NewGuid(), "file.cs", "member", "body", 0, "$"), call, true, SourceCompilation(), true);
            Assert.That(node.IsOpaque, Is.True);
            Assert.That(node.UnavailableReason, Does.Contain("Unowned"));
            Assert.That(node.IntrinsicSource.Tokens, Is.EqualTo(SourceFactState.Unavailable));
            Assert.That(node.IsCurrent(), Is.True, "An explicitly opaque boundary is not a known-safe leaf.");
            var dictionary = new ObjectInitializerExpression(new SourceOpaqueDictionary());
            var dictionaryNode = PreparedSourceOccurrence.Capture(node.Id with { EdgePath = "$/initializer" }, dictionary, true, SourceCompilation(), true);
            Assert.That(dictionaryNode.IsOpaque, Is.True);
            using var unknownRoots = PreparedFieldTypes.Create(new SourceOpaqueList<TypeProvider>(), SourceCompilation(), _ => true);
            Assert.That(unknownRoots.SourceFiles, Is.Empty);
        }

        [Test]
        public void SourceOccurrenceBodyInvalidationDoesNotDisableIndependentPreparedFieldPositiveOrReplay()
        {
            var target = Target();
            var literal = new KeywordExpression("null", null);
            int callbacks = 0;
            var callback = new SourceCallbackExpression(writer =>
            {
                callbacks++;
                Assert.That(writer.CurrentSourceOccurrence!.IsOpaque, Is.True);
                literal.Update("default", null);
                writer.AppendRaw("null");
            });
            var owner = new OccurrenceOwner(new TupleExpression(callback, literal), targetType: target.Type);
            owner.EnsureBuilt(); target.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner, target }, SourceCompilation(), _ => true);
            Assert.That(callbacks, Is.EqualTo(0));
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(callbacks, Is.EqualTo(1));
            Assert.That(file.SourceConsumption!.WasCurrentAtEndOfWrite, Is.False);
            Assert.That(file.Content, Does.Contain("Widget _value"));
            Assert.That(prepared.CanWriteSimpleName(owner, owner.Fields[0]), Is.True);
            Assert.That(prepared.CanCommit(), Is.True, "Only existing field dependencies authorize field choices; opaque/stale body facts are independent.");
        }

        [Test]
        public void SourceOccurrenceStructuredBlockLambdaCompilesAndIsConsumed()
        {
            var lambda = new FuncExpression(Array.Empty<CodeWriterDeclaration?>(),
                new MethodBodyStatements(new MethodBodyStatement[] { Return(New.Instance(typeof(Exception))) }));
            var owner = new OccurrenceOwner(lambda);
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(file.SourceConsumption.Consumed.Any(i => i.EdgePath.Contains("block-body/statement[0]")), Is.True);
            Assert.That(SourceCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(file.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void SourceOccurrenceForeachCollectionAndBodyAndBothConditionalVariantsHaveDistinctEdges(bool async)
        {
            var shared = Static<string>().Invoke(nameof(string.Concat), new ValueExpression[] { Literal("a"), Literal("b") });
            var loop = new ForEachStatement(typeof(char), "item", shared, async, out _)
            { new ExpressionStatement(shared) };
            var condition = new IfElsePreprocessorStatement("FEATURE", loop, new ExpressionStatement(shared));
            var owner = new OccurrenceOwner(Null);
            owner.EnsureBuilt();
            owner.Methods[0].Update(bodyStatements: condition);
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            var uses = nodes.Where(n => ReferenceEquals(n.Producer, shared)).ToArray();
            Assert.That(uses.Length, Is.EqualTo(3));
            Assert.That(uses.Select(n => n.Id).Distinct().Count(), Is.EqualTo(3));
            Assert.That(uses.Any(n => n.Id.EdgePath.Contains("collection")), Is.True);
            Assert.That(uses.Any(n => n.Id.EdgePath.Contains("body[0]")), Is.True);
            Assert.That(uses.Any(n => n.Id.EdgePath.Contains("else-variant")), Is.True);
            Assert.That(uses.All(n => n.IntrinsicSource.WithinConditional), Is.True);
            Assert.That(uses.All(n => n.IntrinsicSource.InactiveVariants == SourceFactState.Present), Is.True);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
        }

        [Test]
        public void SourceOccurrenceStructuredBranchesLoopsTryUsingAndInitializersMatchWriterOrder()
        {
            ValueExpression Call() => Static<string>().Invoke(nameof(string.Concat), new ValueExpression[] { Literal("a"), Literal("b") });
            var loop = new ForStatement(null, False, null) { new ExpressionStatement(Call()) };
            var @while = new WhileStatement(False) { new ExpressionStatement(Call()) };
            var @do = new DoWhileStatement(False) { new ExpressionStatement(Call()) };
            var @if = new IfElseStatement(new IfStatement(True) { new ExpressionStatement(Call()) }, new ExpressionStatement(Call()));
            var @try = new TryCatchFinallyStatement(new TryExpression(new MethodBodyStatements(new MethodBodyStatement[] { new ExpressionStatement(Call()) })),
                new CatchExpression(new DeclarationExpression(typeof(Exception), "ex"), new ExpressionStatement(Call())),
                new FinallyExpression(new ExpressionStatement(Call())));
            var @using = new UsingScopeStatement(typeof(MemoryStream), "stream", New.Instance(typeof(MemoryStream)), out _)
            { new ExpressionStatement(Call()) };
            var objectInit = new NewInstanceExpression(typeof(Exception), Array.Empty<ValueExpression>(),
                new ObjectInitializerExpression(new Dictionary<ValueExpression, ValueExpression> { [Identifier("Source")] = Literal("test") }, true));
            var dictionaryInit = New.Dictionary(typeof(string), typeof(object), new Dictionary<ValueExpression, ValueExpression> { [Literal("key")] = New.Instance(typeof(object)) });
            var local = new DeclareLocalFunctionStatement(new CodeWriterDeclaration("Local"), Array.Empty<ParameterProvider>(), typeof(string), Call());
            var block = new MethodBodyStatements(new MethodBodyStatement[] { loop, @while, @do, @if, @try, @using,
                new ExpressionStatement(objectInit), new ExpressionStatement(dictionaryInit), local });
            var owner = new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), block), returnType: typeof(Action));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(SourceCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(file.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var nodes = prepared.SourceFiles.Single().Roots.SelectMany(r => r.DescendantsAndSelf()).ToArray();
            Assert.That(nodes.Any(n => n.Id.EdgePath.Contains("resource")), Is.True);
            Assert.That(nodes.Any(n => n.Id.EdgePath.Contains("key[0]")), Is.True);
            Assert.That(nodes.Any(n => n.Id.EdgePath.Contains("finally")), Is.True);
        }

        [Test]
        public void SourceOccurrenceConstructorParameterInitializerAndPropertyRootsAreActuallyConsumed()
        {
            var owner = new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), New.Instance(typeof(Exception))));
            owner.EnsureBuilt();
            var value = new ParameterProvider("value", $"", typeof(object));
            var text = new ParameterProvider("text", $"", typeof(string), Literal(""), attributes: new AttributeStatement[]
            { new(typeof(CallerArgumentExpressionAttribute), Literal("value")) });
            var target = new ConstructorProvider(new ConstructorSignature(owner.Type, null, MethodSignatureModifiers.Public, new[] { value, text }),
                MethodBodyStatement.Empty, owner);
            var chain = new ConstructorProvider(new ConstructorSignature(owner.Type, null, MethodSignatureModifiers.Public, Array.Empty<ParameterProvider>(),
                initializer: new ConstructorInitializer(false, target, new ValueExpression[] { Null })), MethodBodyStatement.Empty, owner);
            var property = new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(string), "Text",
                new ExpressionPropertyBody(Literal("get")), owner);
            var auto = new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(object), "Value",
                new AutoPropertyBody(true, MethodSignatureModifiers.None, New.Instance(typeof(object))), owner);
            owner.Update(constructors: new[] { target, chain }, properties: new[] { property, auto });
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            var ids = file.SourceConsumption.Consumed;
            Assert.That(ids.Any(i => i.RootRole == "constructor" && i.EdgePath.Contains("parameter[1]/attribute[0]")), Is.True);
            Assert.That(ids.Any(i => i.RootRole == "constructor" && i.EdgePath.Contains("parameter[1]/default")), Is.True);
            Assert.That(ids.Any(i => i.RootRole == "constructor" && i.EdgePath.Contains("initializer/argument[0]")), Is.True);
            Assert.That(ids.Any(i => i.RootRole == "property" && i.EdgePath.Contains("getter")), Is.True);
            Assert.That(ids.Any(i => i.RootRole == "property" && i.EdgePath.Contains("initializer")), Is.True);
            Assert.That(SourceCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(file.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [Test]
        public void SourceOccurrenceGenerationRootListChangesInvalidateWithoutRepreparation()
        {
            var owner = new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), New.Instance(typeof(Exception))));
            owner.EnsureBuilt();
            var roots = new List<TypeProvider> { owner };
            using var prepared = PreparedFieldTypes.Create(roots, SourceCompilation(), _ => true);
            var source = prepared.SourceFiles.Single();
            Assert.That(source.IsCurrent(), Is.True);
            roots.Clear();
            prepared.ObserveSourceSnapshot();
            roots.Add(owner);
            Assert.That(source.IsCurrent(), Is.False);
            Assert.That(prepared.SourceGeneration, Is.EqualTo(source.Generation));
        }

        [Test]
        public void SourceOccurrenceInitializerEntryMutationAndRestorationIsSticky()
        {
            var key = Identifier("Source");
            var original = Literal("first");
            var values = new Dictionary<ValueExpression, ValueExpression> { [key] = original };
            var creation = new NewInstanceExpression(typeof(Exception), Array.Empty<ValueExpression>(), new ObjectInitializerExpression(values, true));
            var owner = new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), creation));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var source = prepared.SourceFiles.Single();
            Assert.That(source.IsCurrent(), Is.True);
            values[key] = Literal("second");
            Assert.That(source.IsCurrent(), Is.False);
            values[key] = original;
            Assert.That(source.IsCurrent(), Is.False);
        }

        [Test]
        public void SourceOccurrenceSwitchArrayAndCollectionWrapperPathsAreInspectable()
        {
            var match = new SwitchExpression(Int(0), new SwitchCaseExpression(Int(0), Literal("zero")), SwitchCaseExpression.Default(Literal("other")));
            var switchStatement = new SwitchStatement(Int(0))
            { new SwitchCaseStatement(Int(0), new MethodBodyStatements(new MethodBodyStatement[] { Break })) };
            var array = New.Array(typeof(object), new ValueExpression[] { New.Instance(typeof(object)) });
            var statements = new MethodBodyStatements(new MethodBodyStatement[]
            {
                new DeclarationExpression(typeof(string), "choice").Assign(match).Terminate(),
                switchStatement,
                new DeclarationExpression(typeof(object[]), "items").Assign(array).Terminate()
            });
            var owner = new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), statements), returnType: typeof(Action));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(file.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(SourceCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(file.Content)).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            var collection = new CollectionInitializerExpression(Literal(1), Literal(2));
            var node = PreparedSourceOccurrence.Capture(new(Guid.NewGuid(), "file.cs", "member", "body", 0, "$"), collection, true, SourceCompilation(), true);
            Assert.That(node.Children.Select(n => n.Id.EdgePath), Is.EqualTo(new[] { "$/element[0]", "$/element[1]" }));
        }

        [Test]
        public void SourceOccurrenceRepeatedTraversalCannotReauthorizeThePreparedFile()
        {
            var owner = new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(), New.Instance(typeof(Exception))));
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var first = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            var second = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
            Assert.That(first.SourceConsumption!.WasCurrentAtEndOfWrite, Is.True);
            Assert.That(second.SourceConsumption!.WasCurrentAtEndOfWrite, Is.False);
            Assert.That(second.Content, Is.EqualTo(first.Content), "Invalid source facts do not replay or rewrite normal output.");
        }

        [Test]
        public async Task SourceOccurrenceIndependentPreparationsHaveNoSharedTraversalState()
        {
            var owners = Enumerable.Range(0, 2).Select(i => new OccurrenceOwner(new FuncExpression(Array.Empty<CodeWriterDeclaration?>(),
                New.Instance(typeof(Exception))), "Independent" + i)).ToArray();
            foreach (var owner in owners) { owner.EnsureBuilt(); _ = owner.RelativeFilePath; }
            var compilation = SourceCompilation();
            var results = await Task.WhenAll(owners.Select(owner => Task.Run(() =>
            {
                using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, compilation, _ => true);
                return new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write().SourceConsumption!;
            })));
            Assert.That(results.All(r => r.WasCurrentAtEndOfWrite), Is.True);
            Assert.That(results[0].Generation, Is.Not.EqualTo(results[1].Generation));
            Assert.That(results[0].Consumed.Intersect(results[1].Consumed), Is.Empty);
        }

        [TestCase("\n")]
        [TestCase("\r\n")]
        public void SourceOccurrenceLineAndRawLayoutFactsStayIndependentAndConservative(string ending)
        {
            var literal = PreparedSourceOccurrence.Capture(new(Guid.NewGuid(), "file.cs", "member", "body", 0, "$"),
                Literal("a" + ending + "b"), true, SourceCompilation(), true);
            Assert.That(literal.IntrinsicSource.LineEndings, Is.EqualTo(SourceFactState.Absent), "Escaped literal data is not a physical newline.");
            var interpolation = PreparedSourceOccurrence.Capture(literal.Id with { EdgePath = "$/raw-format" },
                new FormattableStringExpression("a" + ending + "{0}", new ValueExpression[] { Null }), true, SourceCompilation(), true);
            Assert.That(interpolation.IntrinsicSource.Layout, Is.EqualTo(SourceFactState.Unavailable));
            Assert.That(interpolation.IntrinsicSource.LineEndings, Is.EqualTo(SourceFactState.Unavailable));
            Assert.That(interpolation.IntrinsicSource.Diagnostics, Is.EqualTo(SourceFactState.Unavailable));
            Assert.That(interpolation.IntrinsicSource.Visibility, Is.EqualTo(SourceFactState.Unavailable));
        }

        [Test]
        public void SourceOccurrenceLoadedOriginalFlagsAreNotErasedByExplicitCallerExpressionOverride()
        {
            var sourceText = Helpers.GetExpectedFromFile(method: "SourceOccurrenceOriginalPolicy");
            var compilation = SourceCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(sourceText,
                CSharpParseOptions.Default.WithPreprocessorSymbols("FEATURE")));
            var symbol = compilation.GetTypeByMetadataName("Original.Observer")!.GetMembers("Capture").OfType<IMethodSymbol>().Single();
            var contract = DeclaredCallableContract.FromSymbol(symbol, compilation);
            var invocation = InvokeMethodExpression.FromDeclaredContract(null, contract,
                new ValueExpression[] { New.Instance(typeof(object)), PositionalReference("text", Null) });
            var node = PreparedSourceOccurrence.Capture(new(Guid.NewGuid(), "file.cs", "member", "body", 0, "$"), invocation, true, compilation, true);
            Assert.That(node.DeclaredArguments!.ImplicitCallerExpressionInputs, Is.Empty);
            Assert.That(node.OriginalDescriptors, Is.Not.Empty);
            Assert.That(node.OriginalSource.Any(p => p.Visibility == SourceFactState.Present), Is.True);
            Assert.That(node.OriginalSource.Any(p => p.MappedSource == SourceFactState.Present), Is.True);
            Assert.That(node.OriginalSource.Any(p => p.InactiveVariants == SourceFactState.Present), Is.True);
            Assert.That(node.IntrinsicSource.Visibility, Is.EqualTo(SourceFactState.Unavailable), "Original source is not proof of emitted projection correspondence.");
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task SourceOccurrenceCSharpGenUsesTheSamePreparationAndOneWriterCallback(bool mutate)
        {
            var directory = Path.Combine(TestContext.CurrentContext.WorkDirectory, ".pi", "source-occurrence-pipeline", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                const string json = "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Sample\",\"unreferenced-types-handling\":\"keepAll\"}";
                var mock = await MockHelpers.LoadMockGeneratorAsync(outputPath: directory, configuration: json,
                    compilation: () => Task.FromResult<Compilation>(SourceCompilation()));
                int callbacks = 0;
                var observed = new List<SourceOccurrenceId>();
                var value = new KeywordExpression("null", null);
                var callback = new SourceCallbackExpression(writer =>
                {
                    callbacks++;
                    Assert.That(writer.CurrentSourceOccurrence, Is.Not.Null, "Real CSharpGen must hand the prepared file cursor to the standard writer.");
                    observed.Add(writer.CurrentSourceOccurrence!.Id);
                    Assert.That(writer.CurrentSourceOccurrence.IsOpaque, Is.True);
                    if (mutate) { value.Update("default", null); }
                    writer.AppendRaw("null");
                });
                var owner = new OccurrenceOwner(new TupleExpression(callback.CastTo(typeof(object)), value.CastTo(typeof(object))), returnType: typeof(object));
                var generator = new PipelineGenerator(new GeneratorContext(mock.Object.Configuration), mock.Object.InputLibrary,
                    mock.Object.TypeFactory, new TestOutputLibrary(owner));
                CodeModelGenerator.Instance = generator;
                await new CSharpGen().ExecuteAsync();
                Assert.That(callbacks, Is.EqualTo(1));
                Assert.That(observed.Count, Is.EqualTo(1));
                Assert.That(generator.SourceChecks, Is.GreaterThan(0));
                var output = await File.ReadAllTextAsync(Path.Combine(directory, "OccurrenceOwner.cs"));
                Assert.That(SourceCompilation().AddSyntaxTrees(CSharpSyntaxTree.ParseText(output)).GetDiagnostics()
                    .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            }
            finally { Directory.Delete(directory, recursive: true); }
        }

        private static CSharpCompilation SourceCompilation() => CSharpCompilation.Create("SourceOccurrences",
            references: ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(p => MetadataReference.CreateFromFile(p)), options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        private sealed record SourceCallbackExpression(Action<CodeWriter> Callback) : ValueExpression
        {
            internal override void WriteCore(CodeWriter writer) => Callback(writer);
            internal override ValueExpression? Accept(LibraryVisitor visitor, MethodProvider method) => throw new InvalidOperationException("Preparation must not invoke a visitor callback.");
        }

        private sealed class SourceOpaqueList<T> : IReadOnlyList<T>
        {
            public int Count => throw new InvalidOperationException("Count callback");
            public T this[int index] => throw new InvalidOperationException("Indexer callback");
            public IEnumerator<T> GetEnumerator() => throw new InvalidOperationException("Enumerator callback");
            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
        }

        private sealed class SourceOpaqueDictionary : IReadOnlyDictionary<ValueExpression, ValueExpression>
        {
            public int Count => throw new InvalidOperationException("Count callback");
            public IEnumerable<ValueExpression> Keys => throw new InvalidOperationException("Keys callback");
            public IEnumerable<ValueExpression> Values => throw new InvalidOperationException("Values callback");
            public ValueExpression this[ValueExpression key] => throw new InvalidOperationException("Indexer callback");
            public bool ContainsKey(ValueExpression key) => throw new InvalidOperationException("Lookup callback");
            public bool TryGetValue(ValueExpression key, out ValueExpression value) => throw new InvalidOperationException("Lookup callback");
            public IEnumerator<KeyValuePair<ValueExpression, ValueExpression>> GetEnumerator() => throw new InvalidOperationException("Enumerator callback");
            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
        }

        private sealed class OccurrenceOwner : TypeProvider
        {
            private readonly ValueExpression _body;
            private readonly string _name;
            private readonly CSharpType _returnType;
            private readonly CSharpType? _targetType;
            internal int MethodBuilds { get; private set; }
            internal OccurrenceOwner(ValueExpression body, string name = "OccurrenceOwner", CSharpType? returnType = null, CSharpType? targetType = null)
            { _body = body; _name = name; _returnType = returnType ?? typeof(Func<Exception>); _targetType = targetType; }
            protected override string BuildName() => _name;
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => _name + ".cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => _targetType is null ? Array.Empty<FieldProvider>() :
                new[] { new FieldProvider(FieldModifiers.Private, _targetType, "_value", this) };
            protected internal override MethodProvider[] BuildMethods()
            {
                MethodBuilds++;
                return new[] { new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public,
                    _returnType, null, Array.Empty<ParameterProvider>()), _body, this) };
            }
        }
    }
}
