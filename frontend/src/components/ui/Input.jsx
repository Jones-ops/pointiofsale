import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className={className}>
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
