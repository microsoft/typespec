// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputParameterExample
    {
        public InputParameterExample(InputParameter parameter, InputExampleValue exampleValue)
        {
            Parameter = parameter;
            ExampleValue = exampleValue;
        }

        public InputParameter Parameter { get; internal set; }
        public InputExampleValue ExampleValue { get; internal set; }
    }
}
