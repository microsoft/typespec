// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputOperationLongRunning
    {
        public InputOperationLongRunning(int finalStateVia, InputOperationResponse finalResponse, string? resultPath)
        {
            FinalStateVia = finalStateVia;
            FinalResponse = finalResponse;
            ResultPath = resultPath;
        }

        public InputOperationLongRunning() : this(1, new InputOperationResponse(), null) { }

        public int FinalStateVia { get; }
        public InputOperationResponse FinalResponse { get; }
        public string? ResultPath { get; }

        /// <summary>
        /// Meaningful return type of the long running operation.
        /// </summary>
        public InputType? ReturnType
        {
            get
            {
                if (FinalResponse.BodyType is null)
                    return null;

                if (ResultPath is null)
                    return FinalResponse.BodyType;

                var rawResponseType = (InputModelType)FinalResponse.BodyType;
                return rawResponseType.Properties.FirstOrDefault(p => p.SerializationOptions.Json?.Name == ResultPath)!.Type;
            }
        }
    }
}
