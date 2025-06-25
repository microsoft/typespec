import "@typespec/rest";

using Http;

@error
model ErrorDetails {
  code: int32;
  message: string;
}

model CodeSignAccount {
  name: string;
}

model AccountProfile {
  value: int32;
}

@get
@doc("Reads an instance of the {name} resource.", Resource)
op ResourceReadBase<Resource extends {}, Error>(@path name: string): Resource | Error;
op ResourceRead<Resource extends {}> is ResourceReadBase<Resource, ErrorDetails>;

@post
@doc("Reads an instance of the {name} resource.", Resource)
op ResourceCreateBase<Resource extends {}, Error>(@body resource: Resource): Resource | Error;
op ResourceCreate<Resource extends {}> is ResourceCreateBase<Resource, ErrorDetails>;

@route("codeSignAccounts")
interface CodeSignAccounts {
  get is ResourceRead<CodeSignAccount>;
  create is ResourceCreate<CodeSignAccount>;
}

interface ResourceOperations<Resource extends {}> {
  get is ResourceRead<Resource>;
  create is ResourceCreate<Resource>;
}

@route("accountProfiles")
interface AccountProfiles extends ResourceOperations<AccountProfile> {}
