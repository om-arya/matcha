import styles from '../css-modules/NavigationButtons.module.css';

interface NavigationButtonsProps {
  onNext?: () => void;
  onBack?: () => void;
  canGoNext?: boolean;
  canGoBack?: boolean;
  nextLabel?: string;
  backLabel?: string;
  className?: string;
  showSaveOptions?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onNext,
  onBack,
  canGoNext = true,
  canGoBack = true,
  nextLabel = 'Next',
  backLabel = 'Back',
  className = ''
}) => {
  const handleClick = (callback?: () => void) => {
    if (callback) callback();
  };

  const getButtons = () => {
    const buttons: React.ReactNode[] = [];

    if (onBack) {
      buttons.push(
        <button
          key="back"
          className={`${styles.navigationButton} ${styles.backButton}`}
          onClick={() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: 'smooth'
            });
            handleClick(onBack);
          }}
          disabled={!canGoBack}
          aria-disabled={!canGoBack}
          aria-label={backLabel}
        >
          {backLabel}
        </button>
      );
    }

    if (onNext) {
      buttons.push(
        <button
          key="next"
          className={`${styles.navigationButton} ${styles.nextButton}`}
          onClick={() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: 'smooth'
            });
            handleClick(onNext);
          }}
          disabled={!canGoNext}
          aria-disabled={!canGoNext}
          aria-label={nextLabel}
        >
          {nextLabel}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div
      className={`${styles.navigationButtons} ${className}`}
      role="group"
      aria-label="Navigation Buttons"
    >
      {getButtons()}
    </div>
  );
};

export default NavigationButtons;