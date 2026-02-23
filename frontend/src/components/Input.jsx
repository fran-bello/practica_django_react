const baseClasses =
  "w-full text-sm p-3 rounded-sm border border-gray-300 mb-0 outline-blue-200 outline-1";

function Input({ className = "", error, ...props }) {
  return (
    <div className="w-full">
      <input
        className={`${baseClasses} ${error ? "border-red-500" : ""} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id || props.name}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={props.id || props.name ? `${props.id || props.name}-error` : undefined} className="text-red-600 text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
