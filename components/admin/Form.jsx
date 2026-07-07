import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function Form({ fields, onSubmit, initialValues = {}, submitText = 'Submit', onFormDataChange }) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInitialized = useRef(false);

  // Update formData when initialValues change (for edit mode), but only on first load or when key changes
  useEffect(() => {
    if (!isInitialized.current) {
      setFormData(initialValues);
      isInitialized.current = true;
    }
  }, [initialValues]);

  // Notify parent of formData changes for external components like MediaPicker
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.validation && !field.validation(formData[field.name])) {
        newErrors[field.name] = field.validationMessage || 'Invalid value';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field, index) => (
        <motion.div
          key={field.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'date' || field.type === 'time' ? (
            <input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleChange(field.name, value);
                if (field.onChange) {
                  field.onChange(value, formData, handleChange);
                }
              }}
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors[field.name]
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
              disabled={isSubmitting}
            />
          ) : field.type === 'textarea' ? (
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 4}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors[field.name]
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all resize-none`}
              disabled={isSubmitting}
            />
          ) : field.type === 'select' ? (
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors[field.name]
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all`}
              disabled={isSubmitting}
            >
              <option value="">Select {field.label}</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData[field.name] || false}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {field.checkboxLabel}
              </span>
            </div>
          ) : field.type === 'file' ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
              <input
                type="file"
                onChange={(e) => handleChange(field.name, e.target.files[0])}
                className="hidden"
                id={field.name}
                disabled={isSubmitting}
                accept="image/*"
              />
              <label
                htmlFor={field.name}
                className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {formData[field.name] ? (
                  <div className="space-y-2">
                    {typeof formData[field.name] === 'string' ? (
                      <img
                        src={formData[field.name]}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formData[field.name].name}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm mt-1">or drag and drop</p>
                  </>
                )}
              </label>
            </div>
          ) : field.type === 'richtext' ? (
            <div>
              {field.render ? (
                field.render(formData, handleChange, isSubmitting)
              ) : null}
            </div>
          ) : field.type === 'custom' && field.render ? (
            <div>{field.render(formData, handleChange, isSubmitting)}</div>
          ) : null}

          {field.helpText && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {field.helpText}
            </p>
          )}
          {errors[field.name] && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-500"
            >
              {errors[field.name]}
            </motion.p>
          )}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: fields.length * 0.05 }}
      >
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : submitText}
        </button>
      </motion.div>
    </form>
  );
}
