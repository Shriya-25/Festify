import React, { useState } from 'react';

const FormBuilder = ({ fields, onUpdate }) => {
  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: [] // for dropdown/radio
  });

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'file', label: 'File Upload' },
    { value: 'date', label: 'Date' }
  ];

  const addField = () => {
    if (!newField.label.trim()) {
      alert('Please enter a field label');
      return;
    }

    if (['dropdown', 'radio'].includes(newField.type) && newField.options.length === 0) {
      alert('Please add at least one option for this field type');
      return;
    }

    const fieldToAdd = {
      id: Date.now(),
      label: newField.label,
      type: newField.type,
      required: newField.required,
      placeholder: newField.placeholder || ''
    };
    
    // Only add options if they exist
    if (newField.options.length > 0) {
      fieldToAdd.options = newField.options;
    }

    onUpdate([...fields, fieldToAdd]);

    // Reset form
    setNewField({
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: []
    });
  };

  const removeField = (fieldId) => {
    onUpdate(fields.filter(f => f.id !== fieldId));
  };

  const moveField = (index, direction) => {
    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onUpdate(newFields);
  };

  const updateField = (fieldId, updatedData) => {
    onUpdate(fields.map(f => f.id === fieldId ? { ...f, ...updatedData } : f));
    setEditingField(null);
  };

  const addOption = () => {
    const option = prompt('Enter option text:');
    if (option && option.trim()) {
      setNewField({
        ...newField,
        options: [...newField.options, option.trim()]
      });
    }
  };

  const removeOption = (index) => {
    setNewField({
      ...newField,
      options: newField.options.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing Fields List */}
      {fields.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-white text-lg mb-4">Custom Form Fields ({fields.length})</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="glass-container p-5 border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="font-semibold text-white">{field.label}</span>
                    {field.required && <span className="text-red-400 text-sm font-bold">*</span>}
                    <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                      {fieldTypes.find(ft => ft.value === field.type)?.label}
                    </span>
                  </div>
                  {field.placeholder && (
                    <p className="text-sm text-gray-400">
                      Placeholder: {field.placeholder}
                    </p>
                  )}
                  {field.options && (
                    <p className="text-sm text-gray-400">
                      Options: {field.options.join(', ')}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {/* Move buttons */}
                  <button
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-white disabled:opacity-20 p-2 transition-colors"
                    title="Move up"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="text-gray-400 hover:text-white disabled:opacity-20 p-2 transition-colors"
                    title="Move down"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeField(field.id)}
                    className="text-red-400 hover:text-red-300 p-2 transition-colors"
                    title="Remove field"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Field Form */}
      <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 bg-white/5">
        <h3 className="font-semibold text-white text-lg mb-6">Add New Field</h3>
        
        <div className="space-y-4">
          {/* Field Type Selector */}
          <div>
            <label className="label">Field Type</label>
            <select
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value, options: [] })}
              className="input-field"
            >
              {fieldTypes.map(ft => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {/* Field Label */}
          <div>
            <label className="label">Field Label *</label>
            <input
              type="text"
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              className="input-field"
              placeholder="e.g., T-Shirt Size, Team Name, etc."
            />
          </div>

          {/* Placeholder (for text inputs) */}
          {['text', 'email', 'phone', 'number', 'textarea'].includes(newField.type) && (
            <div>
              <label className="label">Placeholder (Optional)</label>
              <input
                type="text"
                value={newField.placeholder}
                onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                className="input-field"
                placeholder="Hint text for the field"
              />
            </div>
          )}

          {/* Options (for dropdown/radio) */}
          {['dropdown', 'radio'].includes(newField.type) && (
            <div>
              <label className="label">Options *</label>
              <div className="space-y-2">
                {newField.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      readOnly
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="btn-secondary w-full"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Required Checkbox */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="w-5 h-5 rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-white font-medium">Required Field</span>
            </label>
          </div>

          {/* Add Button */}
          <button
            onClick={addField}
            className="btn-primary w-full"
          >
            Add Field to Form
          </button>
        </div>
      </div>

      {fields.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg mb-2">No custom fields added yet</p>
          <p className="text-sm text-gray-500">
            Basic fields (Name, Email, Phone, College) are included by default if prefill is enabled.
          </p>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
