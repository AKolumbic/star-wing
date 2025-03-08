import { UIUtils } from "../../../src/utils/UIUtils";

describe("UIUtils", () => {
  beforeEach(() => {
    // Clean up the DOM before each test
    document.body.innerHTML = "";
    // Remove any styles added to head
    const styles = document.head.getElementsByTagName("style");
    Array.from(styles).forEach((style) => style.remove());
  });

  describe("Error Message Display", () => {
    test("creates error overlay with correct structure", () => {
      UIUtils.showErrorMessage("Test Error", "This is a test error message");

      const overlay = document.querySelector(
        ".error-overlay"
      ) as HTMLDivElement;
      expect(overlay).toBeTruthy();
      expect(overlay.style.position).toBe("fixed");
      expect(overlay.style.backgroundColor).toBe("rgba(0, 0, 0, 0.85)");
      expect(overlay.style.zIndex).toBe("10000");

      // Check title
      const title = overlay.querySelector("h1") as HTMLHeadingElement;
      expect(title).toBeTruthy();
      expect(title.textContent).toBe("Test Error");
      expect(title.style.animation).toBe("errorBlink 1s infinite alternate");

      // Check message
      const message = overlay.querySelector("div") as HTMLDivElement;
      expect(message).toBeTruthy();
      expect(message.textContent).toBe("This is a test error message");

      // Check button
      const button = overlay.querySelector("button") as HTMLButtonElement;
      expect(button).toBeTruthy();
      expect(button.textContent).toBe("[ RELOAD SYSTEM ]");
    });

    test("adds error blink animation style to head", () => {
      UIUtils.showErrorMessage("Test Error", "Test Message");

      const styles = document.head.getElementsByTagName("style");
      const errorStyle = Array.from(styles).find((style) =>
        style.textContent?.includes("@keyframes errorBlink")
      );

      expect(errorStyle).toBeTruthy();
      expect(errorStyle?.textContent).toContain("0% { opacity: 1; }");
      expect(errorStyle?.textContent).toContain("50% { opacity: 0.7; }");
      expect(errorStyle?.textContent).toContain("100% { opacity: 1; }");
    });

    test("reload button triggers page reload", () => {
      // Mock window.location using Object.defineProperty
      const reloadMock = jest.fn();
      const originalLocation = window.location;

      delete (window as any).location;
      Object.defineProperty(window, "location", {
        value: { reload: reloadMock },
        writable: true,
      });

      UIUtils.showErrorMessage("Test Error", "Test Message");
      const button = document.querySelector("button") as HTMLButtonElement;
      button.click();

      expect(reloadMock).toHaveBeenCalled();

      // Restore original location
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    });

    test("button hover effects work correctly", () => {
      UIUtils.showErrorMessage("Test Error", "Test Message");
      const button = document.querySelector("button") as HTMLButtonElement;

      // Simulate hover
      button.dispatchEvent(new MouseEvent("mouseover"));
      expect(button.style.backgroundColor).toBe("rgba(255, 0, 0, 0.2)");

      // Simulate hover out
      button.dispatchEvent(new MouseEvent("mouseout"));
      expect(button.style.backgroundColor).toBe("transparent");
    });
  });

  describe("Ship Boundary Controls", () => {
    let mockShip: any;

    beforeEach(() => {
      mockShip = {
        horizontalLimit: 1400,
        verticalLimit: 700,
        setBoundaryLimits: jest.fn(),
      };
    });

    test("creates boundary controls with correct structure", () => {
      const controls = UIUtils.createShipBoundaryControls(mockShip);

      expect(controls.className).toBe("");
      expect(controls.style.position).toBe("fixed");
      expect(controls.style.backgroundColor).toBe("rgba(0, 0, 0, 0.7)");
      expect(controls.style.zIndex).toBe("10000");

      // Check title
      const title = controls.querySelector("h3") as HTMLHeadingElement;
      expect(title).toBeTruthy();
      expect(title.textContent).toBe("Ship Boundary Controls");

      // Check sliders
      const sliders = controls.querySelectorAll('input[type="range"]');
      expect(sliders.length).toBe(2);

      // Check labels
      const labels = controls.querySelectorAll("label");
      expect(labels.length).toBe(2);
      expect(labels[0].textContent).toContain("Horizontal:");
      expect(labels[1].textContent).toContain("Vertical:");

      // Check button
      const button = controls.querySelector("button") as HTMLButtonElement;
      expect(button).toBeTruthy();
      expect(button.textContent).toBe("Make Oblong (2:1)");
    });

    test("horizontal slider updates ship boundaries", () => {
      const controls = UIUtils.createShipBoundaryControls(mockShip);
      const horizontalSlider = controls.querySelectorAll(
        'input[type="range"]'
      )[0] as HTMLInputElement;
      const horizontalValue = controls.querySelector(
        "label span"
      ) as HTMLSpanElement;

      // Change slider value
      horizontalSlider.value = "1600";
      horizontalSlider.dispatchEvent(new Event("input"));

      expect(horizontalValue.textContent).toBe("1600");
      expect(mockShip.setBoundaryLimits).toHaveBeenCalledWith(1600, 700);
    });

    test("vertical slider updates ship boundaries", () => {
      const controls = UIUtils.createShipBoundaryControls(mockShip);
      const verticalSlider = controls.querySelectorAll(
        'input[type="range"]'
      )[1] as HTMLInputElement;
      const verticalValue = controls.querySelectorAll(
        "label span"
      )[1] as HTMLSpanElement;

      // Change slider value
      verticalSlider.value = "800";
      verticalSlider.dispatchEvent(new Event("input"));

      expect(verticalValue.textContent).toBe("800");
      expect(mockShip.setBoundaryLimits).toHaveBeenCalledWith(1400, 800);
    });

    test("make oblong button sets correct ratio", () => {
      const controls = UIUtils.createShipBoundaryControls(mockShip);
      const button = controls.querySelector("button") as HTMLButtonElement;
      const horizontalValue = controls.querySelectorAll(
        "label span"
      )[0] as HTMLSpanElement;
      const verticalValue = controls.querySelectorAll(
        "label span"
      )[1] as HTMLSpanElement;

      button.click();

      expect(horizontalValue.textContent).toBe("1400");
      expect(verticalValue.textContent).toBe("700");
      expect(mockShip.setBoundaryLimits).toHaveBeenCalledWith(1400, 700);
    });

    test("handles undefined ship limits gracefully", () => {
      const mockShipNoLimits = {
        setBoundaryLimits: jest.fn(),
      };

      const controls = UIUtils.createShipBoundaryControls(mockShipNoLimits);

      // Check default values
      const horizontalValue = controls.querySelectorAll(
        "label span"
      )[0] as HTMLSpanElement;
      const verticalValue = controls.querySelectorAll(
        "label span"
      )[1] as HTMLSpanElement;

      expect(horizontalValue.textContent).toBe("1400");
      expect(verticalValue.textContent).toBe("700");
    });

    test("sliders respect min and max values", () => {
      const controls = UIUtils.createShipBoundaryControls(mockShip);
      const sliders = Array.from(
        controls.querySelectorAll('input[type="range"]')
      ) as HTMLInputElement[];
      const [horizontalSlider, verticalSlider] = sliders;

      // Check horizontal slider constraints
      expect(horizontalSlider.min).toBe("400");
      expect(horizontalSlider.max).toBe("2000");
      expect(horizontalSlider.step).toBe("100");

      // Check vertical slider constraints
      expect(verticalSlider.min).toBe("200");
      expect(verticalSlider.max).toBe("1000");
      expect(verticalSlider.step).toBe("50");
    });
  });
});
