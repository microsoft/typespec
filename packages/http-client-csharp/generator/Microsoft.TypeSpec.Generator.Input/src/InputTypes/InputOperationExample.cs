// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputOperationExample
    {
        public InputOperationExample(string name, string? description, IReadOnlyList<InputParameterExample> parameters, string filePath)
        {
            Name = name;
            Description = description;
            Parameters = parameters;
            FilePath = filePath;
        }

        public string Name { get; }
        public string? Description { get; }
        public IReadOnlyList<InputParameterExample> Parameters { get; }
        public string FilePath { get; }
    }
}
