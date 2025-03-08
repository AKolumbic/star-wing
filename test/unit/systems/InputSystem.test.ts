import { InputSystem } from "../../../src/core/systems/InputSystem";
import { Input } from "../../../src/core/Input";

// Mock Input class
jest.mock("../../../src/core/Input");

describe("InputSystem", () => {
  let inputSystem: InputSystem;
  let mockInput: jest.Mocked<Input>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a fresh instance of InputSystem for each test
    inputSystem = new InputSystem();

    // Get the mocked Input instance
    mockInput = (inputSystem as any).input;
  });

  describe("Initialization", () => {
    test("initializes successfully", async () => {
      await inputSystem.init();
      expect(mockInput.init).toHaveBeenCalled();
    });

    test("handles multiple init calls", async () => {
      await inputSystem.init();
      await inputSystem.init();
      expect(mockInput.init).toHaveBeenCalledTimes(2);
    });
  });

  describe("Resource Management", () => {
    test("disposes resources correctly", () => {
      inputSystem.dispose();
      expect(mockInput.dispose).toHaveBeenCalled();
    });

    test("provides access to Input instance", () => {
      const input = inputSystem.getInput();
      expect(input).toBe(mockInput);
    });
  });

  describe("Update Cycle", () => {
    test("updates input state each frame", () => {
      inputSystem.update(0.016); // 16ms frame
      expect(mockInput.update).toHaveBeenCalled();
    });

    test("delta time is not used in update", () => {
      // Update with different delta times should not affect behavior
      inputSystem.update(0.016);
      inputSystem.update(0.032);
      inputSystem.update(0.064);

      // Each call should just trigger input.update()
      expect(mockInput.update).toHaveBeenCalledTimes(3);
    });
  });

  describe("Keyboard Input", () => {
    test("detects pressed keys", () => {
      // Mock key press detection
      mockInput.isKeyPressed.mockImplementation((key) => key === "Space");

      expect(inputSystem.isKeyPressed("Space")).toBe(true);
      expect(inputSystem.isKeyPressed("Enter")).toBe(false);
      expect(mockInput.isKeyPressed).toHaveBeenCalledWith("Space");
      expect(mockInput.isKeyPressed).toHaveBeenCalledWith("Enter");
    });

    test("handles multiple key queries", () => {
      // Test checking multiple keys in sequence
      inputSystem.isKeyPressed("w");
      inputSystem.isKeyPressed("a");
      inputSystem.isKeyPressed("s");
      inputSystem.isKeyPressed("d");

      expect(mockInput.isKeyPressed).toHaveBeenCalledTimes(4);
      expect(mockInput.isKeyPressed).toHaveBeenCalledWith("w");
      expect(mockInput.isKeyPressed).toHaveBeenCalledWith("a");
      expect(mockInput.isKeyPressed).toHaveBeenCalledWith("s");
      expect(mockInput.isKeyPressed).toHaveBeenCalledWith("d");
    });
  });

  describe("Mouse Input", () => {
    test("detects mouse button presses", () => {
      // Mock mouse button press detection
      mockInput.isMouseButtonPressed.mockImplementation(
        (button) => button === 0
      );

      expect(inputSystem.isMouseButtonPressed(0)).toBe(true); // Left button
      expect(inputSystem.isMouseButtonPressed(1)).toBe(false); // Right button
      expect(mockInput.isMouseButtonPressed).toHaveBeenCalledWith(0);
      expect(mockInput.isMouseButtonPressed).toHaveBeenCalledWith(1);
    });

    test("gets mouse position", () => {
      const mockPosition = { x: 100, y: 200 };
      mockInput.getMousePosition.mockReturnValue(mockPosition);

      const position = inputSystem.getMousePosition();
      expect(position).toEqual(mockPosition);
      expect(mockInput.getMousePosition).toHaveBeenCalled();
    });

    test("handles multiple mouse position queries", () => {
      mockInput.getMousePosition.mockReturnValue({ x: 0, y: 0 });

      // Multiple queries in the same frame
      inputSystem.getMousePosition();
      inputSystem.getMousePosition();
      inputSystem.getMousePosition();

      expect(mockInput.getMousePosition).toHaveBeenCalledTimes(3);
    });
  });

  describe("Edge Cases", () => {
    test("handles empty key strings", () => {
      inputSystem.isKeyPressed("");
      expect(mockInput.isKeyPressed).toHaveBeenCalledWith("");
    });

    test("handles invalid mouse button indices", () => {
      inputSystem.isMouseButtonPressed(-1);
      inputSystem.isMouseButtonPressed(999);
      expect(mockInput.isMouseButtonPressed).toHaveBeenCalledWith(-1);
      expect(mockInput.isMouseButtonPressed).toHaveBeenCalledWith(999);
    });

    test("handles rapid input polling", () => {
      // Simulate rapid polling of input state
      for (let i = 0; i < 100; i++) {
        inputSystem.isKeyPressed("Space");
        inputSystem.isMouseButtonPressed(0);
        inputSystem.getMousePosition();
      }

      expect(mockInput.isKeyPressed).toHaveBeenCalledTimes(100);
      expect(mockInput.isMouseButtonPressed).toHaveBeenCalledTimes(100);
      expect(mockInput.getMousePosition).toHaveBeenCalledTimes(100);
    });
  });

  describe("System Integration", () => {
    test("update and input query sequence", () => {
      // Simulate a typical frame sequence
      inputSystem.update(0.016);
      inputSystem.isKeyPressed("w");
      inputSystem.getMousePosition();
      inputSystem.isMouseButtonPressed(0);

      expect(mockInput.update).toHaveBeenCalledTimes(1);
      expect(mockInput.isKeyPressed).toHaveBeenCalledTimes(1);
      expect(mockInput.getMousePosition).toHaveBeenCalledTimes(1);
      expect(mockInput.isMouseButtonPressed).toHaveBeenCalledTimes(1);
    });
  });
});
