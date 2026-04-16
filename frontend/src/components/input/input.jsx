import "./input.css";

export default function Input({
  id,
  value,
  onChange,
  placeholder,
  type,
  inputRef,
  error,
  pattern,
  title,
  maxLength,
  min,
  max,
  step,
  disabled = false,
}) {
  return (
    <>
      {error && <span className="error-message">{error}</span>}

      <input
        className="input"
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        ref={inputRef}
        pattern={pattern}
        title={title}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
    </>
  );
}
