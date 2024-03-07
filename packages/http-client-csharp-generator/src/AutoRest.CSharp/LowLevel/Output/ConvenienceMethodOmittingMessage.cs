// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.Output.Models
{
    internal record ConvenienceMethodOmittingMessage
    {
        private ConvenienceMethodOmittingMessage(string message)
        {
            Message = message;
        }

        public string Message { get; }

        public static ConvenienceMethodOmittingMessage AnonymousModel = new("The convenience method of this operation is omitted because it is using at least one anonymous model");

        public static ConvenienceMethodOmittingMessage NotConfident = new("The convenience method of this operation is made internal because this operation directly or indirectly uses a low confident type, for instance, unions, literal types with number values, etc.");

        public static ConvenienceMethodOmittingMessage NotMeaningful = new("The convenience method is omitted here because it has exactly the same parameter list as the corresponding protocol method");
    }
}
