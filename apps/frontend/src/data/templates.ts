export interface Template {
  id: string;

  title: string;
  description: string;
  files: { [key: string]: string };
  dependencies: { [key: string]: string };
}

export const templates: Template[] = [
  {
    id: 'frontend_react_vitest',
    title: 'Frontend React with Vitest',
    description: 'A React template with Vitest for unit testing',
    files: {
      'src/App.tsx': `
  import React, { useState } from 'react';
  
  function App() {
    const [count, setCount] = useState(0);
  
    return (
      <div>
        <h1>React Counter</h1>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
    );
  }
  
  export default App;
        `,
      'src/App.test.tsx': `
  import { render, screen, fireEvent } from '@testing-library/react';
  import { expect, test } from 'vitest';
  import App from './App';
  
  test('renders counter and increments', () => {
    render(<App />);
    const countElement = screen.getByText(/Count: 0/i);
    expect(countElement).toBeInTheDocument();
  
    const button = screen.getByText(/Increment/i);
    fireEvent.click(button);
  
    expect(screen.getByText(/Count: 1/i)).toBeInTheDocument();
  });
        `,
    },
    dependencies: {
      'react': '^17.0.2',
      'react-dom': '^17.0.2',
      'vitest': '^0.22.1',
      '@testing-library/react': '^12.1.2',
    },
  },
  {
    id: 'frontend_static_vitest',
    title: 'Frontend Static with Vitest',
    description: 'A static HTML/JS template with Vitest for unit testing',
    files: {
      'index.html': `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Static Counter</title>
  </head>
  <body>
    <h1>Static Counter</h1>
    <p id="count">Count: 0</p>
    <button id="increment">Increment</button>
    <script src="script.js"></script>
  </body>
  </html>
        `,
      'script.js': `
  let count = 0;
  const countElement = document.getElementById('count');
  const incrementButton = document.getElementById('increment');
  
  incrementButton.addEventListener('click', () => {
    count++;
    countElement.textContent = \`Count: \${count}\`;
  });
        `,
      'script.test.js': `
  import { expect, test } from 'vitest';
  import { JSDOM } from 'jsdom';
  
  test('increments counter on button click', () => {
    const dom = new JSDOM(\`
      <!DOCTYPE html>
      <html>
        <body>
          <p id="count">Count: 0</p>
          <button id="increment">Increment</button>
        </body>
      </html>
    \`);
  
    global.document = dom.window.document;
    global.window = dom.window;
  
    require('./script.js');
  
    const countElement = document.getElementById('count');
    const incrementButton = document.getElementById('increment');
  
    expect(countElement.textContent).toBe('Count: 0');
  
    incrementButton.click();
  
    expect(countElement.textContent).toBe('Count: 1');
  });
        `,
    },
    dependencies: {
      'vitest': '^0.22.1',
      'jsdom': '^16.7.0',
    },
  },
  {
    id: 'backend_node_junit',
    title: 'Backend Node with JUnit',
    description: 'A Node.js backend template with JUnit for unit testing',
    files: {
      'src/app.js': `
  const express = require('express');
  const app = express();
  
  app.get('/', (req, res) => {
    res.json({ message: 'Hello, World!' });
  });
  
  module.exports = app;
        `,
      'test/app.test.js': `
  const request = require('supertest');
  const app = require('../src/app');
  
  describe('GET /', () => {
    it('responds with json', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
  
      expect(response.body).toEqual({ message: 'Hello, World!' });
    });
  });
        `,
    },
    dependencies: {
      'express': '^4.17.1',
      'supertest': '^6.1.3',
      'jest': '^27.0.6',
    },
  },
];
