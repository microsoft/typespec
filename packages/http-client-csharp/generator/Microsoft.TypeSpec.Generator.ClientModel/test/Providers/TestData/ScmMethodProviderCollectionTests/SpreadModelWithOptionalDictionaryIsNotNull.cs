global::Sample.Argument.AssertNotNullOrEmpty(requiredParam, nameof(requiredParam));

global::Sample.Models.SpreadModelWithDict spreadModel = new global::Sample.Models.SpreadModelWithDict((query ?? new global::Sample.ChangeTrackingDictionary<string, string>()), (filter ?? new global::Sample.ChangeTrackingDictionary<string, string>()), requiredParam, default);
return await this.CreateMessageAsync(spreadModel, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
