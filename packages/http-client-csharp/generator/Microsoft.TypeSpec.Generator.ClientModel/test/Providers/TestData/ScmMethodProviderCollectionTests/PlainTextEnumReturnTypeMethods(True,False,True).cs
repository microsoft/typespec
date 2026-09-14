public virtual global::System.ClientModel.ClientResult<global::Sample.Models.TestEnum?> GetPlainTextEnum(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextEnum(cancellationToken.ToRequestOptions());
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::Sample.Models.TestEnum? value = (responseContent.Trim() == "null") ? ((global::Sample.Models.TestEnum?)null) : responseContent.ToTestEnum();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
