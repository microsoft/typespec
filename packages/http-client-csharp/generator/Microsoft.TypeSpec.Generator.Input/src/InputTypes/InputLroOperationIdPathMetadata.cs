// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputLroOperationIdPathMetadata : InputLroOperationIdMetadata
    {
        public InputLroOperationIdPathMetadata(InputOperationLink source, InputPathParameter pathParameter, string pollingPath)
        {
            Source = source;
            PathParameter = pathParameter;
            PollingPath = pollingPath;
        }

        public InputOperationLink Source { get; }
        public InputPathParameter PathParameter { get; }
        /// <summary>
        /// Modeled polling route used to locate the selected parameter in the complete polling URL.
        /// </summary>
        public string PollingPath { get; }
    }
}
