import { useEffect, useState, useRef } from "react";
import styles from "../../css-modules/SelectMultipleQuestion.module.css";

interface SelectMultipleQuestionProps {
  label: string;
  options: string[];
  controlledValue: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function SelectMultipleQuestion({
  label,
  options,
  controlledValue,
  onChange,
  required = false,
}: SelectMultipleQuestionProps) {
  const initialArray = (() => {
    try {
      return controlledValue ? JSON.parse(controlledValue) : [];
    } catch {
      return [];
    }
  })();

  const [selected, setSelected] = useState<string[]>(initialArray);

  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  const groupId = `smq-${label.replace(/\s+/g, '-').toLowerCase()}`;

  useEffect(() => {
    try {
      const parsed = controlledValue ? JSON.parse(controlledValue) : [];
      setSelected(parsed);
    } catch {
      setSelected([]);
    }
  }, [controlledValue]);

  function handleToggle(option: string) {
    let newSelected: string[];
    if (selected.includes(option)) {
      newSelected = selected.filter((item) => item !== option);
    } else {
      newSelected = [...selected, option];
    }
    setSelected(newSelected);
    onChange(JSON.stringify(newSelected));
  }

  // Focus first checkbox when Enter/Space is pressed on label
  function handleLabelKeyDown(e: React.KeyboardEvent<HTMLLabelElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      firstCheckboxRef.current?.focus();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <label
          tabIndex={0} // focusable
          onKeyDown={handleLabelKeyDown}
          className={`${styles.label} ${required ? styles.requiredLabel : ""}`}
        >
          {label} {required && "*"}
        </label>
      </div>

      <div className={styles.options} role="group" aria-labelledby={groupId}>
        {options.map((option, idx) => {
          const optionId = `${groupId}-option-${idx}`;
          return (
            <label key={idx} htmlFor={optionId} className={styles.option}>
              <input
                ref={idx === 0 ? firstCheckboxRef : null}
                type="checkbox"
                id={optionId}
                value={option}
                checked={selected.includes(option)}
                onChange={() => handleToggle(option)}
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default SelectMultipleQuestion;