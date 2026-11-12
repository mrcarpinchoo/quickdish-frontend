import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnvBadge } from "./EnvBadge";

describe("EnvBadge", () => {
  it("shows the environment and the version", () => {
    render(
      <EnvBadge
        environment="DEV"
        version="a1b2c3d"
      />
    );

    expect(screen.getByText("DEV · a1b2c3d")).toBeInTheDocument();
  });

  it("uses a different color for PROD than for DEV", () => {
    const { rerender } = render(
      <EnvBadge
        environment="DEV"
        version="a1b2c3d"
      />
    );
    const dev = screen.getByText("DEV · a1b2c3d");
    expect(dev).toHaveClass("bg-amber-100");

    rerender(
      <EnvBadge
        environment="PROD"
        version="a1b2c3d"
      />
    );
    expect(screen.getByText("PROD · a1b2c3d")).toHaveClass("bg-red-100");
  });
});
