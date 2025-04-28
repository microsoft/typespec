package todo.implementation;

import todo.todoitems.TodoItemPatch;

/**
 * This is the Helper class to enable json merge patch serialization for a model.
 */
public class JsonMergePatchHelper {
    private static TodoItemPatchAccessor todoItemPatchAccessor;

    public interface TodoItemPatchAccessor {
        TodoItemPatch prepareModelForJsonMergePatch(TodoItemPatch todoItemPatch, boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(TodoItemPatch todoItemPatch);
    }

    public static void setTodoItemPatchAccessor(TodoItemPatchAccessor accessor) {
        todoItemPatchAccessor = accessor;
    }

    public static TodoItemPatchAccessor getTodoItemPatchAccessor() {
        return todoItemPatchAccessor;
    }
}
