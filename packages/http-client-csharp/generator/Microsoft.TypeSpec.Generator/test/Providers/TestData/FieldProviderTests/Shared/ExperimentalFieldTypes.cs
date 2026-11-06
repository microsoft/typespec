// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;

namespace Sample
{
    [Experimental("FIELD001")]
    public class ExperimentalFieldType
    {
        public class Nested
        {
        }
    }

    [Experimental("FIELD002")]
    public class ExperimentalFieldGeneric<T>
    {
    }
}
