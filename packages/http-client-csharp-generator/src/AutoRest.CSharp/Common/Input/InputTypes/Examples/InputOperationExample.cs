// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Input.Examples
{
    // TODO -- currently we do not need the responses. In the case that in the future we need to handle the responses in examples, we need to add a new class InputExampleResponse and a new property here
    internal record InputOperationExample(InputOperation Operation, IReadOnlyList<InputParameterExample> Parameters);
}
