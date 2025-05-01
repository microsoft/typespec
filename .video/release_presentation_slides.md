# Slide 1: TypeSpec 1.0-RC

## Design Faster Today, Scale Easier Tomorrow

---

# Slide 2: What is TypeSpec?

- Open source language for describing API contracts
- Created by Microsoft, shared with the community
- Concise, human-readable API definitions
- Single source of truth for API artifacts

---

# Slide 3: What TypeSpec Generates

- API specifications (OpenAPI, JSON Schema, Protocol Buffers)
- Server-side code skeletons
- Client libraries in multiple languages
- Documentation
- Custom formats through emitters

---

# Slide 4: API-First Development

- Single source of truth for all artifacts
- Eliminates drift between implementations
- Accelerates initial API development
- Keeps everything in sync as your API grows

---

# Slide 5: Who's Using TypeSpec?

- Microsoft internal teams
- London Stock Exchange Group
- Growing community of adopters
- Accessible to technical and non-technical stakeholders

---

# Slide 6: TypeSpec in Action

```tsp
@route("/todoitems")
interface TodoItems {
  @get getTodoItems(): TodoItem[];
  @post createTodoItem(@body body: CreateTodoItem): Http.CreatedResponse & TodoItem;
}

model TodoItem {
  @visibility(Lifecycle.Read)
  id: string;

  content: string;
  dueDate: utcDateTime;
  isCompleted: boolean;
  labels?: string[];
}
```

---

# Slide 7: Code Generation Preview

![TypeSpec Workflow Diagram](./workflow-diagram-full.png)

- Server controllers and models
- Client libraries in multiple languages
- Type-safe interfaces

---

# Slide 8: What's in 1.0-RC?

**Stable Components:**

- Compiler and core libraries
- IDE support for VS Code and Visual Studio
- OpenAPI 3.0 and JSON Schema emitters

**Preview Features:**

- Protocol emitters
- Client/server code generation
- Specialized libraries

---

# Slide 9: Emitter Framework

- Transform TypeSpec to various formats
- Compatible with existing OpenAPI workflows
- Build custom emitters for specialized needs
- Migrate existing OpenAPI definitions

---

# Slide 10: Community & Ecosystem

- GitHub Issues & Discussions
- Discord Community
- Comprehensive Documentation
- Videos & Examples

---

# Slide 11: Getting Started

1. Install TypeSpec
2. Create your first API definition
3. Generate artifacts
4. Join our community

---

# Slide 12: We Need Your Feedback!

- Try the preview features
- Share your thoughts
- Report bugs
- Request features

---

# Slide 13: Thank You!

TypeSpec 1.0-RC: Design Faster Today, Scale Easier Tomorrow

- Docs: typespec.io/docs
- GitHub: github.com/microsoft/typespec
- Discord: aka.ms/typespec/discord
