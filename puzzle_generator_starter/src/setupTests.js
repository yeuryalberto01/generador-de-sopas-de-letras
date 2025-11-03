import '@testing-library/jest-dom'

// Polyfill for TextEncoder (needed for react-router-dom)
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Mock the apiClient module to avoid import.meta issues
jest.mock('./services/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  del: jest.fn()
}))