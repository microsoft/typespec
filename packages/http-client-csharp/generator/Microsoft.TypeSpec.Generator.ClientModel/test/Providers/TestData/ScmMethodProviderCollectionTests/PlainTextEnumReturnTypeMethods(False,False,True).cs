public virtual global::System.ClientModel.ClientResult<global::Sample.Models.TestEnum?> GetPlainTextEnum(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetPlainTextEnum(cancellationToken.ToRequestOptions());
    string content = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    global::Sample.Models.TestEnum? value = (content == "null") ? ((global::Sample.Models.TestEnum?)null) : int.Parse(content, global::System.Globalization.CultureInfo.InvariantCulture).ToTestEnum();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
