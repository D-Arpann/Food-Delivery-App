import './BackButton.css';

export default function BackButton({
  className = '',
  label = 'Back',
  onClick,
  variant = 'default',
  ...props
}) {
  const classes = [
    'app-back-button',
    `app-back-button-${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} onClick={onClick} {...props}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18 9 12l6-6" />
        <path d="M9 12h11" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
