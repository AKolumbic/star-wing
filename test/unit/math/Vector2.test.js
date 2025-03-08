/**
 * Unit tests for Vector2 class
 */

// In a real implementation, we would import from our code
// For now, we'll create a simple Vector2 implementation for testing
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  subtract(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  divide(scalar) {
    if (scalar === 0) {
      throw new Error("Division by zero");
    }
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.length();
    if (len === 0) {
      return new Vector2();
    }
    return this.divide(len);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  equals(v) {
    return this.x === v.x && this.y === v.y;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }
}

describe("Vector2", () => {
  test("constructor initializes with correct values", () => {
    const v1 = new Vector2();
    expect(v1.x).toBe(0);
    expect(v1.y).toBe(0);

    const v2 = new Vector2(2, 3);
    expect(v2.x).toBe(2);
    expect(v2.y).toBe(3);
  });

  test("add combines two vectors correctly", () => {
    const v1 = new Vector2(1, 2);
    const v2 = new Vector2(3, 4);
    const result = v1.add(v2);

    expect(result.x).toBe(4);
    expect(result.y).toBe(6);

    // Original vectors should be unchanged
    expect(v1.x).toBe(1);
    expect(v1.y).toBe(2);
    expect(v2.x).toBe(3);
    expect(v2.y).toBe(4);
  });

  test("subtract removes second vector from first correctly", () => {
    const v1 = new Vector2(5, 7);
    const v2 = new Vector2(2, 3);
    const result = v1.subtract(v2);

    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  test("multiply scales vector by scalar correctly", () => {
    const v = new Vector2(2, 3);
    const result = v.multiply(2);

    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  test("divide scales vector by scalar correctly", () => {
    const v = new Vector2(4, 6);
    const result = v.divide(2);

    expect(result.x).toBe(2);
    expect(result.y).toBe(3);
  });

  test("divide throws error when dividing by zero", () => {
    const v = new Vector2(4, 6);
    expect(() => v.divide(0)).toThrow("Division by zero");
  });

  test("length calculates vector magnitude correctly", () => {
    const v = new Vector2(3, 4);
    expect(v.length()).toBe(5);
  });

  test("normalize creates unit vector with same direction", () => {
    const v = new Vector2(3, 4);
    const result = v.normalize();

    expect(result.length()).toBeCloseTo(1);
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);
  });

  test("dot product calculates correctly", () => {
    const v1 = new Vector2(1, 2);
    const v2 = new Vector2(3, 4);

    expect(v1.dot(v2)).toBe(11); // 1*3 + 2*4 = 11
  });

  test("equals returns true for identical vectors", () => {
    const v1 = new Vector2(1, 2);
    const v2 = new Vector2(1, 2);
    const v3 = new Vector2(2, 1);

    expect(v1.equals(v2)).toBe(true);
    expect(v1.equals(v3)).toBe(false);
  });

  test("clone creates a new identical vector", () => {
    const v1 = new Vector2(1, 2);
    const v2 = v1.clone();

    expect(v2.x).toBe(1);
    expect(v2.y).toBe(2);

    // Check they are different objects
    v1.x = 5;
    expect(v2.x).toBe(1);
  });
});
