// src/App.jsx
import { useState, useEffect } from 'react';

// Main app component
function App() {
  const [formData, setFormData] = useState({
    name: '',
    dept: 'IT',
    active: false,
    number: '',
    email: '',
    address: '',
    photo: null,
  });

  // Employees and UI states
  const [employees, setEmployees] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null); 

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Load employees from backend
  const fetchEmployees = () => {
    fetch('http://localhost:3000/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error('Failed to load employees:', err));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle photo upload and clear error on new selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear photo error immediately when a file is selected
    if (errors.photo) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photo;
        return newErrors;
      });
    }

    // Validate file type and size
    if (!file.type.match('image/(jpeg|png|jpg)')) {
      setErrors(prev => ({ ...prev, photo: 'Only JPG or PNG images are allowed.' }));
      return;
    }

    // Max size 2MB
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: 'File too large (max 2MB).' }));
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, photo: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Name Validation
    if (!formData.name.trim()) newErrors.name = 'Employee name is required.';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters.';

    // Email Validation
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email address.';

    // Number Validation
    if (!formData.number.trim()) newErrors.number = 'Employee number is required.';
    else if (!/^\d+$/.test(formData.number))
      newErrors.number = 'Employee number must contain only digits.';
    else if (formData.number.length > 10)
      newErrors.number = 'Employee number too long (max 10 digits).';

    // Address Validation
    if (!formData.address.trim()) newErrors.address = 'Employee address is required.';

    // Photo Validation
    if (!formData.photo) newErrors.photo = 'Employee photo is required.';

    return newErrors;
  };

  // Create or Update employee
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Validate form
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return; // stop submission

    try {
      const url = isEditing
        ? `http://localhost:3000/api/employees/${currentId}`
        : 'http://localhost:3000/api/employees';
      const method = isEditing ? 'PUT' : 'POST';

      // Send data to backend
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Handle response
      if (response.ok) {
        setMessage({
          text: isEditing ? 'Employee updated successfully!' : 'Employee created successfully!',
          type: 'success',
        });

        // Refresh employee list
        fetchEmployees(); // Refresh list
        resetForm(); // Clear form
        setTimeout(() => setMessage({ text: '', type: '' }), 5000); // clear message after 5s

      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.error || 'Something went wrong.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error. Is backend running?', type: 'error' });
      console.error(err);
    }
  };

  // Clear form
  const resetForm = () => {
    setFormData({
      name: '',
      dept: 'IT',
      active: false,
      number: '',
      email: '',
      address: '',
      photo: null,
    });
    setIsEditing(false);
    setCurrentId(null);
    setErrors({});
  };

  // Populate form for editing
  const handleEdit = (emp) => {
    setFormData({
      name: emp.name,
      dept: emp.dept,
      active: emp.active,
      number: emp.number,
      email: emp.email,
      address: emp.address,
      photo: emp.photo,
    });
    setIsEditing(true); // Switch to edit mode
    setCurrentId(emp.id); // Store current employee ID
    setErrors({}); // Clear previous errors
  };

  // DELETE - Remove employee
  const handleDelete = (id) => {
    setDeleteConfirm(id);
  };

  // Confirm deletion
  const confirmDelete = () => {
    fetch(`http://localhost:3000/api/employees/${deleteConfirm}`, { method: 'DELETE' })
      .then(() => {
        setMessage({ text: 'Employee deleted!', type: 'success' });
        fetchEmployees(); // Refresh list
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      })
      .catch(err => {
        setMessage({ text: 'Failed to delete employee', type: 'error' });
        console.error(err);
      })
      .finally(() => {
        setDeleteConfirm(null);
      });
  };

  // Cancel deletion
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // VIEW - View employee details
  const handleView = (emp) => setViewEmployee(emp);
  // Close view popup
  const closeView = () => setViewEmployee(null);

  return (
    <div className="container">
      <h1>Employee Manager</h1>

      {/* Message Display */}
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Employee Form */}
      <div className="card">
        <h2>{isEditing ? 'Edit Employee' : 'Create Employee'}</h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label>Employee Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'invalid' : ''}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          {/* Department */}
          <div className="form-group">
            <label>Department *</label>
            <select
              name="dept"
              value={formData.dept}
              onChange={handleInputChange}
            >
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
              <option value="Security">Security</option>
            </select>
          </div>

          {/* Active */}
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
              />
              Employee Active
            </label>
          </div>

          {/* Employee Number */}
          <div className="form-group">
            <label>Employee Number *</label>
            <input
              type="text"
              name="number"
              value={formData.number}
              onChange={handleInputChange}
              className={errors.number ? 'invalid' : ''}
            />
            {errors.number && <div className="error-message">{errors.number}</div>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Employee Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'invalid' : ''}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          {/* Address */}
          <div className="form-group">
            <label>Employee Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className={errors.address ? 'invalid' : ''}
            />
            {errors.address && <div className="error-message">{errors.address}</div>}
          </div>

          {/* Photo */}
          <div className="form-group">
            <label>Employee Photo *</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoChange}
              className={errors.photo ? 'invalid' : ''}
            />
            {formData.photo && (
              <img src={formData.photo} alt="Preview" className="photo-preview" />
            )}
            {errors.photo && <div className="error-message">{errors.photo}</div>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {isEditing ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>

        {/* Employee List */}
        <div className="employee-list">
          <h2>Employee List</h2>
          {employees.length === 0 ? (
            <p className="text-center" style={{ color: '#6b7280', marginTop: '1rem' }}>
              No employees yet. Create one!
            </p>
          ) : (
            <div>
              {employees.map((emp) => (
                <div key={emp.id} className="employee-item">
                  <div className="employee-info">
                    <h3>{emp.name}</h3>
                    <p>{emp.email} • {emp.dept}</p>
                    <p>Status: {emp.active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="actions">
                    <button className="btn-link" onClick={() => handleEdit(emp)}>
                      Edit
                    </button>
                    <button className="btn-link" onClick={() => handleDelete(emp.id)}>
                      Delete
                    </button>
                    <button className="btn-link" onClick={() => handleView(emp)}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Popup */}
        {viewEmployee && (
          <div className="modal-overlay">
            <div className="modal">
              <button className="modal-close" onClick={closeView}>
                ✕
              </button>
              <h2>Employee Details</h2>
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Name:</strong> {viewEmployee.name}</p>
                <p><strong>Dept:</strong> {viewEmployee.dept}</p>
                <p><strong>Status:</strong> {viewEmployee.active ? 'Active' : 'Inactive'}</p>
                <p><strong>Number:</strong> {viewEmployee.number || '—'}</p>
                <p><strong>Email:</strong> {viewEmployee.email}</p>
                <p><strong>Address:</strong> {viewEmployee.address || '—'}</p>
                {viewEmployee.photo && (
                  <div>
                    <strong>Photo:</strong>
                    <img
                      src={viewEmployee.photo}
                      alt="Employee"
                      className="photo-preview"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '400px' }}>
              <h2>Delete Employee</h2>
              <p style={{ marginTop: '1rem' }}>
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={cancelDelete}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={confirmDelete} style={{ backgroundColor: '#ef4444' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
    
export default App;
