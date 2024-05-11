// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class OperationLongRunning
    {
        public OperationLongRunning(int finalStateVia, OperationResponse finalResponse, string? resultPath)
        {
            FinalStateVia = finalStateVia;
            FinalResponse = finalResponse;
            ResultPath = resultPath;
        }

        public OperationLongRunning() : this(1, new OperationResponse(), null) { }

        public int FinalStateVia { get; }
        public OperationResponse FinalResponse { get; }
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
                return rawResponseType.Properties.FirstOrDefault(p => p.SerializedName == ResultPath)!.Type;
            }
        }
    }
}
