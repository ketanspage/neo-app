interface AssignmentProject {
    id: string;
    title: string;
    description: string;
    files: {
        [key: string]: string;
    };
    dependencies: {
        [key: string]: string;
    };
}

export const assignmentProjects: AssignmentProject[] = [
    {
        id: '1',
        title: 'React Counter with Hooks',
        description: 'Create a counter component using the useState hook',
        files: {
            'index.html': '<div id="root"></div>',
            'index.js': `
  import React from 'react';
  import ReactDOM from 'react-dom';
  import App from './App';
  
  ReactDOM.render(<App />, document.getElementById('root'));
        `,
            'App.js': `
  import React from 'react';
  
  function App() {
    // TODO: Implement a counter using useState hook
    return (
      <div>
        <h1>Counter: 0</h1>
        <button>Increment</button>
        <button>Decrement</button>
      </div>
    );
  }
  
  export default App;
        `,
        },
        dependencies: {
            'react': '^17.0.2',
            'react-dom': '^17.0.2',
        },
    },
    {
        id: '2',
        title: 'React Context API',
        description: 'Implement a theme switcher using Context API',
        files: {
            'index.html': '<div id="root"></div>',
            'index.js': `
  import React from 'react';
  import ReactDOM from 'react-dom';
  import App from './App';
  
  ReactDOM.render(<App />, document.getElementById('root'));
        `,
            'App.js': `
  import React from 'react';
  
  // TODO: Implement ThemeContext and ThemeProvider
  
  function App() {
    return (
      <div>
        <h1>Theme Switcher</h1>
        <button>Toggle Theme</button>
      </div>
    );
  }
  
  export default App;
        `,
        },
        dependencies: {
            'react': '^17.0.2',
            'react-dom': '^17.0.2',
        },
    },
];

