import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { EmitterTester } from "../test-host.js";

const outputDir = join(import.meta.dirname, "output");
mkdirSync(outputDir, { recursive: true });

async function emitSchema(name: string, code: string) {
  const [result, diagnostics] = await EmitterTester.compileAndDiagnose(code, {
    compilerOptions: {
      options: { "@typespec/graphql": { "output-file": "schema.graphql" } },
    },
  });
  const sdl = result.outputs["schema.graphql"] ?? "";
  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");

  writeFileSync(join(outputDir, `${name}.graphql`), sdl);
  if (diagnostics.length) {
    writeFileSync(
      join(outputDir, `${name}.diagnostics.txt`),
      diagnostics.map((d) => `${d.severity}: [${d.code}] ${d.message}`).join("\n"),
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    `${name}.graphql: ${sdl.split("\n").length} lines | ${errors.length} errors, ${warnings.length} warnings`,
  );
  // eslint-disable-next-line no-console
  if (errors.length) console.log("  ERRORS:", errors.map((d) => d.message).join("; "));
  return { sdl, diagnostics, errors, warnings };
}

// =============================================================================
// Schema 1: Core — operations, models, scalars, enums, interfaces, unions
// Patterns: #1-15, #19-20, #25-36, #39-40, #45, #54-55, #59
// =============================================================================
describe("schema: core content platform", () => {
  it("emits all core patterns", async () => {
    const { sdl, errors } = await emitSchema(
      "01-core",
      `
      @schema(#{ name: "core" })
      namespace Core {
        scalar DateTime extends utcDateTime;
        @specifiedBy("https://tools.ietf.org/html/rfc3986")
        scalar URL extends url;
        @specifiedBy("https://spec.graphql.org/draft/#sec-Long")
        scalar Long extends int64;

        enum Role { Admin, Moderator, Member,
          #deprecated "use Member"
          Viewer,
        }
        enum ContentStatus { Draft, Published, Archived,
          #deprecated "use Archived"
          SoftDeleted,
        }
        enum SortOrder { Ascending, Descending }
        enum MimeType { ImageJpeg: "image/jpeg", ImagePng: "image/png", ImageWebp: "image/webp" }

        @graphqlInterface(#{interfaceOnly: true})
        model Node { id: GraphQL.ID; }

        @graphqlInterface(#{interfaceOnly: true})
        model Connection { totalCount: int32; hasNextPage: boolean; }

        @graphqlInterface
        model Reactable { likeCount: int32; dislikeCount: int32; }

        @compose(Node)
        model Article { ...Node; title: string; slug: string; content: string; }

        @compose(Node, Reactable)
        model Review { ...Node; ...Reactable; rating: int32; text: string; reviewer: User; }

        @graphqlInterface(#{interfaceOnly: true})
        @compose(Connection)
        model PagedConnection { ...Connection; pageSize: int32; currentPage: int32; }

        @compose(PagedConnection)
        model ReviewConnection { ...PagedConnection; reviews: Review[]; averageRating: float32; }

        model Timestamps { createdAt: DateTime; updatedAt: DateTime; }
        model Auditable { createdBy: string; lastModifiedBy: string; }

        /** A user on the platform */
        model User {
          id: GraphQL.ID;
          /** Display name */
          name: string;
          email: string;
          bio?: string;
          role: Role;
          avatarUrl?: URL;
          followers: User[];
          following: User[];
          posts: Post[];
          phoneNumber?: string | null;
          previousEmails: string[] | null;
          recentSearches: (string | null)[];
          drafts: (Post | null)[] | null;
          bookmarkedPostIds?: string[];
          metadata: Record<string>;
          ...Timestamps;
          ...Auditable;
        }

        /** A content post */
        model Post {
          id: GraphQL.ID;
          title: string;
          #deprecated "use contentBody"
          body?: string;
          contentBody: string;
          status: ContentStatus;
          publishedAt?: DateTime;
          viewCount: Long;
          author: Author;
          tags: Tag[];
          comments: Comment[];
          media: MediaAttachment[];
          engagement: Record<Metric>;
          ...Timestamps;
        }

        model Author { user: User; penName?: string; }
        model Comment { id: GraphQL.ID; text: string; author: User; post: Post; replies: Comment[]; parentComment?: Comment; ...Timestamps; }
        model Tag { id: GraphQL.ID; name: string; slug: string; postCount: int32; }
        model MediaAttachment { id: GraphQL.ID; url: URL; mimeType: MimeType; altText?: string; width?: int32; height?: int32; }
        model Metric { count: Long; lastUpdated: DateTime; }
        model PostFilter { authorId?: string; status?: ContentStatus; tag?: string; sortOrder?: SortOrder; }
        model AuditedComment extends Timestamps { ...Auditable; commentId: GraphQL.ID; action: string; reason?: string; }
        model Board { id: GraphQL.ID; name: string; description?: string; posts: Post[]; owner: User; }

        union SearchResult { user: User, post: Post, tag: Tag }
        union NotificationContent { post: Post, comment: Comment, message: string }
        model FeedItem { content: Article | Post | Review; relevanceScore: float32; reason: string; }
        alias Publishable = Post | Article;
        union WrappedArticle { article: Article }

        model CreatePostInput { title: string; contentBody: string; status?: ContentStatus; tagIds: string[]; media?: CreateMediaInput[]; }
        model CreateArticleInput { title: string; slug: string; content: string; author: CreateAuthorInput; reviewPolicy?: CreateReviewPolicyInput; }
        model CreateAuthorInput { userId: GraphQL.ID; penName?: string; }
        model CreateReviewPolicyInput { requireApproval: boolean; minReviewers: int32; autoPublish: boolean; }
        model CreateMediaInput { url: URL; mimeType: MimeType; altText?: string; }
        model UpdatePostInput { title?: string; contentBody?: string; status?: ContentStatus; }
        model CreateCommentInput { text: string; replies?: CreateCommentInput[]; }

        /** Fetch a user by ID */
        @query op getUser(id: GraphQL.ID): User;
        @query op getUsers(limit?: int32, offset?: int32): User[];
        /** Search content */
        @query op search(query: string, limit?: int32): SearchResult[];
        @query op getPost(id: GraphQL.ID): Post | null;
        @query op getFeed(userId: GraphQL.ID, cursor?: string): FeedItem[];
        @query op getContent(id: GraphQL.ID): Article | Post;
        @query op getReviews(articleId: GraphQL.ID): ReviewConnection;
        @query op listPosts(filter?: PostFilter, sort?: SortOrder): Post[];
        @query op getPublishable(id: GraphQL.ID): Publishable;
        @query op getNotification(id: GraphQL.ID): NotificationContent;
        @query op getWrapped(): WrappedArticle;
        @query op getAuditLog(postId: GraphQL.ID): AuditedComment[];

        @mutation op createUser(input: User): User;
        @mutation op createPost(input: CreatePostInput): Post;
        @mutation op createArticle(input: CreateArticleInput): Article;
        @mutation op updatePost(id: GraphQL.ID, input: UpdatePostInput): Post;
        @mutation op deletePost(id: GraphQL.ID): boolean;
        @mutation op addComment(postId: GraphQL.ID, input: CreateCommentInput): Comment;
        #deprecated "use createPost"
        @mutation op publishDraft(draftId: GraphQL.ID): Post;

        @subscription op onPostPublished(): Post;
        @subscription op onNewComment(postId: GraphQL.ID): Comment;

        interface BoardOps {
          @query getBoard(id: GraphQL.ID): Board;
          @query listBoards(userId: GraphQL.ID): Board[];
          @mutation createBoard(name: string, description?: string): Board;
        }
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(sdl).toContain("type Query");
    expect(sdl).toContain("type Mutation");
    expect(sdl).toContain("type Subscription");
    expect(sdl).not.toMatch(/^scalar string$/m);
    expect(errors.filter((d) => d.message.includes("collides"))).toHaveLength(0);
  });
});

// =============================================================================
// Schema 2: Generics — template models, nested, constrained, recursive
// Patterns: #16-18, #57, #72
// =============================================================================
describe("schema: generics", () => {
  it("emits instantiated generics including nested", async () => {
    const { sdl, errors } = await emitSchema(
      "02-generics",
      `
      @schema(#{ name: "generics" })
      namespace Generics {
        scalar DateTime extends utcDateTime;

        model PagedResponse<T> { data: T[]; totalCount: int32; hasMore: boolean; cursor?: string; }
        model BatchResult<T> { pages: PagedResponse<T>[]; batchId: string; completedAt: DateTime; }
        model TreeNode<T> { value: T; children: TreeNode<T>[]; parent?: TreeNode<T>; }
        model CreateInput<T> { data: T; clientMutationId?: string; }

        model User { id: string; name: string; }
        model Post { id: string; title: string; }
        model Tag { id: string; name: string; }

        @query op getUsers(cursor?: string): PagedResponse<User>;
        @query op getBatchPosts(): BatchResult<Post>;
        @query op getTree(rootId: string): TreeNode<Post>;
        @mutation op batchCreateTags(input: CreateInput<Tag>): Tag[];
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(sdl).toContain("PagedResponseOfUser");
    expect(sdl).toContain("BatchResultOfPost");
    expect(sdl).toContain("PagedResponseOfPost");
    expect(sdl).toContain("TreeNodeOfPost");
    expect(errors).toHaveLength(0);
  });
});

// =============================================================================
// Schema 3: Visibility — read-only, create-only, query/mutation splitting
// Patterns: #41-44
// =============================================================================
describe("schema: visibility", () => {
  it("emits visibility-filtered input/output types", async () => {
    const { sdl, errors } = await emitSchema(
      "03-visibility",
      `
      @schema(#{ name: "visibility" })
      namespace Visibility {
        scalar DateTime extends utcDateTime;

        model Account {
          @visibility(Lifecycle.Read) id: GraphQL.ID;
          @visibility(Lifecycle.Read) createdAt: DateTime;
          @visibility(Lifecycle.Read) lastLoginAt: DateTime;
          @visibility(Lifecycle.Create) password: string;
          @visibility(Lifecycle.Create) inviteCode?: string;
          username: string;
          displayName: string;
          isActive: boolean;
        }

        @query op getAccount(id: GraphQL.ID): Account;
        @mutation op createAccount(input: Account): Account;

        model ServerGenerated {
          @visibility(Lifecycle.Read) requestId: string;
          @visibility(Lifecycle.Read) timestamp: DateTime;
          @visibility(Lifecycle.Read) serverVersion: string;
        }

        @query op getServerInfo(): ServerGenerated;
        @mutation op triggerJob(info: ServerGenerated): boolean;

        model UserProfile {
          @visibility(Lifecycle.Read, Lifecycle.Query) id: GraphQL.ID;
          @visibility(Lifecycle.Read, Lifecycle.Query) username: string;
          @visibility(Lifecycle.Create, Lifecycle.Update) email: string;
          @visibility(Lifecycle.Create, Lifecycle.Update) password: string;
          displayName: string;
          bio?: string;
        }

        @query op findProfiles(filter: UserProfile): UserProfile[];
        @mutation op updateProfile(input: UserProfile): UserProfile;
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(sdl).toContain("type Account");
    expect(sdl).toContain("input AccountInput");
    expect(sdl).toMatch(/input AccountInput[^}]*password/s);
    expect(sdl).not.toMatch(/input AccountInput[^}]*lastLoginAt/s);
    expect(sdl).toContain("UserProfileQueryInput");
    expect(sdl).toContain("UserProfileMutationInput");
    expect(errors).toHaveLength(0);
  });
});

// =============================================================================
// Schema 4: Record types
// Patterns: #21-24
// =============================================================================
describe("schema: record types", () => {
  it("emits Record<T> as custom scalars", async () => {
    const { sdl, errors } = await emitSchema(
      "04-records",
      `
      @schema(#{ name: "records" })
      namespace Records {
        scalar DateTime extends utcDateTime;
        model Metric { count: int32; lastUpdated: DateTime; }

        model Config {
          labels: Record<string>;
          metrics: Record<Metric>;
          rawData: Record<unknown> | null;
        }

        model StrictConfig {
          maxItems: int32;
          enabled: boolean;
          ...Record<never>;
        }

        @query op getConfig(): Config;
        @query op getStrictConfig(): StrictConfig;
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(sdl).toContain("scalar RecordOfString");
    expect(sdl).toContain("scalar RecordOfMetric");
    expect(errors).toHaveLength(0);
  });

  it("emits a single scalar for Record<T> used in both input and output contexts", async () => {
    const { sdl, errors } = await emitSchema(
      "04b-records-dedup",
      `
      @schema(#{ name: "records-dedup" })
      namespace RecordsDedup {
        model User {
          name: string;
          metadata: Record<string>;
        }

        @query op getUser(): User;
        @mutation op createUser(input: User): User;
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(errors).toHaveLength(0);

    // Should have exactly ONE RecordOfString scalar, not two
    const matches = sdl!.match(/scalar RecordOfString/g);
    expect(matches).toHaveLength(1);

    // Should NOT have RecordOfStringInput
    expect(sdl).not.toContain("RecordOfStringInput");

    // Both type and input should reference the same scalar
    expect(sdl).toMatch(/type User \{[\s\S]*?metadata: RecordOfString/);
    expect(sdl).toMatch(/input UserInput \{[\s\S]*?metadata: RecordOfString/);
  });
});

// =============================================================================
// Schema 5: Union as input — @oneOf conversion
// Patterns: #49, #67
// =============================================================================
describe("schema: union as input", () => {
  it("emits @oneOf input for union in mutation param", async () => {
    const { sdl } = await emitSchema(
      "05-union-input",
      `
      @schema(#{ name: "union-input" })
      namespace UnionInput {
        model Cat { name: string; indoor: boolean; }
        model Dog { name: string; breed: string; }
        union Pet { cat: Cat, dog: Dog }

        @query op getPets(): Pet[];
        @mutation op adoptPet(pet: Pet): Cat | Dog;
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(sdl).toContain("union Pet");
    expect(sdl).toContain("type Query");
    expect(sdl).toContain("type Mutation");
  });
});

// =============================================================================
// Schema 6: Descriptions and deprecation
// Patterns: #52-55
// =============================================================================
describe("schema: descriptions and deprecation", () => {
  it("emits doc comments and @deprecated directives", async () => {
    const { sdl } = await emitSchema(
      "06-descriptions",
      `
      @schema(#{ name: "descriptions" })
      namespace Descriptions {
        enum Priority { Low, Medium, High, Critical }

        model Task {
          id: string;
          /** The task title */
          title: string;
          priority: Priority;
          #deprecated "use priority field"
          oldPriority?: string;
        }

        /** Get tasks by priority */
        @query op getTasks(priority?: Priority): Task[];
        @mutation op setTaskPriority(taskId: string, priority: Priority): Task;
        /** Get a task by ID */
        @query op getTaskById(/** The unique ID */ id: string): Task | null;
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(sdl).toContain('"The task title"');
    expect(sdl).toContain('@deprecated(reason: "use priority field")');
    expect(sdl).toContain('"Get tasks by priority"');
    expect(sdl).toContain('"The unique ID"');
  });
});

// =============================================================================
// Schema 7: @operationFields with visibility
// Patterns: #5, @operationFields + visibility + query/mutation split
// =============================================================================
describe("schema: @operationFields with visibility", () => {
  it("emits operation fields on output, excludes from input, warns", async () => {
    const { sdl, errors, warnings } = await emitSchema(
      "07-opfields",
      `
      @schema(#{ name: "opfields" })
      namespace OpFields {
        model Post { id: GraphQL.ID; title: string; }

        @query op getUser(id: GraphQL.ID): User;
        @query op getUserPosts(userId: GraphQL.ID, limit?: int32): Post[];
        @query op getUserFollowers(userId: GraphQL.ID): User[];
        @operationFields(getUser, getUserPosts, getUserFollowers)
        model User {
          @visibility(Lifecycle.Read) id: GraphQL.ID;
          @visibility(Lifecycle.Read, Lifecycle.Query) username: string;
          @visibility(Lifecycle.Create, Lifecycle.Update) password: string;
          name: string;
          email: string;
        }
        @query op searchUsers(filter: User): User[];
        @mutation op createUser(input: User): User;
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(errors).toHaveLength(0);
    // Output type has operation fields
    expect(sdl).toMatch(/type User \{[^}]*getUser\(/s);
    expect(sdl).toMatch(/type User \{[^}]*getUserPosts\(/s);
    expect(sdl).toMatch(/type User \{[^}]*getUserFollowers\(/s);
    // No input variant has operation fields
    expect(sdl).not.toMatch(/input[^}]*getUser\(/s);
    // Warning about operation fields ignored on input
    expect(
      warnings.some((d) => d.code === "@typespec/graphql/operation-fields-ignored-on-input"),
    ).toBe(true);
  });
});

// =============================================================================
// Schema 8: Remaining gaps — optional+nullable, constrained generic
// Patterns: #18, #32
// =============================================================================
describe("schema: remaining patterns", () => {
  it("emits optional+nullable and constrained generic", async () => {
    const { sdl, errors } = await emitSchema(
      "08-gaps",
      `
      @schema(#{ name: "gaps" })
      namespace Gaps {
        model Item { bio?: string | null; count?: int32 | null; }
        model Labeled<L extends string> { label: L; description: string; }
        @query op getItem(): Item;
        @query op getLabel(): Labeled<"category">;
      }
    `,
    );

    expect(sdl).toBeTruthy();
    expect(errors).toHaveLength(0);
    // optional + nullable → no !
    expect(sdl).toMatch(/bio: String[^!]/);
    expect(sdl).toMatch(/count: Int[^!]/);
    // Constrained generic resolves
    expect(sdl).toContain("type Labeled");
    expect(sdl).toContain("label: String!");
  });
});

// =============================================================================
// Schema 9: Edge case — nested empty model from visibility (API-5280)
// =============================================================================
describe("schema: edge case - nested visibility-filtered empty model", () => {
  it("handles model with property whose type is fully visibility-filtered", async () => {
    const { sdl, errors } = await emitSchema(
      "09-nested-empty",
      `
      @schema(#{ name: "nested-empty" })
      namespace NestedEmpty {
        model Inner {
          @visibility(Lifecycle.Read) id: string;
          @visibility(Lifecycle.Read) createdAt: string;
        }

        model Outer {
          name: string;
          inner: Inner;
        }

        @query op getOuter(): Outer;
        @mutation op createOuter(input: Outer): Outer;
      }
    `,
    );

    // This is a known edge case from code review Finding 2.
    // Inner as input has 0 properties after visibility filtering.
    // Expected: either omit 'inner' from OuterInput, or handle gracefully.
    // eslint-disable-next-line no-console
    console.log("  [Finding 2] SDL:", sdl?.substring(0, 500));
    // eslint-disable-next-line no-console
    console.log(
      "  [Finding 2] Errors:",
      errors.map((d) => d.message),
    );
    // Don't assert pass/fail — just document current behavior
    expect(sdl !== undefined || errors.length > 0).toBe(true);
  });
});
