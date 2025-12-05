global::System.ClientModel.ClientResult result = this.GetScalar(cancellationToken.ToRequestOptions());
return global::System.ClientModel.ClientResult.FromValue(global::System.ClientModel.Primitives.ModelReaderWriter.Read<int>(result.GetRawResponse().Content, global::Sample.ModelSerializationExtensions.WireOptions, global::Sample.SampleContext.Default), result.GetRawResponse());
