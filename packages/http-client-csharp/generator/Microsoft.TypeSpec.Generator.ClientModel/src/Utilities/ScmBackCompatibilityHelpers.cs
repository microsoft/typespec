// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Utilities
{
    internal static class ScmBackCompatibilityHelpers
    {
        /// <summary>
        /// Drops any generator-owned attributes that were newly restored from the last contract.
        /// <paramref name="restoredAttributes"/> is the result of the base
        /// <c>BuildAttributesForBackCompatibility</c> call; any attribute whose type name is in
        /// <paramref name="generatorOwnedAttributeNames"/> and was not already present in
        /// <paramref name="originalAttributes"/> is removed, since generation recomputes it.
        /// <paramref name="generatorOwnedAttributeNames"/> is only evaluated when there is restored
        /// content to filter, so callers can pass a lazily-initialized set without paying for it when
        /// nothing was restored.
        /// </summary>
        public static IReadOnlyList<AttributeStatement> FilterRestoredAttributes(
            IReadOnlyList<AttributeStatement> originalAttributes,
            IReadOnlyList<AttributeStatement> restoredAttributes,
            Func<IReadOnlySet<string>> generatorOwnedAttributeNames)
        {
            // The base returns the original list unchanged when nothing was restored.
            if (ReferenceEquals(restoredAttributes, originalAttributes))
            {
                return restoredAttributes;
            }

            var ownedNames = generatorOwnedAttributeNames();

            var originalDisplayStrings = new HashSet<string>(StringComparer.Ordinal);
            foreach (var attribute in originalAttributes)
            {
                originalDisplayStrings.Add(attribute.ToDisplayString());
            }

            var result = new List<AttributeStatement>(restoredAttributes.Count);
            foreach (var attribute in restoredAttributes)
            {
                if (ownedNames.Contains(attribute.Type.Name)
                    && !originalDisplayStrings.Contains(attribute.ToDisplayString()))
                {
                    continue;
                }

                result.Add(attribute);
            }

            return result;
        }
    }
}
