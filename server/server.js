// Server.js
const express = require('express');
const cors = require('cors');

// Initialize app
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes

// Parse JSON bodies (for POST/PUT requests)
app.use(express.json({ limit: '10mb' })); // allows larger payloads for images

// In-memory storage
let employees = [];
let nextId = 1;

// Helper: Validate employee data
const validateEmployee = (data, isUpdate = false) => {
  const errors = [];

  // Name
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters.');
  }

  // Email
  if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required.');
  }

  // Number
  if (!data.number || typeof data.number !== 'string' || !/^\d+$/.test(data.number)) {
    errors.push('Employee number is required and must contain only digits.');
  } else if (data.number.length > 10) {
    errors.push('Employee number is too long (max 10 digits).');
  }

  // Address
  if (!data.address || typeof data.address !== 'string' || data.address.trim().length === 0) {
    errors.push('Address is required.');
  }

  // Photo - should be a base64 string like "data:image/..."
  if (!data.photo || typeof data.photo !== 'string' || !data.photo.startsWith('data:image/')) {
    errors.push('Valid photo is required.');
  }

  return errors;
};



// GET all employees
app.get('/api/employees', (req, res) => {
  res.json(employees);
});

// POST - Create new employee
app.post('/api/employees', (req, res) => {
  const errors = validateEmployee(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  // Destructure fields
  const { name, dept, active, number, email, address, photo } = req.body;

  // Create new employee
  const newEmployee = {
    id: nextId++,
    name: name.trim(),
    dept,
    active: Boolean(active),
    number: String(number),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    photo,
  };

  // Store employee
  employees.push(newEmployee);
  res.status(201).json(newEmployee); 
});



// PUT - Update employee
app.put('/api/employees/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = employees.findIndex(emp => emp.id === id);

  // Employee not found
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Validate input
  const errors = validateEmployee(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  // Destructure fields
  const { name, dept, active, number, email, address, photo } = req.body;

  // Update employee
  employees[index] = {
    ...employees[index],
    name: name.trim(),
    dept,
    active: Boolean(active),
    number: String(number),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    photo,
  };

  // Return updated employee
  res.json(employees[index]);
});



// DELETE - Remove employee
app.delete('/api/employees/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = employees.length;
  employees = employees.filter(emp => emp.id !== id);

  // If no employee was removed
  if (employees.length === initialLength) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Successful deletion
  res.status(204).send();
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});