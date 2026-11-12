// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputLongRunningServiceMetadata
    {
        public InputLongRunningServiceMetadata(int finalStateVia, InputOperationResponse finalResponse, string? resultPath)
            : this(finalStateVia, finalResponse, resultPath, [], [])
        {
        }

        public InputLongRunningServiceMetadata(int finalStateVia, InputOperationResponse finalResponse, string? resultPath,
            IReadOnlyList<InputLroStatusMetadata> statusMetadata, IReadOnlyList<InputLroOperationIdMetadata> operationId)
        {
            FinalStateVia = finalStateVia;
            FinalResponse = finalResponse;
            ResultPath = resultPath;
            StatusMetadata = statusMetadata;
            OperationId = operationId;
        }

        public InputLongRunningServiceMetadata() : this(1, new InputOperationResponse(), null) { }

        public int FinalStateVia { get; }
        public InputOperationResponse FinalResponse { get; }
        public string? ResultPath { get; }
        /// <summary>
        /// Auxiliary values from the latest polling response, in selection order.
        /// </summary>
        public IReadOnlyList<InputLroStatusMetadata> StatusMetadata { get; }
        /// <summary>
        /// Server-issued ID sources in availability order: polling URL, then polling response body.
        /// These selections do not replace the complete polling URL.
        /// </summary>
        public IReadOnlyList<InputLroOperationIdMetadata> OperationId { get; }

        /// <summary>
        /// Meaningful return type of the long running operation.
        /// </summary>
        public InputType? ReturnType
        {
            get
            {
                if (FinalResponse.BodyType is null)
                {
                    return null;
                }

                if (ResultPath is null)
                {
                    return FinalResponse.BodyType;
                }

                var rawResponseType = (InputModelType)FinalResponse.BodyType;
                return rawResponseType.Properties.FirstOrDefault(p => p is InputModelProperty modelProperty && modelProperty.SerializationOptions?.Json?.Name == ResultPath)!.Type;
            }
        }
    }
}
