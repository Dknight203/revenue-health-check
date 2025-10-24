import { Question, AnswerValue } from "@/types/analyzer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuestionCardProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
      <Label className="text-base font-medium text-foreground leading-relaxed">
        {question.text}
      </Label>
      
      <RadioGroup
        value={value?.toString()}
        onValueChange={(v) => onChange(parseInt(v) as AnswerValue)}
      >
        {([0, 1, 2, 3] as AnswerValue[]).map((score) => (
          <div key={score} className="flex items-start space-x-3 py-2">
            <RadioGroupItem value={score.toString()} id={`${question.id}_${score}`} className="mt-1" />
            <Label
              htmlFor={`${question.id}_${score}`}
              className="flex-1 cursor-pointer text-sm leading-relaxed text-foreground/90"
            >
              <span className="font-medium">{score}:</span> {question.descriptions[score]}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
