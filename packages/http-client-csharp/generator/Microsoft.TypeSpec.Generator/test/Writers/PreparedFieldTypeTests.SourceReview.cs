// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
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
        [TestCase("new")]
        [TestCase("invoke")]
        public void SourcePreparationDoesNotChangeRetainedRecordKeyEquality(string kind)
        {
            ValueExpression key = kind == "new"
                ? new NewInstanceExpression(typeof(object), Array.Empty<ValueExpression>())
                : new InvokeMethodExpression(null, "M", Array.Empty<ValueExpression>());
            ValueExpression equal = key switch
            {
                NewInstanceExpression creation => creation with { },
                InvokeMethodExpression invocation => invocation with { },
                _ => throw new InvalidOperationException()
            };
            var values = new Dictionary<ValueExpression, ValueExpression> { [key] = Literal(1) };
            var hash = key.GetHashCode();
            Assert.That(key.Equals(equal), Is.True);
            var root = new DictionaryInitializerExpression(values);
            _ = PreparedSourceOccurrence.Capture(new(Guid.NewGuid(), "key.cs", "member", "body", 0, "$"), root, true, SourceCompilation(), true);

            // Check logical equality first so observational cache changes fail at
            // the original value-identity invariant before dictionary operations.
            Assert.That(key.Equals(equal), Is.True, "Observing declaration metadata must not change record value equality.");
            Assert.That(key.GetHashCode(), Is.EqualTo(hash));
            Assert.That(values.ContainsKey(key), Is.True);
            values[key] = Literal(2);
            Assert.That(values.Count, Is.EqualTo(1));
            Assert.That(values.Remove(key), Is.True);
        }

        [Test]
        public void SourcePreparationDoesNotChangeConstructorInitializerEquality()
        {
            var initializer = new ConstructorInitializer(true, Array.Empty<ValueExpression>());
            var equal = initializer with { };
            var hash = initializer.GetHashCode();
            _ = initializer.CaptureDeclaredArguments(SourceCompilation());
            Assert.That(initializer.Equals(equal), Is.True);
            Assert.That(initializer.GetHashCode(), Is.EqualTo(hash));
            _ = initializer.CaptureDeclaredArguments(SourceCompilation());
            Assert.That(initializer.Equals(equal), Is.True);
            Assert.That(initializer.GetHashCode(), Is.EqualTo(hash));
        }

        [TestCase("variable")]
        [TestCase("argument")]
        [TestCase("keyword")]
        [TestCase("scoped")]
        public void SourceRevisionOnlyChangesDoNotAlterRecordValueEquality(string kind)
        {
            var value = new VariableExpression(typeof(int), "value");
            ValueExpression record;
            ValueExpression equal;
            Action touch;
            switch (kind)
            {
                case "argument":
                    var argument = new ArgumentExpression(value);
                    record = argument;
                    equal = argument with { };
                    touch = () => argument.Update(expression: value);
                    break;
                case "keyword":
                    var keyword = new KeywordExpression("await", value);
                    record = keyword;
                    equal = keyword with { };
                    touch = () => keyword.Update("await", value);
                    break;
                case "scoped":
                    var scoped = value.As(typeof(int));
                    record = scoped;
                    equal = scoped with { };
                    touch = () => scoped.Update(original: value);
                    break;
                default:
                    record = value;
                    equal = value with { };
                    touch = () => value.Update(type: value.Type);
                    break;
            }
            var hash = record.GetHashCode();
            Assert.That(record.Equals(equal), Is.True);
            touch();
            Assert.That(record.Equals(equal), Is.True);
            Assert.That(record.GetHashCode(), Is.EqualTo(hash));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void SourceSnapshotTracksCachedUnusedParameterDeclaration(bool indexer)
        {
            var parameter = new ParameterProvider("original", $"", typeof(int));
            var variable = parameter.AsVariable();
            var owner = new ReviewSourceOwner(parameter, indexer);
            owner.EnsureBuilt();
            var baseline = new TypeProviderWriter(owner).Write().Content;
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var file = prepared.SourceFiles.Single();
            Assert.That(file.IsCurrent(), Is.True);
            variable.Update(name: "different");
            var actual = new TypeProviderWriter(owner).Write().Content;
            Assert.That(actual, Does.Contain("different"));
            Assert.That(actual, Is.Not.EqualTo(baseline));
            Assert.That(file.IsCurrent(), Is.False, "Parameter.Name is not the cached declaration that was actually emitted.");
            variable.Update(name: "original");
            Assert.That(file.IsCurrent(), Is.False);
        }

        [Test]
        public void SourceSnapshotTreatsCustomTypeofWriterAsOpaque()
        {
            var calls = 0;
            var custom = new ReviewCustomTypeof(() => calls++);
            var occurrence = PreparedSourceOccurrence.Capture(new(Guid.NewGuid(), "typeof.cs", "member", "body", 0, "$"),
                custom, true, SourceCompilation(), true);
            Assert.That(calls, Is.Zero);
            Assert.That(occurrence.IsOpaque, Is.True);
            Assert.That(occurrence.IntrinsicSource.Tokens, Is.EqualTo(SourceFactState.Unavailable));
            using var writer = new CodeWriter();
            custom.Write(writer);
            Assert.That(calls, Is.EqualTo(1));
            Assert.That(writer.ToString(false), Does.Contain("#if REVIEW"));
            var ordinary = PreparedSourceOccurrence.Capture(new(Guid.NewGuid(), "typeof.cs", "member", "body", 0, "$"),
                new TypeOfExpression(typeof(int)), true, SourceCompilation(), true);
            Assert.That(ordinary.IsOpaque, Is.False);
        }

        [Test]
        public void SourceCursorRejectsCompleteButReversedRootOrder()
        {
            var owner = new ReviewSourceOwner();
            owner.EnsureBuilt();
            using var prepared = PreparedFieldTypes.Create(new TypeProvider[] { owner }, SourceCompilation(), _ => true);
            var file = prepared.SourceFiles.Single();
            Assert.That(file.Roots.Length, Is.GreaterThanOrEqualTo(3));
            var cursor = file.Start();
            foreach (var root in file.Roots.Reverse())
            {
                using var scope = cursor.BeginRoot(owner, root.Id.RootRole, root.Id.RootIndex);
                Consume(root);
            }
            Assert.That(cursor.Complete(), Is.False, "A set of roots is not an ordered traversal proof.");

            void Consume(PreparedSourceOccurrence occurrence)
            {
                IDisposable? scope = occurrence.EmissionBoundary ? cursor.Enter(occurrence.Producer) : null;
                using (scope)
                {
                    if (!occurrence.IsOpaque)
                    {
                        foreach (var child in occurrence.Children)
                        {
                            Consume(child);
                        }
                    }
                }
            }
        }

        [TestCase("array", false)]
        [TestCase("array", true)]
        [TestCase("object", false)]
        [TestCase("object", true)]
        [TestCase("dictionary", false)]
        [TestCase("dictionary", true)]
        public void SourceInitializerLayoutMatchesEmptyAndNonemptyRawOutput(string kind, bool empty)
        {
            var elements = empty ? Array.Empty<ValueExpression>() : new ValueExpression[] { Literal(1) };
            var entries = new Dictionary<ValueExpression, ValueExpression>();
            if (!empty)
            {
                entries.Add(Identifier("Item"), Literal(1));
            }
            ValueExpression expression = kind switch
            {
                "array" => new ArrayInitializerExpression(elements, IsInline: false),
                "object" => new ObjectInitializerExpression(entries, false),
                _ => new DictionaryInitializerExpression(entries)
            };
            var node = PreparedSourceOccurrence.Capture(new(Guid.NewGuid(), "initializer.cs", "member", "body", 0, "$"),
                expression, true, SourceCompilation(), true);
            using var writer = new CodeWriter();
            expression.Write(writer);
            var code = writer.ToString(false);
            var hasBreak = code.Contains('\n');
            Assert.That(hasBreak, Is.EqualTo(!empty));
            Assert.That(node.IntrinsicSource.Layout, Is.EqualTo(hasBreak ? SourceFactState.Present : SourceFactState.Absent));
            Assert.That(node.IntrinsicSource.IntrinsicLineEnding, Is.EqualTo(hasBreak ? "\n" : null));
        }

        private sealed record ReviewCustomTypeof(Action Callback) : TypeOfExpression(typeof(int))
        {
            internal override void WriteCore(CodeWriter writer)
            {
                Callback();
                writer.WriteRawLine("#if REVIEW");
                writer.WriteRawLine("typeof(int)");
                writer.AppendRaw("#endif");
            }
        }

        private sealed class ReviewSourceOwner(ParameterProvider? parameter = null, bool indexer = false) : TypeProvider
        {
            protected override string BuildName() => "SourceReview";
            protected override string BuildNamespace() => "Sample";
            protected override string BuildRelativeFilePath() => "SourceReview.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() => parameter is not null ? [] :
                [new FieldProvider(FieldModifiers.Private, typeof(int), "_first", this),
                 new FieldProvider(FieldModifiers.Private, typeof(int), "_second", this)];
            protected internal override MethodProvider[] BuildMethods() => parameter is null || indexer ? [] :
                [new MethodProvider(new MethodSignature("M", null, MethodSignatureModifiers.Public, null, null, new[] { parameter }),
                    new MethodBodyStatements(Array.Empty<MethodBodyStatement>()), this)];
            protected internal override PropertyProvider[] BuildProperties() => parameter is null || !indexer ? [] :
                [new IndexPropertyProvider(null, MethodSignatureModifiers.Public, typeof(int), parameter, new ExpressionPropertyBody(Literal(1)), this)];
        }
    }
}
