// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System.ClientModel;

namespace Payload.MultiPart
{
    public partial class MultiPartRequestWithWireName
    {
        internal virtual MultiPartFormContent ToMultipartContent()
        {
            MultiPartFormContent content = new();
            content.Add("id", Identifier);
            content.Add("profileImage", Image);

            return content;
        }
    }
}
