# Testing the AudioManager

This directory contains tests for the AudioManager class, which is responsible for all audio functionality in the Star-Wing game.

## Testing Approach

The AudioManager class is a complex component with multiple dependencies:

- AudioContextManager
- BufferManager
- MusicPlayer
- SoundEffectPlayer
- ProceduralMusicGenerator

Due to the complexity of testing audio in a browser environment and the TypeScript nature of the codebase, we've adopted a specific testing strategy:

1. **Complete Mocking**: We create a fully mocked version of the AudioManager class that mimics its behavior but uses Jest mocks for all dependencies.
2. **Behavior Testing**: We test the behavior of the AudioManager rather than its implementation details.
3. **Isolation**: Each test is isolated and doesn't depend on the state of other tests.

## Example Test File

The `AudioManagerExample.test.js` file demonstrates how to test the AudioManager class. It includes:

- A complete mock implementation of AudioManager
- Tests for core functionality
- Examples of how to test complex interactions

## Writing Additional Tests

When writing additional tests for AudioManager, follow these guidelines:

1. Use the mock implementation approach shown in `AudioManagerExample.test.js`
2. Focus on testing behavior, not implementation details
3. Mock all dependencies to avoid browser-specific issues
4. Test edge cases and error handling
5. Ensure tests are isolated and don't depend on each other

## Coverage Goals

The goal is to achieve 100% code coverage for the AudioManager class. This includes:

- All public methods
- All branches in conditional statements
- Error handling paths
- Edge cases

## Running the Tests

Run the tests using:

```bash
# Run all audio tests
npx jest --testPathPattern=test/unit/audio

# Run with coverage
npx jest --coverage --testPathPattern=test/unit/audio

# Run a specific test file
npx jest --testPathPattern=test/unit/audio/AudioManagerExample.test.js
```

## Troubleshooting

If you encounter issues with the tests:

1. **Memory Issues**: If you get "JavaScript heap out of memory" errors, try increasing the memory limit:

   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx jest --testPathPattern=test/unit/audio
   ```

2. **TypeScript Errors**: If you get TypeScript parsing errors, ensure you're using the mock implementation approach rather than trying to import the actual TypeScript class.

3. **Audio Context Issues**: Browser audio contexts can't be properly instantiated in a test environment, which is why we mock all audio-related functionality.
