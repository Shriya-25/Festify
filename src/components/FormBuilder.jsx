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
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'phone', label: 'Phone Number', icon: '📱' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'textarea', label: 'Long Text', icon: '📄' },
    { value: 'dropdown', label: 'Dropdown', icon: '▼' },
    { value: 'radio', label: 'Radio Buttons', icon: '⚪' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑' },
    { value: 'file', label: 'File Upload', icon: '📎' },
    { value: 'date', label: 'Date', icon: '📅' }
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
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Custom Form Fields: ({fields.length})</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">
                      {fieldTypes.find(ft => ft.value === field.type)?.icon}
                    </span>
                    <span className="font-medium">{field.label}</span>
                    {field.required && <span className="text-red-500 text-sm">*</span>}
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      {fieldTypes.find(ft => ft.value === field.type)?.label}
                    </span>
                  </div>
                  {field.placeholder && (
                    <p className="text-sm text-gray-500 ml-7">
                      Placeholder: {field.placeholder}
                    </p>
                  )}
                  {field.options && (
                    <p className="text-sm text-gray-500 ml-7">
                      Options: {field.options.join(', ')}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Move buttons */}
                  <button
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    title="Move up"
                  >
                    ⬆
                  </button>
                  <button
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    title="Move down"
                  >
                    ⬇
                  </button>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeField(field.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove field"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Field Form */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h3 className="font-semibold text-gray-700 mb-4">➕ Add New Field</h3>
        
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
                  {ft.icon} {ft.label}
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
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
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
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Required Field</span>
            </label>
          </div>

          {/* Add Button */}
          <button
            onClick={addField}
            className="btn-primary w-full"
          >
            ➕ Add Field to Form
          </button>
        </div>
      </div>

      {fields.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No custom fields added yet.</p>
          <p className="text-sm mt-2">
            Basic fields (Name, Email, Phone, College) are included by default if prefill is enabled.
          </p>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
