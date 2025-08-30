import { useEffect, useState, useRef } from "react";
import styles from "../../css-modules/MultipleChoiceQuestion.module.css";

interface MultipleChoiceQuestionProps {
  label: string;
  options: string[];
  controlledValue: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function MultipleChoiceQuestion({
  label,
  options,
  controlledValue,
  onChange,
  required = false,
}: MultipleChoiceQuestionProps) {
  const [value, setValue] = useState(controlledValue);

  const firstOptionRef = useRef<HTMLInputElement>(null);

  const questionId = `mcq-${label.replace(/\s+/g, '-').toLowerCase()}`;

  useEffect(() => {
    setValue(controlledValue);
  }, [controlledValue]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  }

  // Focus the first option when Enter or Space is pressed on the question label
  function handleLabelKeyDown(e: React.KeyboardEvent<HTMLLabelElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      firstOptionRef.current?.focus();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <label
          tabIndex={0} // Make label focusable
          onKeyDown={handleLabelKeyDown}
          className={`${styles.label} ${required ? styles.requiredLabel : ""}`}
        >
          {label} {required && "*"}
        </label>
      </div>

      <div className={styles.options} role="radiogroup" aria-labelledby={questionId}>
        {options.map((option, idx) => {
          const optionId = `${questionId}-option-${idx}`;
          return (
            <label key={idx} htmlFor={optionId} className={styles.option}>
              <input
                ref={idx === 0 ? firstOptionRef : null} // ref for first option
                type="radio"
                id={optionId}
                name={questionId}
                value={option}
                checked={value === option}
                onChange={handleChange}
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default MultipleChoiceQuestion;