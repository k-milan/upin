"use client";

import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  ChevronDown,
  ChevronUp,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MarkdownBlockEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
};

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

function ToolbarButton({
  active = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-35 ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const listItemType = editor.isActive("taskList") ? "taskItem" : "listItem";

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "");

    if (url === null) return;

    const chain = editor.chain().focus();
    if (!url.trim()) {
      chain.extendMarkRange("link").unsetLink().run();
      return;
    }

    chain.extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-sm"
      role="toolbar"
      aria-label="Markdown formatting"
    >
      <ToolbarButton
        label="Bold"
        icon={Bold}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic"
        icon={Italic}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Underline"
        icon={Underline}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="Strikethrough"
        icon={Strikethrough}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        label="Add or edit link"
        icon={Link}
        active={editor.isActive("link")}
        onClick={setLink}
      />

      <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

      <ToolbarButton
        label="Bullet list"
        icon={List}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Numbered list"
        icon={ListOrdered}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Task list"
        icon={ListTodo}
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      />
      <ToolbarButton
        label="Quote"
        icon={Quote}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="Indent list item"
        icon={IndentIncrease}
        disabled={
          !editor.can().chain().focus().sinkListItem(listItemType).run()
        }
        onClick={() => editor.chain().focus().sinkListItem(listItemType).run()}
      />
      <ToolbarButton
        label="Outdent list item"
        icon={IndentDecrease}
        disabled={
          !editor.can().chain().focus().liftListItem(listItemType).run()
        }
        onClick={() => editor.chain().focus().liftListItem(listItemType).run()}
      />

      <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

      <ToolbarButton
        label="Undo"
        icon={Undo2}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label="Redo"
        icon={Redo2}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

export function MarkdownBlockEditor({
  value,
  onChange,
  placeholder = "Write anything here…",
}: MarkdownBlockEditorProps) {
  const onChangeRef = useRef(onChange);
  const lastEmittedValue = useRef(value);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [, setEditorVersion] = useState(0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    content: value,
    contentType: "markdown",
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({
        indentation: { style: "space", size: 2 },
        markedOptions: { gfm: true },
      }),
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      attributes: {
        "aria-label": "Task notes",
        class: "markdown-block-content",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const markdown = currentEditor.getMarkdown();
      lastEmittedValue.current = markdown;
      onChangeRef.current(markdown);
      setEditorVersion((version) => version + 1);
    },
    onSelectionUpdate: () => setEditorVersion((version) => version + 1),
    onTransaction: () => setEditorVersion((version) => version + 1),
  });

  useEffect(() => {
    if (!editor || editor.isFocused || value === lastEmittedValue.current)
      return;
    if (editor.getMarkdown() === value) return;
    editor.commands.setContent(value, {
      contentType: "markdown",
      emitUpdate: false,
    });
    lastEmittedValue.current = value;
  }, [editor, value]);

  return (
    <div className="markdown-block-editor min-h-full">
      <button
        type="button"
        aria-expanded={isToolbarOpen}
        aria-controls="markdown-formatting-toolbar"
        onClick={() => setIsToolbarOpen((isOpen) => !isOpen)}
        className="mb-3 inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        Formatting
        {isToolbarOpen ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </button>
      {isToolbarOpen && editor ? (
        <div id="markdown-formatting-toolbar">
          <EditorToolbar editor={editor} />
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
