import { Category, Answer, AnswerValue } from "@/types/analyzer";
import { QuestionCard } from "./QuestionCard";

interface CategorySectionProps {
  category: Category;
  answers: Answer[];
  onAnswerChange: (categoryId: string, questionId: string, value: AnswerValue) => void;
}

export function CategorySection({ category, answers, onAnswerChange }: CategorySectionProps) {
  const getAnswerValue = (questionId: string): AnswerValue | undefined => {
    const answer = answers.find(
      a => a.categoryId === category.id && a.questionId === questionId
    );
    return answer?.value;
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">{category.name}</h2>
      <div className="space-y-4">
        {category.questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={getAnswerValue(question.id)}
            onChange={(value) => onAnswerChange(category.id, question.id, value)}
          />
        ))}
      </div>
    </section>
  );
}
