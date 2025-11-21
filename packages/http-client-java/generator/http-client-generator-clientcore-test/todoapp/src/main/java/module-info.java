module todo {
    requires transitive io.clientcore.core;
    exports todo;
    exports todo.users;
    exports todo.todoitems;
    opens todo to io.clientcore.core;
    opens todo.todoitems.implementation to io.clientcore.core;
    opens todo.users to io.clientcore.core;
    opens todo.implementation to io.clientcore.core;
    opens todo.todoitems to io.clientcore.core;
}