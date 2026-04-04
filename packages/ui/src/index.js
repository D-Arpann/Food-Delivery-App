export function Button({ children, variant = 'primary', ...props }) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 28px',
    borderRadius: '8px',
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  }

  const variants = {
    primary: {
      background: '#F8964F',
      color: '#FFFFFF',
      borderColor: '#FFDCC3',
    },
    outline: {
      background: 'transparent',
      color: '#1E1E1E',
      borderColor: '#EAEAEA',
    },
  }

  return (
    <button style={{ ...baseStyles, ...variants[variant] }} {...props}>
      {children}
    </button>
  )
}
