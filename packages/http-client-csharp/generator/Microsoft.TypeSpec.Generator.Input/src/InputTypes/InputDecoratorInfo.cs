// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents decoratorinfo information.
    /// </summary>
    /// <summary>

    /// Gets the inputdecoratorinfo.

    /// </summary>

    public class InputDecoratorInfo
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputDecoratorInfo"/> class.
        /// </summary>
        public InputDecoratorInfo(string name, IReadOnlyDictionary<string, BinaryData>? arguments)
        {
            Name = name;
            Arguments = arguments;
        }        /// <summary>
        /// Gets the  name.
        /// </summary>
        public string Name { get; }        /// <summary>
        /// Gets the arguments.
        /// </summary>
        public IReadOnlyDictionary<string, BinaryData>? Arguments { get; }
    }
}
