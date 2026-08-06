// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using Sample.Models;

namespace Sample
{
    public partial class TestClient
    {
        public partial ClientResult GetWidget(GetWidgetOptions renamedOptions, RequestOptions renamedRequestOptions);
    }
}
