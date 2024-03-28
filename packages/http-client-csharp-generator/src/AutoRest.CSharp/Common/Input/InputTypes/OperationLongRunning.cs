// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;
using System.Linq;

namespace AutoRest.CSharp.Common.Input;

internal record OperationLongRunning(OperationFinalStateVia FinalStateVia, OperationResponse FinalResponse, string? ResultPath)
{
    public OperationLongRunning() : this(FinalStateVia: OperationFinalStateVia.Location, FinalResponse: new OperationResponse(), null) { }

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
