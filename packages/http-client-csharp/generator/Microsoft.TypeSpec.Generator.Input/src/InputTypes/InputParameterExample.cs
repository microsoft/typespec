// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public class InputParameterExample
    {
        public InputParameterExample(InputParameter parameter, InputExampleValue exampleValue)
        {
            Parameter = parameter;
            ExampleValue = exampleValue;
        }

        public InputParameter Parameter { get; }
        public InputExampleValue ExampleValue { get; }
    }
}
