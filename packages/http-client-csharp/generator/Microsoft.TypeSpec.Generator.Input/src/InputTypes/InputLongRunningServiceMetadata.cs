// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputLongRunningServiceMetadata
    {
        public InputLongRunningServiceMetadata(int finalStateVia, InputOperationResponse finalResponse, string? resultPath)
            : this(finalStateVia, finalResponse, resultPath, null, [])
        {
        }

        public InputLongRunningServiceMetadata(int finalStateVia, InputOperationResponse finalResponse, string? resultPath,
            InputModelType? pollingResponseModel, IReadOnlyList<InputLroStatusMetadata> statusMetadata)
        {
            FinalStateVia = finalStateVia;
            FinalResponse = finalResponse;
            ResultPath = resultPath;
            PollingResponseModel = pollingResponseModel;
            StatusMetadata = statusMetadata;
        }

        public InputLongRunningServiceMetadata() : this(1, new InputOperationResponse(), null) { }

        public int FinalStateVia { get; }
        public InputOperationResponse FinalResponse { get; }
        public string? ResultPath { get; }

        /// <summary>
        /// The status-monitor (polling) response model. Present when <see cref="StatusMetadata"/> is not empty.
        /// </summary>
        public InputModelType? PollingResponseModel { get; }

        /// <summary>
        /// Values selected by <c>@lroStatusMetadata</c> from the latest status-monitor response.
        /// Each selection refers to a property of <see cref="PollingResponseModel"/> or one of its base models.
        /// </summary>
        public IReadOnlyList<InputLroStatusMetadata> StatusMetadata { get; }

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
