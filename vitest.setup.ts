// test/setup.js
global.window = {
    location: {
      href: 'http://localhost/',
      // Add other properties as needed
    },
    history: {
      pushState: () => {},
      replaceState: () => {},
    },
    // Mock other window properties if needed
  };
  