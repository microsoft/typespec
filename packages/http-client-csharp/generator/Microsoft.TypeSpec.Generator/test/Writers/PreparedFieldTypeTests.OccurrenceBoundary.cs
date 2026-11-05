// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void LaterCandidateScopeMutationRejectsTheCurrentOccurrenceImmediately(bool mutateOwnerScope)
        {
            var arguments = new List<CSharpType>();
            var widget = new CSharpType("Widget", "N", false, false, null, arguments, true, false);
            var first = new FieldOwner(widget);
            first.Type.Namespace = "N";
            var implements = new List<CSharpType>();
            first.Update(implements: implements);
            var laterValue = new CSharpType("LaterValue", "N", false, false, null, [], true, false);
            var conflictingInterface = new CSharpType("IConflict", "N", false, false, null, [], true, false);
            var later = new OccurrenceBoundaryLaterOwner(laterValue, () =>
            {
                if (mutateOwnerScope) { implements.Add(conflictingInterface); }
                else { arguments.Add(new CSharpType(typeof(int))); }
            });
            TypeProvider[] roots = [first, later];
            foreach (var root in roots) { root.EnsureBuilt(); }
            var field = first.Fields[0];
            var laterField = later.Fields[0];
            Assert.That(widget.Arguments, Is.SameAs(arguments), "The constructor must retain the empty list.");
            Assert.That(first.Implements, Is.SameAs(implements));
            Assert.That(field.Type, Is.SameAs(widget));
            Assert.That(laterField.Type, Is.SameAs(laterValue));
            Assert.That(later.BaseType, Is.Null);
            var compilation = ReferenceCompilation(OccurrenceBoundaryNativeReference());
            using var prepared = PreparedFieldTypes.Create(roots, compilation, _ => true);
            Assert.That(prepared.CanWriteSimpleName(first, field), Is.True);
            Assert.That(prepared.CanWriteSimpleName(later, laterField), Is.True,
                "The later owner must have a real candidate in the ordered scope sweep.");
            Assert.That(arguments, Is.Empty);
            Assert.That(implements, Is.Empty);
            Assert.That(later.ArmedBaseCalls, Is.Zero);
            var version = widget.IdentityVersion;
            var baseCalls = later.BaseCalls;

            // The first candidate is swept before the later owner's uncached null base getter.
            // Do not emit Widget<int>: this is an occurrence API fail-closed oracle.
            bool immediate;
            try
            {
                later.Armed = true;
                immediate = prepared.CanWriteSimpleName(first, field);
                Assert.That(later.BaseCalls, Is.GreaterThan(baseCalls));
                Assert.That(later.ArmedBaseCalls, Is.EqualTo(1));
                Assert.That(mutateOwnerScope ? implements.Count : arguments.Count, Is.EqualTo(1));
                Assert.That(widget.IdentityVersion, Is.EqualTo(version));
                Assert.That(field.Type, Is.SameAs(widget));
                Assert.That(laterField.Type, Is.SameAs(laterValue));
            }
            finally
            {
                later.Armed = false;
                arguments.Clear();
                implements.Clear();
            }
            var restored = prepared.CanWriteSimpleName(first, field);
            Assert.Multiple(() =>
            {
                Assert.That(immediate, Is.False,
                    "Recheck target shape and owner declaration scope at the current occurrence, not only at commit.");
                Assert.That(restored, Is.False, "Restoration must not resurrect an observed stale occurrence.");
                Assert.That(prepared.CanCommit(), Is.False);
            });
        }

        private static PortableExecutableReference OccurrenceBoundaryNativeReference()
        {
            var external = CSharpCompilation.Create("OccurrenceBoundaryNative",
                [CSharpSyntaxTree.ParseText("namespace N { public class Widget {} public class LaterValue {} public interface IConflict {} }")],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var image = new MemoryStream();
            var emit = external.Emit(image);
            Assert.That(emit.Success, Is.True, string.Join("\n", emit.Diagnostics));
            return MetadataReference.CreateFromImage(image.ToArray());
        }

        private sealed class OccurrenceBoundaryLaterOwner(CSharpType fieldType, Action mutate) : TypeProvider
        {
            internal bool Armed { get; set; }
            internal int BaseCalls { get; private set; }
            internal int ArmedBaseCalls { get; private set; }
            protected override string BuildName() => "LaterOwner";
            protected override string BuildNamespace() => "N";
            protected override string BuildRelativeFilePath() => "LaterOwner.cs";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;
            protected internal override FieldProvider[] BuildFields() =>
                [new FieldProvider(FieldModifiers.Private, fieldType, "_laterValue", this)];
            protected override CSharpType? BuildBaseType()
            {
                BaseCalls++;
                if (Armed) { ArmedBaseCalls++; mutate(); }
                return null;
            }
        }
    }
}
