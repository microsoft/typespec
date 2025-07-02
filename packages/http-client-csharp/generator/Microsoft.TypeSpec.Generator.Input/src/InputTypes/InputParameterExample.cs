// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents parameterexample information.
    /// </summary>
    public class InputParameterExample
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="InputParameterExample"/> class.
        /// </summary>
        public InputParameterExample(InputParameter parameter, InputExampleValue exampleValue)
        {
            Parameter = parameter;
            ExampleValue = exampleValue;
        }

        /// <summary>
        /// Gets the parameter.
        /// </summary>
        public InputParameter Parameter { get; }

        /// <summary>
        /// Gets the examplevalue.
        /// </summary>
        public InputExampleValue ExampleValue { get; }
    }
}
