// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample
{
    public static class Consumer
    {
        public static object Read(Models.Payload model) => model.Preview;
    }
}
