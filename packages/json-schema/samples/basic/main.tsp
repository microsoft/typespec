import "@typespec/json-schema";
using JsonSchema;

@jsonSchema
namespace Example;

@id("user")
model User {
  @format("uuid")
  id: string;

  @minLength(2)
  @maxLength(20)
  username: string;

  @format("email")
  email: string;
  posts: Page<Post>;
}

@id("postUnion")
union Post {
  blog: BlogPost,
  link: LinkPost,
}

model Page<T> {
  @format("uri-reference")
  nextLink?: string;
  items: T[];
}

model PostBase {
  author: User.id;
  postedAt: offsetDateTime;
  updatedAt?: offsetDateTime;
}

model BlogPost extends PostBase {
  @minLength(20)
  @maxLength(2000)
  content: string;
}

model LinkPost extends PostBase {
  link: url;
  title?: string;
}
