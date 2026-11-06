// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal partial class PreparedFieldTypeTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void SourceFileRootViewReusesFrozenCanonicalRootsIncludingPartialCapture(bool cycle)
        {
            using var host = new BodyOnlyPhysicalHost(customizationSource: OriginalTypeOfSupportSource(false));
            var owner = new OriginalTypeOfHostOwner(false);
            owner.EnsureBuilt();
            if (cycle) { owner.Update(nestedTypes: new[] { owner }); }
            var file = new PreparedSourceFile(Guid.NewGuid(), owner, "FrozenRoots.cs", host.Snapshot.Compilation, false);
            var first = file.Roots;
            var second = file.Roots;
            Assert.That(file.IsInvalid, Is.EqualTo(cycle));
            Assert.That(first.Length, Is.EqualTo(owner.Methods.Count + 1));
            for (var i = 0; i < first.Length; i++) { Assert.That(second[i], Is.SameAs(first[i])); }
            Assert.That(second.Equals(first), Is.True, "Get-only root membership must reuse the captured immutable array, not allocate another copy.");
            file.Invalidate();
            Assert.That(file.Roots.Equals(first), Is.True, "Invalidation must not discard or rebuild a partial root view.");
        }
    }
}
