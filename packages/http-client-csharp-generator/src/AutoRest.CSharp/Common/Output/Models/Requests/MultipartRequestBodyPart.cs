// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class MultipartRequestBodyPart
    {
        public string Name { get;  }
        public RequestBody Content { get; }

        public MultipartRequestBodyPart(string name, RequestBody content)
        {
            Name = name;
            Content = content;
        }
    }
}
