// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.Input.Extensions
{
    /// <summary>
    /// Extension methods for working with <see cref="InputDecoratorInfo"/> lists.
    /// </summary>
    public static class InputDecoratorInfoExtensions
    {
        private const string ClientOptionDecoratorName = "Azure.ClientGenerator.Core.@clientOption";

        /// <summary>
        /// Gets the value of a client option decorator by key from a list of decorator info objects.
        /// This is the C# equivalent of the TypeScript <c>getClientOptions</c> helper in TCGC.
        /// </summary>
        /// <typeparam name="T">The type to deserialize the option value to.</typeparam>
        /// <param name="decorators">The list of decorator info objects to search.</param>
        /// <param name="key">The name of the client option to look up.</param>
        /// <returns>The deserialized option value, or <c>default</c> if the option is not set.</returns>
        public static T? GetClientOption<T>(this IReadOnlyList<InputDecoratorInfo> decorators, string key)
        {
            var decorator = decorators
                .Where(d => d.Name == ClientOptionDecoratorName && d.Arguments != null)
                .FirstOrDefault(d =>
                    d.Arguments!.TryGetValue("name", out var nameData) &&
                    nameData.ToObjectFromJson<string>() == key);

            if (decorator?.Arguments?.TryGetValue("value", out var value) == true)
            {
                return value.ToObjectFromJson<T>();
            }

            return default;
        }
    }
}
