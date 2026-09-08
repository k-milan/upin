"use client";

import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  CodeXml,
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
import { type FormEvent, useEffect, useRef, useState } from "react";

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

type LinkDraft = {
  isExistingLink: boolean;
  selectedText: string;
  selection: { from: number; to: number };
  url: string;
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

type EditorToolbarProps = {
  editor: Editor;
  linkDraft: LinkDraft | null;
  linkUrlInputRef: React.RefObject<HTMLInputElement | null>;
  onCloseLink: () => void;
  onOpenLink: () => void;
  onRemoveLink: () => void;
  onSaveLink: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateLink: (
    updates: Partial<Pick<LinkDraft, "selectedText" | "url">>,
  ) => void;
};

function EditorToolbar({
  editor,
  linkDraft,
  linkUrlInputRef,
  onCloseLink,
  onOpenLink,
  onRemoveLink,
  onSaveLink,
  onUpdateLink,
}: EditorToolbarProps) {
  const listItemType = editor.isActive("taskList") ? "taskItem" : "listItem";

  return (
    <div className="relative mb-3">
      <div
        id="markdown-formatting-toolbar"
        className="flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-sm"
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
          onClick={onOpenLink}
        />
        <ToolbarButton
          label="Inline code"
          icon={Code}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
        <ToolbarButton
          label="Code block"
          icon={CodeXml}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
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
          onClick={() =>
            editor.chain().focus().sinkListItem(listItemType).run()
          }
        />
        <ToolbarButton
          label="Outdent list item"
          icon={IndentDecrease}
          disabled={
            !editor.can().chain().focus().liftListItem(listItemType).run()
          }
          onClick={() =>
            editor.chain().focus().liftListItem(listItemType).run()
          }
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

      {linkDraft ? (
        <form
          className="absolute top-[calc(100%+0.5rem)] left-0 z-10 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-border bg-card p-3 shadow-lg"
          onSubmit={onSaveLink}
        >
          <p className="mb-2 text-sm font-medium text-foreground">
            {linkDraft.isExistingLink ? "Edit link" : "Add link"}
          </p>
          {!linkDraft.isExistingLink &&
          linkDraft.selection.from === linkDraft.selection.to ? (
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Text
              <input
                value={linkDraft.selectedText}
                onChange={(event) =>
                  onUpdateLink({ selectedText: event.target.value })
                }
                placeholder="Link text"
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2.5 text-base outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </label>
          ) : null}
          <label className="block text-xs font-medium text-muted-foreground">
            URL
            <input
              ref={linkUrlInputRef}
              type="url"
              value={linkDraft.url}
              onChange={(event) => onUpdateLink({ url: event.target.value })}
              placeholder="https://example.com"
              required
              className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2.5 text-base outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <div className="mt-3 flex items-center justify-between gap-2">
            {linkDraft.isExistingLink ? (
              <button
                type="button"
                onClick={onRemoveLink}
                className="h-8 rounded-lg px-2 text-xs font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/20"
              >
                Remove link
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onCloseLink}
                className="h-8 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !linkDraft.url.trim() ||
                  (!linkDraft.isExistingLink &&
                    linkDraft.selection.from === linkDraft.selection.to &&
                    !linkDraft.selectedText.trim())
                }
                className="h-8 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              >
                Save link
              </button>
            </div>
          </div>
        </form>
      ) : null}
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
  const linkUrlInputRef = useRef<HTMLInputElement>(null);
  const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);
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

  useEffect(() => {
    if (!linkDraft) return;
    window.requestAnimationFrame(() => linkUrlInputRef.current?.focus());
  }, [linkDraft]);

  const openLinkPopover = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const existingUrl = editor.getAttributes("link").href as string | undefined;
    setLinkDraft({
      isExistingLink: editor.isActive("link"),
      selectedText: editor.state.doc.textBetween(from, to, " "),
      selection: { from, to },
      url: existingUrl ?? "",
    });
  };

  const saveLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || !linkDraft || !linkDraft.url.trim()) return;

    const { isExistingLink, selectedText, selection, url } = linkDraft;
    const chain = editor.chain().focus().setTextSelection(selection);

    if (isExistingLink) {
      chain.extendMarkRange("link").setLink({ href: url.trim() }).run();
    } else {
      chain
        .insertContent({
          type: "text",
          text: selectedText,
          marks: [{ type: "link", attrs: { href: url.trim() } }],
        })
        .run();
    }

    setLinkDraft(null);
  };

  const removeLink = () => {
    if (!editor || !linkDraft) return;
    editor
      .chain()
      .focus()
      .setTextSelection(linkDraft.selection)
      .extendMarkRange("link")
      .unsetLink()
      .run();
    setLinkDraft(null);
  };

  return (
    <div className="markdown-block-editor min-h-full">
      {editor ? (
        <EditorToolbar
          editor={editor}
          linkDraft={linkDraft}
          linkUrlInputRef={linkUrlInputRef}
          onCloseLink={() => setLinkDraft(null)}
          onOpenLink={openLinkPopover}
          onRemoveLink={removeLink}
          onSaveLink={saveLink}
          onUpdateLink={(updates) =>
            setLinkDraft((draft) => (draft ? { ...draft, ...updates } : null))
          }
        />
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
