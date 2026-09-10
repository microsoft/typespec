public virtual global::System.ClientModel.ClientResult<global::Sample.Models.TestEnum> GetPlainTextEnum(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextEnum(cancellationToken.ToRequestOptions());
    global::Sample.Models.TestEnum value = result.GetRawResponse().Content.ToString().TrimStart('﻿').ToTestEnum();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
