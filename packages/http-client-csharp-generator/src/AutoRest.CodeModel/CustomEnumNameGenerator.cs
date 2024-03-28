// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NJsonSchema;
using NJsonSchema.CodeGeneration;

namespace AutoRest.CodeModel
{
    internal class CustomEnumNameGenerator : IEnumNameGenerator
    {
        private readonly DefaultEnumNameGenerator _defaultEnumNameGenerator = new DefaultEnumNameGenerator();

        public string Generate(int index, string name, object value, JsonSchema schema) =>
            _defaultEnumNameGenerator.Generate(
                index,
                // Fixes + and - enum values that cannot be generated into C# enum names
                name.Equals("+") ? "plus" : name.Equals("-") ? "minus" : name,
                value,
                schema);
    }
}
