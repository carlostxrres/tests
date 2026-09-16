import { CheckIcon, XIcon } from "lucide-react";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";

type Props = {
  options: string[];
  correctOption: number;
  // The option the user picked, if any (null = explicitly unanswered).
  choice?: number | null;
};

const letters = "ABCDEFGHIJ";

// Read-only option list: the correct option is highlighted, and the user's
// choice (when given) is marked as correct or incorrect.
export function QuestionOptions({ options, correctOption, choice }: Props) {
  return (
    <ItemGroup className="gap-2">
      {options.map((option, index) => {
        const isCorrect = index === correctOption;
        const isChoice = choice === index;
        return (
          <Item
            key={option}
            variant="outline"
            size="sm"
            className={cn(
              "items-start",
              isCorrect && "border-success/40 bg-success/10",
              isChoice && !isCorrect && "border-destructive/40 bg-destructive/10",
            )}
            aria-current={isChoice ? "true" : undefined}
          >
            <ItemMedia
              variant="icon"
              className={cn(
                "size-7 self-start rounded-full border font-mono text-xs",
                isCorrect && "border-success/40 bg-success/15 text-success",
                isChoice &&
                  !isCorrect &&
                  "border-destructive/40 bg-destructive/15 text-destructive",
              )}
            >
              {isCorrect ? <CheckIcon /> : isChoice ? <XIcon /> : letters[index]}
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="font-normal text-pretty">{option}</ItemTitle>
            </ItemContent>
          </Item>
        );
      })}
    </ItemGroup>
  );
}
