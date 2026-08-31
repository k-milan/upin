"use client";

import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

type MarkdownBlockEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
};

export function MarkdownBlockEditor({
  value,
  onChange,
  placeholder = "Write anything here…",
}: MarkdownBlockEditorProps) {
  const onChangeRef = useRef(onChange);
  const lastEmittedValue = useRef(value);

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
    },
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
      <EditorContent editor={editor} />
    </div>
  );
}
