// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputLroOperationIdPathMetadata : InputLroOperationIdMetadata
    {
        public InputLroOperationIdPathMetadata(InputOperationLink source, InputPathParameter pathParameter, string path)
        {
            Source = source;
            PathParameter = pathParameter;
            Path = path;
        }

        public InputOperationLink Source { get; }
        public InputPathParameter PathParameter { get; }
        /// <summary>The linked polling operation's route template, not the polling URL received at runtime.</summary>
        public string Path { get; }
    }
}
