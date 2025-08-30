import { useEffect, useState, useRef } from 'react';
import styles from "../../css-modules/TextQuestion.module.css";

interface TextQuestionProps {
  label: string;
  onChange: (value: string) => void;
  controlledValue: string;
  required?: boolean;
  disableOverwrite?: boolean;
  size?: 'small' | 'large';
}

function TextQuestion({
  label,
  onChange,
  controlledValue,
  required = false,
  disableOverwrite = false,
  size = 'large'
}: TextQuestionProps) {
  const [value, setValue] = useState(controlledValue);
  const [placeholder, setPlaceholder] = useState("Enter text here");
  const [isValid, setIsValid] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const textareaId = `text-question-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const errorId = `${textareaId}-error`;

  useEffect(() => {
    setValue(controlledValue);
  }, [controlledValue]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    setIsValid(true);
    setPlaceholder("Enter text here");
    onChange(newValue);
  }

  function validate() {
    if (required && value.trim() === '') {
      setIsValid(false);
      setPlaceholder("This field is required");
    }
  }

  // Focus textarea when Enter or Space is pressed on the label
  function handleLabelKeyDown(e: React.KeyboardEvent<HTMLLabelElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      textareaRef.current?.focus();
    }
  }

  return (
    <div className={`${styles.container} ${size === 'small' ? styles.smallContainer : ''}`}>
      <div className={styles.labelRow}>
        <label
          htmlFor={textareaId}
          tabIndex={0} // make label focusable
          onKeyDown={handleLabelKeyDown}
          className={`${styles.label} ${required ? styles.requiredLabel : ''} ${size === 'small' ? styles.smallLabel : ''}`}
        >
          {label} {required && '*'}
        </label>
      </div>

      <textarea
        id={textareaId}
        ref={textareaRef}
        className={`${styles.input} ${isValid ? styles.validInput : styles.invalidInput} ${disableOverwrite ? styles.disabledInput : ""} ${size === 'small' ? styles.smallInput : ''}`}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={validate}
        aria-invalid={!isValid}
        aria-describedby={!isValid ? errorId : undefined}
        disabled={disableOverwrite}
      />

      {!isValid && (
        <div id={errorId} role="alert" className={styles.errorText}>
          {placeholder}
        </div>
      )}
    </div>
  );
}

export default TextQuestion;