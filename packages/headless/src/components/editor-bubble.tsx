import { BubbleMenu, isNodeSelection, useCurrentEditor } from "@tiptap/react";
import { useMemo, useRef, useEffect, forwardRef } from "react";
import type { BubbleMenuProps } from "@tiptap/react";
import type { ReactNode } from "react";
import type { Instance, Props } from "tippy.js";

export interface EditorBubbleProps extends Omit<BubbleMenuProps, "editor"> {
  readonly children: ReactNode;
}

export const EditorBubble = forwardRef<HTMLDivElement, EditorBubbleProps>(
  ({ children, tippyOptions, ...rest }, ref) => {
    const { editor: currentEditor } = useCurrentEditor();
    const instanceRef = useRef<Instance<Props> | null>(null);

    useEffect(() => {
      if (!instanceRef.current || !tippyOptions?.placement) return;

      instanceRef.current.setProps({ placement: tippyOptions.placement });
      instanceRef.current.popperInstance?.update();
    }, [tippyOptions?.placement]);

    const bubbleMenuProps: BubbleMenuProps = useMemo(() => {
      const shouldShow: BubbleMenuProps["shouldShow"] = ({ editor, state }) => {
        const { selection } = state;
        const { empty } = selection;

        if (!editor.isEditable || editor.isActive("image") || empty || isNodeSelection(selection)) {
          return false;
        }
        return true;
      };

      return {
        shouldShow,
        tippyOptions: {
          onCreate: (val) => {
            instanceRef.current = val;
          },
          moveTransition: "transform 0.15s ease-out",
          ...tippyOptions,
        },
        ...rest,
        editor: currentEditor,
        children: children, // Add this line to include the children prop
      };
    }, [rest, tippyOptions, currentEditor, children]); // Add children to the dependency array

    if (!currentEditor) return null;

    return (
      <div ref={ref}>
        <BubbleMenu {...bubbleMenuProps}>
          {children}
        </BubbleMenu>
      </div>
    );
  }
);

EditorBubble.displayName = "EditorBubble";

export default EditorBubble;